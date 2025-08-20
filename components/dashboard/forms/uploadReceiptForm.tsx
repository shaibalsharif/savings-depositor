"use client"; 

 import type React from "react"; 
 import { useState } from "react"; 
 import { z } from "zod"; 
 import { Button } from "@/components/ui/button"; 
 import { CardFooter } from "@/components/ui/card"; 
 import { Input } from "@/components/ui/input"; 
 import { Label } from "@/components/ui/label"; 
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
 import { useToast } from "@/hooks/use-toast"; 
 import { Upload, X } from "lucide-react"; 
 import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; 
 import { useUploadThing } from "@/lib/uploadthing"; 
 import { parse, format } from "date-fns"; 
 import { submitDeposit } from "@/lib/actions/deposits/pushDeposit"; 

 // Updated DepositMonth interface 
 interface DepositMonth { 
   month: string; 
   status: string; 
   monthlyAmount: number; 
 } 

 // Updated props interface 
 interface UploadReceiptFormProps { 
   availableMonths: DepositMonth[]; 
   userId: string; 
 } 

 const depositSchema = z.object({ 
   month: z.string().min(1, "Month is required"), 
   amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, { 
     message: "Amount must be a positive number", 
   }), 
   transactionId: z.string().optional(), 
   depositType: z.enum(["full", "partial"]), 
   file: z.any().optional(), 
 }); 

 export function UploadReceiptForm({ availableMonths, userId }: UploadReceiptFormProps) { 
   const { toast } = useToast(); 
   const { startUpload } = useUploadThing("depositImage"); 

   // Get the default month and amount 
   const defaultMonthData = availableMonths.find(m => m.status === "current") || availableMonths[0]; 
    
   const [month, setMonth] = useState(defaultMonthData?.month || ""); 
   const [amount, setAmount] = useState(defaultMonthData?.monthlyAmount.toString() || ""); 
   const [transactionId, setTransactionId] = useState(""); 
   const [file, setFile] = useState<File | null>(null); 
   const [isUploading, setIsUploading] = useState(false); 
   const [depositType, setDepositType] = useState("full"); 

   // Handle month change and update amount 
   const handleMonthChange = (newMonth: string) => { 
     setMonth(newMonth); 
     const selectedMonthData = availableMonths.find(m => m.month === newMonth); 
     if (selectedMonthData) { 
       setAmount(selectedMonthData.monthlyAmount.toString()); 
     } 
   }; 

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
     if (e.target.files && e.target.files[0]) { 
       const selectedFile = e.target.files[0]; 
       if (selectedFile.size > 1 * 1024 * 1024) { 
         toast({ 
           title: "File too large", 
           description: "Please select a file smaller than 1MB", 
           variant: "destructive", 
         }); 
         return; 
       } 
       const validTypes = ["image/jpeg", "image/png", "application/pdf"]; 
       if (!validTypes.includes(selectedFile.type)) { 
         toast({ 
           title: "Invalid file type", 
           description: "Please select a JPEG, PNG, or PDF file", 
           variant: "destructive", 
         }); 
         return; 
       } 
       setFile(selectedFile); 
     } 
   }; 

   const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
     const value = e.target.value; 
     const selectedMonthData = availableMonths.find(m => m.month === month); 
     if (depositType === "partial" && selectedMonthData && Number(value) >= selectedMonthData.monthlyAmount) { 
       toast({ 
         title: "Invalid amount", 
         description: "Partial deposit amount must be less than the monthly amount", 
         variant: "destructive", 
       }); 
       return; 
     } 
     setAmount(value); 
   }; 

   const handleDepositTypeChange = (value: string) => { 
     setDepositType(value); 
     const selectedMonthData = availableMonths.find(m => m.month === month); 
     if (value === "full" && selectedMonthData) { 
       setAmount(selectedMonthData.monthlyAmount.toString()); 
     } else { 
       setAmount(""); 
     } 
   }; 

   const handleSubmit = async (e: React.FormEvent) => { 
     e.preventDefault(); 

     const parseResult = depositSchema.safeParse({ month, amount, transactionId, depositType, file }); 
     if (!parseResult.success) { 
       toast({ 
         title: "Validation Error", 
         description: parseResult.error.errors.map((err) => err.message).join(", "), 
         variant: "destructive", 
       }); 
       return; 
     } 

     setIsUploading(true); 

     try { 
       let imageUrl = undefined; 
       if (file) { 
         const uploadRes = await startUpload([file]); 
         if (!uploadRes || !uploadRes[0]?.ufsUrl) { 
           throw new Error("Image upload failed"); 
         } 
         imageUrl = uploadRes[0].ufsUrl; 
       } 

       const result = await submitDeposit({ 
         userId, 
         month, 
         amount: Number(amount), 
         transactionId, 
         depositType:"full", 
         imageUrl, 
       }); 

       if (result.error) { 
         throw new Error(result.error); 
       } 

       toast({ 
         title: "Receipt uploaded", 
         description: "Your receipt has been uploaded and is pending verification", 
       }); 

       // Reset form 
       setMonth(""); 
       setAmount(""); 
       setTransactionId(""); 
       setFile(null); 
       setDepositType("full"); 
     } catch (err: any) { 
       toast({ 
         title: "Error", 
         description: err.message || "Something went wrong", 
         variant: "destructive", 
       }); 
     } finally { 
       setIsUploading(false); 
     } 
   }; 

   const getMonthLabel = (m: string) => { 
     try { 
       return format(parse(m, "yyyy-MM", new Date()), "MMMM yyyy"); 
     } catch { 
       return m; 
     } 
   }; 

   const getMonthOptions = () => { 
     if (!availableMonths.length) { 
       return <SelectItem key="loading" value="loading" disabled>No months available</SelectItem>; 
     } 

     return availableMonths.map(({ month, status }) => { 
       const labelParts = [getMonthLabel(month)]; 
       if (status === "due") labelParts.push("(Past Due)"); 
       else if (status === "advance") labelParts.push("(Advance)"); 
       else if (status === "current") labelParts.push("(Current)"); 
        
       return ( 
         <SelectItem key={month} value={month}> 
           {labelParts.join(" ")} 
         </SelectItem> 
       ); 
     }); 
   }; 

   return ( 
     <form onSubmit={handleSubmit}> 
       <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 gap-6"> 
         <div className="space-y-2"> 
           <Label htmlFor="month">Month</Label> 
           <Select value={month} onValueChange={handleMonthChange} required> 
             <SelectTrigger id="month"> 
               <SelectValue placeholder="Select month" /> 
             </SelectTrigger> 
             <SelectContent>{getMonthOptions()}</SelectContent> 
           </Select> 
         </div> 
         <div className="space-y-2"> 
           <Label>Deposit Type</Label> 
           <RadioGroup value={depositType} onValueChange={handleDepositTypeChange} className="flex flex-col sm:flex-row gap-4 pt-2"> 
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
             value={amount} 
             onChange={handleAmountChange} 
             className={depositType === "full" ? "bg-muted/50" : ""} 
             disabled={depositType === "full"} 
             required 
           /> 
           <p className="text-sm text-muted-foreground">Fixed monthly deposit amount</p> 
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
       </div> 
       <CardFooter> 
         <Button type="submit" className="w-full" disabled={isUploading}> 
           {isUploading ? "Uploading..." : "Upload Receipt"} 
         </Button> 
       </CardFooter> 
     </form> 
   ); 
 }