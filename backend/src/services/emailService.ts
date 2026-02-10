import nodemailer from 'nodemailer';

// ── SMTP Configuration ──────────────────────────────────────
// Set these env vars in production:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
//
// For Gmail:
//   SMTP_HOST=smtp.gmail.com  SMTP_PORT=587
//   SMTP_USER=your@gmail.com  SMTP_PASS=<app-password>
//   SMTP_FROM="KKFI <your@gmail.com>"
// ─────────────────────────────────────────────────────────────

const SMTP_CONFIGURED =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

const transporter = SMTP_CONFIGURED
    ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465', // true for 465, false for 587
          auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
          },
      })
    : {
          // Fallback: log to console when SMTP is not configured
          sendMail: async (mailOptions: any) => {
              console.log('──────────────────────────────────────────');
              console.log('📧 EMAIL (no SMTP configured – console only)');
              console.log(`   To: ${mailOptions.to}`);
              console.log(`   Subject: ${mailOptions.subject}`);
              console.log('──────────────────────────────────────────');
              return { messageId: 'console-' + Date.now() };
          },
      };

const FROM = process.env.SMTP_FROM || 'Kyokushin Karate Foundation of India <noreply@kkfi.in>';
const SITE_URL = process.env.FRONTEND_URL || 'https://kyokushin-karate-india.vercel.app';

// ── HTML Email Wrapper ──────────────────────────────────────
function wrapHtml(title: string, body: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#111;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #333;">
<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 24px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:1px;">KYOKUSHIN KARATE</h1>
  <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:3px;">FOUNDATION OF INDIA</p>
</td></tr>
<!-- Body -->
<tr><td style="padding:32px 24px;color:#e5e5e5;font-size:15px;line-height:1.7;">
${body}
</td></tr>
<!-- Footer -->
<tr><td style="padding:20px 24px;border-top:1px solid #333;text-align:center;">
  <p style="margin:0;color:#666;font-size:11px;">Kyokushin Karate Foundation of India</p>
  <p style="margin:4px 0 0;color:#555;font-size:11px;">Shuklaganj Bypass Rd, Shuklaganj, Unnao, UP 209861</p>
  <p style="margin:8px 0 0;"><a href="${SITE_URL}" style="color:#dc2626;text-decoration:none;font-size:11px;">${SITE_URL.replace('https://', '')}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function btn(text: string, url: string): string {
    return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr>
<td style="background:#dc2626;border-radius:8px;padding:12px 28px;">
<a href="${url}" style="color:#fff;text-decoration:none;font-weight:700;font-size:14px;">${text}</a>
</td></tr></table>`;
}

// ── Helper: safe send ───────────────────────────────────────
async function send(to: string, subject: string, html: string, text: string) {
    try {
        await transporter.sendMail({ from: FROM, to, subject, html, text });
    } catch (err) {
        console.error(`[EMAIL ERROR] Failed to send to ${to}:`, err);
        // Don't throw — email failure shouldn't block the main flow
    }
}

// ── Email Templates ─────────────────────────────────────────

export const sendRegistrationEmail = async (email: string, name: string) => {
    const subject = 'Welcome to Kyokushin Karate India – OSU!';
    const html = wrapHtml(subject, `
<h2 style="color:#fff;margin:0 0 16px;font-size:20px;">Osu, ${name}! 🥋</h2>
<p>Welcome to the <strong>Kyokushin Karate Foundation of India</strong>.</p>
<p>Your registration has been received and is currently <span style="color:#fbbf24;font-weight:700;">PENDING</span> approval from your Dojo instructor.</p>
<p>We'll notify you as soon as your status is updated.</p>
${btn('Visit Dashboard', SITE_URL + '/dashboard')}
<p style="color:#888;font-size:13px;">Train hard, stay humble. Osu!</p>
`);
    const text = `Osu ${name},\n\nWelcome to KKFI. Your registration is PENDING approval.\n\nOsu!`;
    await send(email, subject, html, text);
};

export const sendNewApplicantEmail = async (instructorEmail: string, studentName: string) => {
    const subject = `New Student Application: ${studentName}`;
    const html = wrapHtml(subject, `
<h2 style="color:#fff;margin:0 0 16px;font-size:20px;">New Student Application</h2>
<p>A new student, <strong style="color:#dc2626;">${studentName}</strong>, has registered under your Dojo.</p>
<p>Please review and approve their application in the management portal.</p>
${btn('Review Applications', SITE_URL + '/management')}
<p style="color:#888;font-size:13px;">Osu!</p>
`);
    const text = `New student ${studentName} has registered. Please log in to review.\n\nOsu!`;
    await send(instructorEmail, subject, html, text);
};

export const sendInstructorApprovalEmail = async (adminEmail: string, studentName: string, instructorName: string) => {
    const subject = `Student Approved: ${studentName}`;
    const html = wrapHtml(subject, `
<h2 style="color:#fff;margin:0 0 16px;font-size:20px;">Instructor Approval</h2>
<p>Student <strong style="color:#dc2626;">${studentName}</strong> has been approved by Instructor <strong>${instructorName}</strong>.</p>
<p>They are now waiting for your final Admin approval to become <span style="color:#22c55e;font-weight:700;">ACTIVE</span>.</p>
${btn('Review in Management', SITE_URL + '/management')}
`);
    const text = `Student ${studentName} approved by ${instructorName}. Awaiting admin approval.\n\nOsu!`;
    await send(adminEmail, subject, html, text);
};

export const sendMembershipActiveEmail = async (email: string, name: string, membershipNumber: string) => {
    const subject = '🎉 Membership Activated – Welcome to KKFI!';
    const html = wrapHtml(subject, `
<h2 style="color:#fff;margin:0 0 16px;font-size:20px;">Congratulations, ${name}! 🎉</h2>
<p>Your membership has been <span style="color:#22c55e;font-weight:700;">FULLY APPROVED</span>. You are now an active member of KKFI.</p>
<table style="margin:20px 0;background:#222;border-radius:12px;padding:20px;width:100%;">
<tr><td style="text-align:center;">
  <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your Membership ID</p>
  <p style="margin:8px 0 0;color:#dc2626;font-size:24px;font-weight:800;letter-spacing:2px;">${membershipNumber}</p>
</td></tr>
</table>
${btn('View Your Profile', SITE_URL + '/profile')}
<p style="color:#888;font-size:13px;">Train hard, stay humble. Osu!</p>
`);
    const text = `Osu ${name},\n\nYour membership is now ACTIVE.\nMembership Number: ${membershipNumber}\n\nOsu!`;
    await send(email, subject, html, text);
};

export const sendRejectionEmail = async (email: string, name: string) => {
    const subject = 'Registration Update – KKFI';
    const html = wrapHtml(subject, `
<h2 style="color:#fff;margin:0 0 16px;font-size:20px;">Registration Update</h2>
<p>Osu ${name},</p>
<p>We regret to inform you that your registration application has been <span style="color:#ef4444;font-weight:700;">declined</span> at this time.</p>
<p>Please contact your Dojo instructor for more details or reach out to us directly.</p>
${btn('Contact Us', SITE_URL + '/contact')}
<p style="color:#888;font-size:13px;">Osu.</p>
`);
    const text = `Osu ${name},\n\nYour registration has been declined. Please contact your instructor.\n\nOsu.`;
    await send(email, subject, html, text);
};

export const sendBeltPromotionEmail = async (email: string, name: string, newBelt: string, promoterName: string) => {
    const subject = `🥋 Belt Promotion: ${newBelt}!`;
    const html = wrapHtml(subject, `
<h2 style="color:#fff;margin:0 0 16px;font-size:20px;">Congratulations, ${name}! 🥋</h2>
<p>You have been promoted to:</p>
<table style="margin:20px 0;background:#222;border-radius:12px;padding:20px;width:100%;">
<tr><td style="text-align:center;">
  <p style="margin:0;color:#fbbf24;font-size:28px;font-weight:900;">${newBelt}</p>
  <p style="margin:8px 0 0;color:#888;font-size:12px;">Promoted by ${promoterName}</p>
</td></tr>
</table>
<p>This is a proud achievement. Keep pushing your limits!</p>
${btn('View Your Profile', SITE_URL + '/profile')}
<p style="color:#888;font-size:13px;">Train harder. Osu!</p>
`);
    const text = `Osu ${name},\n\nCongratulations! You've been promoted to ${newBelt}.\nPromoted by: ${promoterName}\n\nOsu!`;
    await send(email, subject, html, text);
};

export const sendEventRegistrationEmail = async (email: string, name: string, eventName: string) => {
    const subject = `Event Registration Confirmed: ${eventName}`;
    const html = wrapHtml(subject, `
<h2 style="color:#fff;margin:0 0 16px;font-size:20px;">Registration Confirmed!</h2>
<p>Osu ${name},</p>
<p>You have successfully registered for:</p>
<table style="margin:20px 0;background:#222;border-radius:12px;padding:20px;width:100%;">
<tr><td style="text-align:center;">
  <p style="margin:0;color:#dc2626;font-size:20px;font-weight:800;">${eventName}</p>
</td></tr>
</table>
<p>Check the event page for schedules and additional details.</p>
${btn('View Events', SITE_URL + '/events')}
<p style="color:#888;font-size:13px;">Good luck! Osu!</p>
`);
    const text = `Osu ${name},\n\nYou have registered for ${eventName}.\n\nOsu!`;
    await send(email, subject, html, text);
};

export const sendEventReminderEmail = async (email: string, name: string, eventName: string, date: string) => {
    const subject = `⏰ Reminder: ${eventName} on ${date}`;
    const html = wrapHtml(subject, `
<h2 style="color:#fff;margin:0 0 16px;font-size:20px;">Event Reminder</h2>
<p>Osu ${name},</p>
<p>This is a friendly reminder about the upcoming event:</p>
<table style="margin:20px 0;background:#222;border-radius:12px;padding:20px;width:100%;">
<tr><td style="text-align:center;">
  <p style="margin:0;color:#dc2626;font-size:20px;font-weight:800;">${eventName}</p>
  <p style="margin:8px 0 0;color:#fbbf24;font-size:16px;font-weight:600;">${date}</p>
</td></tr>
</table>
<p>Prepare well and arrive on time.</p>
${btn('View Event Details', SITE_URL + '/events')}
<p style="color:#888;font-size:13px;">Osu!</p>
`);
    const text = `Osu ${name},\n\nReminder: ${eventName} on ${date}.\n\nOsu!`;
    await send(email, subject, html, text);
};
