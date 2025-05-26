"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { withdrawalData, memberData, fundAccounts } from "@/lib/dummy-data"
import { useToast } from "@/hooks/use-toast"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

export default function WithdrawalsPage() {
  const { user } = useKindeAuth()
  const { toast } = useToast()
  const [withdrawals, setWithdrawals] = useState(withdrawalData)
  const [amount, setAmount] = useState("")
  const [purpose, setPurpose] = useState("")
  const [details, setDetails] = useState("")
  const [account, setAccount] = useState("main")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterAccount, setFilterAccount] = useState<string>("all")

  const isFinanceManager = user?.role === "finance_manager" || user?.role === "admin"
  const isMember = user?.role === "member"

  // For members, only show their own withdrawals
  const userWithdrawals = isMember ? withdrawals.filter((withdrawal) => withdrawal.userId === user?.id) : withdrawals

  const filteredWithdrawals = userWithdrawals.filter((withdrawal) => {
    const statusMatch = filterStatus === "all" || withdrawal.status === filterStatus
    const accountMatch = filterAccount === "all" || withdrawal.account === filterAccount
    return statusMatch && accountMatch
  })

  // Get the current user's total contribution
  const currentUserContribution = memberData.find((member) => member.id === user?.id)?.totalContribution || 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || !purpose || !details) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const amountValue = Number.parseFloat(amount)

    // Check if withdrawal amount is greater than user's savings
    if (amountValue > currentUserContribution) {
      toast({
        title: "Invalid amount",
        description: "Withdrawal amount cannot exceed your total savings",
        variant: "destructive",
      })
      return
    }

    const newWithdrawal = {
      id: `w-${Date.now()}`,
      amount: amountValue,
      purpose,
      details,
      date: new Date().toLocaleDateString(),
      status: "pending",
      requestedBy: user?.name || "Current User",
      userId: user?.id || "",
      account,
    }

    setWithdrawals([newWithdrawal, ...withdrawals])

    toast({
      title: "Withdrawal requested",
      description: "Your withdrawal request has been submitted and is pending approval",
    })

    setAmount("")
    setPurpose("")
    setDetails("")
    setAccount("main")
  }

  const handleApproveWithdrawal = (withdrawalId: string) => {
    setWithdrawals(
      withdrawals.map((withdrawal) =>
        withdrawal.id === withdrawalId ? { ...withdrawal, status: "approved" } : withdrawal,
      ),
    )

    toast({
      title: "Withdrawal approved",
      description: "The withdrawal request has been approved",
    })
  }

  const handleRejectWithdrawal = (withdrawalId: string) => {
    setWithdrawals(
      withdrawals.map((withdrawal) =>
        withdrawal.id === withdrawalId ? { ...withdrawal, status: "rejected" } : withdrawal,
      ),
    )

    toast({
      title: "Withdrawal rejected",
      description: "The withdrawal request has been rejected",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Withdrawal Management</h1>
        <p className="text-muted-foreground">Request and track withdrawals from the group fund</p>
      </div>

      <Tabs defaultValue={isFinanceManager ? "pending-withdrawals" : "all-withdrawals"}>
        <TabsList>
          <TabsTrigger value="all-withdrawals">All Withdrawals</TabsTrigger>
          <TabsTrigger value="request-withdrawal">Request Withdrawal</TabsTrigger>
          {isFinanceManager && <TabsTrigger value="pending-withdrawals">Pending Approval</TabsTrigger>}
        </TabsList>

        <TabsContent value="all-withdrawals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>View and filter your withdrawal history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-wrap gap-4">
                <div className="w-full md:w-auto">
                  <Label htmlFor="status-filter">Filter by Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger id="status-filter" className="w-full md:w-[180px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-auto">
                  <Label htmlFor="account-filter">Filter by Account</Label>
                  <Select value={filterAccount} onValueChange={setFilterAccount}>
                    <SelectTrigger id="account-filter" className="w-full md:w-[180px]">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      <SelectItem value="main">Main Account</SelectItem>
                      <SelectItem value="side">Side Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWithdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No withdrawals found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWithdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>{withdrawal.purpose}</TableCell>
                          <TableCell>৳ {withdrawal.amount.toLocaleString()}</TableCell>
                          <TableCell>{withdrawal.requestedBy}</TableCell>
                          <TableCell>{withdrawal.date}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                withdrawal.status === "approved"
                                  ? "success"
                                  : withdrawal.status === "pending"
                                    ? "outline"
                                    : "destructive"
                              }
                            >
                              {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={withdrawal.account === "main" ? "default" : "secondary"}>
                              {withdrawal.account === "main" ? "Main" : "Side"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="request-withdrawal">
          <Card>
            <CardHeader>
              <CardTitle>Request Withdrawal</CardTitle>
              <CardDescription>Submit a new withdrawal request</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (৳)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Your total savings: ৳{currentUserContribution.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account">Account</Label>
                  <Select value={account} onValueChange={setAccount} required>
                    <SelectTrigger id="account">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main Account (৳{fundAccounts.main.balance.toLocaleString()})</SelectItem>
                      <SelectItem value="side">Side Account (৳{fundAccounts.side.balance.toLocaleString()})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Select value={purpose} onValueChange={setPurpose} required>
                    <SelectTrigger id="purpose">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Emergency Fund">Emergency Fund</SelectItem>
                      <SelectItem value="Equipment Purchase">Equipment Purchase</SelectItem>
                      <SelectItem value="Business Investment">Business Investment</SelectItem>
                      <SelectItem value="Medical Expenses">Medical Expenses</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">Details</Label>
                  <Textarea
                    id="details"
                    placeholder="Provide details about this withdrawal request"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  Submit Request
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {isFinanceManager && (
          <TabsContent value="pending-withdrawals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Withdrawals</CardTitle>
                <CardDescription>Approve or reject withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requested By</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.filter((w) => w.status === "pending").length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">
                            No pending withdrawals
                          </TableCell>
                        </TableRow>
                      ) : (
                        withdrawals
                          .filter((w) => w.status === "pending")
                          .map((withdrawal) => (
                            <TableRow key={withdrawal.id}>
                              <TableCell>{withdrawal.requestedBy}</TableCell>
                              <TableCell>{withdrawal.purpose}</TableCell>
                              <TableCell>৳ {withdrawal.amount.toLocaleString()}</TableCell>
                              <TableCell>{withdrawal.date}</TableCell>
                              <TableCell>
                                <Badge variant={withdrawal.account === "main" ? "default" : "secondary"}>
                                  {withdrawal.account === "main" ? "Main" : "Side"}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">{withdrawal.details}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRejectWithdrawal(withdrawal.id)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
