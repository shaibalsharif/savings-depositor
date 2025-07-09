'use client'

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X } from "lucide-react"
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useUploadThing } from "@/lib/uploadthing";

export default function RequestWithdrawalTab() {
  const user = { id: "kp_99fcb766a4034aebb728c7a450be83df" }; // Replace with real getUser() if needed
  const [amount, setAmount] = useState("0")
  const [purpose, setPurpose] = useState("")
  const [details, setDetails] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const { startUpload } = useUploadThing("withdrawalImage")

  const { toast } = useToast()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const withdrawalSchema = z.object({
      amount: z.string().min(1, "amount is required"),
      purpose: z.string().min(1, "purpose is required"),
      details: z.string().optional(),
      file: z.any().optional(),
    })
    const parseResult = withdrawalSchema.safeParse({
      amount,
      purpose,
      details,
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

      const withdrawalPayload = {
        userId: user?.id,
        amount: Number(amount),
        details,
        purpose,
        imageUrl, // ✅ can be null if no file uploaded
        status: "pending",
      }

      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withdrawalPayload),
      })
      if (!res.ok) throw new Error("Failed to submit withdrawal request")

      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          action: "request_withdrawal",
          details: { amount, purpose, },
          // timestamp: new Date().toISOString(),
        }),
      })
      toast({
        title: "Withdrawal Requested",
        description: "Your request has been submitted and is pending verification",
      })

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal request form</CardTitle>
        <CardDescription>request for a urgent withdrawal with due verification</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} >
        <CardContent className="  md:grid md:grid-cols-2 gap-6" >
          <div className="">
            <Label htmlFor="amount">Amount</Label>
            <Input name="amount" type="number" required value={amount}
              onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="">
            <Label htmlFor="purpose">Purpose</Label>
            <Select name="purpose" value={purpose} onValueChange={setPurpose} required>
              <SelectTrigger>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Emergency Fund">Emergency Fund</SelectItem>
                <SelectItem value="Medical Expenses">Medical Expenses</SelectItem>
                <SelectItem value="Business Investment">Business Investment</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Details</Label>
            <Textarea name="details" required value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          <div className="space-y-2">
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
          <input type="hidden" name="userId" value={user.id} />
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isUploading}>
            {isUploading ? "Submitting..." : "Submit Request"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
