"use client";

import { useState } from "react";
import Link from "next/link";
import { formatLocalDate } from "@/lib/format-date";
import { EditExpenseModal } from "./EditExpenseModal";
import { Edit2 } from "lucide-react";

const categoryColors: Record<string, string> = {
  Food: "badge-teal",
  Event: "badge-purple",
  Materials: "badge-amber",
  "Bank Charge": "badge-red",
  Conveyance: "badge-green",
};

export function ExpensesTable({
  filtered,
  isFiltered,
  manager,
  totalValid,
  availableInvestments = [],
}: {
  filtered: any[];
  isFiltered: any;
  manager: boolean;
  totalValid: number;
  availableInvestments?: any[];
}) {
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  return (
    <>
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table id="expenses-table" className="data-table">
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th className="col-date">Date</th>
                <th className="col-category">Category</th>
                <th className="col-description">Description</th>
                <th className="col-linked-inv">Linked Investment</th>
                <th className="col-amount">Amount</th>
                <th className="col-status">Status</th>
                {manager && <th className="col-actions">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => (
                <tr key={exp.id} style={{ opacity: exp.voided ? 0.5 : 1 }}>
                  <td className="col-id font-mono text-xs text-muted-foreground">{exp.entryId}</td>
                  <td className="col-date text-muted-foreground">{formatLocalDate(exp.expenseDate)}</td>
                  <td className="col-category">
                    <span className={`${categoryColors[exp.category] || "badge-purple"} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                      {exp.category}
                    </span>
                  </td>
                  <td className="col-description font-medium max-w-[200px] truncate">{exp.description}</td>
                  <td className="col-linked-inv text-muted-foreground font-mono text-xs">{exp.linkedInvestmentId || "—"}</td>
                  <td className="col-amount font-semibold" style={{ color: "var(--red)" }}>
                    −৳{Number(exp.amount).toLocaleString()}
                  </td>
                  <td className="col-status">
                    {exp.voided ? (
                      <span className="badge-red inline-flex items-center px-2 py-0.5 rounded-full text-xs">Voided</span>
                    ) : (
                      <span className="badge-teal inline-flex items-center px-2 py-0.5 rounded-full text-xs">Active</span>
                    )}
                  </td>
                  {manager && (
                    <td className="col-actions">
                      <button
                        onClick={() => setSelectedExpense(exp)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted/60 border bg-muted/30 transition text-foreground"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={manager ? 8 : 7} className="py-12 text-center text-muted-foreground">
                    {isFiltered ? "No expenses match the current filters." : "No expenses recorded yet."}{" "}
                    {manager && !isFiltered && <Link href="/expenses/new" style={{ color: "var(--teal)" }}>Add the first one →</Link>}
                  </td>
                </tr>
              )}
              {filtered.length > 0 && (
                <tr style={{ background: "hsl(var(--muted))", fontWeight: 600 }}>
                  <td colSpan={5} className="text-right text-sm">Total Valid Expenses:</td>
                  <td className="col-amount" style={{ color: "var(--red)" }}>−৳{totalValid.toLocaleString()}</td>
                  <td colSpan={manager ? 2 : 1} className="col-status"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditExpenseModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        availableInvestments={availableInvestments}
      />
    </>
  );
}
