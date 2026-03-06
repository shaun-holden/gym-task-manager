import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);

  // Gym search for employees
  const [gymQuery, setGymQuery] = useState('');
  const [gymResults, setGymResults] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Search orgs as user types
  useEffect(() => {
    if (gymQuery.length < 1) {
      setGymResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api.get('/api/auth/organizations', { params: { q: gymQuery } })
        .then((res) => {
          setGymResults(res.data.organizations);
          setShowResults(true);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [gymQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectOrg(org) {
    setSelectedOrg(org);
    setGymQuery(org.name);
    setShowResults(false);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === 'EMPLOYEE' && !selectedOrg) {
      toast.error('Please search and select your gym');
      return;
    }
    if (role === 'SUPERVISOR' && !organizationName.trim()) {
      toast.error('Please enter your gym / organization name');
      return;
    }
    setLoading(true);
    try {
      await register(
        name, email, password, role,
        null,
        role === 'SUPERVISOR' ? organizationName.trim() : null,
        role === 'EMPLOYEE' ? selectedOrg.id : null,
      );
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
                onClick={() => { setRole('EMPLOYEE'); setSelectedOrg(null); setGymQuery(''); }}
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

          {role === 'EMPLOYEE' && (
            <div className="relative" ref={searchRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Find Your Gym</label>
              <input
                type="text"
                value={gymQuery}
                onChange={(e) => { setGymQuery(e.target.value); setSelectedOrg(null); }}
                onFocus={() => gymResults.length > 0 && setShowResults(true)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="Type your gym name..."
              />
              {selectedOrg && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-brand-50 border border-brand-200 rounded-lg">
                  <svg className="w-4 h-4 text-brand-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-brand-700">{selectedOrg.name}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedOrg(null); setGymQuery(''); }}
                    className="ml-auto text-brand-400 hover:text-brand-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {showResults && gymResults.length > 0 && !selectedOrg && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {gymResults.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => selectOrg(org)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 hover:text-brand-700 border-b last:border-b-0"
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
              )}
              {showResults && gymQuery.length >= 1 && gymResults.length === 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                  <p className="text-sm text-gray-500 text-center">No gyms found matching "{gymQuery}"</p>
                  <p className="text-xs text-gray-400 text-center mt-1">Ask your employer for the correct gym name</p>
                </div>
              )}
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
