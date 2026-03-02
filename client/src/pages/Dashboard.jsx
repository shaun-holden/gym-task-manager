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

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        <div className={`bg-white rounded-xl border p-5 ${stats?.eodSubmitted ? 'border-green-200' : 'border-yellow-200'}`}>
          <p className="text-sm text-gray-500">Today's EOD</p>
          <p className={`text-2xl font-bold mt-1 ${stats?.eodSubmitted ? 'text-green-600' : 'text-yellow-600'}`}>
            {stats?.eodSubmitted ? 'Submitted' : 'Pending'}
          </p>
          {!stats?.eodSubmitted && (
            <Link to="/eod" className="text-sm text-brand-600 hover:text-brand-700 mt-2 inline-block">
              Complete EOD →
            </Link>
          )}
        </div>
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
