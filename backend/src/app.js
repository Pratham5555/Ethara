const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.replace(/^["']|["']$/g, '').split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, Postman)
    if (!origin) return callback(null, true);
    // Allow if no FRONTEND_URL set (open) or origin matches
    if (!allowedOrigins.length || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Auto-migrate on startup — safe to run repeatedly because schema uses IF NOT EXISTS
const fs = require('fs');
const path = require('path');
const pool = require('./config/database');
const schemaSql = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
pool.query(schemaSql).then(() => console.log('Schema ready')).catch((e) => console.error('Schema error:', e.message));

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));


app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'production' || process.env.START_SERVER) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
