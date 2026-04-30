import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import Modal from '../components/Modal';

const STATUSES = ['todo', 'in_progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_COLORS = {
  todo: 'border-t-gray-400',
  in_progress: 'border-t-blue-500',
  done: 'border-t-green-500',
};

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignee_id: '', due_date: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = project?.my_role === 'admin' || user?.role === 'admin';

  useEffect(() => {
    fetchAll();
  }, [id]);

  async function fetchAll() {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
      ]);
      setProject(projRes.data.project);
      setMembers(projRes.data.members);
      setTasks(tasksRes.data.tasks);
    } catch {
      toast.error('Project not found');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTask(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...taskForm,
        assignee_id: taskForm.assignee_id || null,
        due_date: taskForm.due_date || null,
      };
      if (editingTask) {
        const { data } = await api.put(`/tasks/${editingTask.id}`, payload);
        setTasks(tasks.map((t) => t.id === editingTask.id ? data.task : t));
        toast.success('Task updated');
      } else {
        const { data } = await api.post(`/tasks/project/${id}`, payload);
        setTasks([data.task, ...tasks]);
        toast.success('Task created');
      }
      closeTaskModal();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTask(task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      setTasks(tasks.filter((t) => t.id !== task.id));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete task');
    }
  }

  async function handleStatusChange(taskId, newStatus) {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map((t) => t.id === taskId ? data.task : t));
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post(`/projects/${id}/members`, { email: memberEmail });
      setMembers([...members, data.member]);
      setMemberEmail('');
      setShowMemberModal(false);
      toast.success('Member added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveMember(memberId) {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      setMembers(members.filter((m) => m.id !== memberId));
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  }

  async function handleDeleteProject() {
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete project');
    }
  }

  function openEditTask(task) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assignee_id: task.assignee_id || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
    });
    setShowTaskModal(true);
  }

  function closeTaskModal() {
    setShowTaskModal(false);
    setEditingTask(null);
    setTaskForm({ title: '', description: '', priority: 'medium', assignee_id: '', due_date: '' });
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-8 pb-0">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => navigate('/projects')} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            </div>
            {project.description && <p className="text-gray-500 ml-8">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button onClick={() => setShowMemberModal(true)} className="btn-secondary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add Member
                </button>
                <button onClick={() => setShowDeleteModal(true)} className="btn-danger">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </>
            )}
            <button onClick={() => setShowTaskModal(true)} className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {[
            { key: 'board', label: 'Board' },
            { key: 'list', label: 'List' },
            { key: 'members', label: `Members (${members.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8 pt-6">
        {activeTab === 'board' && (
          <div className="flex gap-5 h-full min-h-0">
            {STATUSES.map((status) => (
              <div key={status} className="flex-1 min-w-64">
                <div className={`card border-t-4 ${STATUS_COLORS[status]} h-full flex flex-col`}>
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700 text-sm">{STATUS_LABELS[status]}</h3>
                    <span className="badge bg-gray-100 text-gray-600">{tasksByStatus[status].length}</span>
                  </div>
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                    {tasksByStatus[status].map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={openEditTask}
                        onDelete={handleDeleteTask}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                    {tasksByStatus[status].length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">No tasks</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-3">
            {tasks.length === 0 && (
              <div className="text-center py-16 text-gray-400">No tasks yet</div>
            )}
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={openEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                compact
              />
            ))}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="max-w-2xl space-y-3">
            {members.map((member) => (
              <div key={member.id} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold">
                  {member.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <span className={`badge ${member.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                  {member.role}
                </span>
                {isAdmin && member.id !== user.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="btn-ghost p-1.5 text-gray-400 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <Modal isOpen={showTaskModal} onClose={closeTaskModal} title={editingTask ? 'Edit Task' : 'Create Task'} size="lg">
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input type="text" className="input" placeholder="Task title" value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required autoFocus />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="Optional description"
              value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Assignee</label>
              <select className="input" value={taskForm.assignee_id}
                onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" value={taskForm.due_date}
              onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
          </div>
          {editingTask && (
            <div>
              <label className="label">Status</label>
              <select className="input" value={taskForm.status || editingTask.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeTaskModal} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (editingTask ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title="Add Team Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="label">Member email</label>
            <input type="email" className="input" placeholder="teammate@example.com"
              value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required autoFocus />
            <p className="text-xs text-gray-400 mt-1">They must already have an Ethara account</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowMemberModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Project Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Project" size="sm">
        <p className="text-gray-600 mb-6">This will permanently delete <strong>{project?.name}</strong> and all its tasks. This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleDeleteProject} className="btn-danger flex-1">Delete Project</button>
        </div>
      </Modal>
    </div>
  );
}
