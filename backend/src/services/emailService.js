const nodemailer = require('nodemailer');
const knex = require('../config/db');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Replace placeholders in template body
 */
const compileTemplate = (html, data) => {
  let compiled = html;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    compiled = compiled.replace(regex, data[key]);
  });
  return compiled;
};

const sendEmail = async ({ templateName, recipient, data, attachments = [] }) => {
  try {
    // 1. Fetch Template
    const template = await knex('email_templates').where('name', templateName).first();
    if (!template) throw new Error(`Template [${templateName}] not found`);

    const compiledBody = compileTemplate(template.body, data);
    const compiledSubject = compileTemplate(template.subject, data);

    // 2. Create Log Entry
    const [logId] = await knex('email_logs').insert({
      recipient,
      subject: compiledSubject,
      body: compiledBody,
      status: 'pending',
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : null
    }).returning('id');

    try {
      // 3. Send Email
      const info = await transporter.sendMail({
        from: `"${process.env.APP_NAME || 'NKB Petty Cash'}" <${process.env.SMTP_USER}>`,
        to: recipient,
        subject: compiledSubject,
        html: compiledBody,
        attachments: attachments.map(att => ({
          filename: att.filename,
          path: att.path, // or content: att.content
          contentType: att.contentType
        }))
      });

      // 4. Update Log on Success
      await knex('email_logs').where('id', logId).update({
        status: 'sent',
        sent_at: new Date()
      });

      console.log(`Email sent to ${recipient}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };

    } catch (sendErr) {
      // 5. Update Log on Failure
      await knex('email_logs').where('id', logId).update({
        status: 'failed',
        error_message: sendErr.message
      });
      throw sendErr;
    }

  } catch (err) {
    console.error('Email Service Error:', err.message);
    throw err;
  }
};

const verifyConnection = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (err) {
    console.error('SMTP Connection Failed:', err.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  verifyConnection
};
