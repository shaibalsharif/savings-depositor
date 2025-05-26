"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { activityLogs } from "@/lib/dummy-data"
import { Calendar, CreditCard, User, Wallet } from "lucide-react"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

export default function LogsPage() {
  const { user } = useKindeAuth()
  const [logs, setLogs] = useState(activityLogs)
  const [filterAction, setFilterAction] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<string>("all")

  const isAdmin = user?.role === "admin"
  const isFinanceManager = user?.role === "finance_manager" || isAdmin
  const isMember = user?.role === "member"

  // For members, only show their own logs
  const userLogs = isMember ? logs.filter((log) => log.userId === user?.id) : logs

  const filteredLogs = userLogs.filter((log) => {
    const actionMatch = filterAction === "all" || log.action === filterAction
    const searchMatch =
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.userName && log.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.performedByName && log.performedByName.toLowerCase().includes(searchQuery.toLowerCase()))

    // Date filtering logic would go here in a real app

    return actionMatch && searchMatch
  })

  const getActionIcon = (action: string) => {
    switch (action) {
      case "deposit":
      case "deposit_partial":
        return <Wallet className="h-4 w-4" />
      case "withdrawal":
        return <CreditCard className="h-4 w-4" />
      case "user_added":
        return <User className="h-4 w-4" />
      case "transfer":
        return <Calendar className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

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
      case "transfer":
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
                  <SelectItem value="transfer">Fund Transfer</SelectItem>
                </SelectContent>
              </Select>
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
                  {isFinanceManager && <TableHead>User</TableHead>}
                  <TableHead>Amount</TableHead>
                  {isFinanceManager && <TableHead>Performed By</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isFinanceManager ? 6 : 4} className="text-center">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>{log.description}</TableCell>
                      {isFinanceManager && <TableCell>{log.userName || "System"}</TableCell>}
                      <TableCell>{log.amount ? `৳ ${log.amount.toLocaleString()}` : "-"}</TableCell>
                      {isFinanceManager && <TableCell>{log.performedByName}</TableCell>}
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
