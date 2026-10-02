const jwt = require('jsonwebtoken');
const db = require('../config/db');

// In-memory cache for dynamic DB keys
let cachedDbKeys = [];
let lastDbKeyFetch = 0;

const getValidApiKeys = async () => {
  const envKeys = [
    process.env.PAYABLE_API_KEY,
    process.env.PAYABLES_API_KEY,
    process.env.SYSTEM_API_KEY,
    process.env.CANTEEN_API_KEY,
    'NkbPayablesApiKey2026',
    'NkbManufacturingSecretApiKey2026'
  ].filter(Boolean);

  const now = Date.now();
  if (now - lastDbKeyFetch > 10000) { // refresh cache every 10s
    try {
      const rows = await db('settings').whereIn('key', ['payables_api_key', 'api_key', 'system_api_key', 'canteen_api_key']);
      cachedDbKeys = rows.map(r => r.value).filter(Boolean);
      lastDbKeyFetch = now;
    } catch (e) {
      // ignore DB read error fallback to env
    }
  }

  return Array.from(new Set([...envKeys, ...cachedDbKeys]));
};

const protect = async (req, res, next) => {
  // 1. Check for x-api-key or x-api-token header (case-insensitive in Express) or query parameter
  const apiKey = req.headers['x-api-key'] || 
                 req.headers['x-api-token'] || 
                 req.query.api_key || 
                 req.query.apiKey;

  if (apiKey) {
    const validKeys = await getValidApiKeys();
    if (validKeys.includes(apiKey.trim())) {
      // Attach system API client identity with full Super Admin / COO privileges
      req.user = {
        id: 1,
        username: 'api_service',
        full_name: 'External API Service',
        role: 'Super Admin',
        is_api_client: true
      };
      return next();
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid x-api-key provided' 
      });
    }
  }

  // 2. Check for standard JWT Bearer Authorization header
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route. Provide valid Bearer token or x-api-key header.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user?.role || 'Unknown'} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };

