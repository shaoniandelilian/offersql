import React, { useEffect, useMemo, useState } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../utils/api';

const PAID_LIBRARY_OPTIONS = [
  { id: 'analysis_product', label: '数据分析与产品题库' },
  { id: 'data_engineering', label: '数据开发题库' },
];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      return {};
    }
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.listUsers();
      if (response.success) {
        setUsers(response.data || []);
      }
    } catch (error) {
      console.error('加载用户列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updatePlan = async (userId, plan) => {
    setSavingUserId(userId);
    try {
      const response = await adminAPI.updateUserPlan(userId, plan);
      if (!response.success) return;

      setUsers((prev) => prev.map((u) => (
        u.id === userId ? { ...u, plan: response.data.plan } : u
      )));
      toast.success(`套餐已更新为 ${response.data.plan}`);
    } catch (error) {
      console.error('更新套餐失败', error);
    } finally {
      setSavingUserId(null);
    }
  };

  const updateLibraryPermissions = async (userId, libraryPermissions) => {
    setSavingUserId(userId);
    try {
      const response = await adminAPI.updateUserLibraryPermissions(userId, libraryPermissions);
      if (!response.success) return;
      setUsers((prev) => prev.map((u) => (
        u.id === userId ? { ...u, libraryPermissions: response.data.libraryPermissions || [] } : u
      )));
      toast.success('题库权限已更新');
    } catch (error) {
      console.error('更新题库权限失败', error);
    } finally {
      setSavingUserId(null);
    }
  };

  const toggleLibraryPermission = (user, permissionId) => {
    const current = Array.isArray(user.libraryPermissions) ? user.libraryPermissions : [];
    const next = current.includes(permissionId)
      ? current.filter((x) => x !== permissionId)
      : [...current, permissionId];
    updateLibraryPermissions(user.id, next);
  };

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="p-8">
        <div className="bg-white border rounded-xl p-6 text-gray-600">
          仅管理员可访问该页面。
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Shield className="mr-2 text-indigo-600" size={26} />
            用户与套餐管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">管理注册用户套餐和付费题库单独权限</p>
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          <RefreshCw size={16} />
          <span>刷新</span>
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        {loading ? (
          <div className="text-gray-500">加载中...</div>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">用户ID</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">用户名</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">角色</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">套餐</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">付费题库权限</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{u.username}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={u.plan}
                        disabled={savingUserId === u.id || u.role === 'ADMIN'}
                        onChange={(e) => updatePlan(u.id, e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-sm disabled:bg-gray-100"
                      >
                        <option value="FREE">FREE</option>
                        <option value="PRO">PRO</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="space-y-1.5">
                        {PAID_LIBRARY_OPTIONS.map((option) => {
                          const checked = Array.isArray(u.libraryPermissions)
                            && u.libraryPermissions.includes(option.id);
                          return (
                            <label key={option.id} className="flex items-center gap-2 text-xs text-gray-700">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={savingUserId === u.id || u.role === 'ADMIN'}
                                onChange={() => toggleLibraryPermission(u, option.id)}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                              />
                              <span>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
