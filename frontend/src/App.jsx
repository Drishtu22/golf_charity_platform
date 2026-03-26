import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '@/context/authStore';
import api from '@/services/api';

// Layouts
import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminLayout from '@/components/layout/AdminLayout';

// Public Pages
import HomePage from '@/pages/public/HomePage';
import CharitiesPage from '@/pages/public/CharitiesPage';
import CharityDetailPage from '@/pages/public/CharityDetailPage';
import HowItWorksPage from '@/pages/public/HowItWorksPage';
import SubscribePage from '@/pages/public/SubscribePage';
import LoginPage from '@/pages/public/LoginPage';
import RegisterPage from '@/pages/public/RegisterPage';

// User Dashboard Pages
import DashboardHome from '@/pages/user/DashboardHome';
import ScoresPage from '@/pages/user/ScoresPage';
import WinningsPage from '@/pages/user/WinningsPage';
import SettingsPage from '@/pages/user/SettingsPage';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminDrawsPage from '@/pages/admin/AdminDrawsPage';
import AdminCharitiesPage from '@/pages/admin/AdminCharitiesPage';
import AdminWinnersPage from '@/pages/admin/AdminWinnersPage';

// Guards
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AdminRoute from '@/components/common/AdminRoute';

export default function App() {
  const { isAuthenticated, accessToken, fetchMe } = useAuthStore();

  // Sync stored token to axios headers on mount
  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      fetchMe();
    }
  }, []);

  return (
    <Routes>
      {/* ─── Public ─────────────────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/charities" element={<CharitiesPage />} />
        <Route path="/charities/:id" element={<CharityDetailPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/subscribe" element={<SubscribePage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      </Route>

      {/* ─── User Dashboard ─────────────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/dashboard/scores" element={<ScoresPage />} />
          <Route path="/dashboard/winnings" element={<WinningsPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* ─── Admin ──────────────────────────────────────────────────── */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/draws" element={<AdminDrawsPage />} />
          <Route path="/admin/charities" element={<AdminCharitiesPage />} />
          <Route path="/admin/winners" element={<AdminWinnersPage />} />
        </Route>
      </Route>

      {/* ─── 404 ────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
