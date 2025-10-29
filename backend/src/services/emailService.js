// src/services/emailService.js
const nodemailer = require('nodemailer');
const { AppError } = require('../middleware/errorHandler');

// --------------------------------------------------
// 🔹 Configure reusable email transporter
// --------------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

if (process.env.NODE_ENV !== 'test') {
  transporter.verify((error) => {
    if (error) console.error('❌ Email transporter error:', error);
    else console.log('✅ Email transporter ready');
  });
}

// --------------------------------------------------
// 🔹 Utility function to send an email
// --------------------------------------------------
async function sendEmail (to, subject, html) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '\'SkillWise\' <no-reply@skillwise.ai>',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId} → ${to}`);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new AppError('Failed to send email', 500, 'EMAIL_SEND_ERROR');
  }
}

// --------------------------------------------------
// 🔹 Email Templates
// --------------------------------------------------
const templates = {
  welcome: (name) => `
    <h2>Welcome to SkillWise, ${name}!</h2>
    <p>We’re excited to have you join our learning community 🚀</p>
    <p>Start exploring challenges, setting goals, and leveling up your skills today.</p>
    <a href="${process.env.APP_URL}/login" style="background:#007bff;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">Get Started</a>
  `,

  resetPassword: (token) => `
    <h2>Password Reset Request</h2>
    <p>We received a request to reset your password.</p>
    <p>Click below to choose a new password (valid for 1 hour):</p>
    <a href="${process.env.APP_URL}/reset-password?token=${token}" style="background:#dc3545;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">Reset Password</a>
    <p>If you didn’t request this, you can safely ignore this email.</p>
  `,

  progressUpdate: (data) => `
    <h2>Progress Update</h2>
    <p>You’ve made great progress, ${data.userName}!</p>
    <p><strong>Goals completed:</strong> ${data.completedGoals}</p>
    <p><strong>Total points earned:</strong> ${data.totalPoints}</p>
    <p>Keep it up 💪</p>
    <a href="${process.env.APP_URL}/dashboard" style="background:#28a745;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">View Dashboard</a>
  `,

  achievement: (achievement) => `
    <h2>🎉 Congratulations!</h2>
    <p>You’ve unlocked a new achievement:</p>
    <h3>${achievement.title}</h3>
    <p>${achievement.description}</p>
    <a href="${process.env.APP_URL}/achievements" style="background:#ffc107;color:#000;padding:10px 20px;border-radius:5px;text-decoration:none;">View Achievements</a>
  `,
};

// --------------------------------------------------
// 🔹 Email Service Methods
// --------------------------------------------------
const emailService = {
  /** 📨 Send welcome email */
  sendWelcomeEmail: async (userEmail, userName) => {
    const subject = 'Welcome to SkillWise 🚀';
    const html = templates.welcome(userName);
    return await sendEmail(userEmail, subject, html);
  },

  /** 🔐 Send password reset email */
  sendPasswordResetEmail: async (userEmail, resetToken) => {
    const subject = 'Reset Your Password 🔑';
    const html = templates.resetPassword(resetToken);
    return await sendEmail(userEmail, subject, html);
  },

  /** 📊 Send progress update email */
  sendProgressUpdate: async (userEmail, progressData) => {
    const subject = 'Your SkillWise Progress Update 📈';
    const html = templates.progressUpdate(progressData);
    return await sendEmail(userEmail, subject, html);
  },

  /** 🏆 Send achievement notification */
  sendAchievementNotification: async (userEmail, achievement) => {
    const subject = `Achievement Unlocked: ${achievement.title} 🏅`;
    const html = templates.achievement(achievement);
    return await sendEmail(userEmail, subject, html);
  },
};

module.exports = emailService;
