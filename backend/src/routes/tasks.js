const express = require('express');
const { body } = require('express-validator');
const { getProjectTasks, createTask, getTask, updateTask, deleteTask, getMyTasks } = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/my', getMyTasks);

router.get('/project/:projectId', getProjectTasks);
router.post('/project/:projectId',
  [body('title').trim().notEmpty().withMessage('Task title is required')],
  createTask
);

router.get('/:id', getTask);
router.put('/:id',
  [
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
  ],
  updateTask
);
router.delete('/:id', deleteTask);

module.exports = router;
