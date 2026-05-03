import { SlideModal } from "@/components/ui/slide-modal";
import { requireManager } from "@/lib/auth";
import { db } from "@/db/client";
import { investments } from "@/db/schema";
import { desc, eq, and, ne } from "drizzle-orm";
import RevenueForm from "./form";

export default async function NewRevenuePage() {
  await requireManager();

  const allInvestments = await db
    .select({
      entryId: investments.entryId,
      recipient: investments.recipient,
      principal: investments.principal,
    })
    .from(investments)
    .where(eq(investments.deleted, false))
    .orderBy(desc(investments.investDate));

  return (
    <SlideModal title="Record Revenue / Loss" backHref="/revenue">
      <RevenueForm availableInvestments={allInvestments} />
    </SlideModal>
  );
}
