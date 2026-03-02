import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export default function EodTemplateList() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await api.get('/api/eod/templates');
      setTemplates(res.data.templates);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id, isActive) {
    try {
      await api.put(`/api/eod/templates/${id}`, { isActive: !isActive });
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isActive: !isActive } : t))
      );
      toast.success(isActive ? 'Template deactivated' : 'Template activated');
    } catch (err) {
      toast.error('Failed to update template');
    }
  }

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">EOD Templates</h1>
        <Link
          to="/eod/templates/new"
          className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
        >
          + New Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          title="No EOD templates"
          description="Create your first EOD template to get started."
          action={
            <Link to="/eod/templates/new" className="text-brand-600 hover:text-brand-700 font-medium">
              Create template →
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{t.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {t.items?.length || 0} items · Created by {t.createdBy?.name} · {formatDate(t.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(t.id, t.isActive)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                    t.isActive
                      ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                      : 'text-green-600 bg-green-50 hover:bg-green-100'
                  }`}
                >
                  {t.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <Link
                  to={`/eod/templates/${t.id}/edit`}
                  className="px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
