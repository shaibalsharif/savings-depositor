"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TableLoadMore } from "@/components/dashboard/tables/TableLoadMore";
import { format, parseISO, isValid } from "date-fns";
import { TableFilter } from "@/components/dashboard/tables/TableFilter";

const PAGE_LIMIT = 10;

const getActionBadge = (action: string) => {
  switch (action) {
    case "approve_deposit":
      return <Badge variant="success">Deposit Approved</Badge>;
    case "upload_deposit":
      return <Badge variant="default">Deposit Uploaded</Badge>;
    case "create_fund":
      return <Badge variant="success">Fund Created</Badge>;
    default:
      return <Badge variant="outline">{action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</Badge>;
  }
};

const DateWithTime = ({ value }: { value?: string | null }) => {
  if (!value) return <span className="text-muted-foreground">N/A</span>;
  const date = parseISO(value);
  if (!isValid(date)) return <span className="text-muted-foreground">N/A</span>;
  return (
    <div>
      {format(date, "dd MMM yyyy")}
      <div className="text-xs text-muted-foreground">{format(date, "HH:mm:ss")}</div>
    </div>
  );
};

const renderDetails = (action: string, details: any) => {
  try {
    const obj = typeof details === "string" ? JSON.parse(details) : details;
    switch (action) {
      case "approve_deposit":
        return (
          <>
            <div>Deposit ID: <b>{obj.depositId}</b></div>
            <div>Fund ID: <b>{obj.fundId}</b></div>
            <div>New Balance: <b>৳{obj.newBalance}</b></div>
          </>
        );
      case "upload_deposit":
        return (
          <>
            <div>Month: <b>{obj.month}</b></div>
            <div>Amount: <b>৳{obj.amount}</b></div>
          </>
        );
      default:
        return <pre className="text-xs bg-muted/50 rounded p-2 whitespace-pre-wrap max-w-[300px]">{JSON.stringify(obj, null, 2)}</pre>;
    }
  } catch {
    return <span>{details}</span>;
  }
};

export default function LogsPage() {
  const { user } = useKindeAuth();
  const [tab, setTab] = useState<"my" | "all">("my");
  const [logs, setLogs] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({
    userId: "", // will be set dynamically
    action: "all",
    startDate: "",
    endDate: "",
    query: "",
  });
  const [error, setError] = useState<string | null>(null);

  const canSeeAll = true//user?.role === "admin" || user?.role === "manager";

  // Update userId filter based on tab
  useEffect(() => {
    setFilter((prev) => ({
      ...prev,
      userId: tab === "my" ? (user?.id || "") : "", // empty means all users for "all" tab
    }));
    setPage(1);
  }, [tab, user?.id]);

  const fetchLogs = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filter.userId) params.append("userId", filter.userId);
      if (filter.action && filter.action !== "all") params.append("action", filter.action);
      if (filter.startDate) params.append("startDate", filter.startDate);
      if (filter.endDate) params.append("endDate", filter.endDate);
      if (filter.query) params.append("query", filter.query);

      params.append("limit", PAGE_LIMIT.toString());
      if (!reset && nextCursor) {
        params.append("cursor", nextCursor);
      }

      const res = await fetch(`/api/logs?${params.toString()}`, {
        headers: { "x-user-role": "admin", }// user?.role || "" },
      });

      if (!res.ok) {
        setError("Failed to fetch logs");
        setLoading(false);
        return;
      }

      const json = await res.json();
      const newLogs = json.logs || [];

      setLogs((prev) => (reset ? newLogs : [...prev, ...newLogs]));
      setNextCursor(json.nextCursor || null);
      setHasMore(Boolean(json.nextCursor));
    } catch {
      setError("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [filter, nextCursor, /* user?.role */]);
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchLogs(false);
    }
  };
  useEffect(() => {
    fetchLogs(true);
  }, [fetchLogs]);

  // const handleLoadMore = () => {
  //   if (hasMore && !loading) setPage((p) => p + 1);
  // };

  // Batch fetch user info for logs
  useEffect(() => {
    const uniqueUserIds = Array.from(new Set(logs.map(l => l.user_id).filter(Boolean)));
    if (uniqueUserIds.length === 0) {
      setUserMap({});
      return;
    }
    let cancelled = false;
    async function fetchUsers() {
      try {
        const res = await fetch("/api/deposits/depositors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: uniqueUserIds }),
        });
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        if (!cancelled) setUserMap(data);
      } catch {
        if (!cancelled) setUserMap({});
      }
    }
    fetchUsers();
    return () => { cancelled = true; };
  }, [logs]);

  const handleFilter = (newFilter: any) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
    setPage(1);
  };

  useEffect(() => {
    setFilter({
      userId: "", // will be set dynamically
      action: "all",
      startDate: "",
      endDate: "",
      query: "",
    })
  }, [tab])

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-2">Logs</h1>
      <p className="mb-6 text-muted-foreground">View and filter logs</p>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "my" | "all")}>
        <TabsList>
          <TabsTrigger value="my">My Logs</TabsTrigger>
          {canSeeAll && <TabsTrigger value="all">All Logs</TabsTrigger>}
        </TabsList>

        <TabsContent value="my">
          <TableFilter
            filterList={["action", "startDate", "endDate", "query"]}
            months={[]}
            onFilter={handleFilter}
          />
          <LogsTable logs={logs} userMap={userMap} />
          <TableLoadMore loading={loading} hasMore={hasMore} onClick={handleLoadMore} />
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </TabsContent>

        {canSeeAll && (
          <TabsContent value="all">
            <TableFilter
              filterList={["user", "action", "startDate", "endDate", "query"]}
              months={[]}
              onFilter={handleFilter}
            />
            <LogsTable logs={logs} userMap={userMap} />
            <TableLoadMore loading={loading} hasMore={hasMore} onClick={handleLoadMore} />
            {error && <div className="text-red-600 mt-2">{error}</div>}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function LogsTable({ logs, userMap }: { logs: any[]; userMap: Record<string, any> }) {
  if (logs.length === 0) {
    return <div className="text-center text-muted-foreground py-4">No logs found.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const user = userMap[log.user_id];
            return (
              <TableRow key={log.id}>
                <TableCell>
                  {log.user_id ? (
                    user ? (
                      <div className="flex items-center space-x-2">
                        {user.picture ? (
                          <Image src={user.picture} alt={user.name || "User"} width={32} height={32} className="rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                            {user.name?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span>{user.name || "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    ) : (
                      <span>Loading...</span>
                    )
                  ) : (
                    <span className="italic text-gray-400">System</span>
                  )}
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell>{renderDetails(log.action, log.details)}</TableCell>
                <TableCell>
                  <DateWithTime value={log.createdAt} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table></div>
  );
}
