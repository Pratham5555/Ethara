const jwt = require('jsonwebtoken');
const pool = require('../config/database');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
    if (!rows.length) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function requireProjectRole(roles) {
  return async (req, res, next) => {
    const projectId = req.params.projectId || req.params.id;
    const userId = req.user.id;

    if (req.user.role === 'admin') return next();

    const { rows } = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (!rows.length) return res.status(403).json({ error: 'Not a project member' });
    if (!roles.includes(rows[0].role)) return res.status(403).json({ error: 'Insufficient permissions' });
    req.projectRole = rows[0].role;
    next();
  };
}

module.exports = { authenticate, requireProjectRole };
