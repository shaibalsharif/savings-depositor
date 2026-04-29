import { db } from "@/db/client";
import { personalInfo, funds } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import { SlideModal } from "@/components/ui/slide-modal";
import { WithdrawalForm } from "./withdrawal-form";

export default async function NewWithdrawalPage() {
  await requireManager();
  const members = await db
    .select({ userId: personalInfo.userId, name: personalInfo.name })
    .from(personalInfo);
  const activeFunds = await db.select().from(funds);

  return (
    <SlideModal title="Record Withdrawal" backHref="/withdrawals">
      <WithdrawalForm members={members} funds={activeFunds} />
    </SlideModal>
  );
}
