const express = require('express');
const { body } = require('express-validator');
const {
  getProjects, createProject, getProject, updateProject, deleteProject,
  addMember, removeMember, updateMemberRole,
} = require('../controllers/projectController');
const { authenticate, requireProjectRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', getProjects);
router.post('/',
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  createProject
);

router.get('/:id', getProject);
router.put('/:id',
  [body('name').optional().trim().notEmpty()],
  updateProject
);
router.delete('/:id', deleteProject);

router.post('/:id/members',
  [body('email').isEmail().normalizeEmail()],
  addMember
);
router.delete('/:id/members/:userId', removeMember);
router.patch('/:id/members/:userId',
  [body('role').isIn(['admin', 'member'])],
  updateMemberRole
);

module.exports = router;
