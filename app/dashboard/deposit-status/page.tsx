"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { memberDepositStatus, systemSettings } from "@/lib/dummy-data"

import { CheckCircle2, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

export default async function DepositStatusPage() {
 const {isAuthenticated} = getKindeServerSession();
const isUserAuthenticated = await isAuthenticated();
const {getUser} = getKindeServerSession();
const user = await getUser();
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMonth, setFilterMonth] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [selectedMonth, setSelectedMonth] = useState("")
  const [transactionId, setTransactionId] = useState("")

  const isFinanceManager = user?.role === "finance_manager" || user?.role === "admin"
  const isMember = user?.role === "member"

  // Filter members based on search query and filters
  const filteredMembers = memberDepositStatus.filter((member) => {
    const nameMatch = member.userName.toLowerCase().includes(searchQuery.toLowerCase())
    return nameMatch
  })

  // For members, only show their own status
  const displayMembers = isMember ? filteredMembers.filter((member) => member.userId === user?.id) : filteredMembers

  const handlePayDue = () => {
    if (!transactionId) {
      toast({
        title: "Missing information",
        description: "Please enter a transaction ID for the deposit.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Due payment submitted",
      description: `Your payment for ${selectedMonth} has been submitted and is pending verification.`,
    })

    setTransactionId("")
    setSelectedMember(null)
    setSelectedMonth("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deposit Status</h1>
        <p className="text-muted-foreground">Track monthly deposit status for all members</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Deposit Status</CardTitle>
          <CardDescription>
            Current monthly deposit amount: ৳{systemSettings.monthlyDepositAmount.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="w-full md:w-auto">
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-[250px]"
              />
            </div>

            <div className="w-full md:w-auto">
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="May 2025">May 2025</SelectItem>
                  <SelectItem value="April 2025">April 2025</SelectItem>
                  <SelectItem value="March 2025">March 2025</SelectItem>
                  <SelectItem value="February 2025">February 2025</SelectItem>
                  <SelectItem value="January 2025">January 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-auto">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>January 2025</TableHead>
                  <TableHead>February 2025</TableHead>
                  <TableHead>March 2025</TableHead>
                  <TableHead>April 2025</TableHead>
                  <TableHead>May 2025</TableHead>
                  <TableHead>Total Paid</TableHead>
                  {isMember && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No members found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayMembers.map((member) => (
                    <TableRow key={member.userId}>
                      <TableCell className="font-medium">{member.userName}</TableCell>
                      {member.months.map((month, index) => (
                        <TableCell key={index}>
                          {month.paid ? (
                            month.isLate ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Late
                              </Badge>
                            ) : (
                              <Badge variant="success">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Paid
                              </Badge>
                            )
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
                              <XCircle className="mr-1 h-3 w-3" /> Unpaid
                            </Badge>
                          )}
                        </TableCell>
                      ))}
                      <TableCell>৳ {member.totalPaid.toLocaleString()}</TableCell>
                      {isMember && (
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedMember(member)
                                  // Find first unpaid month
                                  const unpaidMonth = member.months.find((m) => !m.paid)
                                  if (unpaidMonth) {
                                    setSelectedMonth(unpaidMonth.month)
                                  }
                                }}
                              >
                                Pay Due
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Pay Due Deposit</DialogTitle>
                                <DialogDescription>Submit payment for a missed monthly deposit</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="month">Month</Label>
                                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger id="month">
                                      <SelectValue placeholder="Select month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {selectedMember?.months
                                        .filter((m: any) => !m.paid)
                                        .map((month: any, index: number) => (
                                          <SelectItem key={index} value={month.month}>
                                            {month.month}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="amount">Amount</Label>
                                  <Input
                                    id="amount"
                                    value={`৳ ${systemSettings.monthlyDepositAmount.toLocaleString()}`}
                                    disabled
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="transaction-id">Transaction ID</Label>
                                  <Input
                                    id="transaction-id"
                                    placeholder="Enter transaction ID"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={handlePayDue}>Submit Payment</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
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
