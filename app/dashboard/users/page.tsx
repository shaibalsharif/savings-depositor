"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

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
  const [showArchived, setShowArchived] = useState(false)
  const [assigningManager, setAssigningManager] = useState<string | null>(null)
  const [confirmManagerId, setConfirmManagerId] = useState<string | null>(null)
  const [archivingUser, setArchivingUser] = useState<string | null>(null)
  const [unarchivingUser, setUnarchivingUser] = useState<string | null>(null)
  const isAdmin =true// user?.permissions?.includes("admin")

  // Fetch users from your backend API (which proxies Kinde Management API)
  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/users")
      const { users } = await res.json()
      setMembers(users)
    }
    fetchUsers()
  }, [])

  // Assign Manager logic
  const handleAssignManager = async (userId: string) => {
    setAssigningManager(userId)
    try {
      // 1. Find current manager
      const currentManager = members.find((m) => getUserRole(m.permissions) === "manager")
      // 2. Call your API to update permissions in Kinde
      const res = await fetch("/api/users/assign-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newManagerId: userId, oldManagerId: currentManager?.id }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Manager assigned successfully" })
      // Refresh users
      const usersRes = await fetch("/api/users")
      setMembers((await usersRes.json()).users)
    } catch {
      toast({ title: "Failed to assign manager", variant: "destructive" })
    } finally {
      setAssigningManager(null)
      setConfirmManagerId(null)
    }
  }

  // Archive user logic
  const handleArchiveUser = async (userId: string) => {
    setArchivingUser(userId)
    try {
      const res = await fetch(`/api/users/${userId}/archive`, { method: "POST" })
      if (!res.ok) throw new Error()
      toast({ title: "User archived" })
      // Refresh users
      const usersRes = await fetch("/api/users")
      setMembers((await usersRes.json()).users)
    } catch {
      toast({ title: "Failed to archive user", variant: "destructive" })
    } finally {
      setArchivingUser(null)
    }
  }

  // Unarchive user logic
  const handleUnarchiveUser = async (userId: string) => {
    setUnarchivingUser(userId)
    try {
      const res = await fetch(`/api/users/${userId}/unarchive`, { method: "POST" })
      if (!res.ok) throw new Error()
      toast({ title: "User activated" })
      // Refresh users
      const usersRes = await fetch("/api/users")
      setMembers((await usersRes.json()).users)
    } catch {
      toast({ title: "Failed to activate user", variant: "destructive" })
    } finally {
      setUnarchivingUser(null)
    }
  }

  const filteredMembers = members?.filter(
    (member) =>
      (member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (showArchived ? member.status === "archived" : member.status === "active"),
  )

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their permissions</p>
        </div>
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
                  <TableHead>Permission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers&& filteredMembers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                 filteredMembers && filteredMembers?.map((member) => {
                    const role = getUserRole(member.permissions)
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.avatar || `/placeholder.svg?height=32&width=32&text=${member.name?.charAt(0)}`} />
                              <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>{member.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              role === "admin"
                                ? "default"
                                : role === "manager"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.status === "active" ? "default" : "outline"}>
                            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {role !== "admin" && member.status === "active" && (
                              <Dialog open={confirmManagerId === member.id} onOpenChange={open => setConfirmManagerId(open ? member.id : null)}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={assigningManager === member.id}
                                  >
                                    Assign Manager
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Assign as Manager?</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to assign <b>{member.name}</b> as manager? The current manager will become a member.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button
                                      variant="secondary"
                                      loading={assigningManager === member.id}
                                      onClick={() => handleAssignManager(member.id)}
                                    >
                                      Yes, Assign
                                    </Button>
                                    <Button variant="outline" onClick={() => setConfirmManagerId(null)}>
                                      Cancel
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                            {member.status === "active" ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={archivingUser === member.id}
                                  >
                                    Archive
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Archive User?</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to archive <b>{member.name}</b>?
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button
                                      variant="destructive"
                                      loading={archivingUser === member.id}
                                      onClick={() => handleArchiveUser(member.id)}
                                    >
                                      Yes, Archive
                                    </Button>
                                    <Button variant="outline" onClick={() => setArchivingUser(null)}>
                                      Cancel
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={unarchivingUser === member.id}
                                  >
                                    Activate
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Activate User?</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to activate <b>{member.name}</b>?
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button
                                      variant="secondary"
                                      loading={unarchivingUser === member.id}
                                      onClick={() => handleUnarchiveUser(member.id)}
                                    >
                                      Yes, Activate
                                    </Button>
                                    <Button variant="outline" onClick={() => setUnarchivingUser(null)}>
                                      Cancel
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
