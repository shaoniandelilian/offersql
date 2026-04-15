import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, KeyRound, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [debugCode, setDebugCode] = useState('');

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = window.setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('请输入正确邮箱');
      return;
    }
    setSending(true);
    setDebugCode('');
    try {
      const response = await authAPI.sendResetCode(email.trim().toLowerCase());
      if (!response.success) return;
      setCountdown(60);
      if (response.debugCode) {
        setDebugCode(response.debugCode);
      }
      toast.success('验证码已发送');
    } catch (error) {
      console.error('发送验证码失败', error);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('请输入正确邮箱');
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error('请输入 6 位验证码');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('新密码长度至少 6 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入密码不一致');
      return;
    }

    setSubmitting(true);
    try {
      const response = await authAPI.confirmResetPassword(email.trim().toLowerCase(), code.trim(), newPassword);
      if (!response.success) return;
      toast.success('密码重置成功，请重新登录');
      navigate('/login');
    } catch (error) {
      console.error('重置密码失败', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-cyan-50 to-amber-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800">找回密码</h1>
          <Link to="/login" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft size={14} className="mr-1" />
            返回登录
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱"
              className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6位验证码"
                className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm"
              />
            </div>
            <button
              type="button"
              disabled={sending || countdown > 0}
              onClick={handleSendCode}
              className="px-3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm text-slate-700 disabled:opacity-50"
            >
              {countdown > 0 ? `${countdown}s` : '发送验证码'}
            </button>
          </div>

          {debugCode && (
            <div className="text-xs rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
              开发模式验证码：{debugCode}
            </div>
          )}

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新密码（至少6位）"
              className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="确认新密码"
              className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? '提交中...' : '重置密码'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
