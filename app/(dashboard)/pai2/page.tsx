import { requireMember, isManager } from "@/lib/auth";
import PAI2Client from "./PAI2Client";

export const metadata = {
  title: "PAI2 পাইটু — AI Assistant",
  description: "Intelligent assistant for the Savings & Deposit Management app",
};

export default async function PAI2Page() {
  const user = await requireMember();
  const managerRole = await isManager();

  return (
    <PAI2Client
      user={{
        id: user.id,
        name: user.given_name || user.family_name || "User",
        picture: user.picture || null,
      }}
      isManager={managerRole}
    />
  );
}
