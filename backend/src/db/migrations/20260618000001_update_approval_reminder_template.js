const { APPROVAL_REMINDER_TEMPLATE } = require('../../utils/emailTemplates/approvalReminder');

exports.up = async function (knex) {
  if (!(await knex.schema.hasTable('email_templates'))) return;

  const existing = await knex('email_templates').where({ name: 'approval_reminder' }).first();

  if (existing) {
    await knex('email_templates').where({ name: 'approval_reminder' }).update({
      subject: APPROVAL_REMINDER_TEMPLATE.subject,
      body: APPROVAL_REMINDER_TEMPLATE.body,
      type: APPROVAL_REMINDER_TEMPLATE.type
    });
  } else {
    await knex('email_templates').insert(APPROVAL_REMINDER_TEMPLATE);
  }
};

exports.down = async function () {
  // Non-destructive — keep template on rollback
};
