import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getDepositMonths } from "@/lib/actions/deposits/getDepositMonths";
import { UploadReceiptForm } from "@/components/dashboard/forms/uploadReceiptForm";

export default async function UploadReceiptPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  if (!user?.id) {
    return <div>Please log in to upload receipts.</div>;
  }
  
  const monthsResult = await getDepositMonths(user.id);
  const availableMonths = Array.isArray(monthsResult) ? monthsResult : [];
  
  return (
    <UploadReceiptForm
      availableMonths={availableMonths}
      userId={user.id}
    />
  );
}
