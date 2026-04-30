import { format } from 'date-fns';

const statusConfig = {
  todo: { label: 'To Do', classes: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', classes: 'bg-blue-100 text-blue-700' },
  done: { label: 'Done', classes: 'bg-green-100 text-green-700' },
};

const priorityConfig = {
  low: { label: 'Low', classes: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  medium: { label: 'Medium', classes: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  high: { label: 'High', classes: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

export default function TaskCard({ task, onEdit, onDelete, onStatusChange, compact = false }) {
  const status = statusConfig[task.status] || statusConfig.todo;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div className={`card p-4 hover:shadow-md transition-shadow duration-150 ${compact ? '' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">{task.title}</h3>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button onClick={() => onEdit(task)} className="btn-ghost p-1 text-gray-400 hover:text-indigo-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(task)} className="btn-ghost p-1 text-gray-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {task.description && !compact && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`badge ${status.classes}`}>{status.label}</span>
        <span className={`badge ${priority.classes} gap-1`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          {task.assignee_name ? (
            <>
              <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-medium text-xs">
                {task.assignee_name[0].toUpperCase()}
              </div>
              <span>{task.assignee_name}</span>
            </>
          ) : (
            <span className="text-gray-400">Unassigned</span>
          )}
        </div>
        {task.due_date && (
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
            {isOverdue && '⚠ '}
            {format(new Date(task.due_date), 'MMM d')}
          </span>
        )}
      </div>

      {onStatusChange && task.status !== 'done' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="input py-1 text-xs"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      )}
    </div>
  );
}
