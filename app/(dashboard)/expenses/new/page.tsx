import { SlideModal } from "@/components/ui/slide-modal";
import { requireManager } from "@/lib/auth";
import ExpenseForm from "./form";

export default async function NewExpensePage() {
  await requireManager();
  return (
    <SlideModal title="Record Expense" backHref="/expenses">
      <ExpenseForm />
    </SlideModal>
  );
}
