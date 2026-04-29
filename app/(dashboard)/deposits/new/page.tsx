import { db } from "@/db/client";
import { personalInfo, depositSettings } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import { DepositForm } from "./deposit-form";
import { SlideModal } from "@/components/ui/slide-modal";
import { desc } from "drizzle-orm";
import { format } from "date-fns";

export default async function NewDepositPage() {
  await requireManager();

  const members = await db
    .select({
      id: personalInfo.userId,
      name: personalInfo.name,
      mobile: personalInfo.mobile,
      position: personalInfo.position,
    })
    .from(personalInfo);

  // Get the active monthly amount from settings
  const settings = await db
    .select()
    .from(depositSettings)
    .orderBy(desc(depositSettings.effectiveMonth));

  const currentMonth = format(new Date(), "yyyy-MM");
  let monthlyAmount = 0;
  for (const s of [...settings].sort((a, b) =>
    a.effectiveMonth.localeCompare(b.effectiveMonth)
  )) {
    if (s.effectiveMonth <= currentMonth) {
      if (!s.terminatedAt || s.terminatedAt > currentMonth) {
        monthlyAmount = Number(s.monthlyAmount);
      }
    }
  }

  return (
    <SlideModal title="Record Deposit" backHref="/deposits">
      <DepositForm members={members} monthlyAmount={monthlyAmount} />
    </SlideModal>
  );
}
