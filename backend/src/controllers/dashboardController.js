const pool = require('../config/database');

async function getDashboard(req, res) {
  const userId = req.user.id;
  try {
    const [projectsRes, myTasksRes, overdueRes, activityRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(DISTINCT pm.project_id) as total_projects
         FROM project_members pm WHERE pm.user_id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'todo') as todo,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
          COUNT(*) FILTER (WHERE status = 'done') as done,
          COUNT(*) as total
         FROM tasks WHERE assignee_id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT t.id, t.title, t.due_date, t.priority, t.status, p.name as project_name
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         WHERE t.assignee_id = $1 AND t.due_date < NOW() AND t.status != 'done'
         ORDER BY t.due_date ASC
         LIMIT 5`,
        [userId]
      ),
      pool.query(
        `SELECT t.id, t.title, t.status, t.updated_at, p.name as project_name
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
         ORDER BY t.updated_at DESC
         LIMIT 10`,
        [userId]
      ),
    ]);

    res.json({
      stats: {
        total_projects: parseInt(projectsRes.rows[0].total_projects),
        tasks: myTasksRes.rows[0],
      },
      overdue_tasks: overdueRes.rows,
      recent_activity: activityRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getDashboard };
