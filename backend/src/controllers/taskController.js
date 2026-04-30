const { validationResult } = require('express-validator');
const pool = require('../config/database');

async function getProjectTasks(req, res) {
  const { projectId } = req.params;
  const { status, priority, assignee } = req.query;
  try {
    let query = `
      SELECT t.*,
        u.name as assignee_name, u.email as assignee_email,
        c.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.project_id = $1`;
    const params = [projectId];
    let idx = 2;

    if (status) { query += ` AND t.status = $${idx++}`; params.push(status); }
    if (priority) { query += ` AND t.priority = $${idx++}`; params.push(priority); }
    if (assignee) { query += ` AND t.assignee_id = $${idx++}`; params.push(assignee); }

    query += ' ORDER BY t.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ tasks: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function createTask(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { projectId } = req.params;
  const { title, description, priority = 'medium', assignee_id, due_date } = req.body;
  const createdBy = req.user.id;
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, priority, project_id, assignee_id, created_by, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, priority, projectId, assignee_id || null, createdBy, due_date || null]
    );
    const task = rows[0];

    const full = await pool.query(
      `SELECT t.*, u.name as assignee_name, c.name as created_by_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assignee_id
       LEFT JOIN users c ON c.id = t.created_by
       WHERE t.id = $1`,
      [task.id]
    );
    res.status(201).json({ task: full.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getTask(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT t.*, u.name as assignee_name, u.email as assignee_email,
        c.name as created_by_name, p.name as project_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assignee_id
       LEFT JOIN users c ON c.id = t.created_by
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateTask(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const { title, description, status, priority, assignee_id, due_date } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        assignee_id = COALESCE($5, assignee_id),
        due_date = COALESCE($6, due_date),
        updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [title, description, status, priority, assignee_id, due_date, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });

    const full = await pool.query(
      `SELECT t.*, u.name as assignee_name, c.name as created_by_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assignee_id
       LEFT JOIN users c ON c.id = t.created_by
       WHERE t.id = $1`,
      [id]
    );
    res.json({ task: full.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteTask(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const { rows } = await pool.query('SELECT created_by, project_id FROM tasks WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });

    const task = rows[0];
    const member = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.project_id, userId]
    );
    const isAdmin = req.user.role === 'admin' || (member.rows.length && member.rows[0].role === 'admin');
    const isCreator = task.created_by === userId;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Only task creator or project admin can delete' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function getMyTasks(req, res) {
  const userId = req.user.id;
  try {
    const { rows } = await pool.query(
      `SELECT t.*, p.name as project_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.assignee_id = $1
       ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC`,
      [userId]
    );
    res.json({ tasks: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getProjectTasks, createTask, getTask, updateTask, deleteTask, getMyTasks };
