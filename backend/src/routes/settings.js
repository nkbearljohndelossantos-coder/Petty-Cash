const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const settings = await db('settings').select('*');
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json({ success: true, data: settingsObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      const existing = await db('settings').where({ key }).first();
      const stored = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (existing) {
        await db('settings').where({ key }).update({ value: stored, updated_at: db.fn.now() });
      } else {
        await db('settings').insert({ key, value: stored });
      }
    }
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get active API Key
router.get('/api-key', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const row = await db('settings').where({ key: 'payables_api_key' }).first();
    const apiKey = row?.value || process.env.PAYABLES_API_KEY || 'NkbPayablesApiKey2026';
    res.json({ success: true, data: { api_key: apiKey } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate / Regenerate New API Key
router.post('/generate-api-key', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const crypto = require('crypto');
    const randomHex = crypto.randomBytes(24).toString('hex');
    const newApiKey = `nkb_live_${randomHex}`;
    
    const existing = await db('settings').where({ key: 'payables_api_key' }).first();
    if (existing) {
      await db('settings').where({ key: 'payables_api_key' }).update({ value: newApiKey, updated_at: db.fn.now() });
    } else {
      await db('settings').insert({ key: 'payables_api_key', value: newApiKey });
    }

    res.json({ 
      success: true, 
      data: { api_key: newApiKey }, 
      message: 'New API Key generated and activated successfully!' 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update / Set Custom API Key
router.put('/api-key', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const { api_key } = req.body;
    const trimmed = (api_key || '').trim();
    if (!trimmed || trimmed.length < 8) {
      return res.status(400).json({ success: false, message: 'API key must be at least 8 characters' });
    }

    const existing = await db('settings').where({ key: 'payables_api_key' }).first();
    if (existing) {
      await db('settings').where({ key: 'payables_api_key' }).update({ value: trimmed, updated_at: db.fn.now() });
    } else {
      await db('settings').insert({ key: 'payables_api_key', value: trimmed });
    }

    res.json({ success: true, data: { api_key: trimmed }, message: 'API key updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get FMS Integration Configuration
router.get('/fms-config', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const { getFmsConfig, DEFAULT_FMS_URL, DEFAULT_FMS_API_KEY } = require('../services/fmsService');
    const config = await getFmsConfig();
    res.json({
      success: true,
      data: {
        fms_api_url: config.fmsUrl,
        fms_api_key: config.fmsApiKey,
        fms_auto_sync: config.isAutoSync,
        default_url: DEFAULT_FMS_URL,
        default_key: DEFAULT_FMS_API_KEY
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update FMS Integration Configuration
router.put('/fms-config', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const { fms_api_url, fms_api_key, fms_auto_sync } = req.body;

    const settingsToUpdate = [
      { key: 'fms_api_url', value: (fms_api_url || '').trim() },
      { key: 'fms_api_key', value: (fms_api_key || '').trim() },
      { key: 'fms_auto_sync', value: fms_auto_sync === true || fms_auto_sync === 'true' || fms_auto_sync === '1' ? 'true' : 'false' }
    ];

    for (const item of settingsToUpdate) {
      const existing = await db('settings').where({ key: item.key }).first();
      if (existing) {
        await db('settings').where({ key: item.key }).update({ value: item.value, updated_at: db.fn.now() });
      } else {
        await db('settings').insert({ key: item.key, value: item.value });
      }
    }

    res.json({ success: true, message: 'FMS Integration settings saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Test Connection to FMS
router.post('/test-fms-sync', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const { testFmsConnection } = require('../services/fmsService');
    const { fms_api_url, fms_api_key } = req.body;
    const result = await testFmsConnection(fms_api_url, fms_api_key);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/expense-units', protect, async (req, res) => {
  try {
    const { unit } = req.body;
    const trimmed = (unit || '').trim();
    if (!trimmed) {
      return res.status(400).json({ success: false, message: 'Unit name is required' });
    }

    const row = await db('settings').where({ key: 'expense_units' }).first();
    let units = [];
    if (row?.value) {
      try {
        const parsed = JSON.parse(row.value);
        units = Array.isArray(parsed) ? parsed : [];
      } catch {
        units = [];
      }
    }

    if (!units.includes(trimmed)) {
      units.push(trimmed);
      const stored = JSON.stringify(units);
      if (row) {
        await db('settings').where({ key: 'expense_units' }).update({ value: stored, updated_at: db.fn.now() });
      } else {
        await db('settings').insert({ key: 'expense_units', value: stored });
      }
    }

    res.json({ success: true, data: units, message: 'Unit added' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/clear-transactions', protect, authorize('Super Admin'), async (req, res) => {
  try {
    // Disable foreign key checks to allow truncation
    await db.raw('SET FOREIGN_KEY_CHECKS = 0');

    // Clear transaction and log tables
    await db('notifications').truncate();
    await db('activity_logs').truncate();
    await db('expense_attachments').truncate();
    await db('expenses').truncate();
    await db('funds').truncate();
    
    // Optional: Also clear categories and departments if you want a TRULY fresh start
    // But keeping them for now as per "Data lang" usually meaning transactions
    // await db('categories').truncate();
    // await db('departments').truncate();

    // Re-enable foreign key checks
    await db.raw('SET FOREIGN_KEY_CHECKS = 1');

    res.json({ success: true, message: 'Transaction data has been cleared successfully. User accounts and system settings were preserved.' });
  } catch (err) {
    // Ensure foreign key checks are re-enabled even on error
    await db.raw('SET FOREIGN_KEY_CHECKS = 1');
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
