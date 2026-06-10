import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import DashboardLayout from './layouts/DashboardLayout';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Categories = lazy(() => import('./pages/Categories'));
const Departments = lazy(() => import('./pages/Departments'));
const Users = lazy(() => import('./pages/Users'));
const Funds = lazy(() => import('./pages/Funds'));
const Settings = lazy(() => import('./pages/Settings'));
const Reports = lazy(() => import('./pages/Reports'));
const Login = lazy(() => import('./pages/Login'));
const Logs = lazy(() => import('./pages/Logs'));
const Profile = lazy(() => import('./pages/Profile'));
const BackupRestore = lazy(() => import('./pages/BackupRestore'));
const EmailAutomation = lazy(() => import('./pages/EmailAutomation'));
const QueueMonitor = lazy(() => import('./pages/QueueMonitor'));
const ApprovalAction = lazy(() => import('./pages/ApprovalAction'));

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-erp-blue"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  const loadingFallback = (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-erp-blue"></div>
    </div>
  );

  return (
    <AuthProvider>
      <SocketProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Suspense fallback={loadingFallback}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/approval/approve/:token" element={<ApprovalAction mode="approve" />} />
                <Route path="/approval/decline/:token" element={<ApprovalAction mode="decline" />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="funds" element={
                    <ProtectedRoute allowedRoles={['Super Admin']}>
                      <Funds />
                    </ProtectedRoute>
                  } />
                  <Route path="reports" element={<Reports />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="departments" element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Accounting']}>
                      <Departments />
                    </ProtectedRoute>
                  } />
                  <Route path="users" element={
                    <ProtectedRoute allowedRoles={['Super Admin']}>
                      <Users />
                    </ProtectedRoute>
                  } />
                  <Route path="email-automation" element={
                    <ProtectedRoute allowedRoles={['Super Admin', 'Accounting']}>
                      <EmailAutomation />
                    </ProtectedRoute>
                  } />
                  <Route path="queue-monitor" element={
                    <ProtectedRoute allowedRoles={['Super Admin']}>
                      <QueueMonitor />
                    </ProtectedRoute>
                  } />
                  <Route path="settings" element={
                    <ProtectedRoute allowedRoles={['Super Admin']}>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="logs" element={
                    <ProtectedRoute allowedRoles={['Super Admin']}>
                      <Logs />
                    </ProtectedRoute>
                  } />
                  <Route path="profile" element={<Profile />} />
                  <Route path="maintenance" element={
                    <ProtectedRoute allowedRoles={['Super Admin']}>
                      <BackupRestore />
                    </ProtectedRoute>
                  } />
                </Route>

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ThemeProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
