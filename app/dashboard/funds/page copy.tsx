"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { fundAccounts, activityLogs } from "@/lib/dummy-data"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeftRight } from "lucide-react"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

export default  function FundsPage() {


const {user} =  useKindeAuth()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState(fundAccounts)
  const [transferAmount, setTransferAmount] = useState("")
  const [transferFrom, setTransferFrom] = useState("main")
  const [transferTo, setTransferTo] = useState("side")
  const [transferNote, setTransferNote] = useState("")
  const [logs, setLogs] = useState(activityLogs.filter((log) => log.action === "transfer"))

  const isFinanceManager = true//user?.role === "finance_manager" || user?.role === "admin"

  if (!isFinanceManager) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>You do not have permission to access fund management.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Only finance managers and administrators can access and modify fund accounts.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault()

    const amount = Number(transferAmount)

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid transfer amount",
        variant: "destructive",
      })
      return
    }

    if (transferFrom === transferTo) {
      toast({
        title: "Invalid transfer",
        description: "Source and destination accounts cannot be the same",
        variant: "destructive",
      })
      return
    }

    // Check if source account has enough funds
    if (accounts[transferFrom as keyof typeof accounts].balance < amount) {
      toast({
        title: "Insufficient funds",
        description: `Not enough funds in the ${transferFrom === "main" ? "Main" : "Side"} account`,
        variant: "destructive",
      })
      return
    }

    // Update account balances
    const updatedAccounts = {
      ...accounts,
      [transferFrom]: {
        ...accounts[transferFrom as keyof typeof accounts],
        balance: accounts[transferFrom as keyof typeof accounts].balance - amount,
      },
      [transferTo]: {
        ...accounts[transferTo as keyof typeof accounts],
        balance: accounts[transferTo as keyof typeof accounts].balance + amount,
      },
    }

    // Create a new log entry
    const newLog = {
      id: `log-${Date.now()}`,
      action: "transfer",
      description: `Funds transferred from ${transferFrom === "main" ? "Main" : "Side"} to ${transferTo === "main" ? "Main" : "Side"} account${transferNote ? `: ${transferNote}` : ""}`,
      amount,
      date: new Date().toLocaleDateString(),
      performedBy: user?.id || "",
      performedByName: user?.email || "Finance Manager",
    }

    setAccounts(updatedAccounts)
    setLogs([newLog, ...logs])

    toast({
      title: "Transfer successful",
      description: `৳${amount.toLocaleString()} transferred from ${transferFrom === "main" ? "Main" : "Side"} to ${transferTo === "main" ? "Main" : "Side"} account`,
    })

    // Reset form
    setTransferAmount("")
    setTransferNote("")
  }

  const handleSwitchAccounts = () => {
    setTransferFrom(transferTo)
    setTransferTo(transferFrom)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fund Management</h1>
        <p className="text-muted-foreground">Manage and transfer funds between accounts</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Main Account</CardTitle>
            <CardDescription>Primary bank account for group savings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">৳ {accounts.main.balance.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Side Account</CardTitle>
            <CardDescription>Secondary account for additional funds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">৳ {accounts.side.balance.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transfer">
        <TabsList>
          <TabsTrigger value="transfer">Transfer Funds</TabsTrigger>
          <TabsTrigger value="history">Transfer History</TabsTrigger>
        </TabsList>

        <TabsContent value="transfer">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Between Accounts</CardTitle>
              <CardDescription>Move funds between main and side accounts</CardDescription>
            </CardHeader>
            <form onSubmit={handleTransfer}>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="from-account">From</Label>
                    <select
                      id="from-account"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={transferFrom}
                      onChange={(e) => setTransferFrom(e.target.value)}
                    >
                      <option value="main">Main Account (৳{accounts.main.balance.toLocaleString()})</option>
                      <option value="side">Side Account (৳{accounts.side.balance.toLocaleString()})</option>
                    </select>
                  </div>

                  <Button type="button" variant="outline" size="icon" className="mt-8" onClick={handleSwitchAccounts}>
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>

                  <div className="flex-1 space-y-2">
                    <Label htmlFor="to-account">To</Label>
                    <select
                      id="to-account"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                    >
                      <option value="main">Main Account (৳{accounts.main.balance.toLocaleString()})</option>
                      <option value="side">Side Account (৳{accounts.side.balance.toLocaleString()})</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (৳)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount to transfer"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Add a note for this transfer"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  Transfer Funds
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Transfer History</CardTitle>
              <CardDescription>View all fund transfers between accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Performed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          No transfer history found
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{log.date}</TableCell>
                          <TableCell>{log.description}</TableCell>
                          <TableCell>৳ {log.amount?.toLocaleString()}</TableCell>
                          <TableCell>{log.performedByName}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
