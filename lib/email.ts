import nodemailer from "nodemailer";

export async function sendInvitationEmail({
  email,
  firstName,
  inviteLink,
}: {
  email: string;
  firstName: string;
  inviteLink: string;
}) {
  console.log(`[Email] Attempting to send to ${email} using ${process.env.SMTP_USER}`);
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD?.replace(/\s/g, ""),
    },
  });

  const fromEmail = process.env.SMTP_FROM_EMAIL || `"Project 13" <${process.env.SMTP_USER}>`;

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: "Welcome to Project 13 - Your Invitation is Ready",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #eee; border-radius: 12px;">
          <h1 style="color: #0b0f19; font-size: 24px; font-weight: 800; margin-bottom: 16px;">Welcome to Project 13, ${firstName}!</h1>
          <p style="color: #4b5563; font-size: 16px; line-height: 24px;">
            You have been invited to join the <strong>Project 13 Savings Management Portal</strong>. 
            Once you join, you'll be able to track your deposits, view investment shares, and monitor your savings growth.
          </p>
          <div style="margin: 32px 0;">
            <a href="${inviteLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block;">
              Join Organization
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:
            <br />
            <span style="word-break: break-all;">${inviteLink}</span>
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            &copy; 2026 Project 13 Fund. All rights reserved.
          </p>
        </div>
      `,
    });

    console.log("[Email] Invitation sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[Email] SMTP error:", err);
    return { success: false, error: err };
  }
}
