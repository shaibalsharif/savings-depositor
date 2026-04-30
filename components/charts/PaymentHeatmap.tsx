"use client";

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
  // Reverse so latest month is on the LEFT (index 0)
  const reversedMonths = [...months].reverse();

  return (
    <div>
      {/* Outer container: sticky name col + scrollable month grid */}
      <div style={{ display: "flex", overflow: "hidden" }}>
        {/* Sticky left column — member names */}
        <div style={{ flexShrink: 0, minWidth: 130, zIndex: 2 }}>
          {/* header spacer */}
          <div
            style={{
              height: 30,
              padding: "4px 8px",
              color: "hsl(215 20% 55%)",
              fontWeight: 600,
              fontSize: 11,
              display: "flex",
              alignItems: "center",
            }}
          >
            Member
          </div>
          {data.map((member) => (
            <div
              key={member.memberId}
              style={{
                height: 36,
                display: "flex",
                alignItems: "center",
                padding: "0 8px",
                fontWeight: 500,
                fontSize: 12,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 130,
                background: "transparent",
              }}
            >
              {member.name}
            </div>
          ))}
        </div>

        {/* Scrollable month columns */}
        <div style={{ overflowX: "auto", flex: 1 }}>
          {/* Month headers */}
          <div style={{ display: "flex", minWidth: "max-content" }}>
            {reversedMonths.map((m) => (
              <div
                key={m}
                style={{
                  width: 44,
                  flexShrink: 0,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "hsl(215 20% 55%)",
                  fontWeight: 500,
                  fontSize: 10,
                }}
              >
                {m.slice(5, 7)}/{m.slice(2, 4)}
              </div>
            ))}
          </div>

          {/* Member rows */}
          {data.map((member) => {
            // Build a lookup for this member's month data, then reorder by reversedMonths
            const lookup = Object.fromEntries(member.months.map((m) => [m.month, m]));
            return (
              <div
                key={member.memberId}
                style={{ display: "flex", minWidth: "max-content", height: 36, alignItems: "center" }}
                className="hover:bg-accent/10"
              >
                {reversedMonths.map((mKey) => {
                  const cell = lookup[mKey];
                  return (
                    <div
                      key={mKey}
                      style={{ width: 44, flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                    >
                      <div
                        title={
                          cell
                            ? `${member.name} — ${mKey}: ৳${cell.paid.toLocaleString()} paid of ৳${cell.expected.toLocaleString()} (${getLabel(cell.pct)})`
                            : `${member.name} — ${mKey}: No data`
                        }
                        style={{
                          width: 30,
                          height: 26,
                          borderRadius: 5,
                          background: cell ? getColor(cell.pct) : "hsl(222 47% 12%)",
                          border: "1px solid hsl(222 47% 18%)",
                          cursor: "default",
                          transition: "transform 0.1s",
                        }}
                        onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1.2)")}
                        onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
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
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <span>Legend:</span>
        {[
          { color: "hsl(222 47% 14%)", label: "Unpaid" },
          { color: "rgba(239,68,68,0.4)", label: "< 33%" },
          { color: "rgba(245,158,11,0.5)", label: "33–66%" },
          { color: "rgba(45,212,191,0.5)", label: "66–99%" },
          { color: "rgba(45,212,191,0.95)", label: "Full" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                background: item.color,
                border: "1px solid hsl(222 47% 18%)",
              }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
