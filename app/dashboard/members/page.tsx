"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { memberData } from "@/lib/dummy-data"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

export default function MembersPage() {
  const { user } = useKindeAuth()
  const [members, setMembers] = useState(memberData)
  const [searchQuery, setSearchQuery] = useState("")
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "member",
  })

  const isAdmin = user?.role === "admin"
  const isFinanceManager = user?.role === "finance_manager" || isAdmin

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddMember = () => {
    const member = {
      id: `m-${Date.now()}`,
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone,
      role: newMember.role,
      joinDate: new Date().toLocaleDateString(),
      status: "active",
      totalContribution: 0,
    }

    setMembers([...members, member])
    setNewMember({
      name: "",
      email: "",
      phone: "",
      role: "member",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Member Management</h1>
          <p className="text-muted-foreground">View and manage group members</p>
        </div>

        {isFinanceManager && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>Add Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>Add a new member to the group savings system.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  />
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={newMember.role}
                      onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                    >
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
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleAddMember}>Add Member</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Manage and view all members in the group</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              placeholder="Search members..."
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
                  <TableHead>Role</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Contribution</TableHead>
                  {isFinanceManager && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isFinanceManager ? 7 : 6} className="text-center">
                      No members found
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
                      <TableCell>
                        <Badge variant={member.status === "active" ? "success" : "destructive"}>
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>৳ {member.totalContribution.toLocaleString()}</TableCell>
                      {isFinanceManager && (
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      )}
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
