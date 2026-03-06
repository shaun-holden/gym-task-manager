import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [supervisorId, setSupervisorId] = useState('');
  const [supervisors, setSupervisors] = useState([]);
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/auth/supervisors').then((res) => setSupervisors(res.data.supervisors));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === 'EMPLOYEE' && !supervisorId) {
      toast.error('Please select your team / gym');
      return;
    }
    if (role === 'SUPERVISOR' && !organizationName.trim()) {
      toast.error('Please enter your gym / organization name');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, role, role === 'EMPLOYEE' ? supervisorId : null, role === 'SUPERVISOR' ? organizationName.trim() : null);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-600">GymTaskManager</h1>
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="you@gym.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I am signing up as</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('EMPLOYEE')}
                className={`flex flex-col items-center gap-1.5 p-4 rounded-lg border-2 transition-all ${
                  role === 'EMPLOYEE'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-semibold">Employee</span>
                <span className="text-xs text-center leading-tight opacity-75">Complete tasks & EODs</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('SUPERVISOR')}
                className={`flex flex-col items-center gap-1.5 p-4 rounded-lg border-2 transition-all ${
                  role === 'SUPERVISOR'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-semibold">Employer</span>
                <span className="text-xs text-center leading-tight opacity-75">Manage team & tasks</span>
              </button>
            </div>
          </div>
          {role === 'SUPERVISOR' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gym / Organization Name</label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="e.g., TNT Gymnastics"
              />
            </div>
          )}
          {role === 'EMPLOYEE' && supervisors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Your Gym / Team</label>
              <select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              >
                <option value="">Select your gym...</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.organization?.name ? `${s.organization.name} — ${s.name}` : s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
