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

// Lazy-initialised transporter.  The env vars may not be available at
// module-load time (ESM imports are hoisted above dotenv.config), so we
// build the transporter on first use.

let _transporter: nodemailer.Transporter | null = null;
let _smtpLogged = false;

function getTransporter(): nodemailer.Transporter {
    if (_transporter) return _transporter;

    const configured =
        process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

    if (!_smtpLogged) {
        console.log(`📧 Email service: ${configured ? 'SMTP configured ✅' : '⚠️  No SMTP – emails will only log to console'}`);
        _smtpLogged = true;
    }

    if (configured) {
        _transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            connectionTimeout: 10000, // 10s to establish connection
            greetingTimeout: 10000,   // 10s for SMTP greeting
            socketTimeout: 15000,     // 15s for socket inactivity
        });
    } else {
        // Fallback: log to console when SMTP is not configured
        _transporter = {
            sendMail: async (mailOptions: any) => {
                console.log('──────────────────────────────────────────');
                console.log('📧 EMAIL (no SMTP configured – console only)');
                console.log(`   To: ${mailOptions.to}`);
                console.log(`   Subject: ${mailOptions.subject}`);
                console.log('──────────────────────────────────────────');
                return { messageId: 'console-' + Date.now() };
            },
        } as any;
    }

    return _transporter!;
}

function getFrom() {
    const from = process.env.SMTP_FROM || '';
    // If SMTP_FROM has proper format like "Name <email>", use as-is
    if (from.includes('<') && from.includes('>')) {
        return from;
    }
    // If SMTP_FROM is just a name (no email), append SMTP_USER
    if (from && process.env.SMTP_USER) {
        return `${from} <${process.env.SMTP_USER}>`;
    }
    // If SMTP_FROM is an email address
    if (from && from.includes('@')) {
        return from;
    }
    // Fallback: use SMTP_USER directly or default
    return process.env.SMTP_USER || 'Kyokushin Karate Foundation of India <noreply@kkfi.in>';
}

function getSiteUrl() {
    return process.env.FRONTEND_URL || 'https://kyokushin-karate-india.vercel.app';
}

// ── HTML Email Wrapper ──────────────────────────────────────
function wrapHtml(title: string, body: string): string {
    const SITE_URL = getSiteUrl();
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
        const transporter = getTransporter();
        const fromAddr = getFrom();
        console.log(`[EMAIL] Sending "${subject}" to ${to} from ${fromAddr}`);
        const info = await transporter.sendMail({ from: fromAddr, to, subject, html, text });
        console.log(`[EMAIL] ✅ Sent "${subject}" to ${to} (messageId: ${info.messageId})`);
    } catch (err: any) {
        console.error(`[EMAIL] ❌ Failed to send "${subject}" to ${to}:`, err?.message || err);
        // Don't throw — email failure shouldn't block the main flow
    }
}

// ── Email Templates ─────────────────────────────────────────

export const sendRegistrationEmail = async (email: string, name: string) => {
    const subject = 'Welcome to the Kyokushin Karate Foundation of India – Osu! 🥋';
    const html = wrapHtml(subject, `
<h2 style="color:#fff;margin:0 0 8px;font-size:22px;font-weight:800;">Osu, ${name}!</h2>
<p style="color:#fbbf24;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin:0 0 20px;">Welcome to the KKFI Family</p>

<p>Thank you for registering with the <strong style="color:#fff;">Kyokushin Karate Foundation of India (KKFI)</strong>. We are honoured that you have chosen to walk the path of the strongest karate.</p>

<!-- Shihan Introduction Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:linear-gradient(135deg,#1f1f1f,#2a2020);border-radius:16px;border:1px solid #333;overflow:hidden;">
<tr>
<td style="padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
  <td style="vertical-align:top;width:100%;">
    <p style="margin:0 0 4px;color:#dc2626;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;">Meet Our Founder</p>
    <h3 style="margin:0 0 4px;color:#fff;font-size:18px;font-weight:800;">Shihan Vasant Kumar Singh</h3>
    <p style="margin:0 0 12px;color:#888;font-size:12px;font-style:italic;">Country Director — IKO World Kyokushin Kaikan</p>
    <p style="margin:0;color:#ccc;font-size:13px;line-height:1.7;">Shihan Vasant Kumar Singh began his Kyokushin Karate journey in <strong style="color:#fff;">1987</strong>. Driven by an unwavering passion for the art, he founded the <strong style="color:#fff;">Kyokushin Karate Foundation of India in 2013</strong> to bring world-class Kyokushin training to every corner of the country. Today, the foundation has grown to include <strong style="color:#dc2626;">100 + dojos</strong> across India, nurturing a new generation of disciplined and strong-spirited karateka.</p>
  </td>
  </tr>
  </table>
</td>
</tr>
</table>

<!-- What Happens Next -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#1f1f1f;border-radius:12px;border:1px solid #333;">
<tr><td style="padding:20px 24px;">
  <h3 style="margin:0 0 16px;color:#fff;font-size:16px;font-weight:700;">📋 What Happens Next?</h3>
  <table cellpadding="0" cellspacing="0" style="width:100%;">

  <tr>
  <td style="vertical-align:top;padding:0 12px 14px 0;width:28px;">
    <div style="width:28px;height:28px;background:#dc2626;border-radius:50%;text-align:center;line-height:28px;color:#fff;font-weight:800;font-size:13px;">1</div>
  </td>
  <td style="vertical-align:top;padding-bottom:14px;">
    <p style="margin:0;color:#fff;font-size:14px;font-weight:600;">Instructor Review</p>
    <p style="margin:2px 0 0;color:#999;font-size:13px;">Your assigned Dojo instructor will review your application.</p>
  </td>
  </tr>

  <tr>
  <td style="vertical-align:top;padding:0 12px 14px 0;width:28px;">
    <div style="width:28px;height:28px;background:#dc2626;border-radius:50%;text-align:center;line-height:28px;color:#fff;font-weight:800;font-size:13px;">2</div>
  </td>
  <td style="vertical-align:top;padding-bottom:14px;">
    <p style="margin:0;color:#fff;font-size:14px;font-weight:600;">Admin Approval</p>
    <p style="margin:2px 0 0;color:#999;font-size:13px;">Once recommended by your instructor, the KKFI admin will grant final approval.</p>
  </td>
  </tr>

  <tr>
  <td style="vertical-align:top;padding:0 12px 0 0;width:28px;">
    <div style="width:28px;height:28px;background:#22c55e;border-radius:50%;text-align:center;line-height:28px;color:#fff;font-weight:800;font-size:13px;">✓</div>
  </td>
  <td style="vertical-align:top;">
    <p style="margin:0;color:#fff;font-size:14px;font-weight:600;">Membership Activated</p>
    <p style="margin:2px 0 0;color:#999;font-size:13px;">You'll receive your unique KKFI membership ID and full access to the portal.</p>
  </td>
  </tr>

  </table>
</td></tr>
</table>

<p>Your application is currently <span style="display:inline-block;background:#78350f;color:#fbbf24;font-weight:700;padding:2px 10px;border-radius:6px;font-size:13px;">⏳ PENDING REVIEW</span></p>

<p style="color:#ccc;">Please be patient — your instructor will review your application shortly. You'll receive an email as soon as your membership is approved.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-top:1px solid #333;padding-top:20px;">
<tr><td>
  <p style="margin:0;color:#888;font-size:13px;font-style:italic;">"A person who has not trained for a long time must not lose heart, but must make effort to set goals for themselves, not comparing themselves with their peers."</p>
  <p style="margin:6px 0 0;color:#dc2626;font-size:12px;font-weight:700;">— Sosai Mas Oyama, Founder of Kyokushin Karate</p>
</td></tr>
</table>

<p style="color:#888;font-size:13px;">Train hard, stay humble.<br/><strong style="color:#ccc;">Osu! 🥋</strong></p>
`);
    const text = `Osu ${name},\n\nWelcome to the Kyokushin Karate Foundation of India!\n\nThank you for registering. Your application is currently PENDING REVIEW.\n\nShihan Vasant Kumar Singh, Country Director of IKO World Kyokushin Kaikan, founded KKFI in 2013. Starting his Kyokushin journey in 1987, he has built KKFI into a network of 100+ dojos across India.\n\nWhat Happens Next:\n1. Your Dojo instructor will review your application\n2. The KKFI admin will grant final approval\n3. You'll receive your membership ID and full portal access\n\nPlease be patient — you'll be notified by email once approved.\n\nTrain hard, stay humble.\nOsu!`;
    await send(email, subject, html, text);
};

export const sendNewApplicantEmail = async (instructorEmail: string, studentName: string) => {
    const SITE_URL = getSiteUrl();
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
    const SITE_URL = getSiteUrl();
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
    const SITE_URL = getSiteUrl();
    const subject = '🎉 Your KKFI Membership Has Been Approved – Welcome Aboard!';
    const html = wrapHtml(subject, `
<div style="text-align:center;margin-bottom:24px;">
  <div style="display:inline-block;background:#14532d;border:2px solid #22c55e;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;margin-bottom:8px;">✅</div>
  <h2 style="color:#fff;margin:8px 0 4px;font-size:24px;font-weight:800;">Congratulations, ${name}!</h2>
  <p style="color:#22c55e;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0;">Membership Approved</p>
</div>

<p>We are delighted to inform you that your membership with the <strong style="color:#fff;">Kyokushin Karate Foundation of India</strong> has been <span style="display:inline-block;background:#14532d;color:#22c55e;font-weight:700;padding:2px 10px;border-radius:6px;font-size:13px;">APPROVED</span> by our team.</p>

<p>You are now an official member of the KKFI family — welcome to a community dedicated to the strongest karate on Earth.</p>

<!-- Membership Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:linear-gradient(135deg,#1a0a0a,#2a1515);border-radius:16px;border:1px solid #dc2626;overflow:hidden;">
<tr><td style="padding:4px 0 0;background:linear-gradient(90deg,#dc2626,#991b1b);height:4px;"></td></tr>
<tr>
<td style="padding:24px 28px;">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
  <td>
    <p style="margin:0 0 2px;color:#888;font-size:10px;text-transform:uppercase;letter-spacing:3px;font-weight:600;">Kyokushin Karate Foundation of India</p>
    <p style="margin:0 0 16px;color:#666;font-size:10px;letter-spacing:1px;">Official Membership Certificate</p>
  </td>
  </tr>
  <tr>
  <td>
    <p style="margin:0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Member Name</p>
    <p style="margin:4px 0 16px;color:#fff;font-size:18px;font-weight:800;">${name}</p>
  </td>
  </tr>
  <tr>
  <td>
    <p style="margin:0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Membership ID</p>
    <p style="margin:4px 0 0;color:#dc2626;font-size:28px;font-weight:900;letter-spacing:3px;font-family:monospace;">${membershipNumber}</p>
  </td>
  </tr>
  </table>
</td>
</tr>
</table>

<!-- What You Can Do Now -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#1f1f1f;border-radius:12px;border:1px solid #333;">
<tr><td style="padding:20px 24px;">
  <h3 style="margin:0 0 16px;color:#fff;font-size:16px;font-weight:700;">🎯 What You Can Do Now</h3>
  <table cellpadding="0" cellspacing="0" style="width:100%;">

  <tr>
  <td style="vertical-align:top;padding:0 10px 10px 0;width:24px;color:#dc2626;font-size:16px;">▸</td>
  <td style="padding-bottom:10px;color:#ccc;font-size:14px;">Access your <strong style="color:#fff;">personal dashboard</strong> with training logs and progress</td>
  </tr>
  <tr>
  <td style="vertical-align:top;padding:0 10px 10px 0;width:24px;color:#dc2626;font-size:16px;">▸</td>
  <td style="padding-bottom:10px;color:#ccc;font-size:14px;">Register for <strong style="color:#fff;">upcoming events</strong>, seminars, and tournaments</td>
  </tr>
  <tr>
  <td style="vertical-align:top;padding:0 10px 10px 0;width:24px;color:#dc2626;font-size:16px;">▸</td>
  <td style="padding-bottom:10px;color:#ccc;font-size:14px;">View and download your <strong style="color:#fff;">digital membership card</strong></td>
  </tr>
  <tr>
  <td style="vertical-align:top;padding:0 10px 0 0;width:24px;color:#dc2626;font-size:16px;">▸</td>
  <td style="color:#ccc;font-size:14px;">Connect with your <strong style="color:#fff;">Dojo community</strong> and fellow karateka</td>
  </tr>

  </table>
</td></tr>
</table>

${btn('Login to Your Account →', SITE_URL + '/login')}

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-top:1px solid #333;padding-top:20px;">
<tr><td>
  <p style="margin:0;color:#888;font-size:13px;font-style:italic;">"One becomes a beginner after one thousand days of training and an expert after ten thousand days of practice."</p>
  <p style="margin:6px 0 0;color:#dc2626;font-size:12px;font-weight:700;">— Sosai Mas Oyama</p>
</td></tr>
</table>

<p style="color:#888;font-size:13px;">We look forward to seeing you grow on this journey.<br/><strong style="color:#ccc;">Osu! 🥋</strong></p>
`);
    const text = `Osu ${name},\n\nCongratulations! Your membership with the Kyokushin Karate Foundation of India has been APPROVED.\n\nYour Membership ID: ${membershipNumber}\n\nYou can now:\n- Access your personal dashboard\n- Register for events, seminars, and tournaments\n- Download your digital membership card\n- Connect with your Dojo community\n\nLogin here: ${SITE_URL}/login\n\nTrain hard, stay humble.\nOsu!`;
    await send(email, subject, html, text);
};

export const sendRejectionEmail = async (email: string, name: string) => {
    const SITE_URL = getSiteUrl();
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
    const SITE_URL = getSiteUrl();
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
    const SITE_URL = getSiteUrl();
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
    const SITE_URL = getSiteUrl();
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

// ── Bulk Announcement ───────────────────────────────────────
export const sendBulkAnnouncementEmail = async (
    recipients: { email: string; name: string }[],
    announcementSubject: string,
    announcementBody: string,
) => {
    const SITE_URL = getSiteUrl();
    const results = { sent: 0, failed: 0 };

    for (const r of recipients) {
        const subject = announcementSubject;
        const html = wrapHtml(subject, `
<h2 style="color:#fff;margin:0 0 16px;font-size:20px;">Osu, ${r.name}!</h2>
<div style="white-space:pre-line;">${announcementBody}</div>
${btn('Visit KKFI', SITE_URL)}
<p style="color:#888;font-size:13px;">Osu!</p>
`);
        const text = `Osu ${r.name},\n\n${announcementBody}\n\nOsu!`;
        try {
            await getTransporter().sendMail({ from: getFrom(), to: r.email, subject, html, text });
            results.sent++;
        } catch (err) {
            console.error(`[BULK EMAIL] Failed for ${r.email}:`, err);
            results.failed++;
        }
    }
    return results;
};

// ── Password Reset ──────────────────────────────────────────

// ── Admin-Created User Welcome Email ────────────────────────
export const sendAdminCreatedUserEmail = async (
    email: string,
    name: string,
    password: string,
    role: string,
    membershipNumber: string
) => {
    const SITE_URL = getSiteUrl();
    const roleLabel = role === 'INSTRUCTOR' ? 'Instructor' : 'Student';
    const subject = `Welcome to KKFI – Your ${roleLabel} Account Has Been Created! 🥋`;
    const html = wrapHtml(subject, `
<div style="text-align:center;margin-bottom:24px;">
  <div style="display:inline-block;background:#14532d;border:2px solid #22c55e;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;margin-bottom:8px;">✅</div>
  <h2 style="color:#fff;margin:8px 0 4px;font-size:22px;font-weight:800;">Welcome, ${name}!</h2>
  <p style="color:#22c55e;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0;">Account Created Successfully</p>
</div>

<p>An admin has created your <strong style="color:#dc2626;">${roleLabel}</strong> account with the <strong style="color:#fff;">Kyokushin Karate Foundation of India (KKFI)</strong>.</p>

<!-- Login Credentials Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:linear-gradient(135deg,#1a0a0a,#2a1515);border-radius:16px;border:1px solid #dc2626;overflow:hidden;">
<tr><td style="padding:4px 0 0;background:linear-gradient(90deg,#dc2626,#991b1b);height:4px;"></td></tr>
<tr>
<td style="padding:24px 28px;">
  <p style="margin:0 0 16px;color:#dc2626;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;">🔐 Your Login Credentials</p>
  <table cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="padding:8px 0;">
        <p style="margin:0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Email</p>
        <p style="margin:4px 0 0;color:#fff;font-size:16px;font-weight:700;font-family:monospace;">${email}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 0;">
        <p style="margin:0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Password</p>
        <p style="margin:4px 0 0;color:#fbbf24;font-size:16px;font-weight:700;font-family:monospace;">${password}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 0;">
        <p style="margin:0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Membership ID</p>
        <p style="margin:4px 0 0;color:#22c55e;font-size:16px;font-weight:700;font-family:monospace;">${membershipNumber}</p>
      </td>
    </tr>
  </table>
</td>
</tr>
</table>

<p style="color:#ef4444;font-size:13px;font-weight:600;">⚠️ Please change your password after your first login for security.</p>

${btn('Login to Your Account →', SITE_URL + '/login')}

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-top:1px solid #333;padding-top:20px;">
<tr><td>
  <p style="margin:0;color:#888;font-size:13px;font-style:italic;">"A person who has not trained for a long time must not lose heart, but must make effort to set goals for themselves."</p>
  <p style="margin:6px 0 0;color:#dc2626;font-size:12px;font-weight:700;">— Sosai Mas Oyama</p>
</td></tr>
</table>

<p style="color:#888;font-size:13px;">Train hard, stay humble.<br/><strong style="color:#ccc;">Osu! 🥋</strong></p>
`);
    const text = `Osu ${name},\n\nWelcome to KKFI! An admin has created your ${roleLabel} account.\n\nYour Login Credentials:\nEmail: ${email}\nPassword: ${password}\nMembership ID: ${membershipNumber}\n\n⚠️ Please change your password after first login.\n\nLogin here: ${SITE_URL}/login\n\nOsu!`;
    await send(email, subject, html, text);
};

export const sendPasswordResetEmail = async (email: string, name: string, resetToken: string) => {
    const SITE_URL = getSiteUrl();
    const resetUrl = `${SITE_URL}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset – KKFI';
    const html = wrapHtml(subject, `
<h2 style="color:#fff;margin:0 0 16px;font-size:20px;">Password Reset</h2>
<p>Osu ${name},</p>
<p>You requested a password reset for your KKFI account. Click below to set a new password:</p>
${btn('Reset Password', resetUrl)}
<p style="color:#888;font-size:13px;">This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
<p style="color:#666;font-size:11px;margin-top:16px;word-break:break-all;">Or copy this link: ${resetUrl}</p>
`);
    const text = `Osu ${name},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nOsu!`;
    await send(email, subject, html, text);
};

// ── Membership Renewal Reminder ─────────────────────────────
export const sendMembershipRenewalEmail = async (
    email: string,
    name: string,
    daysLeft: number,
    expiryDate: string
) => {
    const SITE_URL = getSiteUrl();
    const urgency = daysLeft <= 7 ? '🚨 URGENT' : daysLeft <= 15 ? '⚠️ Important' : '📬 Reminder';
    const urgencyColor = daysLeft <= 7 ? '#dc2626' : daysLeft <= 15 ? '#f59e0b' : '#3b82f6';

    const subject = `${urgency}: Your KKFI Membership expires ${daysLeft === 0 ? 'today' : `in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}!`;
    const html = wrapHtml(subject, `
<h2 style="color:#fff;margin:0 0 16px;font-size:20px;">Membership Renewal</h2>
<p>Osu ${name},</p>
<p>Your KKFI membership is ${daysLeft === 0 ? '<strong style="color:#dc2626;">expiring today</strong>' : `expiring in <strong style="color:${urgencyColor};">${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>`}.</p>

<table style="margin:20px 0;background:#222;border-radius:12px;padding:20px;width:100%;text-align:center;">
<tr><td>
  <p style="margin:0;color:#888;font-size:12px;">EXPIRY DATE</p>
  <p style="margin:8px 0 0;color:${urgencyColor};font-size:24px;font-weight:800;">${expiryDate}</p>
</td></tr>
</table>

<p>To continue enjoying all KKFI benefits — event access, belt promotions, and training records — please renew your membership before it expires.</p>
<p style="margin:16px 0;"><strong style="color:#fff;">Renewal Fee:</strong> ₹250 + 18% GST = <strong style="color:#22c55e;">₹295</strong></p>

${btn('Renew Now – ₹295', SITE_URL + '/renew-membership')}

<p style="color:#888;font-size:13px;">If your membership expires, your account will be temporarily blocked until renewal is completed.</p>
`);
    const text = `Osu ${name},\n\nYour KKFI membership expires ${daysLeft === 0 ? 'today' : `in ${daysLeft} days`} (${expiryDate}).\n\nRenew at: ${SITE_URL}/renew-membership\n\nFee: ₹295 (₹250 + GST)\n\nOsu!`;
    await send(email, subject, html, text);
};

// ── Order Confirmation Email ─────────────────────────────────────────
export const sendOrderConfirmationEmail = async (
    email: string,
    name: string,
    orderId: string,
    items: { name: string; size: string; quantity: number; price: number }[],
    totalAmount: number,
    paymentId: string
) => {
    const SITE_URL = getSiteUrl();
    const orderRef = `KKFI-ORD-${orderId.slice(0, 8).toUpperCase()}`;

    const itemRows = items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #333;color:#ccc;font-size:13px;">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;color:#888;font-size:13px;text-align:center;">${i.size}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;color:#888;font-size:13px;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;color:#fff;font-size:13px;text-align:right;font-weight:600;">₹${(i.price * i.quantity).toLocaleString()}</td>
    </tr>
    `).join('');

    const subject = `Order Confirmed – ${orderRef} 🛍️`;
    const html = wrapHtml(subject, `
<div style="text-align:center;margin-bottom:24px;">
  <div style="display:inline-block;background:#14532d;border:2px solid #22c55e;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;margin-bottom:8px;">✅</div>
  <h2 style="color:#fff;margin:8px 0 4px;font-size:22px;font-weight:800;">Order Confirmed!</h2>
  <p style="color:#22c55e;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0;">Payment Successful</p>
</div>

<p>Hi <strong style="color:#fff;">${name}</strong>, your KKFI Store order has been confirmed and is being processed.</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#1f1f1f;border-radius:12px;border:1px solid #333;overflow:hidden;">
<tr><td style="padding:16px 20px;border-bottom:1px solid #333;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td><p style="margin:0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Order ID</p><p style="margin:4px 0 0;color:#fff;font-weight:700;">${orderRef}</p></td>
      <td style="text-align:right;"><p style="margin:0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Payment ID</p><p style="margin:4px 0 0;color:#22c55e;font-weight:700;font-size:12px;">${paymentId}</p></td>
    </tr>
  </table>
</td></tr>
<tr><td style="padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr style="background:#171717;">
      <td style="padding:10px 12px;color:#666;font-size:11px;font-weight:700;text-transform:uppercase;">Item</td>
      <td style="padding:10px 12px;color:#666;font-size:11px;font-weight:700;text-transform:uppercase;text-align:center;">Size</td>
      <td style="padding:10px 12px;color:#666;font-size:11px;font-weight:700;text-transform:uppercase;text-align:center;">Qty</td>
      <td style="padding:10px 12px;color:#666;font-size:11px;font-weight:700;text-transform:uppercase;text-align:right;">Amount</td>
    </tr>
    ${itemRows}
    <tr>
      <td colspan="3" style="padding:12px;color:#fff;font-weight:700;text-align:right;border-top:2px solid #333;">Total</td>
      <td style="padding:12px;color:#dc2626;font-weight:800;font-size:18px;text-align:right;border-top:2px solid #333;">₹${totalAmount.toLocaleString()}</td>
    </tr>
  </table>
</td></tr>
</table>

<p style="color:#ccc;font-size:13px;">We'll notify you when your order is ready for pickup or shipped.</p>

${btn('View My Orders', SITE_URL + '/dashboard')}

<p style="color:#888;font-size:13px;">Osu! 🥋</p>
`);
    const text = `Order Confirmed!\n\nOrder: ${orderRef}\nPayment: ${paymentId}\nTotal: ₹${totalAmount}\n\nItems:\n${items.map(i => `- ${i.name} (${i.size}) x${i.quantity} = ₹${i.price * i.quantity}`).join('\n')}\n\nOsu!`;
    await send(email, subject, html, text);
};
