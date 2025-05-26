"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { memberData } from "@/lib/dummy-data"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

export default function UsersPage() {
  const { user } = useKindeAuth()
  const { toast } = useToast()
  const [members, setMembers] = useState(memberData)
  const [searchQuery, setSearchQuery] = useState("")
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "member",
    initialDeposit: "",
  })
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState("123456")
  const [showArchived, setShowArchived] = useState(false)

  const isAdmin = user?.role === "admin"

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>You do not have permission to access user management.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Only administrators can access and modify user information.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredMembers = members.filter(
    (member) =>
      (member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (showArchived ? member.status === "archived" : member.status === "active"),
  )

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.phone) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const member = {
      id: `m-${Date.now()}`,
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone,
      role: newMember.role as "member" | "finance_manager" | "admin",
      joinDate: new Date().toLocaleDateString(),
      status: "active" as "active" | "archived",
      totalContribution: newMember.initialDeposit ? Number(newMember.initialDeposit) : 0,
    }

    setMembers([...members, member])

    toast({
      title: "User added",
      description: `${member.name} has been added with default password: 123456`,
    })

    setNewMember({
      name: "",
      email: "",
      phone: "",
      role: "member",
      initialDeposit: "",
    })
  }

  const handleArchiveUser = (userId: string) => {
    setMembers(
      members.map((member) =>
        member.id === userId ? { ...member, status: member.status === "active" ? "archived" : "active" } : member,
      ),
    )

    const memberName = members.find((m) => m.id === userId)?.name

    toast({
      title: "User status updated",
      description: `${memberName} has been ${
        members.find((m) => m.id === userId)?.status === "active" ? "archived" : "activated"
      }.`,
    })
  }

 

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Add, edit, and manage system users</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Add a new user to the group savings system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newMember.role} onValueChange={(value) => setNewMember({ ...newMember, role: value })}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="finance_manager">Finance Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialDeposit">Initial Deposit (Optional)</Label>
                <Input
                  id="initialDeposit"
                  type="number"
                  placeholder="0"
                  value={newMember.initialDeposit}
                  onChange={(e) => setNewMember({ ...newMember, initialDeposit: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Default password will be set to: <span className="font-medium">123456</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  User will need to verify phone number to change password.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddMember}>Add User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" onClick={() => setShowArchived(false)}>
            Active Users
          </TabsTrigger>
          <TabsTrigger value="archived" onClick={() => setShowArchived(true)}>
            Archived Users
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>{showArchived ? "Archived Users" : "Active Users"}</CardTitle>
          <CardDescription>
            {showArchived ? "View and manage archived users" : "Manage and view all active users in the system"}
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Total Contribution</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${member.name.charAt(0)}`} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>{member.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.role === "admin"
                              ? "default"
                              : member.role === "finance_manager"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {member.role === "finance_manager"
                            ? "Finance Manager"
                            : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.joinDate}</TableCell>
                      <TableCell>৳ {member.totalContribution.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedUser(member)}>
                                Reset Password
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reset Password</DialogTitle>
                                <DialogDescription>Reset password for {selectedUser?.name}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="new-password">New Password</Label>
                                  <Input
                                    id="new-password"
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={()=>{}}>Reset Password</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant={showArchived ? "default" : "destructive"}
                            size="sm"
                            onClick={() => handleArchiveUser(member.id)}
                          >
                            {showArchived ? "Activate" : "Archive"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
