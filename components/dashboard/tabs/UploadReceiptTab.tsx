'use client'
import { UploadReceiptForm } from "@/components/dashboard/forms/uploadReceiptForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UploadReceiptTabProps {
  userId: string;
  availableMonths: DepositMonth[];
}
interface DepositMonth {
  month: string;
  status: "current" | "due" | "advance";
  monthlyAmount: number;
}
export default function UploadReceiptTab({ userId, availableMonths }: UploadReceiptTabProps) {
  if (!userId) {
    return <div>Please log in to upload receipts.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Receipt</CardTitle>
        <CardDescription>Upload your deposit receipt for verification</CardDescription>
      </CardHeader>
      <CardContent>
        <UploadReceiptForm
          availableMonths={availableMonths}
          userId={userId}
        />
      </CardContent>
    </Card>
  );
}