import nodemailer from 'nodemailer';

// Mock transporter for development (logs to console)
// In production, replace with real SMTP credentials
const transporter = {
    sendMail: async (mailOptions: any) => {
        console.log('---------------------------------------------------');
        console.log('📧 EMAIL SIMULATION');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Body: ${mailOptions.text}`);
        console.log('---------------------------------------------------');
        return { messageId: 'mock-id' };
    }
};

// Types of notifications
export const sendRegistrationEmail = async (email: string, name: string) => {
    await transporter.sendMail({
        to: email,
        subject: 'Welcome to Kyokushin Karate India',
        text: `Osu ${name},\n\nThank you for registering. Your application is currently PENDING approval from your Dojo Instructor.\n\nWe will notify you once your status changes.\n\nOsu!`
    });
};

export const sendNewApplicantEmail = async (instructorEmail: string, studentName: string) => {
    await transporter.sendMail({
        to: instructorEmail,
        subject: 'New Student Application',
        text: `Osu,\n\nA new student, ${studentName}, has registered under your Dojo. Please log in to the dashboard to review and approve their application.\n\nOsu!`
    });
};

export const sendInstructorApprovalEmail = async (adminEmail: string, studentName: string, instructorName: string) => {
    await transporter.sendMail({
        to: adminEmail,
        subject: 'Student Approved by Instructor',
        text: `Osu,\n\nStudent ${studentName} has been approved by Instructor ${instructorName}. They are now waiting for your final Admin approval to become ACTIVE.\n\nOsu!`
    });
};

export const sendMembershipActiveEmail = async (email: string, name: string, membershipNumber: string) => {
    await transporter.sendMail({
        to: email,
        subject: 'Membership Activated - Kyokushin Karate India',
        text: `Osu ${name},\n\nCongratulations! Your membership has been fully approved. You are now an ACTIVE member.\n\nYour Membership Number is: ${membershipNumber}\n\nOsu!`
    });
};

export const sendRejectionEmail = async (email: string, name: string) => {
    await transporter.sendMail({
        to: email,
        subject: 'Registration Update',
        text: `Osu ${name},\n\nWe regret to inform you that your registration application has been rejected at this time. Please contact your Dojo instructor for more details.\n\nOsu.`
    });
};

export const sendBeltPromotionEmail = async (email: string, name: string, newBelt: string, promoterName: string) => {
    await transporter.sendMail({
        to: email,
        subject: 'Congratulations on your Belt Promotion!',
        text: `Osu ${name},\n\nCongratulations on being promoted to ${newBelt} Belt!\n\nPromoted by: ${promoterName}\n\nKeep training hard!\n\nOsu!`
    });
};

export const sendEventRegistrationEmail = async (email: string, name: string, eventName: string) => {
    await transporter.sendMail({
        to: email,
        subject: 'Event Registration Confirmed',
        text: `Osu ${name},\n\nYou have successfully registered for the event: ${eventName}.\n\nGood luck!\n\nOsu!`
    });
};

export const sendEventReminderEmail = async (email: string, name: string, eventName: string, date: string) => {
    await transporter.sendMail({
        to: email,
        subject: 'Upcoming Event Reminder',
        text: `Osu ${name},\n\nThis is a reminder that the event ${eventName} is coming up on ${date}.\n\nPrepare well!\n\nOsu!`
    });
};
