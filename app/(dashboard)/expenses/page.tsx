import { db } from "@/db/client";
import { expenses } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import Link from "next/link";
import { format } from "date-fns";
import { desc } from "drizzle-orm";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function ExpensesPage() {
  await requireManager();

  const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.expenseDate));

  const totalValid = allExpenses
    .filter((e) => !e.voided)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const categoryColors: Record<string, string> = {
    Food: "badge-teal",
    Event: "badge-purple",
    Materials: "badge-amber",
    "Bank Charge": "badge-red",
    Conveyance: "badge-green",
    Other: "",
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Expenses" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {allExpenses.filter((e) => !e.voided).length} active expenses — ৳{totalValid.toLocaleString()} total
          </p>
        </div>
        <Link
          href="/expenses/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--teal)", color: "hsl(var(--primary-foreground))" }}
        >
          + Record Expense
        </Link>
      </div>

      <div className="glass overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Linked Investment</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {allExpenses.map((exp) => (
              <tr key={exp.id} style={{ opacity: exp.voided ? 0.5 : 1 }}>
                <td className="font-mono text-xs text-muted-foreground">{exp.entryId}</td>
                <td className="text-muted-foreground">{format(new Date(exp.expenseDate), "dd MMM yyyy")}</td>
                <td>
                  <span className={`${categoryColors[exp.category] ?? ""} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                    {exp.category}
                  </span>
                </td>
                <td className="font-medium max-w-[200px] truncate">{exp.description}</td>
                <td className="text-muted-foreground font-mono text-xs">{exp.linkedInvestmentId || "—"}</td>
                <td className="font-semibold" style={{ color: "var(--red)" }}>
                  −৳{Number(exp.amount).toLocaleString()}
                </td>
                <td>
                  {exp.voided ? (
                    <span className="badge-red inline-flex items-center px-2 py-0.5 rounded-full text-xs">Voided</span>
                  ) : (
                    <span className="badge-teal inline-flex items-center px-2 py-0.5 rounded-full text-xs">Active</span>
                  )}
                </td>
              </tr>
            ))}
            {allExpenses.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  No expenses recorded yet.{" "}
                  <Link href="/expenses/new" style={{ color: "var(--teal)" }}>Add the first one →</Link>
                </td>
              </tr>
            )}

            {allExpenses.length > 0 && (
              <tr style={{ background: "hsl(var(--muted))", fontWeight: 600 }}>
                <td colSpan={5} className="text-right text-sm">Total Valid Expenses:</td>
                <td style={{ color: "var(--red)" }}>−৳{totalValid.toLocaleString()}</td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
