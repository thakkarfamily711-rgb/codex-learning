const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '..', 'public');
const dataPath = path.join(__dirname, '..', 'data', 'db.json');

const defaultDb = {
  counters: { hospital: 0, visit: 0, followup: 0, order: 0, recommendation: 0 },
  hospitals: [],
  visits: [],
  followups: [],
  orders: [],
  recommendations: []
};

function ensureDb() {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify(defaultDb, null, 2));
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({ raw: data });
      }
    });
    req.on('error', reject);
  });
}

function getDashboard(db) {
  const month = new Date().toISOString().slice(0, 7);
  return {
    totalHospitals: db.hospitals.length,
    pendingFollowups: db.followups.filter((f) => f.status === 'pending').length,
    ordersThisMonth: db.orders.filter((o) => (o.order_date || '').slice(0, 7) === month).length,
    recommendations: db.recommendations.filter((r) => r.status === 'pending').length
  };
}

function suggestByRule(db, hospitalId, faculty, totalValue) {
  let suggested = 'Cast Padding';
  let reason = 'Default cross-sell recommendation';

  if ((faculty || '').toLowerCase().includes('ortho')) {
    suggested = 'Ortho Follow-up Bundle';
    reason = 'Ortho faculty active';
  }
  if (totalValue >= 50000) {
    suggested = 'Premium Upsell Kit';
    reason = 'High order value';
  }

  db.counters.recommendation += 1;
  db.recommendations.unshift({
    id: db.counters.recommendation,
    hospital_id: hospitalId,
    trigger_source: 'order',
    suggested_products: suggested,
    confidence_score: 0.72,
    reason_text: reason,
    status: 'pending',
    created_at: new Date().toISOString()
  });
}

function serveStatic(req, res) {
  const reqPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(publicDir, reqPath);
  if (!filePath.startsWith(publicDir) || !fs.existsSync(filePath)) return false;

  const ext = path.extname(filePath);
  const type = ext === '.html' ? 'text/html' : ext === '.css' ? 'text/css' : 'text/plain';
  res.writeHead(200, { 'Content-Type': type });
  res.end(fs.readFileSync(filePath));
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const db = readDb();

  if (url.pathname === '/api/health' && req.method === 'GET') return send(res, 200, { ok: true, service: 'medical-crm-mvp' });
  if (url.pathname === '/api/dashboard' && req.method === 'GET') return send(res, 200, getDashboard(db));

  if (url.pathname === '/api/hospitals' && req.method === 'GET') {
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const rows = q
      ? db.hospitals.filter((h) => [h.name, h.city, h.area, h.phone, h.email].join(' ').toLowerCase().includes(q))
      : db.hospitals;
    return send(res, 200, rows);
  }

  if (url.pathname === '/api/hospitals' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.name) return send(res, 400, { error: 'name is required' });

    db.counters.hospital += 1;
    const hospital = {
      id: db.counters.hospital,
      name: body.name,
      city: body.city || '',
      area: body.area || '',
      phone: body.phone || '',
      email: body.email || '',
      source_type: body.source_type || 'manual',
      status: body.status || 'warm',
      faculty_tags: body.faculty_tags || '',
      assigned_to: body.assigned_to || '',
      created_at: new Date().toISOString()
    };
    db.hospitals.unshift(hospital);
    writeDb(db);
    return send(res, 201, hospital);
  }

  if (url.pathname === '/api/visits' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.hospital_id || !body.visit_date) return send(res, 400, { error: 'hospital_id and visit_date are required' });

    db.counters.visit += 1;
    const visit = {
      id: db.counters.visit,
      hospital_id: body.hospital_id,
      faculty: body.faculty || '',
      visit_date: body.visit_date,
      visit_type: body.visit_type || 'follow-up',
      summary: body.summary || '',
      next_followup_date: body.next_followup_date || '',
      created_by: body.created_by || 'sales-user',
      created_at: new Date().toISOString()
    };
    db.visits.unshift(visit);

    if (visit.next_followup_date) {
      db.counters.followup += 1;
      db.followups.push({
        id: db.counters.followup,
        hospital_id: visit.hospital_id,
        visit_id: visit.id,
        due_date: visit.next_followup_date,
        mode: 'call',
        priority: 'medium',
        status: 'pending',
        task_note: `Auto follow-up from visit #${visit.id}`
      });
    }
    writeDb(db);
    return send(res, 201, { id: visit.id, message: 'visit saved' });
  }

  if (url.pathname === '/api/followups' && req.method === 'GET') {
    const rows = db.followups.map((f) => ({ ...f, hospital_name: db.hospitals.find((h) => h.id === f.hospital_id)?.name || 'Unknown' }));
    return send(res, 200, rows);
  }

  if (url.pathname.startsWith('/api/followups/') && req.method === 'PATCH') {
    const id = Number(url.pathname.split('/').pop());
    const body = await parseBody(req);
    const found = db.followups.find((f) => f.id === id);
    if (!found) return send(res, 404, { error: 'follow-up not found' });
    found.status = body.status || found.status;
    writeDb(db);
    return send(res, 200, { ok: true });
  }

  if (url.pathname === '/api/orders' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.hospital_id || !body.order_date) return send(res, 400, { error: 'hospital_id and order_date are required' });

    db.counters.order += 1;
    const order = {
      id: db.counters.order,
      hospital_id: body.hospital_id,
      faculty: body.faculty || '',
      order_date: body.order_date,
      total_value: Number(body.total_value || 0),
      status: body.status || 'new',
      remarks: body.remarks || ''
    };
    db.orders.unshift(order);
    suggestByRule(db, order.hospital_id, order.faculty, order.total_value);
    writeDb(db);

    return send(res, 201, { id: order.id, message: 'order saved and recommendation generated' });
  }

  if (url.pathname === '/api/recommendations' && req.method === 'GET') {
    const rows = db.recommendations.map((r) => ({ ...r, hospital_name: db.hospitals.find((h) => h.id === r.hospital_id)?.name || 'Unknown' }));
    return send(res, 200, rows);
  }

  if (url.pathname === '/api/import/hospitals' && req.method === 'POST') {
    const body = await parseBody(req);
    const csvRaw = body.csv || body.raw || '';
    if (!csvRaw.trim()) return send(res, 400, { error: 'Provide CSV text in body.csv' });

    const lines = csvRaw.trim().split(/\r?\n/);
    const headers = lines.shift().split(',').map((h) => h.trim().toLowerCase());
    const idx = {
      name: headers.indexOf('name'),
      city: headers.indexOf('city'),
      phone: headers.indexOf('phone'),
      email: headers.indexOf('email'),
      faculty_tags: headers.indexOf('faculty_tags')
    };

    let imported = 0;
    let skipped = 0;

    for (const line of lines) {
      if (!line.trim()) { skipped += 1; continue; }
      const cols = line.split(',').map((c) => c.trim());
      const name = idx.name >= 0 ? cols[idx.name] : '';
      const city = idx.city >= 0 ? cols[idx.city] : '';
      const phone = idx.phone >= 0 ? cols[idx.phone] : '';
      const email = idx.email >= 0 ? cols[idx.email] : '';
      const faculty_tags = idx.faculty_tags >= 0 ? cols[idx.faculty_tags] : '';

      if (!name) { skipped += 1; continue; }

      const duplicate = db.hospitals.find((h) =>
        (h.name.toLowerCase() === name.toLowerCase() && h.city.toLowerCase() === city.toLowerCase()) ||
        (phone && h.phone === phone) ||
        (email && h.email.toLowerCase() === email.toLowerCase())
      );
      if (duplicate) { skipped += 1; continue; }

      db.counters.hospital += 1;
      db.hospitals.unshift({
        id: db.counters.hospital,
        name, city, phone, email, faculty_tags,
        area: '', source_type: 'excel', status: 'warm', assigned_to: '',
        created_at: new Date().toISOString()
      });
      imported += 1;
    }

    writeDb(db);
    return send(res, 200, { imported, skipped, totalRows: lines.length });
  }

  if (serveStatic(req, res)) return;

  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Medical CRM MVP running on http://localhost:${PORT}`);
});
