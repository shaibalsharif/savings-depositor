import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Project13 <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("[EmailAdapter] Resend error:", JSON.stringify(error, null, 2));
    } else {
      console.log(`[EmailAdapter] Sent "${subject}" to ${to}. ID: ${data?.id}`);
    }
  } catch (err: any) {
    console.error("[EmailAdapter] Exception:", err.message || err);
  }
}
