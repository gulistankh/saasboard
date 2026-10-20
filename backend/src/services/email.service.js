import nodemailer from "nodemailer";
import env from "../config/env.js";

const smtpConfigured = Boolean(env.smtp.host);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user
        ? { user: env.smtp.user, pass: env.smtp.pass }
        : undefined,
    })
  : null;

// Escape user-provided text before putting it inside HTML
const escapeHtml = (text = "") =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Simple, email-client-friendly layout
const layout = ({ title, intro, buttonText, link, footer }) => `
<div style="font-family:Arial,sans-serif;background:#f9fafb;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
    <h2 style="margin:0 0 12px;color:#111827;">${title}</h2>
    <p style="color:#374151;font-size:15px;line-height:1.5;">${intro}</p>
    <p style="margin:24px 0;">
      <a href="${link}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;display:inline-block;">${buttonText}</a>
    </p>
    <p style="color:#6b7280;font-size:13px;line-height:1.5;">If the button doesn't work, copy this link into your browser:<br>${link}</p>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">${footer}</p>
  </div>
</div>`;

const sendMail = async ({ to, subject, html, text, link }) => {
  // Development without SMTP: print the link so you can click it
  if (!transporter) {
    console.log("\n--------- EMAIL (SMTP not configured) ---------");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Link:    ${link}`);
    console.log("------------------------------------------------\n");
    return;
  }

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
    text,
  });
};

export const sendVerificationEmail = ({ to, name, token }) => {
  const link = `${env.clientUrl}/verify-email?token=${token}`;
  return sendMail({
    to,
    subject: "Verify your email address",
    link,
    text: `Hi ${name}, verify your email: ${link} (valid for ${env.tokens.verifyEmailHours} hours)`,
    html: layout({
      title: "Verify your email",
      intro: `Hi ${escapeHtml(name)}, thanks for signing up. Please confirm your email address to activate your account.`,
      buttonText: "Verify email",
      link,
      footer: `This link expires in ${env.tokens.verifyEmailHours} hours. If you didn't create an account, you can ignore this email.`,
    }),
  });
};

export const sendPasswordResetEmail = ({ to, name, token }) => {
  const link = `${env.clientUrl}/reset-password?token=${token}`;
  return sendMail({
    to,
    subject: "Reset your password",
    link,
    text: `Hi ${name}, reset your password: ${link} (valid for ${env.tokens.resetPasswordHours} hour)`,
    html: layout({
      title: "Reset your password",
      intro: `Hi ${escapeHtml(name)}, we received a request to reset your password. Click the button below to choose a new one.`,
      buttonText: "Reset password",
      link,
      footer: `This link expires in ${env.tokens.resetPasswordHours} hour. If you didn't request this, you can ignore this email and your password will stay the same.`,
    }),
  });
};

export const sendInviteEmail = ({ to, inviterName, workspaceName, role, token }) => {
  const link = `${env.clientUrl}/accept-invite?token=${token}`;
  return sendMail({
    to,
    subject: `You're invited to join ${workspaceName}`,
    link,
    text: `${inviterName} invited you to join ${workspaceName} as ${role}: ${link} (valid for ${env.tokens.inviteDays} days)`,
    html: layout({
      title: "You've been invited",
      intro: `<strong>${escapeHtml(inviterName)}</strong> invited you to join <strong>${escapeHtml(workspaceName)}</strong> as <strong>${escapeHtml(role)}</strong>.`,
      buttonText: "Accept invitation",
      link,
      footer: `This invitation expires in ${env.tokens.inviteDays} days and is only valid for ${escapeHtml(to)}.`,
    }),
  });
};
