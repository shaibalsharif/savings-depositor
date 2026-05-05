"use client";

import { format, parseISO } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type HeatmapMember = {
  memberId: string;
  name: string;
  months: { month: string; paid: number; expected: number; pct: number }[];
};

type TooltipState = {
  visible: boolean;
  x: number;
  y: number;
  member: string;
  monthName: string;
  mKey: string;
  paid: number;
  expected: number;
  pct: number;
  hasData: boolean;
};

function getColor(pct: number): string {
  if (pct === 0) return "hsl(222 47% 14%)";
  if (pct < 0.33) return "rgba(239, 68, 68, 0.4)";
  if (pct < 0.66) return "rgba(245, 158, 11, 0.5)";
  if (pct < 1) return "rgba(45, 212, 191, 0.5)";
  return "rgba(45, 212, 191, 0.95)";
}

function getLabel(pct: number): string {
  if (pct === 0) return "Not Paid";
  if (pct < 0.33) return "< 33%";
  if (pct < 0.66) return "33–66%";
  if (pct < 1) return "66–99%";
  return "Full";
}

const TOOLTIP_WIDTH = 200;

function HeatmapTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip.visible) return null;

  // Clamp horizontally so tooltip never goes off screen
  const left = Math.max(8, Math.min(tooltip.x - TOOLTIP_WIDTH / 2, window.innerWidth - TOOLTIP_WIDTH - 8));
  // Place above the cursor by default
  const top = tooltip.y - 8;

  return createPortal(
    <div
      style={{
        position: "fixed",
        left,
        top,
        transform: "translateY(-100%)",
        zIndex: 9999,
        width: TOOLTIP_WIDTH,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "hsl(var(--popover))",
          border: "1px solid hsl(var(--border))",
          borderRadius: 10,
          padding: "10px 12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          backdropFilter: "blur(12px)",
          fontSize: 11,
          lineHeight: 1.6,
          color: "hsl(var(--foreground))",
        }}
      >
        {/* Header */}
        <div
          style={{
            fontWeight: 700,
            marginBottom: 6,
            paddingBottom: 6,
            borderBottom: "1px solid hsl(var(--border))",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {tooltip.monthName}
          </span>
          <span
            style={{
              fontSize: 9,
              padding: "1px 6px",
              borderRadius: 4,
              background: "hsl(var(--muted))",
              fontFamily: "monospace",
              flexShrink: 0,
            }}
          >
            {tooltip.mKey}
          </span>
        </div>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "hsl(var(--muted-foreground))" }}>Member:</span>
            <span style={{ fontWeight: 600, textAlign: "right", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {tooltip.member}
            </span>
          </div>
          {tooltip.hasData ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "hsl(var(--muted-foreground))" }}>Paid:</span>
                <span style={{ color: "#34d399", fontFamily: "monospace", fontWeight: 600 }}>
                  ৳{tooltip.paid.toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "hsl(var(--muted-foreground))" }}>Expected:</span>
                <span style={{ fontFamily: "monospace" }}>৳{tooltip.expected.toLocaleString()}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 6,
                  marginTop: 2,
                  borderTop: "1px solid hsl(var(--border))",
                }}
              >
                <span style={{ color: "hsl(var(--muted-foreground))" }}>Status:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      tooltip.pct >= 1
                        ? "#2dd4bf"
                        : tooltip.pct > 0
                        ? "#fb923c"
                        : "#f87171",
                  }}
                >
                  {getLabel(tooltip.pct)} ({Math.round(tooltip.pct * 100)}%)
                </span>
              </div>
            </>
          ) : (
            <span style={{ color: "#f87171", fontStyle: "italic" }}>No record found</span>
          )}
        </div>

        {/* Arrow */}
        <div
          style={{
            position: "absolute",
            bottom: -5,
            left: "50%",
            transform: "translateX(-50%) rotate(45deg)",
            width: 8,
            height: 8,
            background: "hsl(var(--popover))",
            borderRight: "1px solid hsl(var(--border))",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        />
      </div>
    </div>,
    document.body
  );
}

export function PaymentHeatmap({ data, months }: { data: HeatmapMember[]; months: string[] }) {
  const reversedMonths = [...months].reverse().filter((m) => m <= format(new Date(), "yyyy-MM"));

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    member: "",
    monthName: "",
    mKey: "",
    paid: 0,
    expected: 0,
    pct: 0,
    hasData: false,
  });

  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showTooltip(
    e: React.MouseEvent,
    member: string,
    mKey: string,
    cell: { paid: number; expected: number; pct: number } | undefined
  ) {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top,
      member,
      monthName: format(parseISO(mKey + "-01"), "MMMM yyyy"),
      mKey,
      paid: cell?.paid ?? 0,
      expected: cell?.expected ?? 0,
      pct: cell?.pct ?? 0,
      hasData: !!cell,
    });
  }

  function hideTooltip() {
    hideTimeout.current = setTimeout(() => {
      setTooltip((prev) => ({ ...prev, visible: false }));
    }, 100);
  }

  useEffect(() => {
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  return (
    <div className="relative">
      <HeatmapTooltip tooltip={tooltip} />

      {/* Outer container */}
      <div className="flex overflow-hidden">
        {/* Sticky left column — member names */}
        <div className="flex-shrink-0 min-w-[130px] z-10 bg-background/50 backdrop-blur-sm border-r pr-2">
          <div className="h-[30px] flex items-center px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Member
          </div>
          {data.map((member) => (
            <div
              key={member.memberId}
              className="h-[36px] flex items-center px-2 text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[130px]"
              title={member.name}
            >
              {member.name}
            </div>
          ))}
        </div>

        {/* Scrollable month columns */}
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          {/* Month headers */}
          <div className="flex min-w-max">
            {reversedMonths.map((m) => (
              <div
                key={m}
                className="w-[50px] flex-shrink-0 h-[30px] flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase"
              >
                {format(parseISO(m + "-01"), "MMM")}
              </div>
            ))}
          </div>

          {/* Member rows */}
          {data.map((member) => {
            const lookup = Object.fromEntries(member.months.map((m) => [m.month, m]));
            return (
              <div
                key={member.memberId}
                className="flex min-w-max h-[36px] items-center hover:bg-muted/30 transition-colors"
              >
                {reversedMonths.map((mKey) => {
                  const cell = lookup[mKey];
                  const color = cell ? getColor(cell.pct) : "hsl(222 47% 12%)";

                  return (
                    <div
                      key={mKey}
                      className="w-[50px] flex-shrink-0 flex justify-center items-center"
                    >
                      <div
                        onMouseEnter={(e) => showTooltip(e, member.name, mKey, cell)}
                        onMouseLeave={hideTooltip}
                        style={{
                          width: 34,
                          height: 24,
                          borderRadius: 4,
                          background: color,
                          border: "1px solid rgba(255,255,255,0.05)",
                          cursor: "default",
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "scale(1.15)";
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 8px rgba(45,212,191,0.3)";
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                          (e.currentTarget as HTMLElement).style.boxShadow = "none";
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-3 mt-6 px-2 text-[10px] text-muted-foreground font-medium">
        <span className="uppercase tracking-widest opacity-70">Payment Legend:</span>
        {[
          { color: "hsl(222 47% 14%)", label: "Unpaid" },
          { color: "rgba(239,68,68,0.4)", label: "< 33%" },
          { color: "rgba(245,158,11,0.5)", label: "33–66%" },
          { color: "rgba(45,212,191,0.5)", label: "66–99%" },
          { color: "rgba(45,212,191,0.95)", label: "Full" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 bg-muted/20 px-2 py-1 rounded-md border border-border/50">
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: item.color,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
