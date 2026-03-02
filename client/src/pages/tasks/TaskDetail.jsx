import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate, formatDateTime, isOverdue } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    api.get(`/api/tasks/${id}`)
      .then((res) => setTask(res.data.task))
      .catch(() => {
        toast.error('Task not found');
        navigate('/tasks');
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleToggleComplete() {
    try {
      const res = await api.patch(`/api/tasks/${id}/complete`);
      setTask(res.data.task);
      toast.success(res.data.task.isCompleted ? 'Task completed!' : 'Task reopened');
    } catch (err) {
      toast.error('Failed to update task');
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/api/tasks/${id}`);
      toast.success('Task deleted');
      navigate('/tasks');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  }

  if (loading) return <LoadingSpinner size="lg" />;
  if (!task) return null;

  const canEdit = user.role === 'ADMIN' || user.role === 'SUPERVISOR';
  const canComplete = canEdit || task.assignedToId === user.id;
  const overdue = !task.isCompleted && isOverdue(task.dueDate);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/tasks" className="text-sm text-gray-500 hover:text-brand-600">
          ← Tasks
        </Link>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {canComplete && (
              <input
                type="checkbox"
                checked={task.isCompleted}
                onChange={handleToggleComplete}
                className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer mt-1"
              />
            )}
            <div>
              <h1 className={`text-xl font-bold ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                {task.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge value={task.category} />
                {overdue && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    Overdue
                  </span>
                )}
                {task.isCompleted && (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                )}
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <Link
                to={`/tasks/${id}/edit`}
                className="px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100"
              >
                Edit
              </Link>
              <button
                onClick={() => setShowDelete(true)}
                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {task.description && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned To</h3>
            <p className="text-sm text-gray-900">{task.assignedTo?.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Created By</h3>
            <p className="text-sm text-gray-900">{task.createdBy?.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
            <p className="text-sm text-gray-900">{formatDate(task.startDate) || '—'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Due Date</h3>
            <p className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
              {formatDate(task.dueDate) || '—'}
            </p>
          </div>
          {task.completedAt && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Completed At</h3>
              <p className="text-sm text-gray-900">{formatDateTime(task.completedAt)}</p>
            </div>
          )}
        </div>

        {task.notes && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
              {task.notes}
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
      />
    </div>
  );
}
