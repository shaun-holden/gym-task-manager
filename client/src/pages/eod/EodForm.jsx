import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const MOOD_OPTIONS = [
  { value: 1, label: 'Rough Day', icon: '1' },
  { value: 2, label: 'Below Average', icon: '2' },
  { value: 3, label: 'Average', icon: '3' },
  { value: 4, label: 'Good Day', icon: '4' },
  { value: 5, label: 'Great Day', icon: '5' },
];

const MOOD_COLORS = {
  1: 'bg-red-100 border-red-400 text-red-700',
  2: 'bg-orange-100 border-orange-400 text-orange-700',
  3: 'bg-yellow-100 border-yellow-400 text-yellow-700',
  4: 'bg-green-100 border-green-400 text-green-700',
  5: 'bg-emerald-100 border-emerald-400 text-emerald-700',
};

const MOOD_COLORS_SELECTED = {
  1: 'bg-red-500 border-red-500 text-white',
  2: 'bg-orange-500 border-orange-500 text-white',
  3: 'bg-yellow-500 border-yellow-500 text-white',
  4: 'bg-green-500 border-green-500 text-white',
  5: 'bg-emerald-500 border-emerald-500 text-white',
};

export default function EodForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [responses, setResponses] = useState({});
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(user.id);
  const canSubmitOnBehalf = user.role === 'ADMIN' || user.role === 'SUPERVISOR';

  useEffect(() => {
    async function load() {
      try {
        const fetches = [
          api.get('/api/eod/templates'),
          api.get('/api/eod/submissions', {
            params: { date: new Date().toISOString().split('T')[0], employeeId: selectedEmployeeId },
          }),
        ];
        if (canSubmitOnBehalf) {
          fetches.push(api.get('/api/users'));
        }
        const results = await Promise.all(fetches);

        const tmpl = results[0].data.templates;
        setTemplates(tmpl);

        if (canSubmitOnBehalf && results[2]) {
          setEmployees(results[2].data.users.filter((u) => u.isActive));
        }

        if (results[1].data.submissions.length > 0) {
          const sub = results[1].data.submissions[0];
          const fullRes = await api.get(`/api/eod/submissions/${sub.id}`);
          setExistingSubmission(fullRes.data.submission);
        } else {
          setExistingSubmission(null);
          if (tmpl.length > 0) {
            setSelectedTemplate(tmpl[0]);
            initResponses(tmpl[0]);
          }
        }
      } catch (err) {
        toast.error('Failed to load EOD data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id, selectedEmployeeId]);

  function initResponses(tmpl) {
    const initial = {};
    tmpl.items.forEach((item) => {
      if (item.type === 'CHECKBOX') initial[item.id] = 'false';
      else if (item.type === 'DATE') initial[item.id] = new Date().toISOString().split('T')[0];
      else initial[item.id] = '';
    });
    setResponses(initial);
  }

  function handleTemplateChange(templateId) {
    const tmpl = templates.find((t) => t.id === templateId);
    setSelectedTemplate(tmpl);
    initResponses(tmpl);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate required fields
    const missingRequired = selectedTemplate.items
      .filter((item) => item.isRequired && !responses[item.id]?.trim?.() && responses[item.id] !== 'true')
      .map((item) => item.question);
    if (missingRequired.length > 0) {
      toast.error(`Please fill in required fields: ${missingRequired.join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const responseArray = Object.entries(responses).map(([templateItemId, response]) => ({
        templateItemId,
        response: String(response),
      }));

      await api.post('/api/eod/submissions', {
        templateId: selectedTemplate.id,
        employeeId: selectedEmployeeId !== user.id ? selectedEmployeeId : undefined,
        responses: responseArray,
        notes: notes || undefined,
        mood: mood || undefined,
      });

      toast.success(selectedEmployeeId !== user.id ? 'EOD submitted on behalf of employee!' : 'EOD submitted successfully!');
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

        {/* Mood display */}
        {existingSubmission.mood && (
          <div className="bg-white rounded-xl border p-4 mb-4 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">How was your day?</span>
            <div className="flex gap-1.5">
              {MOOD_OPTIONS.map((m) => (
                <span
                  key={m.value}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                    existingSubmission.mood === m.value
                      ? MOOD_COLORS_SELECTED[m.value]
                      : 'bg-gray-50 border-gray-200 text-gray-300'
                  }`}
                  title={m.label}
                >
                  {m.icon}
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {MOOD_OPTIONS.find((m) => m.value === existingSubmission.mood)?.label}
            </span>
          </div>
        )}

        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{existingSubmission.template?.title}</h2>
          {existingSubmission.responses?.map((r) => (
            <div key={r.id} className="border-b pb-3 last:border-b-0">
              <p className="text-sm font-medium text-gray-700">{r.templateItem?.question}</p>
              <div className="mt-1">
                {r.templateItem?.type === 'CHECKBOX' ? (
                  <span className={`text-sm ${r.response === 'true' ? 'text-green-600' : 'text-red-600'}`}>
                    {r.response === 'true' ? 'Yes' : 'No'}
                  </span>
                ) : r.templateItem?.type === 'RATING' ? (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${Number(r.response) >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                ) : r.templateItem?.type === 'DATE' ? (
                  <p className="text-sm text-gray-600">{r.response || '—'}</p>
                ) : r.templateItem?.type === 'ATTACHMENT' ? (
                  r.response ? (
                    <a
                      href={r.response}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      View Attachment
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">No attachment</span>
                  )
                ) : (
                  <p className="text-sm text-gray-600">{r.response || '—'}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notes display */}
        {existingSubmission.notes && (
          <div className="bg-white rounded-xl border p-4 mt-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Additional Notes</p>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{existingSubmission.notes}</p>
          </div>
        )}
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

      {canSubmitOnBehalf && employees.length > 0 && (
        <div className="mb-4 bg-white rounded-xl border p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Submit on behalf of</label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => {
              setSelectedEmployeeId(e.target.value);
              setExistingSubmission(null);
              setSelectedTemplate(null);
              setLoading(true);
            }}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          >
            <option value={user.id}>Myself ({user.name})</option>
            {employees.filter((e) => e.id !== user.id).map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
            ))}
          </select>
        </div>
      )}

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
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mood Selector */}
          <div className="bg-white rounded-xl border p-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How was your day?
            </label>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(mood === m.value ? null : m.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg border-2 transition-all ${
                    mood === m.value
                      ? MOOD_COLORS_SELECTED[m.value]
                      : MOOD_COLORS[m.value] + ' hover:shadow-sm'
                  }`}
                  title={m.label}
                >
                  <span className="text-lg font-bold">{m.icon}</span>
                  <span className="text-xs font-medium leading-tight text-center">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Template Questions */}
          <div className="bg-white rounded-xl border p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">{selectedTemplate.title}</h2>

            {selectedTemplate.items.map((item) => (
              <div key={item.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {item.question}
                  {item.isRequired && <span className="text-red-500 ml-1">*</span>}
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

                {item.type === 'RATING' && (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setResponses((r) => ({
                            ...r,
                            [item.id]: String(r[item.id] === String(star) ? '' : star),
                          }))
                        }
                        className="p-0.5 focus:outline-none"
                      >
                        <svg
                          className={`w-8 h-8 transition-colors ${
                            Number(responses[item.id]) >= star
                              ? 'text-yellow-400 hover:text-yellow-500'
                              : 'text-gray-200 hover:text-yellow-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                    {responses[item.id] && (
                      <span className="ml-2 text-sm text-gray-500 self-center">
                        {responses[item.id]}/5
                      </span>
                    )}
                  </div>
                )}

                {item.type === 'DATE' && (
                  <input
                    type="date"
                    value={responses[item.id] || ''}
                    onChange={(e) => setResponses((r) => ({ ...r, [item.id]: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                )}

                {item.type === 'ATTACHMENT' && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={responses[item.id] || ''}
                      onChange={(e) => setResponses((r) => ({ ...r, [item.id]: e.target.value }))}
                      placeholder="Paste a link to a document, photo, or file..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <p className="text-xs text-gray-400">
                      Paste a link to a Google Drive file, Dropbox, photo URL, or any shared document.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Additional Notes */}
          <div className="bg-white rounded-xl border p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra comments, blockers, or things to note..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

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
