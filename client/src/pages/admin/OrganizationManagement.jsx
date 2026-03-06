import { useState, useEffect } from 'react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export default function OrganizationManagement() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [orgName, setOrgName] = useState('');

  // Assign employer state
  const [assigningOrg, setAssigningOrg] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    fetchOrgs();
  }, []);

  async function fetchOrgs() {
    setLoading(true);
    try {
      const res = await api.get('/api/organizations');
      setOrgs(res.data.organizations);
    } catch {
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrg() {
    if (!orgName.trim()) return;
    try {
      const res = await api.post('/api/organizations', { name: orgName.trim() });
      setOrgs((prev) => [...prev, res.data.organization]);
      setOrgName('');
      setShowAdd(false);
      toast.success('Organization created');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create organization');
    }
  }

  async function handleUpdateOrg() {
    if (!orgName.trim()) return;
    try {
      const res = await api.put(`/api/organizations/${editingOrg.id}`, { name: orgName.trim() });
      setOrgs((prev) => prev.map((o) => (o.id === editingOrg.id ? res.data.organization : o)));
      setOrgName('');
      setEditingOrg(null);
      toast.success('Organization updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  }

  async function openAssignEmployer(org) {
    setAssigningOrg(org);
    setSelectedUserId('');
    try {
      const res = await api.get('/api/users');
      // Show users not already a supervisor/admin in this org
      const orgUserIds = org.users.map((u) => u.id);
      setAllUsers(res.data.users.filter((u) => !orgUserIds.includes(u.id)));
    } catch {
      toast.error('Failed to load users');
    }
  }

  async function handleAssignEmployer() {
    if (!selectedUserId) return;
    try {
      const res = await api.post(`/api/organizations/${assigningOrg.id}/employer`, { userId: selectedUserId });
      toast.success(`${res.data.user.name} is now an employer for ${assigningOrg.name}`);
      setAssigningOrg(null);
      fetchOrgs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign employer');
    }
  }

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
        <button
          onClick={() => { setShowAdd(true); setOrgName(''); }}
          className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"
        >
          + Add Organization
        </button>
      </div>

      {orgs.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="text-gray-500">No organizations yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orgs.map((org) => (
            <div key={org.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{org.name}</h2>
                  <p className="text-sm text-gray-500">{org._count.users} member{org._count.users !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openAssignEmployer(org)}
                    className="px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100"
                  >
                    + Employer
                  </button>
                  <button
                    onClick={() => { setEditingOrg(org); setOrgName(org.name); }}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {org.users.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Employers</h3>
                  <div className="flex flex-wrap gap-2">
                    {org.users.map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border rounded-lg text-sm"
                      >
                        <span className="font-medium text-gray-800">{u.name}</span>
                        <span className="text-gray-400 text-xs">{u.email}</span>
                        <span className="text-xs font-medium text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                          {u.role}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Organization Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Organization"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              placeholder="e.g., Elite Gymnastics Academy"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateOrg()}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrg}
              className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Organization Modal */}
      <Modal
        isOpen={!!editingOrg}
        onClose={() => setEditingOrg(null)}
        title="Edit Organization"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateOrg()}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setEditingOrg(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateOrg}
              className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Employer Modal */}
      <Modal
        isOpen={!!assigningOrg}
        onClose={() => setAssigningOrg(null)}
        title={`Add Employer to ${assigningOrg?.name || ''}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select a user to make them an employer (supervisor) for this organization.
          </p>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
          >
            <option value="">Select a user...</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email}) — {u.role}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setAssigningOrg(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignEmployer}
              disabled={!selectedUserId}
              className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              Assign Employer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
