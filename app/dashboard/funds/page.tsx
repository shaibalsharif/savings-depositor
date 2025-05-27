"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeftRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

export default function FundsPage() {
  const { user } = useKindeAuth()
  const { toast } = useToast()
  const [funds, setFunds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])
  const [showAddFund, setShowAddFund] = useState(false)
  const [showDeleteFund, setShowDeleteFund] = useState<{ open: boolean, fundId?: number, fundTitle?: string }>({ open: false })
  const [newFundTitle, setNewFundTitle] = useState("")
  const [addLoading, setAddLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [transferAmount, setTransferAmount] = useState("")
  const [transferFrom, setTransferFrom] = useState<number | null>(null)
  const [transferTo, setTransferTo] = useState<number | null>(null)
  const [transferNote, setTransferNote] = useState("")
  const [transferLoading, setTransferLoading] = useState(false)
  const isFinanceManager = true // Replace with your real check

  // Fetch funds and transactions
  const fetchData = async () => {
    setLoading(true)
    try {
      const [fundsRes, logsRes] = await Promise.all([
        fetch("/api/funds"),
        fetch("/api/fund-transactions"),
      ])
      const { funds } = await fundsRes.json()
      const { transactions } = await logsRes.json()
      setFunds(funds)
      setLogs(transactions)
      if (funds.length > 1) {
        setTransferFrom(funds[0].id)
        setTransferTo(funds[1].id)
      } else if (funds.length === 1) {
        setTransferFrom(funds[0].id)
        setTransferTo(null)
      }
    } catch {
      toast({ title: "Error", description: "Failed to load funds or transactions", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line
  }, [])

  // Add Fund
  const handleAddFund = async () => {
    if (!newFundTitle.trim()) {
      toast({ title: "Enter fund name", variant: "destructive" })
      return
    }
    setAddLoading(true)
    try {
      const res = await fetch("/api/funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newFundTitle }),
      })
      if (!res.ok) throw new Error("Failed to create fund")
      setNewFundTitle("")
      setShowAddFund(false)
      toast({ title: "Fund created" })
      fetchData()
    } catch {
      toast({ title: "Failed to create fund", variant: "destructive" })
    } finally {
      setAddLoading(false)
    }
  }

  // Delete Fund
  const handleDeleteFund = async () => {
    if (!showDeleteFund.fundId) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/funds/${showDeleteFund.fundId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete fund")
      setShowDeleteFund({ open: false })
      toast({ title: "Fund deleted" })
      fetchData()
    } catch {
      toast({ title: "Failed to delete fund", variant: "destructive" })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Transfer funds
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(transferAmount)
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid transfer amount", variant: "destructive" })
      return
    }
    if (!transferFrom || !transferTo || transferFrom === transferTo) {
      toast({ title: "Invalid transfer", description: "Source and destination funds must be different", variant: "destructive" })
      return
    }
    const fromFund = funds.find(f => f.id === transferFrom)
    if (!fromFund || Number(fromFund.balance) < amount) {
      toast({ title: "Insufficient funds", description: "Not enough balance in source fund", variant: "destructive" })
      return
    }
    setTransferLoading(true)
    try {
      const res = await fetch("/api/fund-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromFundId: transferFrom,
          toFundId: transferTo,
          amount,
          description: transferNote,
        }),
      })
      if (!res.ok) throw new Error("Transfer failed")
      toast({ title: "Transfer successful", description: `৳${amount.toLocaleString()} transferred.` })
      setTransferAmount("")
      setTransferNote("")
      fetchData()
    } catch {
      toast({ title: "Error", description: "Failed to transfer funds", variant: "destructive" })
    } finally {
      setTransferLoading(false)
    }
  }

  const handleSwitchAccounts = () => {
    setTransferFrom(transferTo)
    setTransferTo(transferFrom)
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fund Management</h1>
          <p className="text-muted-foreground">Manage and transfer funds between accounts</p>
        </div>
        <Button onClick={() => setShowAddFund(true)}>Add New Fund</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {loading ? (
          <>
            <Card><CardContent>Loading...</CardContent></Card>
            <Card><CardContent>Loading...</CardContent></Card>
          </>
        ) : (
          funds.map(fund => (
            <Card key={fund.id}>
              <CardHeader>
                <CardTitle>{fund.title}</CardTitle>
                <CardDescription>Fund ID: {fund.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">৳ {Number(fund.balance).toLocaleString()}</div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={Number(fund.balance) !== 0}
                  onClick={() => setShowDeleteFund({ open: true, fundId: fund.id, fundTitle: fund.title })}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <Tabs defaultValue="transfer">
        <TabsList>
          <TabsTrigger value="transfer">Transfer Funds</TabsTrigger>
          <TabsTrigger value="history">Transfer History</TabsTrigger>
        </TabsList>
        <TabsContent value="transfer">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Between Funds</CardTitle>
              <CardDescription>Move funds between any two fund accounts</CardDescription>
            </CardHeader>
            <form onSubmit={handleTransfer}>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="from-account">From</Label>
                    <select
                      id="from-account"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={transferFrom ?? ""}
                      onChange={(e) => setTransferFrom(Number(e.target.value))}
                    >
                      <option value="" disabled>Select fund</option>
                      {funds.map(fund => (
                        <option key={fund.id} value={fund.id}>
                          {fund.title} (৳{Number(fund.balance).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="button" variant="outline" size="icon" className="mt-8" onClick={handleSwitchAccounts}>
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="to-account">To</Label>
                    <select
                      id="to-account"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={transferTo ?? ""}
                      onChange={(e) => setTransferTo(Number(e.target.value))}
                    >
                      <option value="" disabled>Select fund</option>
                      {funds.map(fund => (
                        <option key={fund.id} value={fund.id}>
                          {fund.title} (৳{Number(fund.balance).toLocaleString()})
                        </option>
                      ))}
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
                <Button type="submit" className="w-full" 
                loading={transferLoading}>Transfer Funds</Button>
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
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Performed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No transfer history found
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{funds.find(f => f.id === log.fromFundId)?.title || log.fromFundId}</TableCell>
                          <TableCell>{funds.find(f => f.id === log.toFundId)?.title || log.toFundId}</TableCell>
                          <TableCell>৳ {Number(log.amount).toLocaleString()}</TableCell>
                          <TableCell>{log.description}</TableCell>
                          <TableCell>{log.createdBy}</TableCell>
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

      {/* Add Fund Modal */}
      <Dialog open={showAddFund} onOpenChange={setShowAddFund}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Fund</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="fund-title">Fund Title</Label>
            <Input
              id="fund-title"
              value={newFundTitle}
              onChange={e => setNewFundTitle(e.target.value)}
              placeholder="Enter fund name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAddFund} loading={addLoading}>Create</Button>
            <Button variant="outline" onClick={() => setShowAddFund(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Fund Confirmation Modal */}
      <Dialog open={showDeleteFund.open} onOpenChange={open => setShowDeleteFund(s => ({ ...s, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fund</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete <b>{showDeleteFund.fundTitle}</b>? This can only be done if the fund balance is zero.</p>
          <DialogFooter>
            <Button variant="destructive" loading={deleteLoading} onClick={handleDeleteFund}>Yes, Delete</Button>
            <Button variant="outline" onClick={() => setShowDeleteFund({ open: false })}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
