import nodemailer from "nodemailer";

// SMTP configuration for sending emails without a verified domain
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM = process.env.SMTP_FROM_EMAIL || "Project 13 <notifications@your-email.com>";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // If SMTP is not configured, fall back to console logging or skip
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn("[EmailAdapter] SMTP not configured. Skipping email to:", to);
    return;
  }

  try {
    console.log(`[EmailAdapter] Attempting SMTP send: From=${FROM}, To=${to}, PassLen=${process.env.SMTP_PASSWORD?.length}`);
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html,
    });
    console.log(`[EmailAdapter] SUCCESS: Sent "${subject}" to ${to}. MessageId: ${info.messageId}`);
  } catch (err: any) {
    console.error("[EmailAdapter] SMTP FAILURE:", err.message || err);
    if (err.message?.includes("Username and Password not accepted")) {
      console.error("[EmailAdapter] HINT: Check your App Password. If you used spaces, try it exactly as Google showed it.");
    }
  }
}
