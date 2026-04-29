import { isManager } from "@/lib/auth";
import { SidebarClient } from "./SidebarClient";

export async function Sidebar() {
  const managerRole = await isManager();
  return <SidebarClient isManagerRole={managerRole} />;
}
