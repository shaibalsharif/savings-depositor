'use client'

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useUploadThing } from "@/lib/uploadthing";
import { Upload, X } from "lucide-react";
import { requestWithdrawal } from "@/lib/actions/withdrawals/withdrawals";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { Fund } from "@/types";

interface RequestWithdrawalTabProps {
  funds: Fund[];
  onUpdate: () => void;
}

export default function RequestWithdrawalTab({ funds, onUpdate }: RequestWithdrawalTabProps) {
  const { user } = useKindeAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [amount, setAmount] = useState("0");
  const [purpose, setPurpose] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { startUpload } = useUploadThing("withdrawalImage");

  const withdrawalSchema = z.object({
    amount: z.string().min(1),
    purpose: z.string().min(1).max(100),
    details: z.string().optional(),
    file: z.any().optional(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // FIX: Add a guard clause to ensure the user is logged in
    if (!user?.id) {
        toast({ title: "Error", description: "You must be logged in to submit a request.", variant: "destructive" });
        return;
    }

    const parseResult = withdrawalSchema.safeParse({
      amount,
      purpose,
      details,
      file,
    });
    if (!parseResult.success) {
      toast({
        title: "Validation Error",
        description: parseResult.error.errors.map((err) => err.message).join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    let attachmentUrl = null;
    if (file) {
      const uploadRes = await startUpload([file]);
      if (!uploadRes || !uploadRes[0]?.ufsUrl) {
        throw new Error("Image upload failed");
      }
      attachmentUrl = uploadRes[0].ufsUrl;
    }

    const payload = {
      userId: user.id, // User ID is now guaranteed to be a string
      amount: Number(amount),
      purpose,
      details,
      imageUrl: attachmentUrl,
    };
    
    try {
      const result = await requestWithdrawal(payload);
      if ("error" in result) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Withdrawal Requested", description: "Your request has been submitted and is pending verification" });
        // Reset form
        setAmount("0");
        setPurpose("");
        setDetails("");
        setFile(null);
        // onUpdate is now called after a successful submission
        onUpdate();
        // Redirect to a different tab or page after successful submission
        router.push('/dashboard/withdrawals?tab=pending');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 1 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please select a file smaller than 1MB", variant: "destructive" });
        return;
      }
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!validTypes.includes(selectedFile.type)) {
        toast({ title: "Invalid file type", description: "Please select a JPEG, PNG, or PDF file", variant: "destructive" });
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal request form</CardTitle>
        <CardDescription>request for a urgent withdrawal with due verification</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="md:grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input name="amount" type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input name="purpose" type="text" maxLength={100} required value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
          <div className="space-y-2 col-span-full">
            <Label htmlFor="details">Details</Label>
            <Textarea name="details" value={details} onChange={(e) => setDetails(e.target.value)} />
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}