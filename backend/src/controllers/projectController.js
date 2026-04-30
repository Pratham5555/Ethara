const { validationResult } = require('express-validator');
const pool = require('../config/database');

async function getProjects(req, res) {
  const userId = req.user.id;
  try {
    const { rows } = await pool.query(
      `SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        pm.role as my_role
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );
    res.json({ projects: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function createProject(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  const ownerId = req.user.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, ownerId]
    );
    const project = rows[0];
    await client.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, ownerId, 'admin']
    );
    await client.query('COMMIT');
    res.status(201).json({ project });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}

async function getProject(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const { rows } = await pool.query(
      `SELECT p.*, u.name as owner_name,
        pm.role as my_role
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
       WHERE p.id = $1`,
      [id, userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });

    const members = await pool.query(
      `SELECT u.id, u.name, u.email, pm.role, pm.joined_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.joined_at ASC`,
      [id]
    );

    res.json({ project: rows[0], members: members.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateProject(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description),
       updated_at = NOW() WHERE id = $3 RETURNING *`,
      [name, description, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json({ project: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteProject(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const { rows } = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });
    if (rows[0].owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only project owner can delete' });
    }
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function addMember(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id: projectId } = req.params;
  const { email, role = 'member' } = req.body;
  try {
    const userRes = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });
    const user = userRes.rows[0];

    const exists = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, user.id]
    );
    if (exists.rows.length) return res.status(409).json({ error: 'User already a member' });

    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [projectId, user.id, role]
    );
    res.status(201).json({ member: { ...user, role } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function removeMember(req, res) {
  const { id: projectId, userId } = req.params;
  try {
    const project = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [projectId]);
    if (!project.rows.length) return res.status(404).json({ error: 'Project not found' });
    if (parseInt(userId) === project.rows[0].owner_id) {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }
    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateMemberRole(req, res) {
  const { id: projectId, userId } = req.params;
  const { role } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3 RETURNING *',
      [role, projectId, userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Member not found' });
    res.json({ member: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember, updateMemberRole };
