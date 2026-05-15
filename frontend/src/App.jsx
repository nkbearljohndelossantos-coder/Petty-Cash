import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Funds from './pages/Funds';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Logs from './pages/Logs';
import Profile from './pages/Profile';
import BackupRestore from './pages/BackupRestore';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-erp-blue"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

import { SocketProvider } from './context/SocketContext';

import EmailAutomation from './pages/EmailAutomation';
import QueueMonitor from './pages/QueueMonitor';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="funds" element={<Funds />} />
                <Route path="reports" element={<Reports />} />
                <Route path="categories" element={<Categories />} />
                <Route path="users" element={<Users />} />
                <Route path="email-automation" element={<EmailAutomation />} />
                <Route path="queue-monitor" element={<QueueMonitor />} />
                <Route path="settings" element={<Settings />} />
                <Route path="logs" element={<Logs />} />
                <Route path="profile" element={<Profile />} />
                <Route path="maintenance" element={<BackupRestore />} />
              </Route>

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
