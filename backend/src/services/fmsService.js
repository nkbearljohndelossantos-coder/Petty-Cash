const https = require('https');
const http = require('http');
const db = require('../config/db');

const DEFAULT_FMS_URL = 'https://fms.nkbmanufacturing.com/api/payables';
const DEFAULT_FMS_API_KEY = 'nkb_inv_live_6ae6965c1ca61aef54939d6b1ecfac1b';

/**
 * Get FMS configuration from database settings or environment variables
 */
async function getFmsConfig() {
  try {
    const urlSetting = await db('settings').where({ key: 'fms_api_url' }).first();
    const keySetting = await db('settings').where({ key: 'fms_api_key' }).first();
    const enabledSetting = await db('settings').where({ key: 'fms_auto_sync' }).first();

    const fmsUrl = (urlSetting?.value || process.env.FMS_API_URL || DEFAULT_FMS_URL).trim();
    const fmsApiKey = (keySetting?.value || process.env.FMS_API_KEY || DEFAULT_FMS_API_KEY).trim();
    const isAutoSync = enabledSetting ? (enabledSetting.value === 'true' || enabledSetting.value === '1') : true;

    return { fmsUrl, fmsApiKey, isAutoSync };
  } catch (err) {
    return {
      fmsUrl: DEFAULT_FMS_URL,
      fmsApiKey: DEFAULT_FMS_API_KEY,
      isAutoSync: true
    };
  }
}

/**
 * Send HTTP request to FMS with IPv4 resolution and timeout
 */
function sendHttpRequest(targetUrl, method, headers, payload = null) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(targetUrl);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const bodyString = payload ? JSON.stringify(payload) : null;
      const requestHeaders = {
        'Accept': 'application/json',
        'User-Agent': 'PettyCash-System/1.0.0 (Node.js)',
        ...headers
      };

      if (bodyString) {
        requestHeaders['Content-Type'] = 'application/json';
        requestHeaders['Content-Length'] = Buffer.byteLength(bodyString);
      }

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + (urlObj.search || ''),
        method: method,
        headers: requestHeaders,
        family: 4,
        timeout: 12000
      };

      const req = client.request(options, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            resolve({
              statusCode: res.statusCode,
              ok: res.statusCode >= 200 && res.statusCode < 300,
              data: parsed
            });
          } catch (_) {
            resolve({
              statusCode: res.statusCode,
              ok: res.statusCode >= 200 && res.statusCode < 300,
              data: { message: raw || 'Non-JSON response received', raw }
            });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Timeout connecting to ${urlObj.hostname}`));
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (bodyString) {
        req.write(bodyString);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Send / synchronize a payable approval request to FMS (fms.nkbmanufacturing.com)
 */
async function sendPayableToFms(payable, customConfig = null) {
  try {
    const config = customConfig || await getFmsConfig();
    const { fmsUrl, fmsApiKey } = config;

    if (!fmsUrl || !fmsApiKey) {
      return { success: false, message: 'FMS URL or API Key is missing in settings' };
    }

    // Prepare line items
    let lineItems = [];
    if (payable.items && Array.isArray(payable.items) && payable.items.length > 0) {
      lineItems = payable.items.map(item => ({
        description: item.description || 'Item',
        category: item.expense_category || 'Raw Materials',
        quantity: parseFloat(item.quantity) || 1,
        cost: parseFloat(item.cost) || 0,
        subtotal: parseFloat(item.subtotal) || 0
      }));
    } else {
      lineItems = [{
        description: payable.description || payable.remarks || 'Payable Disbursement Request',
        category: payable.payable_category || 'Raw Materials',
        quantity: 1,
        cost: parseFloat(payable.gross_amount || payable.net_amount || 0),
        subtotal: parseFloat(payable.gross_amount || payable.net_amount || 0)
      }];
    }

    const payload = {
      id: payable.id ? `PB-${payable.id}` : undefined,
      request_number: payable.requisition_no || `PB-${Date.now()}`,
      req_cheque_no: payable.requisition_no || `PB-${Date.now()}`,
      company_name: payable.company || 'NKB Manufacturing Corporation',
      company_code: 'NKB',
      payee_name: payable.supplier_name || payable.vendor || 'Supplier',
      category: payable.payable_category || 'Trade payable',
      amount: parseFloat(payable.gross_amount || payable.net_amount || 0),
      total: parseFloat(payable.gross_amount || payable.net_amount || 0),
      bank_name: payable.bank_account || 'BDO - 0080-5801-0547',
      purpose: payable.description || payable.remarks || 'Payable Requisition',
      invoice_number: payable.invoice_no || '',
      control_number: payable.control_number || '',
      due_date: payable.due_date ? String(payable.due_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      terms: payable.term || 'Net 30',
      status: 'PENDING_COO_APPROVAL',
      coo_approval: 'PENDING_COO_APPROVAL',
      requested_by_name: payable.requestor_name || payable.requestor_username || 'Petty Cash System',
      items: lineItems,
      comments: payable.remarks || payable.comments || 'Submitted from Petty Cash System'
    };

    const headers = {
      'x-api-key': fmsApiKey,
      'x-nkb-api-key': fmsApiKey
    };

    const result = await sendHttpRequest(fmsUrl, 'POST', headers, payload);
    return {
      success: result.ok,
      statusCode: result.statusCode,
      data: result.data,
      message: result.data?.message || (result.ok ? 'Successfully synced with FMS' : 'FMS returned an error')
    };
  } catch (err) {
    console.error('sendPayableToFms error:', err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Test connectivity with FMS
 */
async function testFmsConnection(customUrl = null, customKey = null) {
  try {
    const config = await getFmsConfig();
    const targetUrl = (customUrl || config.fmsUrl).trim();
    const apiKey = (customKey || config.fmsApiKey).trim();

    const testPayload = {
      request_number: `PING-TEST-${Date.now().toString().slice(-4)}`,
      payee_name: 'System Connection Diagnostic Test',
      amount: 1.00,
      purpose: 'API Key and Webhook Connectivity Verification',
      category: 'Diagnostic',
      company_name: 'NKB Manufacturing Corporation',
      due_date: new Date().toISOString().slice(0, 10)
    };

    const headers = {
      'x-api-key': apiKey,
      'x-nkb-api-key': apiKey
    };

    const result = await sendHttpRequest(targetUrl, 'POST', headers, testPayload);
    return {
      success: result.ok,
      statusCode: result.statusCode,
      data: result.data,
      message: result.ok ? 'Connection to FMS successful! API Key is active.' : (result.data?.message || 'Connection failed')
    };
  } catch (err) {
    return { success: false, message: `Could not connect to FMS: ${err.message}` };
  }
}

module.exports = {
  getFmsConfig,
  sendPayableToFms,
  testFmsConnection,
  DEFAULT_FMS_URL,
  DEFAULT_FMS_API_KEY
};
