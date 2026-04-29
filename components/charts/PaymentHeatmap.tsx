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
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "4px 8px", color: "hsl(215 20% 55%)", fontWeight: 600, fontSize: 11, minWidth: 140 }}>
              Member
            </th>
            {months.map((m) => (
              <th
                key={m}
                style={{
                  padding: "4px 2px",
                  color: "hsl(215 20% 55%)",
                  fontWeight: 500,
                  fontSize: 10,
                  textAlign: "center",
                  minWidth: 48,
                }}
              >
                {m.slice(5, 7)}/{m.slice(2, 4)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((member) => (
            <tr key={member.memberId} className="hover:bg-accent/20">
              <td
                style={{
                  padding: "4px 8px",
                  fontWeight: 500,
                  fontSize: 12,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 140,
                }}
              >
                {member.name}
              </td>
              {member.months.map((m) => (
                <td key={m.month} style={{ padding: "3px 2px", textAlign: "center" }}>
                  <div
                    title={`${member.name} — ${m.month}: ৳${m.paid.toLocaleString()} paid of ৳${m.expected.toLocaleString()} (${getLabel(m.pct)})`}
                    style={{
                      width: 32,
                      height: 28,
                      borderRadius: 5,
                      background: getColor(m.pct),
                      border: "1px solid hsl(222 47% 18%)",
                      margin: "0 auto",
                      cursor: "default",
                      transition: "transform 0.1s",
                    }}
                    onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1.2)")}
                    onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

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
