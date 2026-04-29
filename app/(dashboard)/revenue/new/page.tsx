import { SlideModal } from "@/components/ui/slide-modal";
import { requireManager } from "@/lib/auth";
import RevenueForm from "./form";

export default async function NewRevenuePage() {
  await requireManager();
  return (
    <SlideModal title="Record Revenue / Loss" backHref="/revenue">
      <RevenueForm />
    </SlideModal>
  );
}
