import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Project13 <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("[EmailAdapter] Resend error:", error);
    } else {
      console.log(`[EmailAdapter] Sent "${subject}" to ${to}`);
    }
  } catch (err) {
    console.error("[EmailAdapter] Exception:", err);
  }
}
