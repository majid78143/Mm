require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/static', express.static(path.join(__dirname, 'static')));

// Firebase public web config -> exposed to the browser via /static/firebase-config.js
app.get('/static/firebase-config.js', (req, res) => {
  res.type('application/javascript').send(`
    window.__FIREBASE_CONFIG__ = ${JSON.stringify({
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      databaseURL: process.env.FIREBASE_DATABASE_URL || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || '',
      measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
    })};
  `);
});

function sign(value) {
  const h = crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
  return `${value}.${h}`;
}
function verify(token) {
  if (!token) return false;
  const idx = token.lastIndexOf('.');
  if (idx === -1) return false;
  const value = token.slice(0, idx);
  const h = token.slice(idx + 1);
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
  return h === expected ? value : false;
}

function requireAdmin(req, res, next) {
  const session = verify(req.cookies.admin_session);
  if (!session || session !== 'admin') {
    return res.redirect('/admin/login');
  }
  next();
}

const page = (name) => (req, res) => res.sendFile(path.join(__dirname, 'templates', name));

app.get('/', page('index.html'));
app.get('/login', page('login.html'));
app.get('/dashboard', page('dashboard.html'));
app.get('/privacy', page('privacy.html'));
app.get('/terms', page('terms.html'));
app.get('/refund-policy', page('refund-policy.html'));
app.get('/payment-delivery', page('payment-delivery.html'));

app.get('/admin/login', (req, res) => {
  const session = verify(req.cookies.admin_session);
  if (session === 'admin') return res.redirect('/admin/dashboard');
  res.sendFile(path.join(__dirname, 'templates', 'admin-login.html'));
});

app.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (
    ADMIN_EMAIL && ADMIN_PASSWORD &&
    email === ADMIN_EMAIL && password === ADMIN_PASSWORD
  ) {
    res.cookie('admin_session', sign('admin'), {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8 // 8 hours
    });
    return res.json({ ok: true, redirect: '/admin/dashboard' });
  }
  return res.status(401).json({ ok: false, message: 'Invalid admin credentials.' });
});

app.post('/admin/logout', (req, res) => {
  res.clearCookie('admin_session');
  res.json({ ok: true });
});

app.get('/admin/dashboard', requireAdmin, page('admin-dashboard.html'));

// Error demo routes (optional, useful while testing styling)
app.get('/errors/403', (req, res) => res.status(403).sendFile(path.join(__dirname, 'templates', '403.html')));
app.get('/errors/429', (req, res) => res.status(429).sendFile(path.join(__dirname, 'templates', '429.html')));
app.get('/errors/500', (req, res) => res.status(500).sendFile(path.join(__dirname, 'templates', '500.html')));
app.get('/errors/503', (req, res) => res.status(503).sendFile(path.join(__dirname, 'templates', '503.html')));

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'templates', '404.html'));
});

app.listen(PORT, () => {
  console.log(`MJ DEVELOPER studio running on http://localhost:${PORT}`);
});
