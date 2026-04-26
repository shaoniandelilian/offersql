import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Database, Menu, X, BookOpen, LogOut, Shield, PenSquare, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    toast.success('已退出登录');
    navigate('/login');
  };

  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (error) {
    currentUser = {};
  }

  const navItems = [
    { path: '/app/questions', label: '面试题库', icon: BookOpen },
    { path: '/app/schema', label: '数据库结构', icon: Database },
    { path: '/app/contributions', label: '贡献题目', icon: PenSquare },
  ];
  if (currentUser.role === 'ADMIN') {
    navItems.push({ path: '/app/admin/users', label: '用户管理', icon: Shield });
    navItems.push({ path: '/app/admin/contributions', label: '投稿审核', icon: BadgeCheck });
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`relative flex flex-col bg-white shadow-lg transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          {isSidebarOpen && (
            <h1
              className="text-xl font-bold text-gray-800 cursor-pointer"
              onClick={() => navigate('/app')}
              title="进入 SQL 编辑器"
            >
              OfferSQL
            </h1>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t space-y-2">
          <button
            onClick={handleLogout}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors w-full text-red-600 hover:bg-red-50 ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>退出登录</span>}
          </button>
          {isSidebarOpen && (
            <div className="text-xs text-gray-500 pt-2">
              <p>仅支持 SELECT / WITH</p>
              <p>EXPLAIN</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
