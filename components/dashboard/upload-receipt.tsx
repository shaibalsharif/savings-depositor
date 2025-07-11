"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, X } from "lucide-react"
import { systemSettings } from "@/lib/dummy-data"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"
import { useUploadThing } from "@/lib/uploadthing"
import { parse, format } from "date-fns"

// import { ToastAction } from "@/components/ui/toast"

// Pass this as a prop or fetch with SWR/React Query
interface UploadReceiptProps {
  onUploadComplete: (deposit: any) => void
  depositedMonths: string[] // e.g. ["May 2024", "April 2024"]
}




export function UploadReceipt({ onUploadComplete, depositedMonths }: UploadReceiptProps) {
  const { toast } = useToast()
  const { user } = useKindeAuth()

  const { startUpload } = useUploadThing("depositImage")
  const [month, setMonth] = useState("")
  const [amount, setAmount] = useState(systemSettings.monthlyDepositAmount.toString())
  const [depositSettings, setDepositSettings] = useState<{ monthlyAmount?: string } | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [depositType, setDepositType] = useState("full")
  const [availableMonths, setAvailableMonths] = useState<
    Array<{ month: string; status: string; rejected?: boolean }>
  >([])



  useEffect(() => {
    if (!month) {
      setDepositSettings(null)
      setAmount("")
      return
    }

    setLoadingSettings(true)
    fetch(`/api/settings/deposit/effective?month=${encodeURIComponent(month)}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Failed to fetch deposit settings")
        }
        return res.json()
      })
      .then((data) => {
        
        setDepositSettings(data)
        if (data?.monthlyAmount) {
          setAmount(data.monthlyAmount.toString())
        } else {
          setAmount("")
        }
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        setDepositSettings(null)
        setAmount("")
      })
      .finally(() => setLoadingSettings(false))
  }, [month, toast])
  const depositSchema = z.object({
    month: z.string().min(1, "Month is required"),
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number",
    }),
    transactionId: z.string().optional(),
    depositType: z.enum(["full", "partial"]),
    file: z.any().optional()/* .refine(
      (val) => val instanceof File || val === undefined,
      { message: "Expected a File" }
    ) */

  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      // File size (max 1MB)
      if (selectedFile.size > 1 * 1024 * 1024) {
        console.log("File too large:", selectedFile.size);

        toast({
          title: "File too large",
          description: "Please select a file smaller than 1MB",
          variant: "destructive",
        })
        return
      }
      // File type
      const validTypes = ["image/jpeg", "image/png", "application/pdf"]
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPEG, PNG, or PDF file",
          variant: "destructive",
        })
        return
      }


      setFile(selectedFile)
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (depositType === "partial" && Number(value) >= systemSettings.monthlyDepositAmount) {
      toast({
        title: "Invalid amount",
        description: "Partial deposit amount must be less than the monthly amount",
        variant: "destructive",
      })
      return
    }
    setAmount(value)
  }

  const handleDepositTypeChange = (value: string) => {
    setDepositType(value)
    if (value === "full") {
      setAmount(systemSettings.monthlyDepositAmount.toString())
    } else {
      setAmount("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parseResult = depositSchema.safeParse({
      month,
      amount,
      transactionId,
      depositType,
      file,
    })

    if (!parseResult.success) {
      toast({
        title: "Validation Error",
        description: parseResult.error.errors.map((err) => err.message).join(", "),
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      let imageUrl = null
      if (file) {
        console.log(file);
        
        const uploadRes = await startUpload([file])
        if (!uploadRes || !uploadRes[0]?.ufsUrl) {
          throw new Error("Image upload failed")
        }
        imageUrl = uploadRes[0].ufsUrl
      }


      const depositPayload = {
        userId: user?.id,
        month,
        amount: Number(amount),
        transactionId,
        depositType,
        imageUrl, // ✅ can be null if no file uploaded
        status: "pending",
      }

      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(depositPayload),
      })
      if (!res.ok) throw new Error("Failed to save deposit")

      // 3. Log the action
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          action: "upload_deposit",
          details: { month, amount, transactionId, depositType, imageUrl },
          // timestamp: new Date().toISOString(),
        }),
      })



      onUploadComplete(depositPayload)
      toast({
        title: "Receipt uploaded",
        description: "Your receipt has been uploaded and is pending verification",
      })

      // Reset form
      setMonth("")
      setAmount(systemSettings.monthlyDepositAmount.toString())
      setTransactionId("")
      setFile(null)
      setDepositType("full")
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    async function fetchMonths() {
      try {
        const userId = user?.id
        if (!userId) return

        const res = await fetch(`/api/deposits/months?userId=${encodeURIComponent(userId)}`)
        const data = await res.json()
        if (res.ok && data.months) {
          setAvailableMonths(data.months)

          // Find current month
          const currentMonth = data.months.find((m: any) => m.status === "current")
          if (currentMonth) {
            setMonth(currentMonth.month)
          } else {
            setMonth("") // or some fallback
          }
        } else {
          console.error("Failed to fetch months", data.error)
        }
      } catch (err) {
        console.error("Error fetching months", err)
      }
    }
    fetchMonths()
  }, [user])
  useEffect(() => {
    if (!availableMonths.length) return

    const currentMonth = availableMonths.find(m => m.status === "current")
    if (currentMonth) {
      setMonth(currentMonth.month)
      return
    }

    // Find closest past due month
    const pastDueMonths = availableMonths
      .filter(m => m.status === "due")
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateB.getTime() - dateA.getTime() // descending
      })

    if (pastDueMonths.length > 0) {
      setMonth(pastDueMonths[0].month)
    } else {
      setMonth("") // fallback
    }
  }, [availableMonths])

  const getMonthLabel = (month: string) => {
    try {
      return format(parse(month, "yyyy-MM", new Date()), "MMMM yyyy")
    } catch {
      return month
    }
  }

  // Generate month options: past 6 months (if not deposited) + next 6 months (always available)
  const getMonthOptions = () => {
    if (!availableMonths.length) {
      return <SelectItem key="loading" value="loading" disabled>Loading months...</SelectItem>
    }

    return availableMonths.map(({ month, status, rejected }) => {
      const isDeposited = depositedMonths?.includes(month)
      const labelParts = [getMonthLabel(month)]

      if (status === "due") labelParts.push("(Past Due)")
      else if (status === "advance") labelParts.push("(Advance)")
      else if (status === "current") labelParts.push("(Current)")
      if (rejected) labelParts.push("[Rejected]")

      return (
        <SelectItem key={month} value={month} disabled={isDeposited}>
          {labelParts.join(" ")} {isDeposited ? "(Already Deposited)" : ""}
        </SelectItem>
      )
    })
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Receipt</CardTitle>
        <CardDescription>Upload your deposit receipt for verification</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 md:space-y-2 md:grid md:grid-cols-2 gap-6" >
          <div className="space-y-2">
            <Label htmlFor="month">Month</Label>
            <Select value={month} onValueChange={setMonth} required>
              <SelectTrigger id="month">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>{getMonthOptions()}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Deposit Type</Label>
            <RadioGroup value={depositType} onValueChange={handleDepositTypeChange} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full">Full Payment</Label>
              </div>
              <div className="flex items-center space-x-2 opacity-50 pointer-events-none">
                <RadioGroupItem value="partial" id="partial" disabled />
                <Label htmlFor="partial">Partial Payment</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (৳)</Label>
            <Input
              id="amount"
              type="number"
              value={loadingSettings ? "Loading..." : amount}
              onChange={handleAmountChange}
              className={depositType === "full" ? "bg-muted/50" : ""}
              disabled={depositType === "full"}
              required
            />
            <p className="text-sm text-muted-foreground">
              Fixed monthly deposit amount
            </p>
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
          <div className="space-y-2 col-span-full">
            <Label htmlFor="receipt">Receipt</Label>
            {file ? (
              <div className="relative rounded-md border border-dashed p-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <div className="mb-2 text-center">
                  <p className="font-medium">Drag and drop your receipt</p>
                  <p className="text-sm text-muted-foreground">Supports JPEG, PNG, and PDF (max 1MB)</p>
                </div>
                <Input
                  id="receipt"
                  type="file"
                  className="hidden"
                  accept=".jpeg,.jpg,.png,.pdf"
                  onChange={handleFileChange}
                />
                <Button type="button" variant="outline" onClick={() => document.getElementById("receipt")?.click()}>
                  Select File
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload Receipt"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
