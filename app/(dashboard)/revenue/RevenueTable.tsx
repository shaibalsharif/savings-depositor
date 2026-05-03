"use client";

import { useState } from "react";
import Link from "next/link";
import { formatLocalDate } from "@/lib/format-date";
import { Edit2 } from "lucide-react";
import { EditRevenueModal } from "./EditRevenueModal";

const sourceTypeLabels: Record<string, string> = {
  bank_profit: "Bank Profit",
  investment_return: "Investment Return",
  business: "Business",
  loss: "Loss",
  other: "Other",
};

export function RevenueTable({
  filtered,
  isFiltered,
  manager,
  availableInvestments = [],
}: {
  filtered: any[];
  isFiltered: any;
  manager: boolean;
  availableInvestments?: any[];
}) {
  const [selectedRevenue, setSelectedRevenue] = useState<any | null>(null);

  return (
    <>
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table id="revenue-table" className="data-table">
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th className="col-date">Date</th>
                <th className="col-source">Source</th>
                <th className="col-description">Description</th>
                <th className="col-linked-inv">Linked Inv.</th>
                <th className="col-amount">Amount</th>
                <th className="col-status">Status</th>
                {manager && <th className="col-actions">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const amount = Number(row.amount);
                return (
                  <tr key={row.id} style={{ opacity: row.voided ? 0.5 : 1 }}>
                    <td className="col-id font-mono text-xs text-muted-foreground">{row.entryId}</td>
                    <td className="col-date text-muted-foreground">{formatLocalDate(row.eventDate)}</td>
                    <td className="col-source">
                      <span className={`${amount >= 0 ? "badge-green" : "badge-red"} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                        {sourceTypeLabels[row.sourceType] ?? row.sourceType}
                      </span>
                    </td>
                    <td className="col-description font-medium max-w-[180px] truncate">{row.description}</td>
                    <td className="col-linked-inv text-muted-foreground font-mono text-xs">{row.linkedInvestmentId || "—"}</td>
                    <td className="col-amount font-semibold" style={{ color: amount >= 0 ? "var(--green)" : "var(--red)" }}>
                      {amount >= 0 ? "+" : ""}৳{amount.toLocaleString()}
                    </td>
                    <td className="col-status">
                      {row.voided ? (
                        <span className="badge-red inline-flex items-center px-2 py-0.5 rounded-full text-xs">Voided</span>
                      ) : (
                        <span className="badge-teal inline-flex items-center px-2 py-0.5 rounded-full text-xs">Active</span>
                      )}
                    </td>
                    {manager && (
                      <td className="col-actions">
                        <button
                          onClick={() => setSelectedRevenue(row)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted/60 border bg-muted/30 transition text-foreground"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={manager ? 8 : 7} className="py-12 text-center text-muted-foreground">
                    {isFiltered ? "No entries match the current filters." : "No entries found."}{" "}
                    {manager && !isFiltered && <Link href="/revenue/new" style={{ color: "var(--teal)" }}>Record the first one →</Link>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditRevenueModal
        isOpen={!!selectedRevenue}
        onClose={() => setSelectedRevenue(null)}
        revenue={selectedRevenue}
        availableInvestments={availableInvestments}
      />
    </>
  );
}
