const knex = require('../config/db');

// Templates
const getTemplates = async (req, res) => {
  try {
    const templates = await knex('email_templates').orderBy('name', 'asc');
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createTemplate = async (req, res) => {
  try {
    const { name, subject, body, type } = req.body;
    const [id] = await knex('email_templates').insert({
      name,
      subject,
      body,
      type,
      updated_at: new Date()
    }).returning('id');
    res.json({ id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body, type } = req.body;
    await knex('email_templates').where('id', id).update({
      name,
      subject,
      body,
      type,
      updated_at: new Date()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Logs
const getEmailLogs = async (req, res) => {
  try {
    const logs = await knex('email_logs')
      .orderBy('created_at', 'desc')
      .limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Scheduled Emails
const getScheduledEmails = async (req, res) => {
  try {
    const scheduled = await knex('scheduled_emails')
      .select('scheduled_emails.*', 'email_templates.name as template_name')
      .leftJoin('email_templates', 'scheduled_emails.template_id', 'email_templates.id')
      .orderBy('schedule_time', 'asc');
    res.json(scheduled);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  getEmailLogs,
  getScheduledEmails
};
