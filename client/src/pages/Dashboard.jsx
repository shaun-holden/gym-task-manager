import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { isOverdue } from '../utils/formatDate';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [tasksRes, eodRes] = await Promise.all([
          api.get('/api/tasks'),
          api.get('/api/eod/submissions', { params: { date: new Date().toISOString().split('T')[0] } }),
        ]);

        const tasks = tasksRes.data.tasks;
        const submissions = eodRes.data.submissions;

        const incomplete = tasks.filter((t) => !t.isCompleted);
        const overdue = incomplete.filter((t) => isOverdue(t.dueDate));
        const completedToday = tasks.filter(
          (t) => t.isCompleted && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()
        );

        const data = {
          totalTasks: tasks.length,
          incompleteTasks: incomplete.length,
          overdueTasks: overdue.length,
          completedToday: completedToday.length,
          eodSubmitted: submissions.some((s) => s.employee.id === user.id),
          submissions,
          recentTasks: incomplete.slice(0, 5),
        };

        // Supervisor/Admin team stats
        if (user.role !== 'EMPLOYEE') {
          const usersRes = await api.get('/api/users');
          const teamMembers = usersRes.data.users.filter((u) => u.id !== user.id);
          const submittedIds = submissions.map((s) => s.employee.id);
          const pendingEods = teamMembers.filter(
            (u) => u.role === 'EMPLOYEE' && !submittedIds.includes(u.id)
          );
          data.teamCount = teamMembers.length;
          data.pendingEods = pendingEods;
        }

        setStats(data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [user]);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Welcome back, {user.name}
      </h1>

      {/* EOD Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className={`rounded-xl border-2 p-6 ${stats?.eodSubmitted ? 'bg-green-50 border-green-200' : 'bg-gradient-to-br from-brand-50 to-brand-100 border-brand-200'}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg className={`w-6 h-6 ${stats?.eodSubmitted ? 'text-green-600' : 'text-brand-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-lg font-bold text-gray-900">End of Day Report</h2>
              </div>
              <p className={`text-sm ${stats?.eodSubmitted ? 'text-green-700' : 'text-gray-600'}`}>
                {stats?.eodSubmitted
                  ? 'You\'ve already submitted your EOD for today.'
                  : 'Submit your daily end-of-day report before you leave.'}
              </p>
            </div>
            {stats?.eodSubmitted && (
              <span className="flex items-center gap-1 text-green-700 bg-green-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Done
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            {!stats?.eodSubmitted ? (
              <Link
                to="/eod"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Submit EOD Now
              </Link>
            ) : (
              <Link
                to="/eod"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-700 text-sm font-medium rounded-lg border border-green-300 hover:bg-green-50"
              >
                View Submission
              </Link>
            )}
            <Link
              to="/eod/submissions"
              className="text-sm text-gray-600 hover:text-brand-600 font-medium"
            >
              Past Submissions
            </Link>
          </div>
        </div>

        {user.role !== 'EMPLOYEE' && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-6">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-900">EOD Templates</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Create and manage end-of-day report templates for your team.
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/eod/templates/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Template
              </Link>
              <Link
                to="/eod/templates"
                className="text-sm text-purple-700 hover:text-purple-800 font-medium"
              >
                Manage Templates
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Incomplete Tasks"
          value={stats?.incompleteTasks || 0}
          color="text-brand-600"
          link="/tasks?isCompleted=false"
        />
        <StatCard
          label="Overdue Tasks"
          value={stats?.overdueTasks || 0}
          color={stats?.overdueTasks > 0 ? 'text-red-600' : 'text-green-600'}
          link="/tasks"
        />
        <StatCard
          label="Completed Today"
          value={stats?.completedToday || 0}
          color="text-green-600"
        />
      </div>

      {/* Recent tasks */}
      {stats?.recentTasks?.length > 0 && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h2>
            <Link to="/tasks" className="text-sm text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentTasks.map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border ${isOverdue(task.dueDate) ? 'border-red-200 bg-red-50/50' : 'border-gray-100'}`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.assignedTo?.name}</p>
                </div>
                {task.dueDate && (
                  <span className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                    {isOverdue(task.dueDate) ? 'Overdue' : `Due ${new Date(task.dueDate).toLocaleDateString()}`}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Team overview for supervisors/admins */}
      {user.role !== 'EMPLOYEE' && stats?.pendingEods && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Overview</h2>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Team members: <span className="font-medium">{stats.teamCount}</span>
              </p>
              <p className="text-sm text-gray-600">
                Pending EODs today: <span className="font-medium text-yellow-600">{stats.pendingEods.length}</span>
              </p>
            </div>
            <Link to="/team" className="text-sm text-brand-600 hover:text-brand-700 mt-3 inline-block">
              View team →
            </Link>
          </div>

          {stats.pendingEods.length > 0 && (
            <div className="bg-white rounded-xl border border-yellow-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending EODs</h2>
              <div className="space-y-2">
                {stats.pendingEods.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="text-gray-700">{u.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, link }) {
  const content = (
    <div className="bg-white rounded-xl border p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );

  if (link) return <Link to={link}>{content}</Link>;
  return content;
}
