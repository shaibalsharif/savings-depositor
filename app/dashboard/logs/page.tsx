"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, CreditCard, User, Wallet } from "lucide-react"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

type Log = {
  id: string
  action: string
  description: string
  amount?: number
  createdAt: string
  performedBy: string
  affectedUser?: string
}

export default function LogsPage() {
  const { user } = useKindeAuth()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({})
  const [selectedUser, setSelectedUser] = useState<string>("")

  const isAdmin = true// user?.permissions?.admin === "true"
  const isFinanceManager = true//user?.permissions?.finance_manager === "true" || isAdmin
  const isMember = true// !isAdmin && !isFinanceManager

  // Fetch logs on mount and when filters change

  const [users, setUsers] = useState<{ email: string }[]>([])

  useEffect(() => {
    if (isAdmin || isFinanceManager) {
      fetch("/api/users")
        .then(res => res.json())
        .then(({ users }) => setUsers(users))
        .catch(console.error)
    }
  }, [isAdmin, isFinanceManager])
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (filterAction !== "all") params.set("action", filterAction)
        if (isAdmin || isFinanceManager) {
          if (selectedUser) params.set("userId", selectedUser)
        }
        if (dateRange.start) params.set("startDate", dateRange.start)
        if (dateRange.end) params.set("endDate", dateRange.end)
        if (searchQuery) params.set("query", searchQuery)
        // For members, backend will filter by user.email
        const res = await fetch(`/api/logs?${params.toString()}`)
        const { logs } = await res.json()
        setLogs(logs)
      } catch (err) {
        console.error("Failed to fetch logs:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [filterAction, selectedUser, dateRange, searchQuery, user?.email])




  // For members, only show their own logs (handled by backend)
  const filteredLogs = logs.filter((log) => {
    const actionMatch = filterAction === "all" || log?.action === filterAction
    const searchMatch =
      log?.description?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
      (log?.affectedUser && log?.affectedUser?.toLowerCase().includes(searchQuery?.toLowerCase())) ||
      (log?.performedBy?.toLowerCase().includes(searchQuery?.toLowerCase()))
    return actionMatch && searchMatch
  })



  const getActionBadge = (action: string) => {
    switch (action) {
      case "deposit":
        return <Badge variant="success">Deposit</Badge>
      case "deposit_partial":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
            Partial Deposit
          </Badge>
        )
      case "withdrawal":
        return <Badge variant="destructive">Withdrawal</Badge>
      case "user_added":
        return <Badge variant="secondary">User Added</Badge>
      case "fund_transfer":
        return <Badge variant="default">Fund Transfer</Badge>
      default:
        return <Badge variant="outline">Other</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground">
          {isMember ? "View your activity history" : "Track all system activities and transactions"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
          <CardDescription>
            {isMember ? "Your personal activity log" : "Comprehensive log of all system activities"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="w-full md:w-auto">
              <Label htmlFor="action-filter">Filter by Action</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger id="action-filter" className="w-full md:w-[180px]">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="deposit_partial">Partial Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="user_added">User Added</SelectItem>
                  <SelectItem value="fund_transfer">Fund Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(isAdmin || isFinanceManager) && (
              <div className="w-full md:w-auto">
                <Label htmlFor="user-filter">Filter by User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger id="user-filter" className="w-full md:w-[180px]">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="user-1">User-1</SelectItem>
                    <SelectItem value="user-2">User-2</SelectItem>
                    {/* In a real app, fetch users and map here */}
                    {/* Example: users.map(u => <SelectItem key={u.email} value={u.email}>{u.email}</SelectItem>) */}
                    {/* For this demo, you would fetch users and populate this */}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="w-full md:w-auto">
              <Label htmlFor="date-start">From</Label>
              <Input
                id="date-start"
                type="date"
                value={dateRange.start || ""}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full md:w-[150px]"
              />
            </div>
            <div className="w-full md:w-auto">
              <Label htmlFor="date-end">To</Label>
              <Input
                id="date-end"
                type="date"
                value={dateRange.end || ""}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full md:w-[150px]"
              />
            </div>

            <div className="w-full md:w-auto md:flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by description or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  {(isAdmin || isFinanceManager) && <TableHead>User</TableHead>}
                  <TableHead>Amount</TableHead>
                  {(isAdmin || isFinanceManager) && <TableHead>Performed By</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={(isAdmin || isFinanceManager) ? 6 : 4} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={(isAdmin || isFinanceManager) ? 6 : 4} className="text-center">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>{log.description}</TableCell>
                      {(isAdmin || isFinanceManager) && (
                        <TableCell>{log.affectedUser || "System"}</TableCell>
                      )}
                      <TableCell>{log.amount ? `৳ ${log.amount.toLocaleString()}` : "-"}</TableCell>
                      {(isAdmin || isFinanceManager) && (
                        <TableCell>{log.performedBy}</TableCell>
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
