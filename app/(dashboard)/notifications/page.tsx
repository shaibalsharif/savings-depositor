import { requireMember, isManager } from "@/lib/auth";
import { ManagerNotifications } from "./ManagerNotifications";
import { MemberNotifications } from "./MemberNotifications";
import { getNotificationQuota, getManagerNotificationHistory, getMemberNotifications } from "@/lib/actions/notifications";
import { getManagerDashboardStats } from "@/lib/queries/dashboard";
import { db } from "@/db/client";
import { personalInfo } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireMember();
  const manager = await isManager();

  if (manager) {
    // Fetch both manager tools AND the manager's own received notifications
    const [quota, history, myNotifications, stats, members] = await Promise.all([
      getNotificationQuota(),
      getManagerNotificationHistory(),
      getMemberNotifications(), // manager is also a member — fetch their inbox
      getManagerDashboardStats(),
      db.select({ 
        id: personalInfo.userId, 
        name: personalInfo.name, 
        email: personalInfo.email, 
        photo: personalInfo.photo 
      }).from(personalInfo)
    ]);

    const membersWithDues = stats.memberPendings.map((m: any) => {
       const totalDue = m.breakdown.reduce((sum: number, b: any) => sum + b.due, 0);
       return { id: m.memberId, name: m.name, totalDue, breakdown: m.breakdown };
    });

    const allMembers = members.map((m: any) => ({
       id: m.id,
       name: m.name,
       email: m.email,
       photo: m.photo
    }));

    return <ManagerNotifications 
             quota={quota} 
             history={history} 
             allMembers={allMembers}
             membersWithDues={membersWithDues}
             myNotifications={myNotifications}
             currentUserId={user.id}
           />;
  } else {
    const notifications = await getMemberNotifications();
    return <MemberNotifications notifications={notifications} />;
  }
}
