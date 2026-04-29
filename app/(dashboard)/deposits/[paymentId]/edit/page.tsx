import { db } from "@/db/client";
import { payments, personalInfo } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import { EditDepositForm } from "./edit-form";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function EditDepositPage({
  params
}: {
  params: Promise<{ paymentId: string }>
}) {
  await requireManager();
  
  const { paymentId } = await params;

  const payment = await db.query.payments.findFirst({
    where: eq(payments.paymentId, paymentId)
  });

  if (!payment) {
    notFound();
  }

  const members = await db.select({
    id: personalInfo.userId,
    name: personalInfo.name,
  }).from(personalInfo);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Edit Deposit {paymentId}</h1>
      </div>
      <EditDepositForm members={members} payment={payment} />
    </div>
  );
}
