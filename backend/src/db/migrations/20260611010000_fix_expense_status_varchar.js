const { ensureApprovalSchema } = require('../../utils/approvalSchemaRepair');

exports.up = async function (knex) {
  await ensureApprovalSchema(knex);
};

exports.down = async function () {
  // Non-destructive repair migration — no down action
};
