import { format, parseISO } from "date-fns";
import type {
  DepositNotificationData,
  ReminderNotificationData,
  SummaryNotificationData,
  SmartReminderNotificationData,
} from "./types";

function monthLabel(yyyyMM: string): string {
  return format(parseISO(yyyyMM + "-01"), "MMMM yyyy");
}

function currency(n: number): string {
  return "৳" + n.toLocaleString("en-BD");
}

// ── Base HTML shell ─────────────────────────────────────────────────────────

function shell(title: string, accentColor: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0b0f19;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f19;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#131929;border-radius:12px;overflow:hidden;border:1px solid #1e2d45;">
        <!-- Header -->
        <tr><td style="background:${accentColor};padding:20px 28px;">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.7);text-transform:uppercase;">Project 13</p>
          <h1 style="margin:6px 0 0;font-size:20px;font-weight:800;color:#fff;">${title}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:24px 28px;color:#c9d6e3;font-size:14px;line-height:1.7;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 28px;border-top:1px solid #1e2d45;font-size:11px;color:#4b6080;text-align:center;">
          Project 13 Savings Fund · Automated Notification · Do not reply<br/>
          <span style="font-size: 10px; color: #3b4d6b;">Generated at: ${format(new Date(), "dd MMM yyyy, hh:mm:ss a")}</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string, valueColor = "#e2eaf3"): string {
  return `<tr>
    <td style="padding:6px 0;color:#7a9bb5;font-size:13px;width:50%;">${label}</td>
    <td style="padding:6px 0;color:${valueColor};font-weight:600;font-size:13px;text-align:right;">${value}</td>
  </tr>`;
}

// ── Deposit Confirmed ───────────────────────────────────────────────────────

export function depositConfirmedEmail(d: DepositNotificationData): { subject: string; html: string } {
  const subject = `✅ Deposit Confirmed — ${monthLabel(d.forMonth)}`;
  const timeStr = d.recordedAt ? ` <sub style="font-size: 10px; color: #7a9bb5;">${format(parseISO(d.recordedAt), "hh:mm a")}</sub>` : "";
  const body = `
    <p style="margin:0 0 20px;">Dear <strong style="color:#fff;">${d.memberName}</strong>,</p>
    <p style="margin:0 0 20px;">Your deposit has been recorded successfully.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1526;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      ${row("For month", monthLabel(d.forMonth))}
      ${row("Amount credited", currency(d.amount), "#2dd4bf")}
      ${row("Paid on", `${format(parseISO(d.paymentDate), "dd MMM yyyy")}${timeStr}`)}
      ${row("Your running balance", currency(d.memberBalance), "#60a5fa")}
      ${row("Total fund balance", currency(d.totalFundBalance))}
    </table>
    <p style="margin:0;color:#4b6080;font-size:12px;">Thank you for keeping up with your contributions!</p>`;
  return { subject, html: shell(subject, "linear-gradient(135deg,#0d9488,#0891b2)", body) };
}

// ── End-of-Month Reminder ───────────────────────────────────────────────────

export function depositReminderEmail(d: ReminderNotificationData): { subject: string; html: string } {
  const subject = `⚠️ Reminder: ${monthLabel(d.forMonth)} Deposit Pending`;
  const body = `
    <p style="margin:0 0 20px;">Dear <strong style="color:#fff;">${d.memberName}</strong>,</p>
    <p style="margin:0 0 20px;">This is a friendly reminder that your deposit for <strong style="color:#fb923c;">${monthLabel(d.forMonth)}</strong> is still outstanding.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1526;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      ${row("Month", monthLabel(d.forMonth))}
      ${row("Amount due", currency(d.amountDue), "#fb923c")}
    </table>
    <p style="margin:0;color:#4b6080;font-size:12px;">Please ensure payment before the month ends to avoid accumulating dues.</p>`;
  return { subject, html: shell(subject, "linear-gradient(135deg,#b45309,#92400e)", body) };
}

// ── Smart Payment Reminder (Detailed Breakdown) ─────────────────────────────

export function smartDepositReminderEmail(d: SmartReminderNotificationData): { subject: string; html: string } {
  const subject = `⚠️ Important: Outstanding Payment Reminder`;
  
  const breakdownRows = d.breakdown.map((b) => 
    row(monthLabel(b.month), currency(b.amountDue), "#fb923c")
  ).join("");

  const body = `
    <p style="margin:0 0 20px;">Dear <strong style="color:#fff;">${d.memberName}</strong>,</p>
    <p style="margin:0 0 20px;">This is a friendly reminder regarding your outstanding deposit balances. Below is the detailed breakdown of the pending amounts for each month:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1526;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      ${breakdownRows}
      <tr><td colspan="2"><hr style="border:none;border-top:1px solid #1e2d45;margin:12px 0;"/></td></tr>
      <tr>
        <td style="padding:6px 0;color:#e2eaf3;font-size:14px;font-weight:700;width:50%;">Total Outstanding</td>
        <td style="padding:6px 0;color:#ef4444;font-weight:800;font-size:16px;text-align:right;">${currency(d.totalDue)}</td>
      </tr>
    </table>
    <p style="margin:0;color:#4b6080;font-size:12px;">Please clear these dues at your earliest convenience to keep your account up to date.</p>`;
  
  return { subject, html: shell(subject, "linear-gradient(135deg,#b45309,#92400e)", body) };
}


// ── Monthly Summary ─────────────────────────────────────────────────────────

export function monthlySummaryEmail(d: SummaryNotificationData): { subject: string; html: string } {
  const subject = `📊 ${monthLabel(d.forMonth)} — Monthly Summary`;
  const pct = d.totalExpected > 0 ? Math.round((d.totalCollected / d.totalExpected) * 100) : 0;
  const unpaidRows = d.unpaidMembers.length
    ? d.unpaidMembers.map((m) =>
        `<tr><td style="padding:4px 0;color:#f87171;font-size:12px;">${m.name}</td><td style="padding:4px 0;color:#f87171;font-size:12px;text-align:right;">${currency(m.due)}</td></tr>`
      ).join("")
    : `<tr><td colspan="2" style="padding:4px 0;color:#2dd4bf;font-size:12px;">All members paid ✅</td></tr>`;

  const body = `
    <p style="margin:0 0 20px;color:#c9d6e3;">Here is the summary for <strong style="color:#fff;">${monthLabel(d.forMonth)}</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1526;border-radius:8px;padding:16px 20px;margin-bottom:16px;">
      ${row("Total collected", `${currency(d.totalCollected)} / ${currency(d.totalExpected)}`)}
      ${row("Collection rate", `${pct}%`, pct >= 90 ? "#2dd4bf" : pct >= 60 ? "#fb923c" : "#f87171")}
      ${row("Members paid", `${d.membersPaid} / ${d.totalMembers}`)}
      ${row("Fund balance", currency(d.fundBalance), "#60a5fa")}
    </table>
    ${d.unpaidMembers.length ? `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#f87171;text-transform:uppercase;letter-spacing:1px;">Unpaid Members</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1526;border-radius:8px;padding:12px 20px;margin-bottom:16px;">
      ${unpaidRows}
    </table>` : ""}`;
  return { subject, html: shell(subject, "linear-gradient(135deg,#3b0764,#1e3a8a)", body) };
}
