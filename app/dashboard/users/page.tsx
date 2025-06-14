"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"
import { useUploadThing } from "@/lib/uploadthing"
import { Label } from "@/components/ui/label"
import { Upload, X } from "lucide-react"

function getUserRole(permissions: string[] = []) {
  let role = ["user"]

  if (permissions.includes("admin")) role.push("admin")
  if (permissions.includes("manager")) role.push("manager")
  return role
}

export default function UsersPage() {
  const { user,getPermissions } = useKindeAuth()
  const { toast } = useToast()
  const [members, setMembers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuspended, setShowSuspended] = useState(false)
  const [assigningManager, setAssigningManager] = useState<string | null>(null)
  const [confirmManagerId, setConfirmManagerId] = useState<string | null>(null)
  const [suspendingUser, setSuspendingUser] = useState<string | null>(null)
  const [unsuspendingUser, setUnsuspendingUser] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("active")
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [addUserForm, setAddUserForm] = useState({
    email: "",
    given_name: "",
    family_name: "",
    username: "",
    phone: "",
    picture: "",
  })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { startUpload } = useUploadThing("userImage")
  const {permissions}= getPermissions()
  const isAdmin = permissions?.includes('admin')

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/users")
      const { users } = await res.json()

      setMembers(users)
      setLoading(false)
    }
    if (loading) {
      fetchUsers()
    }
  }, [loading])

  const handleAssignManager = async (userId: string, type = "assign") => {
    setAssigningManager(userId)

    if (type === "assign") {
      try {

        const currentManager = members.find(m =>
          getUserRole(m.permissions).includes("manager") && !m.permissions.includes("admin")
        )
        const res = await fetch("/api/users/assign-manager", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newManagerId: userId,
            oldManagerId: currentManager?.id
          }),
        })
        if (!res.ok) throw new Error()
        toast({ title: "Manager permissions updated" })
        setLoading(true) // Refresh user list



      } catch {
        toast({ title: "Failed to update manager", variant: "destructive" })
      } finally {
        setAssigningManager(null)
        setConfirmManagerId(null)
      }
    } else if (type === "remove") {
      try {

        const res = await fetch("/api/users/remove-manager", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            removalId: userId
          }),
        })
        if (!res.ok) throw new Error()
        toast({ title: "Manager permissions removed" })
        setLoading(true) // Refresh user list

      } catch {
        toast({ title: "Failed to remove manager", variant: "destructive" })
      } finally {
        setAssigningManager(null)
        setConfirmManagerId(null)
      }
    }
  }

  const handleSuspendUser = async (userId: string) => {
    setSuspendingUser(userId)
    try {
      const res = await fetch(`/api/users/${userId}/suspend`, { method: "POST" })
      if (!res.ok) throw new Error()
      toast({ title: "User suspended" })
      setLoading(true) // Refresh user list
    } catch {
      toast({ title: "Failed to suspend user", variant: "destructive" })
    } finally {
      setSuspendingUser(null)
    }
  }

  const handleUnsuspendUser = async (userId: string) => {
    setUnsuspendingUser(userId)
    try {
      const res = await fetch(`/api/users/${userId}/unsuspend`, { method: "POST" })
      if (!res.ok) throw new Error()
      toast({ title: "User unsuspended" })
      setLoading(true) // Refresh user list
    } catch {
      toast({ title: "Failed to unsuspend user", variant: "destructive" })
    } finally {
      setUnsuspendingUser(null)
    }
  }

  const filteredMembers = members
    .filter(member => {
      const matchesSearch = member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch && (showSuspended ? member.status === "archived" : member.status === "active");
    })
    .sort((a, b) => {
      const getPriority = (member: any) => {
        if (member.permissions?.includes("admin")) return 0;
        if (member.permissions?.includes("manager")) return 1;
        return 2;
      };
      return getPriority(a) - getPriority(b);
    });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setSelectedFile(file);
    setImagePreviewUrl(URL.createObjectURL(file)); // for preview
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddUser = async () => {
    if (!addUserForm.email || !addUserForm.given_name || !addUserForm.family_name || !addUserForm.username) {
      toast({ title: "Required fields missing", variant: "destructive" })
      return
    }
    setAddUserLoading(true)
    try {
      let pictureUrl = addUserForm.picture;
      if (!pictureUrl && selectedFile) {
        const res = await startUpload([selectedFile]);
        if (res?.[0]?.ufsUrl) {
          pictureUrl = res[0].ufsUrl;
        }
      }



      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pictureUrl && pictureUrl.length ? { ...addUserForm, picture: pictureUrl } : { ...addUserForm }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to add user")
      }
      toast({ title: "User added successfully" })
      setSelectedFile(null);
      setImagePreviewUrl(null);
      setAddUserForm({
        email: "",
        given_name: "",
        family_name: "",
        username: "",
        phone: "",
        picture: "",
      })
      setActiveTab("active")
      // Refresh user list
      setLoading(true)
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setAddUserLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>You do not have permission to manage users</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage user access and permissions</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>

        <TabsList>
          <TabsTrigger value="active" onClick={() => setShowSuspended(false)}>
            Active Users
          </TabsTrigger>
          <TabsTrigger value="suspended" onClick={() => setShowSuspended(true)}>
            Suspended Users
          </TabsTrigger>
          <TabsTrigger value="add">
            Add User
          </TabsTrigger>
        </TabsList>

        {/* Active Users */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>{showSuspended ? "Suspended Users" : "Active Users"}</CardTitle>
              <CardDescription>
                {showSuspended
                  ? "Users with suspended access"
                  : "Currently active system users"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>

                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => {
                      const role = getUserRole(member.permissions)
                      const isCurrentUser = member.id === user?.id

                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.avatar} />


                                <AvatarFallback>{member.name?.[0] || member.email[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                {member.name || "Unnamed User"}
                                {isCurrentUser && <span className="ml-2 text-muted-foreground">(You)</span>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell className="space-x-1">
                            {role.map((role_name, index) => {
                              return <Badge key={`${role_name}-${index}`} variant={
                                role_name === "admin" ? "default" :
                                  role_name === "manager" ? "success" : "secondary"
                              }>
                                {role_name.toUpperCase()}
                              </Badge>
                            })}

                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2 ">
                              {member.status === "active" && !role.includes("admin") && (
                                <Dialog open={confirmManagerId === member.id}
                                  onOpenChange={open => setConfirmManagerId(open ? member.id : null)}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant={role.includes("manager") ? 'destructive' : "primary"}
                                      size="sm"
                                      disabled={assigningManager === member.id}
                                    >
                                      {role.includes("manager") ? "Remove Manager" : "Make Manager"}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Confirm Manager Change</DialogTitle>
                                      <DialogDescription>
                                        {role.includes("manager")
                                          ? `Remove manager permissions from ${member.email}?`
                                          : `Assign manager permissions to ${member.email}?`}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button
                                        variant="secondary"
                                        onClick={!(role.includes("manager")) ? () => handleAssignManager(member.id) : () => handleAssignManager(member.id, "remove")}
                                        disabled={assigningManager === member.id}
                                      >
                                        {assigningManager === member.id ? "Loading..." : "Confirm"}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => setConfirmManagerId(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}

                              {(!isCurrentUser && !role.includes("manager")) && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant={member.status === "archived" ? "destructive" : "secondary"}
                                      size="sm"
                                      disabled={
                                        (member.status === "archived" ? unsuspendingUser : suspendingUser) === member.id
                                      }
                                    >
                                      {member.status === "archived" ? "Unsuspend" : "Suspend"}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        {member.status === "archived" ? "Unsuspend User?" : "Suspend User?"}
                                      </DialogTitle>
                                      <DialogDescription>
                                        {member.status === "archived"
                                          ? `Restore access for ${member.email}?`
                                          : `Temporarily disable access for ${member.email}?`}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>



                                      <Button
                                        variant={member.status === "archived" ? "secondary" : "destructive"}
                                        onClick={() => member.status === "archived"
                                          ? handleUnsuspendUser(member.id)
                                          : handleSuspendUser(member.id)
                                        }
                                        disabled={(member.status === "archived" ? unsuspendingUser : suspendingUser) === member.id}
                                      >

                                        {(member.status === "archived" ? unsuspendingUser : suspendingUser) === member.id ? "Loading..." : "Confirm"}
                                      </Button>

                                      <Button variant="outline">Cancel</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suspended Users */}
        <TabsContent value="suspended">
          <Card>
            <CardHeader>
              <CardTitle>{showSuspended ? "Suspended Users" : "Active Users"}</CardTitle>
              <CardDescription>
                {showSuspended
                  ? "Users with suspended access"
                  : "Currently active system users"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>

                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => {
                      const role = getUserRole(member.permissions)
                      const isCurrentUser = member.id === user?.id

                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback>{member.name?.[0] || member.email[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                {member.name || "Unnamed User"}
                                {isCurrentUser && <span className="ml-2 text-muted-foreground">(You)</span>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell className="space-x-1">
                            {role.map((role_name, index) => {
                              return <Badge key={`${role_name}-${index}`} variant={
                                role_name === "admin" ? "default" :
                                  role_name === "manager" ? "success" : "secondary"
                              }>
                                {role_name.toUpperCase()}
                              </Badge>
                            })}

                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2 ">
                              {member.status === "active" && !role.includes("admin") && (
                                <Dialog open={confirmManagerId === member.id}
                                  onOpenChange={open => setConfirmManagerId(open ? member.id : null)}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant={role.includes("manager") ? 'destructive' : "primary"}
                                      size="sm"
                                      disabled={assigningManager === member.id}
                                    >
                                      {role.includes("manager") ? "Remove Manager" : "Make Manager"}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Confirm Manager Change</DialogTitle>
                                      <DialogDescription>
                                        {role.includes("manager")
                                          ? `Remove manager permissions from ${member.email}?`
                                          : `Assign manager permissions to ${member.email}?`}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button
                                        variant="secondary"
                                        onClick={!(role.includes("manager")) ? () => handleAssignManager(member.id) : () => handleAssignManager(member.id, "remove")}
                                        disabled={assigningManager === member.id}
                                      >
                                        {assigningManager === member.id ? "Loading..." : "Confirm"}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => setConfirmManagerId(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}

                              {(!isCurrentUser && !role.includes("manager")) && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant={member.status === "archived" ? "destructive" : "secondary"}
                                      size="sm"
                                      disabled={
                                        (member.status === "archived" ? unsuspendingUser : suspendingUser) === member.id
                                      }
                                    >
                                      {member.status === "archived" ? "Unsuspend" : "Suspend"}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        {member.status === "archived" ? "Unsuspend User?" : "Suspend User?"}
                                      </DialogTitle>
                                      <DialogDescription>
                                        {member.status === "archived"
                                          ? `Restore access for ${member.email}?`
                                          : `Temporarily disable access for ${member.email}?`}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>



                                      <Button
                                        variant={member.status === "archived" ? "secondary" : "destructive"}
                                        onClick={() => member.status === "archived"
                                          ? handleUnsuspendUser(member.id)
                                          : handleSuspendUser(member.id)
                                        }
                                        disabled={(member.status === "archived" ? unsuspendingUser : suspendingUser) === member.id}
                                      >

                                        {(member.status === "archived" ? unsuspendingUser : suspendingUser) === member.id ? "Loading..." : "Confirm"}
                                      </Button>

                                      <Button variant="outline">Cancel</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add User */}
        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New User</CardTitle>
              <CardDescription>
                Enter details to invite a new user. They will receive a passwordless sign-in email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 ">
              <div className="grid md:grid-cols-2 gap-4  md:w-full">
                <div>
                  <Label>Email*</Label>
                  <Input
                    type="email"
                    value={addUserForm.email}
                    onChange={e => setAddUserForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>First Name*</Label>
                  <Input
                    value={addUserForm.given_name}
                    onChange={e => setAddUserForm(f => ({ ...f, given_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Last Name*</Label>
                  <Input
                    value={addUserForm.family_name}
                    onChange={e => setAddUserForm(f => ({ ...f, family_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Username*</Label>
                  <Input
                    value={addUserForm.username}
                    onChange={e => setAddUserForm(f => ({ ...f, username: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={addUserForm.phone}
                    type="number"
                    onChange={e => setAddUserForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="col-span-full">
                  <Label>Profile Image</Label>

                  {imagePreviewUrl ? (
                    <div className="relative rounded-md border border-dashed p-4 w-48 mx-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => {
                          setImagePreviewUrl(null);
                          setSelectedFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={imagePreviewUrl} />
                          <AvatarFallback>IMG</AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-muted-foreground">Image ready to upload</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8">
                      <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                      <div className="mb-2 text-center">
                        <p className="font-medium">Upload your profile image</p>
                        <p className="text-sm text-muted-foreground">Supports JPEG, PNG (max 1MB)</p>
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                        id="profile-image"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        Select Image
                      </Button>
                    </div>
                  )}
                </div>

              </div>
            </CardContent>

            <CardFooter>
              <Button className="w-full"
                onClick={handleAddUser}
                disabled={addUserLoading || !addUserForm.email || !addUserForm.given_name || !addUserForm.family_name || !addUserForm.username}
              >
                {addUserLoading ? "Adding..." : "Add User"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  )
}
