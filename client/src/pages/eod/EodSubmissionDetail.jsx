import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const MOOD_LABELS = { 1: 'Rough Day', 2: 'Below Average', 3: 'Average', 4: 'Good Day', 5: 'Great Day' };
const MOOD_COLORS = {
  1: 'bg-red-500 text-white',
  2: 'bg-orange-500 text-white',
  3: 'bg-yellow-500 text-white',
  4: 'bg-green-500 text-white',
  5: 'bg-emerald-500 text-white',
};

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
        &larr; Submissions
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

        {/* Mood */}
        {submission.mood && (
          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Mood:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <span
                  key={v}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    submission.mood === v
                      ? MOOD_COLORS[v]
                      : 'bg-gray-100 border-gray-200 text-gray-300'
                  }`}
                >
                  {v}
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-600">{MOOD_LABELS[submission.mood]}</span>
          </div>
        )}

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
                ) : r.templateItem?.type === 'RATING' ? (
                  <div className="flex gap-1 items-center">
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
                    <span className="ml-1 text-sm text-gray-500">{r.response}/5</span>
                  </div>
                ) : r.templateItem?.type === 'DATE' || r.templateItem?.type === 'TIME' ? (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">{r.response || '—'}</p>
                ) : r.templateItem?.type === 'ATTACHMENT' ? (
                  r.response ? (
                    r.response.startsWith('data:') ? (
                      r.response.startsWith('data:image') ? (
                        <img src={r.response} alt="Attachment" className="max-w-xs max-h-48 rounded-lg border" />
                      ) : (
                        <a
                          href={r.response}
                          download="attachment"
                          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 bg-gray-50 rounded-lg p-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Attachment
                        </a>
                      )
                    ) : (
                      <a
                        href={r.response}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 bg-gray-50 rounded-lg p-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        View Attachment
                      </a>
                    )
                  ) : (
                    <span className="text-sm text-gray-400">No attachment</span>
                  )
                ) : (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">{r.response || '—'}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {submission.notes && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-1">Additional Notes</p>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{submission.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
