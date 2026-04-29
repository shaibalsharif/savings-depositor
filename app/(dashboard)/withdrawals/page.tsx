import { db } from "@/db/client";
import { withdrawals, personalInfo } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import Link from "next/link";
import { format } from "date-fns";
import { eq, desc } from "drizzle-orm";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function WithdrawalsPage() {
  await requireManager();

  const allWithdrawals = await db
    .select({
      withdrawal: withdrawals,
      member: personalInfo,
    })
    .from(withdrawals)
    .leftJoin(personalInfo, eq(withdrawals.userId, personalInfo.userId))
    .orderBy(desc(withdrawals.createdAt));

  const totalApproved = allWithdrawals
    .filter((w) => w.withdrawal.status === "approved")
    .reduce((sum, w) => sum + Number(w.withdrawal.amount), 0);

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Withdrawals" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Withdrawals</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Total Approved: ৳{totalApproved.toLocaleString()}
          </p>
        </div>
        <Link
          href="/withdrawals/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--teal)", color: "hsl(222 47% 7%)" }}
        >
          + Record Withdrawal
        </Link>
      </div>

      <div className="glass overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Member</th>
              <th>Amount</th>
              <th>Purpose</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {allWithdrawals.map((row) => (
              <tr key={row.withdrawal.id}>
                <td className="text-muted-foreground">{format(new Date(row.withdrawal.createdAt), "dd MMM yyyy")}</td>
                <td className="font-medium">{row.member?.name ?? "Unknown"}</td>
                <td className="font-semibold" style={{ color: "var(--amber)" }}>
                  ৳{Number(row.withdrawal.amount).toLocaleString()}
                </td>
                <td className="text-muted-foreground max-w-[200px] truncate">{row.withdrawal.purpose}</td>
                <td>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.withdrawal.status === "approved"
                        ? "badge-green"
                        : row.withdrawal.status === "rejected"
                        ? "badge-red"
                        : "badge-amber"
                    }`}
                  >
                    {row.withdrawal.status}
                  </span>
                </td>
              </tr>
            ))}
            {allWithdrawals.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  No withdrawals found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
