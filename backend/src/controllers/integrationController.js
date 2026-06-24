const CANTEEN_API_URL =
  process.env.CANTEEN_API_URL ||
  'https://canteen.nkbmanufacturing.com/api/integration/employees';
const CANTEEN_API_KEY =
  process.env.CANTEEN_API_KEY ||
  'NkbCanteenIntegrationSecretApiKey2026';

let employeeCache = { fetchedAt: 0, employees: [] };
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchEmployees() {
  if (!CANTEEN_API_KEY) {
    throw new Error('Canteen integration is not configured on the server');
  }

  const now = Date.now();
  if (employeeCache.employees.length && now - employeeCache.fetchedAt < CACHE_TTL_MS) {
    return employeeCache.employees;
  }

  const url = `${CANTEEN_API_URL}?api_key=${encodeURIComponent(CANTEEN_API_KEY)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Canteen API error (${res.status})`);
  }

  const data = await res.json();
  const employees = Array.isArray(data) ? data : (data.data || data.employees || []);
  employeeCache = { fetchedAt: now, employees };
  return employees;
}

function matchEmployee(employees, idOrBarcode) {
  const query = String(idOrBarcode).trim().toLowerCase();
  if (!query) return null;

  return employees.find((emp) =>
    String(emp.employee_id || emp.id || '').toLowerCase() === query ||
    String(emp.barcode || emp.barcode_id || emp.barcode_number || '').toLowerCase() === query ||
    String(emp.card_no || emp.card || '').toLowerCase() === query
  ) || null;
}

exports.lookupEmployee = async (req, res) => {
  try {
    const idOrBarcode = req.params.idOrBarcode || req.query.q;
    if (!idOrBarcode || !String(idOrBarcode).trim()) {
      return res.status(400).json({ success: false, message: 'Employee ID or barcode is required' });
    }

    const employees = await fetchEmployees();
    const employee = matchEmployee(employees, idOrBarcode);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: employee });
  } catch (err) {
    console.error('[lookupEmployee]', err.message);
    res.status(502).json({
      success: false,
      message: err.message || 'Employee lookup failed'
    });
  }
};
