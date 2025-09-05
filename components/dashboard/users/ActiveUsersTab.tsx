// components/dashboard/users/ActiveUsersTab.tsx

"use client";

import { useState, useMemo } from "react";
import { KindeUser, suspendUser, handleManagerPermission } from "@/lib/actions/users/users";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { FileDown, Info } from 'lucide-react';
import { generateUserInfoPdf } from "@/lib/actions/util/generateInfoPdf";
import { InfoModal } from "./infoModal";

function getUserRole(permissions: string[] = []) {
  const role = ["user"];
  if (permissions.includes("admin")) role.push("admin");
  if (permissions.includes("manager")) role.push("manager");
  return role;
}

export default function ActiveUsersTab({ initialUsers, onUpdate }: { initialUsers: KindeUser[]; onUpdate: () => void }) {
  const { user } = useKindeAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [assigningManager, setAssigningManager] = useState<string | null>(null);
  const [confirmManagerId, setConfirmManagerId] = useState<string | null>(null);
  const [suspendingUser, setSuspendingUser] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);


  const handleShowInfoModal = (userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };



  const filteredUsers = useMemo(() => {
    return initialUsers.filter(u =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      const getPriority = (member: any) => {
        if (member.permissions?.includes("admin")) return 0;
        if (member.permissions?.includes("manager")) return 1;
        return 2;
      };
      return getPriority(a) - getPriority(b);
    });
  }, [initialUsers, searchQuery]);

  const handleAssignManager = async (userId: string, type: "assign" | "remove") => {
    setAssigningManager(userId);
    try {
      const currentManager = initialUsers.find(m =>
        getUserRole(m.permissions).includes("manager") && !m.permissions.includes("admin")
      );
      const result = await handleManagerPermission(userId, type, currentManager?.id);
      if ("error" in result) throw new Error(result.error);
      toast({ title: "Manager permissions updated" });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Failed to update manager", description: e.message, variant: "destructive" });
    } finally {
      setAssigningManager(null);
      setConfirmManagerId(null);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    setSuspendingUser(userId);
    try {
      const result = await suspendUser(userId);
      if ("error" in result) throw new Error(result.error);
      toast({ title: "User suspended" });
      onUpdate();
    } catch (e: any) {
      toast({ title: "Failed to suspend user", description: e.message, variant: "destructive" });
    } finally {
      setSuspendingUser(null);
    }
  };

  const handleDownloadPdf = async (userId: string, userName: string) => {
    setDownloadingPdf(userId);
    try {
      const result = await generateUserInfoPdf(userId);

      // Type Guard: Check if the result is an object with an 'error' property
      if (typeof result === 'object' && result !== null && 'error' in result) {
        // If it's an error object, throw a new Error with the error message
        throw new Error((result as { error: string }).error);
      }

      // The result is a Buffer, which is compatible with ArrayBuffer
      const blob = new Blob([result as unknown as ArrayBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${userName}_info.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({ title: "PDF Generated", description: "The user information PDF has been downloaded." });
    } catch (e: unknown) { // Use 'unknown' here for safety
      let errorMessage = "An unexpected error occurred.";
      if (e instanceof Error) {
        errorMessage = e.message;
      } else if (typeof e === "object" && e !== null && "error" in e) {
        errorMessage = (e as { error: string }).error;
      }
      toast({ title: "Failed to generate PDF", description: errorMessage, variant: "destructive" });
    } finally {
      setDownloadingPdf(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
          <CardDescription>Currently active system users</CardDescription>
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
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No active users found</TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((member) => {
                    const role = getUserRole(member.permissions);
                    const isCurrentUser = member.id === user?.id;


                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.picture || ''} />
                              <AvatarFallback>{member.first_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              {member.first_name} {member.last_name}
                              {isCurrentUser && <span className="ml-2 text-muted-foreground">(You)</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell className="space-x-1">
                          {role.map((role_name, index) => (
                            <Badge key={`${role_name}-${index}`} variant={
                              role_name === "admin" ? "default" : role_name === "manager" ? "success" : "secondary"
                            }>
                              {role_name.toUpperCase()}
                            </Badge>
                          ))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 ">
                             {/* NEW BUTTON FOR DATA INFO MODAL */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShowInfoModal(member.id)}
                            >
                                <Info className="h-4 w-4" />
                            </Button>
                            {/* Download PDF Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPdf(member.id, `${member.first_name} ${member.last_name}`)}
                              disabled={downloadingPdf === member.id}
                            >
                              <FileDown className="h-4 w-4 mr-2" />
                              {downloadingPdf === member.id ? "Generating..." : "PDF"}
                            </Button>
                            {/* Manager Assignment Dialog */}
                            {member.status === "active" && !role.includes("admin") && (
                              <Dialog open={confirmManagerId === member.id} onOpenChange={open => setConfirmManagerId(open ? member.id : null)}>
                                <DialogTrigger asChild>
                                  <Button variant={role.includes("manager") ? 'destructive' : "primary"} size="sm" disabled={assigningManager === member.id}>
                                    {role.includes("manager") ? "Remove Manager" : "Make Manager"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Confirm Manager Change</DialogTitle>
                                    <DialogDescription>
                                      {role.includes("manager") ? `Remove manager permissions from ${member.email}?` : `Assign manager permissions to ${member.email}?`}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="secondary" onClick={() => handleAssignManager(member.id, role.includes("manager") ? "remove" : "assign")} disabled={assigningManager === member.id}>
                                      {assigningManager === member.id ? "Loading..." : "Confirm"}
                                    </Button>
                                    <Button variant="outline" onClick={() => setConfirmManagerId(null)}>Cancel</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                            {/* Suspend/Unsuspend Dialog */}
                            {(!isCurrentUser && !role.includes("admin") && !role.includes("manager")) && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="secondary" size="sm" disabled={suspendingUser === member.id}>
                                    Suspend
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Suspend User?</DialogTitle>
                                    <DialogDescription>Temporarily disable access for {member.email}?</DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="destructive" onClick={() => handleSuspendUser(member.id)} disabled={suspendingUser === member.id}>
                                      {suspendingUser === member.id ? "Loading..." : "Confirm"}
                                    </Button>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
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
      {/* NEW DATA INFO MODAL */}
      <InfoModal
        userId={selectedUserId!}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}