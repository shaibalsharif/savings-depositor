"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"
import { useUploadThing } from "@/lib/uploadthing"
import { Label } from "@/components/ui/label"



function getUserRole(permissions: string[] = []) {
  if (permissions.includes("admin")) return "admin"
  if (permissions.includes("manager")) return "manager"
  return "member"
}

export default function UsersPage() {
  const { user } = useKindeAuth()
  const { toast } = useToast()
  const [members, setMembers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuspended, setShowSuspended] = useState(false)
  const [assigningManager, setAssigningManager] = useState<string | null>(null)
  const [confirmManagerId, setConfirmManagerId] = useState<string | null>(null)
  const [suspendingUser, setSuspendingUser] = useState<string | null>(null)
  const [unsuspendingUser, setUnsuspendingUser] = useState<string | null>(null)
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
  const isAdmin = true//user?.permissions?.includes("admin")

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/users")
      const { users } = await res.json()
      setMembers(users)
    }
    fetchUsers()
  }, [])

  const handleAssignManager = async (userId: string) => {
    setAssigningManager(userId)
    try {
      const currentManager = members.find(
        m => getUserRole(m.permissions) === "manager" && !m.permissions.includes("admin")
      )
      const res = await fetch("/api/users/assign-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newManagerId: userId, oldManagerId: currentManager?.id }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Manager permissions updated" })
      const usersRes = await fetch("/api/users")
      setMembers((await usersRes.json()).users)
    } catch {
      toast({ title: "Failed to update manager", variant: "destructive" })
    } finally {
      setAssigningManager(null)
      setConfirmManagerId(null)
    }
  }

  const handleSuspendUser = async (userId: string) => {
    setSuspendingUser(userId)
    try {
      const res = await fetch(`/api/users/${userId}/suspend`, { method: "POST" })
      if (!res.ok) throw new Error()
      toast({ title: "User suspended" })
      const usersRes = await fetch("/api/users")
      setMembers((await usersRes.json()).users)
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
      const usersRes = await fetch("/api/users")
      setMembers((await usersRes.json()).users)
    } catch {
      toast({ title: "Failed to unsuspend user", variant: "destructive" })
    } finally {
      setUnsuspendingUser(null)
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch && (showSuspended ? member.isSuspended : !member.isSuspended)
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploading(true)
    try {
      const file = e.target.files[0]
      const res = await startUpload([file])
      if (res?.[0]?.url) {
        setAddUserForm(f => ({ ...f, picture: res[0].url }))
      }
    } catch (err) {
      toast({ title: "Upload error", description: (err as Error).message, variant: "destructive" })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleAddUser = async () => {
    if (!addUserForm.email || !addUserForm.given_name || !addUserForm.family_name || !addUserForm.username) {
      toast({ title: "Required fields missing", variant: "destructive" })
      return
    }
    setAddUserLoading(true)
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addUserForm),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to add user")
      }
      toast({ title: "User added successfully" })
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
      const usersRes = await fetch("/api/users")
      setMembers((await usersRes.json()).users)
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
      </Tabs>

      {/* Active Users */}
      <TabsContent value="active">
        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
            <CardDescription>
              Currently active system users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-wrap gap-4">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
              <Button onClick={() => setActiveTab("add")}>
                Add User
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.filter(m => !m.isSuspended).map((member) => {
                    const role = getUserRole(member.permissions)
                    const isCurrentUser = member.id === user?.id
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.picture} />
                              <AvatarFallback>{member.name?.[0] || member.email[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              {member.name || "Unnamed User"}
                              {isCurrentUser && <span className="ml-2 text-muted-foreground">(You)</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            role === "admin" ? "default" :
                              role === "manager" ? "secondary" : "outline"
                          }>
                            {role.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.isSuspended ? "destructive" : "default"}>
                            {member.isSuspended ? "SUSPENDED" : "ACTIVE"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!member.isSuspended && role !== "admin" && (
                              <Dialog open={confirmManagerId === member.id} onOpenChange={open => setConfirmManagerId(open ? member.id : null)}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={assigningManager === member.id}
                                  >
                                    {role === "manager" ? "Remove Manager" : "Make Manager"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Confirm Manager Change</DialogTitle>
                                    <DialogDescription>
                                      {role === "manager"
                                        ? `Remove manager permissions from ${member.email}?`
                                        : `Assign manager permissions to ${member.email}?`}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button
                                      variant="secondary"
                                      loading={assigningManager === member.id}
                                      onClick={() => handleAssignManager(member.id)}
                                    >
                                      Confirm
                                    </Button>
                                    <Button variant="outline" onClick={() => setConfirmManagerId(null)}>
                                      Cancel
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                            {!isCurrentUser && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={suspendingUser === member.id}
                                  >
                                    Suspend
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Suspend User?</DialogTitle>
                                    <DialogDescription>
                                      Temporarily disable access for {member.email}?
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button
                                      variant="destructive"
                                      loading={suspendingUser === member.id}
                                      onClick={() => handleSuspendUser(member.id)}
                                    >
                                      Confirm
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
            <CardTitle>Suspended Users</CardTitle>
            <CardDescription>
              Users with suspended access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.filter(m => m.isSuspended).map((member) => {
                    const role = getUserRole(member.permissions)
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.picture} />
                              <AvatarFallback>{member.name?.[0] || member.email[0]}</AvatarFallback>
                            </Avatar>
                            <div>{member.name || "Unnamed User"}</div>
                          </div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            role === "admin" ? "default" :
                              role === "manager" ? "secondary" : "outline"
                          }>
                            {role.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.isSuspended ? "destructive" : "default"}>
                            {member.isSuspended ? "SUSPENDED" : "ACTIVE"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled={unsuspendingUser === member.id}
                                >
                                  Unsuspend
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Unsuspend User?</DialogTitle>
                                  <DialogDescription>
                                    Restore access for {member.email}?
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button
                                    variant="secondary"
                                    loading={unsuspendingUser === member.id}
                                    onClick={() => handleUnsuspendUser(member.id)}
                                  >
                                    Confirm
                                  </Button>
                                  <Button variant="outline">Cancel</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
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
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 max-w-lg">
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
                  onChange={e => setAddUserForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label>Profile Image</Label>
                <div className="flex items-center gap-2">
                  {addUserForm.picture && (
                    <Avatar>
                      <AvatarImage src={addUserForm.picture} />
                      <AvatarFallback>IMG</AvatarFallback>
                    </Avatar>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="profile-image"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Upload Image"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleAddUser}
              disabled={addUserLoading || !addUserForm.email || !addUserForm.given_name || !addUserForm.family_name || !addUserForm.username}
            >
              {addUserLoading ? "Adding..." : "Add User"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </div>
  )
}
