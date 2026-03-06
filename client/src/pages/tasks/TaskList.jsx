import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { formatDate, isOverdue } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const CATEGORIES = ['', 'CLEANING', 'EQUIPMENT_MAINTENANCE', 'FRONT_DESK', 'CLASSES', 'SAFETY', 'OTHER'];

export default function TaskList() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [status, setStatus] = useState(searchParams.get('isCompleted') || '');
  const [assignee, setAssignee] = useState(searchParams.get('assignedToId') || '');

  const [completingTask, setCompletingTask] = useState(null);
  const [completionNote, setCompletionNote] = useState('');

  useEffect(() => {
    fetchTasks();
    if (user.role !== 'EMPLOYEE') {
      api.get('/api/users').then((res) => setUsers(res.data.users));
    }
  }, [category, status, assignee]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      if (status) params.isCompleted = status;
      if (assignee) params.assignedToId = assignee;

      const res = await api.get('/api/tasks', { params });
      setTasks(res.data.tasks);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  function handleCheckboxClick(task) {
    if (!task.isCompleted) {
      setCompletingTask(task);
      setCompletionNote('');
    } else {
      doToggleComplete(task.id);
    }
  }

  async function doToggleComplete(taskId, note) {
    try {
      const res = await api.patch(`/api/tasks/${taskId}/complete`, {
        completionNote: note || undefined,
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? res.data.task : t))
      );
      toast.success(res.data.task.isCompleted ? 'Task completed!' : 'Task reopened');
    } catch (err) {
      toast.error('Failed to update task');
    }
  }

  function handleCompleteWithNote() {
    if (completingTask) {
      doToggleComplete(completingTask.id, completionNote);
      setCompletingTask(null);
      setCompletionNote('');
    }
  }

  function handleCompleteWithoutNote() {
    if (completingTask) {
      doToggleComplete(completingTask.id);
      setCompletingTask(null);
      setCompletionNote('');
    }
  }

  const canCreate = user.role === 'ADMIN' || user.role === 'SUPERVISOR';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        {canCreate && (
          <Link
            to="/tasks/new"
            className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
          >
            + New Task
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 mb-6 flex flex-wrap gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.filter(Boolean).map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="false">Incomplete</option>
          <option value="true">Completed</option>
        </select>

        {user.role !== 'EMPLOYEE' && (
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Task list */}
      {loading ? (
        <LoadingSpinner />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="Try adjusting your filters or create a new task."
          action={canCreate ? (
            <Link to="/tasks/new" className="text-brand-600 hover:text-brand-700 font-medium">
              Create a task →
            </Link>
          ) : null}
        />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="divide-y">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 ${
                  !task.isCompleted && isOverdue(task.dueDate) ? 'bg-red-50/50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => handleCheckboxClick(task)}
                  className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <Link to={`/tasks/${task.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.title}
                    </p>
                    <Badge value={task.category} />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{task.assignedTo?.name}</span>
                    {task.dueDate && (
                      <span className={`text-xs ${!task.isCompleted && isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                        Due {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Note Modal */}
      <Modal
        isOpen={!!completingTask}
        onClose={() => { setCompletingTask(null); setCompletionNote(''); }}
        title="Complete Task"
      >
        <p className="text-sm text-gray-600 mb-1">
          Marking <span className="font-semibold text-gray-900">"{completingTask?.title}"</span> as complete.
        </p>
        <p className="text-sm text-gray-500 mb-4">Add an optional note about the completed work.</p>
        <textarea
          rows={3}
          value={completionNote}
          onChange={(e) => setCompletionNote(e.target.value)}
          placeholder="e.g., All mats cleaned and sanitized. Replaced one worn mat near vault."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={handleCompleteWithoutNote}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Skip Note
          </button>
          <button
            onClick={handleCompleteWithNote}
            className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
          >
            Complete Task
          </button>
        </div>
      </Modal>
    </div>
  );
}
