// components/dashboard/users/SuspendedUsersTab.tsx
"use client";

import { useState, useMemo } from "react";
import { KindeUser, unsuspendUser } from "@/lib/actions/users/users";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function SuspendedUsersTab({ initialUsers, onUpdate }: { initialUsers: KindeUser[]; onUpdate: () => void }) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [unsuspendingUser, setUnsuspendingUser] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return initialUsers.filter(u =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [initialUsers, searchQuery]);

  const handleUnsuspendUser = async (userId: string) => {
    setUnsuspendingUser(userId);
    try {
      const result = await unsuspendUser(userId);
      if ("error" in result) throw new Error(result.error);
      toast({ title: "User unsuspended" });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Failed to unsuspend user", description: e.message, variant: "destructive" });
    } finally {
      setUnsuspendingUser(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suspended Users</CardTitle>
        <CardDescription>Users with suspended access</CardDescription>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">No suspended users found</TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const fullName = `${user.first_name} ${user.last_name}`;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.picture || ''} />
                            <AvatarFallback>{fullName?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col gap-1">
                            <span>{fullName}</span>
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                            <span className="text-xs text-muted-foreground">{user.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="secondary" size="sm" disabled={unsuspendingUser === user.id}>
                              Unsuspend
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Unsuspend User?</DialogTitle>
                              <DialogDescription>Restore access for {user.email}?</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="secondary" onClick={() => handleUnsuspendUser(user.id)} disabled={unsuspendingUser === user.id}>
                                {unsuspendingUser === user.id ? "Loading..." : "Confirm"}
                              </Button>
                              <Button variant="outline">Cancel</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}