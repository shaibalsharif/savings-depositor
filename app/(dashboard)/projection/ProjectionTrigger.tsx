"use client";

import { useState } from "react";
import { ProjectionSimulatorModal } from "./ProjectionSimulatorModal";
import { TrendingUp } from "lucide-react";

type HistoricalItem = {
  month: string;
  balance: number;
};

export function ProjectionTrigger({
  currentBalance,
  memberCount,
  monthlyPerMember,
  historicalData,
}: {
  currentBalance: number;
  memberCount: number;
  monthlyPerMember: number;
  historicalData: HistoricalItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 font-bold rounded-lg transition border hover:bg-teal/10"
        style={{ borderColor: "rgba(45,212,191,0.3)", color: "var(--teal)" }}
      >
        <TrendingUp size={13} /> Run Projection
      </button>

      <ProjectionSimulatorModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentBalance={currentBalance}
        memberCount={memberCount}
        monthlyPerMember={monthlyPerMember}
        historicalData={historicalData}
      />
    </>
  );
}
