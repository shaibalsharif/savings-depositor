import nodemailer from "nodemailer";

/**
 * Creates a fresh transporter on every call so env vars are always read at
 * runtime — not captured once at module-load time (which can be before env
 * vars are hydrated in serverless/edge environments).
 *
 * IMPORTANT: SMTP_PASSWORD must be set WITHOUT surrounding quotes.
 *   ✅  pxqe fgxj wrkk bcot
 *   ❌  "pxqe fgxj wrkk bcot"
 * Google App Passwords work with or without spaces in the value.
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    requireTLS: true,
    tls: {
      // Ensures TLS works correctly even if Node's CA store differs
      rejectUnauthorized: true,
    },
  });
}

const getFrom = () =>
  process.env.SMTP_FROM_EMAIL || "Project 13 <notifications@your-email.com>";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "SMTP credentials (SMTP_USER / SMTP_PASSWORD) are missing. " +
      "Set them in Vercel → Project → Environment Variables (without surrounding quotes)."
    );
  }

  const transporter = createTransporter();
  const FROM = getFrom();

  try {
    console.log(
      `[EmailAdapter] Sending: From=${FROM}, To=${to}, ` +
      `Host=${process.env.SMTP_HOST}, PassLen=${pass.length}`
    );
    const info = await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[EmailAdapter] ✅ Sent "${subject}" → ${to}. MessageId: ${info.messageId}`);
  } catch (err: any) {
    console.error("[EmailAdapter] ❌ SMTP FAILURE:", err.message || err);
    if (err.message?.includes("Username and Password not accepted")) {
      console.error(
        "[EmailAdapter] HINT: Your Gmail App Password is being rejected. " +
        "Make sure SMTP_PASSWORD is set WITHOUT surrounding quotes in Vercel env vars. " +
        "Also verify 2FA is enabled and the app password was generated for 'Mail'."
      );
    }
    // Re-throw so the caller (notification service) can handle/log it
    throw err;
  }
}
