// components/dashboard/tabs/LogsTabsClient.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { LogEntry } from "@/lib/actions/logs/logs";

import LogTable from "../tables/LogTable";
import { KindeUser as User } from "@/lib/actions/users/users";

interface LogsTabsClientProps {
  isManagerOrAdmin: boolean;
  tab: "my" | "all";
  logEntries: LogEntry[];
  totalCount: number;
  allUsers: User[];
}

export default function LogsTabsClient({ isManagerOrAdmin, tab, logEntries, totalCount, allUsers }: LogsTabsClientProps) {
  const router = useRouter();

  const handleTabChange = (newTab: string) => {
    router.push(`/dashboard/logs?tab=${newTab}`);
  };

  return (
    <Tabs  value={tab} onValueChange={handleTabChange}>
      <TabsList defaultValue={"my"}>
        <TabsTrigger  value="my">My Logs</TabsTrigger>
        {isManagerOrAdmin && <TabsTrigger value="all">All Logs</TabsTrigger>}
      </TabsList>
      <TabsContent value="my">
        <LogTable
          logs={logEntries}
          totalCount={totalCount}
          showUserFilter={false}
          isManagerOrAdmin={isManagerOrAdmin}
          allUsers={allUsers}
          alllogs={false}
        />
      </TabsContent>
      {isManagerOrAdmin && (
        <TabsContent value="all">
          <LogTable
            logs={logEntries}
            totalCount={totalCount}
            showUserFilter={true}
            isManagerOrAdmin={isManagerOrAdmin}
            allUsers={allUsers}
            alllogs={true}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}