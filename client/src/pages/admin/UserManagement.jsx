import { useState, useEffect } from 'react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const ROLES = ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({ role: '', supervisorId: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data.users);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(user) {
    setEditing(user.id);
    setEditData({ role: user.role, supervisorId: user.supervisorId || '' });
  }

  async function saveEdit(userId) {
    try {
      const data = {
        role: editData.role,
        supervisorId: editData.supervisorId || null,
      };
      await api.patch(`/api/users/${userId}`, data);
      toast.success('User updated');
      setEditing(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update user');
    }
  }

  const supervisors = users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPERVISOR');

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Supervisor</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  {editing === u.id ? (
                    <select
                      value={editData.role}
                      onChange={(e) => setEditData((d) => ({ ...d, role: e.target.value }))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <Badge value={u.role} />
                  )}
                </td>
                <td className="px-4 py-3">
                  {editing === u.id ? (
                    <select
                      value={editData.supervisorId}
                      onChange={(e) => setEditData((d) => ({ ...d, supervisorId: e.target.value }))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">None</option>
                      {supervisors
                        .filter((s) => s.id !== u.id)
                        .map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                  ) : (
                    <span className="text-sm text-gray-600">{u.supervisor?.name || '—'}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {editing === u.id ? (
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => saveEdit(u.id)}
                        className="px-3 py-1 text-sm font-medium text-white bg-brand-600 rounded hover:bg-brand-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(u)}
                      className="text-sm text-brand-600 hover:text-brand-700"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
