import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export default function EodSubmissionDetail() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/eod/submissions/${id}`)
      .then((res) => setSubmission(res.data.submission))
      .catch(() => toast.error('Failed to load submission'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!submission) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/eod/submissions" className="text-sm text-gray-500 hover:text-brand-600 mb-6 inline-block">
        ← Submissions
      </Link>

      <div className="bg-white rounded-xl border p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{submission.template?.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>By {submission.employee?.name}</span>
            <span>{formatDate(submission.date)}</span>
            {submission.submittedAt && (
              <span className="text-green-600">Submitted {formatDateTime(submission.submittedAt)}</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {submission.responses?.map((r) => (
            <div key={r.id} className="border-b pb-4 last:border-b-0">
              <p className="text-sm font-medium text-gray-700">{r.templateItem?.question}</p>
              <div className="mt-1">
                {r.templateItem?.type === 'CHECKBOX' ? (
                  <span className={`inline-flex items-center gap-1 text-sm ${r.response === 'true' ? 'text-green-600' : 'text-red-600'}`}>
                    {r.response === 'true' ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {r.response === 'true' ? 'Yes' : 'No'}
                  </span>
                ) : (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">{r.response || '—'}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
