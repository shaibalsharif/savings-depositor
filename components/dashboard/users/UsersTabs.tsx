"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KindeUser } from "@/lib/actions/users/users";
import ActiveUsersTab from "./ActiveUsersTab";
import SuspendedUsersTab from "@/components/dashboard/users/SuspendedUsersTab";
import AddUserTab from "@/components/dashboard/users/AddUserTab";
import { useRouter } from "next/navigation";

export default function UsersTabs({ initialUsers }: { initialUsers: KindeUser[] }) {
  const [activeTab, setActiveTab] = useState("active");
  const router = useRouter();

  const handleUserUpdate = () => {
    // Force a re-render to get the latest data from the server
    router.refresh();
  };

  const activeUsers = initialUsers.filter(u => u.status === "active");
  const suspendedUsers = initialUsers.filter(u => u.status === "archived");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="active">Active Users</TabsTrigger>
        <TabsTrigger value="suspended">Suspended Users</TabsTrigger>
        <TabsTrigger value="add">Add User</TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        <ActiveUsersTab initialUsers={activeUsers} onUpdate={handleUserUpdate} />
      </TabsContent>
      <TabsContent value="suspended">
        <SuspendedUsersTab initialUsers={suspendedUsers} onUpdate={handleUserUpdate} />
      </TabsContent>
      <TabsContent value="add">
        <AddUserTab onUpdate={handleUserUpdate} />
      </TabsContent>
    </Tabs>
  );
}