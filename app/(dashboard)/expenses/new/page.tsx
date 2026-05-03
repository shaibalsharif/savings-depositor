import { SlideModal } from "@/components/ui/slide-modal";
import { requireManager } from "@/lib/auth";
import ExpenseForm from "./form";
import { db } from "@/db/client";
import { investments } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function NewExpensePage() {
  await requireManager();
  const allInvestments = await db.select().from(investments).orderBy(desc(investments.investDate));
  return (
    <SlideModal title="Record Expense" backHref="/expenses">
      <ExpenseForm availableInvestments={allInvestments} />
    </SlideModal>
  );
}
