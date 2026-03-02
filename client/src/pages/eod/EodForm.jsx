import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export default function EodForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [templatesRes, submissionsRes] = await Promise.all([
          api.get('/api/eod/templates'),
          api.get('/api/eod/submissions', {
            params: { date: new Date().toISOString().split('T')[0], employeeId: user.id },
          }),
        ]);

        const tmpl = templatesRes.data.templates;
        setTemplates(tmpl);

        if (submissionsRes.data.submissions.length > 0) {
          // Already submitted — load the full submission
          const sub = submissionsRes.data.submissions[0];
          const fullRes = await api.get(`/api/eod/submissions/${sub.id}`);
          setExistingSubmission(fullRes.data.submission);
        } else if (tmpl.length > 0) {
          setSelectedTemplate(tmpl[0]);
          // Init empty responses
          const initial = {};
          tmpl[0].items.forEach((item) => {
            initial[item.id] = item.type === 'CHECKBOX' ? 'false' : '';
          });
          setResponses(initial);
        }
      } catch (err) {
        toast.error('Failed to load EOD data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id]);

  function handleTemplateChange(templateId) {
    const tmpl = templates.find((t) => t.id === templateId);
    setSelectedTemplate(tmpl);
    const initial = {};
    tmpl.items.forEach((item) => {
      initial[item.id] = item.type === 'CHECKBOX' ? 'false' : '';
    });
    setResponses(initial);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const responseArray = Object.entries(responses).map(([templateItemId, response]) => ({
        templateItemId,
        response: String(response),
      }));

      await api.post('/api/eod/submissions', {
        templateId: selectedTemplate.id,
        responses: responseArray,
      });

      toast.success('EOD submitted successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit EOD');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner size="lg" />;

  // Show existing submission (read-only)
  if (existingSubmission) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Today's EOD</h1>
        <p className="text-sm text-green-600 mb-6">
          Submitted at {formatDateTime(existingSubmission.submittedAt)}
        </p>
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{existingSubmission.template?.title}</h2>
          {existingSubmission.responses?.map((r) => (
            <div key={r.id} className="border-b pb-3 last:border-b-0">
              <p className="text-sm font-medium text-gray-700">{r.templateItem?.question}</p>
              <p className="text-sm text-gray-600 mt-1">
                {r.templateItem?.type === 'CHECKBOX'
                  ? (r.response === 'true' ? 'Yes' : 'No')
                  : r.response || '—'}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">No EOD Templates</h1>
        <p className="text-gray-500">No active EOD templates have been created yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Today's EOD</h1>

      {templates.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
          <select
            value={selectedTemplate?.id || ''}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
      )}

      {selectedTemplate && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">{selectedTemplate.title}</h2>

          {selectedTemplate.items.map((item) => (
            <div key={item.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {item.question}
              </label>

              {item.type === 'TEXT' && (
                <textarea
                  rows={2}
                  value={responses[item.id] || ''}
                  onChange={(e) => setResponses((r) => ({ ...r, [item.id]: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              )}

              {item.type === 'NUMBER' && (
                <input
                  type="number"
                  value={responses[item.id] || ''}
                  onChange={(e) => setResponses((r) => ({ ...r, [item.id]: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              )}

              {item.type === 'CHECKBOX' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={responses[item.id] === 'true'}
                    onChange={(e) =>
                      setResponses((r) => ({ ...r, [item.id]: String(e.target.checked) }))
                    }
                    className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-600">Yes</span>
                </label>
              )}
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit EOD'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
