import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/layout/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import InstallPrompt from './components/InstallPrompt';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/tasks/TaskList';
import TaskForm from './pages/tasks/TaskForm';
import TaskDetail from './pages/tasks/TaskDetail';
import EodForm from './pages/eod/EodForm';
import EodTemplateList from './pages/eod/EodTemplateList';
import EodTemplateForm from './pages/eod/EodTemplateForm';
import EodSubmissions from './pages/eod/EodSubmissions';
import EodSubmissionDetail from './pages/eod/EodSubmissionDetail';
import TeamOverview from './pages/team/TeamOverview';
import UserManagement from './pages/admin/UserManagement';
import OrganizationManagement from './pages/admin/OrganizationManagement';
import Notifications from './pages/Notifications';
import Resources from './pages/Resources';
import UrgentNotificationPopup from './components/UrgentNotificationPopup';

function AuthedUrgentPopup() {
  const { user } = useAuth();
  if (!user) return null;
  return <UrgentNotificationPopup />;
}

function ProtectedRoute({ children, requiredRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner size="lg" />;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Navbar />
      <AuthedUrgentPopup />
      <ErrorBoundary>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          {/* Tasks */}
          <Route path="/tasks" element={
            <ProtectedRoute><TaskList /></ProtectedRoute>
          } />
          <Route path="/tasks/new" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'SUPERVISOR']}><TaskForm /></ProtectedRoute>
          } />
          <Route path="/tasks/:id" element={
            <ProtectedRoute><TaskDetail /></ProtectedRoute>
          } />
          <Route path="/tasks/:id/edit" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'SUPERVISOR']}><TaskForm /></ProtectedRoute>
          } />

          {/* EOD */}
          <Route path="/eod" element={
            <ProtectedRoute><EodForm /></ProtectedRoute>
          } />
          <Route path="/eod/templates" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'SUPERVISOR']}><EodTemplateList /></ProtectedRoute>
          } />
          <Route path="/eod/templates/new" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'SUPERVISOR']}><EodTemplateForm /></ProtectedRoute>
          } />
          <Route path="/eod/templates/:id/edit" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'SUPERVISOR']}><EodTemplateForm /></ProtectedRoute>
          } />
          <Route path="/eod/submissions" element={
            <ProtectedRoute><EodSubmissions /></ProtectedRoute>
          } />
          <Route path="/eod/submissions/:id" element={
            <ProtectedRoute><EodSubmissionDetail /></ProtectedRoute>
          } />

          {/* Team & Admin */}
          <Route path="/team" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'SUPERVISOR']}><TeamOverview /></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRoles={['ADMIN']}><UserManagement /></ProtectedRoute>
          } />
          <Route path="/admin/organizations" element={
            <ProtectedRoute requiredRoles={['ADMIN']}><OrganizationManagement /></ProtectedRoute>
          } />

          {/* Resources */}
          <Route path="/resources" element={
            <ProtectedRoute><Resources /></ProtectedRoute>
          } />

          {/* Notifications */}
          <Route path="/notifications" element={
            <ProtectedRoute><Notifications /></ProtectedRoute>
          } />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      </ErrorBoundary>
      <InstallPrompt />
    </BrowserRouter>
  );
}
