"use client";

import { format, parseISO } from "date-fns";

type HeatmapMember = {
  memberId: string;
  name: string;
  months: { month: string; paid: number; expected: number; pct: number }[];
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

export function PaymentHeatmap({ data, months }: { data: HeatmapMember[]; months: string[] }) {
  // Reverse so latest month is on the LEFT
  const reversedMonths = [...months].reverse().filter(m => m <= format(new Date(), "yyyy-MM"));

  return (
    <div className="relative">
      {/* Outer container: sticky name col + scrollable month grid */}
      <div className="flex overflow-hidden">
        {/* Sticky left column — member names */}
        <div className="flex-shrink-0 min-w-[130px] z-10 bg-background/50 backdrop-blur-sm border-r pr-2">
          {/* header spacer */}
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
                  const monthName = format(parseISO(mKey + "-01"), "MMMM yyyy");
                  
                  return (
                    <div
                      key={mKey}
                      className="w-[50px] flex-shrink-0 flex justify-center items-center group relative"
                    >
                      <div
                        style={{
                          width: 34,
                          height: 24,
                          borderRadius: 4,
                          background: color,
                          border: "1px solid rgba(255,255,255,0.05)",
                          cursor: "default",
                        }}
                        className="transition-transform duration-200 group-hover:scale-110 group-hover:z-20"
                      />
                      
                      {/* Custom Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                        <div className="bg-popover/95 backdrop-blur-md border border-border shadow-2xl rounded-lg p-2.5 min-w-[180px] text-[11px] leading-relaxed">
                          <div className="font-bold text-foreground mb-1 border-b border-border/50 pb-1 flex justify-between items-center">
                            <span>{monthName}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted font-mono">{mKey}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Member:</span>
                              <span className="font-semibold">{member.name}</span>
                            </div>
                            {cell ? (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Paid:</span>
                                  <span className="text-green-400 font-mono">৳{cell.paid.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Expected:</span>
                                  <span className="font-mono">৳{cell.expected.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-border/30 mt-1">
                                  <span className="text-muted-foreground">Status:</span>
                                  <span className={`font-bold ${cell.pct >= 1 ? "text-teal-400" : cell.pct > 0 ? "text-orange-400" : "text-red-400"}`}>
                                    {getLabel(cell.pct)} ({Math.round(cell.pct * 100)}%)
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="text-red-400 italic">No record found</div>
                            )}
                          </div>
                          {/* Pointer arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-r border-b border-border rotate-45 -mt-1"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-4 mt-6 px-2 text-[10px] text-muted-foreground font-medium">
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
