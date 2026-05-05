import { requireMember, isManager } from "@/lib/auth";
import { ManagerNotifications } from "./ManagerNotifications";
import { MemberNotifications } from "./MemberNotifications";
import { getNotificationQuota, getManagerNotificationHistory, getMemberNotifications } from "@/lib/actions/notifications";
import { getManagerDashboardStats } from "@/lib/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireMember();
  const manager = await isManager();

  if (manager) {
    const quota = await getNotificationQuota();
    const history = await getManagerNotificationHistory();
    const stats = await getManagerDashboardStats();
    
    const membersWithDues = stats.memberPendings.map((m: any) => {
       const totalDue = m.breakdown.reduce((sum: number, b: any) => sum + b.due, 0);
       return { id: m.memberId, name: m.name, totalDue, breakdown: m.breakdown };
    });

    const allMembers = stats.heatmapData.heatmapData?.map((m: any) => ({
       id: m.memberId,
       name: m.name
    })) || [];

    return <ManagerNotifications 
             quota={quota} 
             history={history} 
             allMembers={allMembers}
             membersWithDues={membersWithDues} 
           />;
  } else {
    const notifications = await getMemberNotifications();
    return <MemberNotifications notifications={notifications} />;
  }
}
