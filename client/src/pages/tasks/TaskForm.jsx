import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { toInputDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function TaskForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    startDate: '',
    dueDate: '',
    notes: '',
    assignedToId: '',
  });

  const canManageCategories = user.role === 'ADMIN' || user.role === 'SUPERVISOR';

  useEffect(() => {
    Promise.all([
      api.get('/api/users'),
      api.get('/api/task-categories'),
    ]).then(([usersRes, catRes]) => {
      setUsers(usersRes.data.users);
      setCategories(catRes.data.categories);
      if (!isEdit && usersRes.data.users.length > 0 && !form.assignedToId) {
        setForm((f) => ({ ...f, assignedToId: usersRes.data.users[0].id }));
      }
    });

    if (isEdit) {
      api.get(`/api/tasks/${id}`)
        .then((res) => {
          const t = res.data.task;
          setForm({
            title: t.title || '',
            description: t.description || '',
            category: t.category || 'OTHER',
            startDate: toInputDate(t.startDate),
            dueDate: toInputDate(t.dueDate),
            notes: t.notes || '',
            assignedToId: t.assignedToId || '',
          });
        })
        .catch(() => toast.error('Failed to load task'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    try {
      await api.post('/api/task-categories', { name: newCategory.trim() });
      const catRes = await api.get('/api/task-categories');
      setCategories(catRes.data.categories);
      const addedName = newCategory.trim().toUpperCase().replace(/\s+/g, '_');
      setForm((f) => ({ ...f, category: addedName }));
      setNewCategory('');
      toast.success('Category added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add category');
    }
  }

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
      };

      if (isEdit) {
        await api.put(`/api/tasks/${id}`, data);
        toast.success('Task updated');
        navigate(`/tasks/${id}`);
      } else {
        const res = await api.post('/api/tasks', data);
        toast.success('Task created');
        navigate(`/tasks/${res.data.task.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Task' : 'New Task'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            name="title"
            required
            value={form.title}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              name="category"
              required
              value={form.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            >
              {categories.map((c) => (
                <option key={c.name} value={c.name}>{c.name.replace(/_/g, ' ')}</option>
              ))}
            </select>
            {canManageCategories && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category name..."
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
            <select
              name="assignedToId"
              required
              value={form.assignedToId}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            >
              <option value="">Select employee...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            rows={4}
            value={form.notes}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            placeholder="Additional notes..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
