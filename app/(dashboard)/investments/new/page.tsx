import { SlideModal } from "@/components/ui/slide-modal";
import { requireManager } from "@/lib/auth";
import InvestmentForm from "./form";

export default async function NewInvestmentPage() {
  await requireManager();
  return (
    <SlideModal title="Record Investment" backHref="/investments">
      <InvestmentForm />
    </SlideModal>
  );
}
