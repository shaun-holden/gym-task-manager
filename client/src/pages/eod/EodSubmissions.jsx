import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export default function EodSubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  useEffect(() => {
    fetchSubmissions();
    if (user.role !== 'EMPLOYEE') {
      api.get('/api/users').then((res) => setUsers(res.data.users));
    }
  }, [startDate, endDate, employeeFilter]);

  async function fetchSubmissions() {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (employeeFilter) params.employeeId = employeeFilter;

      const res = await api.get('/api/eod/submissions', { params });
      setSubmissions(res.data.submissions);
    } catch (err) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">EOD Submissions</h1>

      <div className="bg-white rounded-xl border p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 uppercase">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 uppercase">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>
        {user.role !== 'EMPLOYEE' && (
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          >
            <option value="">All Employees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
        {(startDate || endDate || employeeFilter) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); setEmployeeFilter(''); }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : submissions.length === 0 ? (
        <EmptyState title="No submissions found" description="Try adjusting your filters." />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Template</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Submitted</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{formatDate(s.date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{s.employee?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{s.template?.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(s.submittedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/eod/submissions/${s.id}`}
                      className="text-sm text-brand-600 hover:text-brand-700"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
