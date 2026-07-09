"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface AnalyticsData {
  totalChats: number;
  totalMessages: number;
  providerStats: Record<string, number>;
  memberUsage: {
    name: string;
    userId: string;
    chats: number;
    prompts: number;
    voice: number;
    files: number;
    lastActive: string | null;
  }[];
  totalMembers: number;
  managerRole: boolean;
}

export function PAI2AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pai2/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch analytics");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Error loading analytics: {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {data.managerRole ? "PAI2 Usage Analytics" : "Your PAI2 Usage"}
          </h1>
          <p className="text-muted-foreground">
            {data.managerRole 
              ? "Monitor AI chatbot usage across all members." 
              : "View your personal AI assistant usage statistics."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#101726] border-border text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalChats}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#101726] border-border text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalMessages}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#101726] border-border text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {Object.entries(data.providerStats).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"}
            </div>
          </CardContent>
        </Card>
        {data.managerRole && (
          <Card className="bg-[#101726] border-border text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.memberUsage.filter((m) => m.prompts > 0).length} / {data.totalMembers}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {data.managerRole && (
        <Card className="bg-[#101726] border-border">
          <CardHeader>
            <CardTitle className="text-white">Member Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-white">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Total Chats</th>
                    <th className="px-4 py-3 font-medium">Total Prompts</th>
                    <th className="px-4 py-3 font-medium">Voice / File Prompts</th>
                    <th className="px-4 py-3 font-medium">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {data.memberUsage.map((m) => (
                    <tr key={m.userId} className="border-b border-border last:border-0 hover:bg-muted/10">
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3">{m.chats}</td>
                      <td className="px-4 py-3">{m.prompts}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.voice} voice / {m.files} file
                      </td>
                      <td className="px-4 py-3">
                        {m.lastActive ? format(new Date(m.lastActive), "PPp") : "Never"}
                      </td>
                    </tr>
                  ))}
                  {data.memberUsage.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                        No members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
