import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import SQLEditor from './pages/SQLEditor';
import SchemaViewer from './pages/SchemaViewer';
import InterviewQuestions from './pages/InterviewQuestions';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminUsers from './pages/AdminUsers';
import Contributions from './pages/Contributions';
import AdminContributions from './pages/AdminContributions';

// 简单的路由保护组件
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' && Boolean(token);
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SQLEditor />} />
          <Route path="schema" element={<SchemaViewer />} />
          <Route path="questions" element={<InterviewQuestions />} />
          <Route path="contributions" element={<Contributions />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/contributions" element={<AdminContributions />} />
        </Route>
        <Route path="/schema" element={<Navigate to="/app/schema" replace />} />
        <Route path="/questions" element={<Navigate to="/app/questions" replace />} />
        <Route path="/contributions" element={<Navigate to="/app/contributions" replace />} />
        <Route path="/admin/users" element={<Navigate to="/app/admin/users" replace />} />
        <Route path="/admin/contributions" element={<Navigate to="/app/admin/contributions" replace />} />
      </Routes>
    </div>
  );
}

export default App;
