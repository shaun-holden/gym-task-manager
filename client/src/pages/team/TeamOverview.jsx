import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { isOverdue } from '../../utils/formatDate';

export default function TeamOverview() {
  const { user } = useAuth();
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeam() {
      try {
        const [usersRes, tasksRes, submissionsRes] = await Promise.all([
          api.get('/api/users'),
          api.get('/api/tasks'),
          api.get('/api/eod/submissions', {
            params: { date: new Date().toISOString().split('T')[0] },
          }),
        ]);

        const members = usersRes.data.users.filter((u) => u.id !== user.id);
        const tasks = tasksRes.data.tasks;
        const submissions = submissionsRes.data.submissions;

        const enriched = members.map((member) => {
          const memberTasks = tasks.filter((t) => t.assignedTo?.id === member.id);
          const incomplete = memberTasks.filter((t) => !t.isCompleted);
          const overdue = incomplete.filter((t) => isOverdue(t.dueDate));
          const eodSubmitted = submissions.some((s) => s.employee?.id === member.id);

          return { ...member, incompleteTasks: incomplete.length, overdueTasks: overdue.length, eodSubmitted };
        });

        setTeamData(enriched);
      } catch (err) {
        console.error('Failed to fetch team data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTeam();
  }, [user.id]);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Team Overview</h1>

      {teamData.length === 0 ? (
        <p className="text-gray-500">No team members found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamData.map((member) => (
            <div key={member.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{member.name}</h3>
                  <Badge value={member.role} />
                </div>
                <div className={`w-3 h-3 rounded-full ${member.eodSubmitted ? 'bg-green-400' : 'bg-yellow-400'}`}
                  title={member.eodSubmitted ? 'EOD submitted' : 'EOD pending'}
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Incomplete tasks</span>
                  <span className="font-medium text-gray-900">{member.incompleteTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Overdue tasks</span>
                  <span className={`font-medium ${member.overdueTasks > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {member.overdueTasks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Today's EOD</span>
                  <span className={`font-medium ${member.eodSubmitted ? 'text-green-600' : 'text-yellow-600'}`}>
                    {member.eodSubmitted ? 'Submitted' : 'Pending'}
                  </span>
                </div>
              </div>

              <Link
                to={`/tasks?assignedToId=${member.id}`}
                className="block mt-3 text-sm text-brand-600 hover:text-brand-700"
              >
                View tasks →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
