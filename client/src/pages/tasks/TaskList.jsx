import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
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

  async function handleToggleComplete(taskId) {
    try {
      const res = await api.patch(`/api/tasks/${taskId}/complete`);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? res.data.task : t))
      );
      toast.success(res.data.task.isCompleted ? 'Task completed!' : 'Task reopened');
    } catch (err) {
      toast.error('Failed to update task');
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
                  onChange={() => handleToggleComplete(task.id)}
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
    </div>
  );
}
