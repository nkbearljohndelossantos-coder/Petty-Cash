const nodemailer = require('nodemailer');
const knex = require('../config/db');

const getSmtpConfig = () => ({
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
  port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10),
  user: process.env.SMTP_USER || process.env.EMAIL_USER,
  pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
});

const isEmailConfigured = () => {
  const { host, user, pass } = getSmtpConfig();
  return Boolean(host && user && pass);
};

let transporter = null;

const getTransporter = () => {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    const { host, port, user, pass } = getSmtpConfig();
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }
  return transporter;
};

const compileTemplate = (html, data) => {
  let compiled = html;
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    compiled = compiled.replace(regex, data[key]);
  });
  return compiled;
};

const sendEmail = async ({ templateName, recipient, data, attachments = [] }) => {
  if (!isEmailConfigured()) {
    console.warn('Email skipped: SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env)');
    return { success: false, skipped: true, message: 'Email not configured' };
  }

  const mailer = getTransporter();
  if (!mailer) {
    return { success: false, skipped: true, message: 'Email not configured' };
  }

  try {
    const template = await knex('email_templates').where('name', templateName).first();
    if (!template) {
      console.error(`Email template [${templateName}] not found`);
      return { success: false, message: `Template [${templateName}] not found` };
    }

    const compiledBody = compileTemplate(template.body, data);
    const compiledSubject = compileTemplate(template.subject, data);
    const { user } = getSmtpConfig();

    const [logId] = await knex('email_logs').insert({
      recipient,
      subject: compiledSubject,
      body: compiledBody,
      status: 'pending',
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : null
    });

    try {
      const info = await mailer.sendMail({
        from: `"${process.env.APP_NAME || 'NKB Petty Cash'}" <${user}>`,
        to: recipient,
        subject: compiledSubject,
        html: compiledBody,
        attachments: attachments.map((att) => ({
          filename: att.filename,
          path: att.path,
          contentType: att.contentType
        }))
      });

      await knex('email_logs').where('id', logId).update({
        status: 'sent',
        sent_at: new Date()
      });

      console.log(`Email sent to ${recipient}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (sendErr) {
      await knex('email_logs').where('id', logId).update({
        status: 'failed',
        error_message: sendErr.message
      });
      console.error(`Email send failed to ${recipient}:`, sendErr.message);
      return { success: false, message: sendErr.message };
    }
  } catch (err) {
    console.error('Email Service Error:', err.message);
    return { success: false, message: err.message };
  }
};

const verifyConnection = async () => {
  try {
    const mailer = getTransporter();
    if (!mailer) return false;
    await mailer.verify();
    return true;
  } catch (err) {
    console.error('SMTP Connection Failed:', err.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  verifyConnection,
  isEmailConfigured
};
