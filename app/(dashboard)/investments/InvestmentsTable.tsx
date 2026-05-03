"use client";

import { useState } from "react";
import Link from "next/link";
import { formatLocalDate } from "@/lib/format-date";
import { Edit2 } from "lucide-react";
import { isPast, differenceInDays } from "date-fns";
import { EditInvestmentModal } from "./EditInvestmentModal";

export function InvestmentsTable({
  filtered,
  isFiltered,
  manager,
}: {
  filtered: any[];
  isFiltered: any;
  manager: boolean;
}) {
  const [selectedInvestment, setSelectedInvestment] = useState<any | null>(null);

  return (
    <>
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table id="investments-table" className="data-table">
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th className="col-recipient">Recipient</th>
                <th className="col-principal">Principal</th>
                <th className="col-invest-date">Invest Date</th>
                <th className="col-expected-return">Expected Return</th>
                <th className="col-actual-return">Actual Return</th>
                <th className="col-days">Days</th>
                <th className="col-status">Status</th>
                {manager && <th className="col-actions text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const isOverdue = isPast(new Date(inv.expectedReturnDate)) && inv.status === "active";
                const daysActive = differenceInDays(
                  inv.actualReturnDate ? new Date(inv.actualReturnDate) : new Date(),
                  new Date(inv.investDate)
                );
                return (
                  <tr key={inv.id}>
                    <td className="col-id font-mono text-xs">
                      <Link href={`/investments/${inv.entryId}`} style={{ color: "var(--teal)" }} className="hover:underline">
                        {inv.entryId}
                      </Link>
                    </td>
                    <td className="col-recipient font-medium">
                      <Link href={`/investments/${inv.entryId}`} className="hover:underline">{inv.recipient}</Link>
                    </td>
                    <td className="col-principal font-semibold" style={{ color: "var(--purple)" }}>
                      ৳{Number(inv.principal).toLocaleString()}
                    </td>
                    <td className="col-invest-date text-muted-foreground">{formatLocalDate(inv.investDate)}</td>
                    <td className={`col-expected-return ${isOverdue ? "" : "text-muted-foreground"}`} style={isOverdue ? { color: "var(--red)" } : {}}>
                      {formatLocalDate(inv.expectedReturnDate)}
                      {isOverdue && <span className="ml-2 text-xs font-medium" style={{ color: "var(--red)" }}>OVERDUE</span>}
                    </td>
                    <td className="col-actual-return text-muted-foreground">
                      {inv.actualReturnDate ? formatLocalDate(inv.actualReturnDate) : "—"}
                    </td>
                    <td className="col-days text-muted-foreground">{daysActive}d</td>
                    <td className="col-status">
                      <span
                        className={inv.status === "active" ? "badge-teal" : inv.status === "matured" ? "badge-green" : "badge-red"}
                        style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: "999px", fontSize: 11, fontWeight: 600 }}
                      >
                        {inv.status}
                      </span>
                    </td>
                    {manager && (
                      <td className="col-actions text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedInvestment(inv)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted/60 border bg-muted/30 transition text-foreground"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <Link
                            href={`/investments/${inv.entryId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all border border-teal/20 hover:bg-teal/10"
                            style={{ color: "var(--teal)" }}
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={manager ? 9 : 8} className="py-12 text-center text-muted-foreground">
                    {isFiltered ? "No investments match the current filters." : "No investments recorded yet."}{" "}
                    {manager && !isFiltered && <Link href="/investments/new" style={{ color: "var(--teal)" }}>Add the first one →</Link>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditInvestmentModal
        isOpen={!!selectedInvestment}
        onClose={() => setSelectedInvestment(null)}
        investment={selectedInvestment}
      />
    </>
  );
}
