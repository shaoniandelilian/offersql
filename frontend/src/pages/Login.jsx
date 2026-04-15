import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Database,
  Eye,
  EyeOff,
  User,
  Lock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';

const Login = () => {
  const PHONE_REGEX = /^1\d{10}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d~!@#$%^&*()_+\-=[\]{}|;:'",.<>/?]{8,20}$/;

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    account: '',
    phone: '',
    email: '',
    password: '',
  });
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [registerErrors, setRegisterErrors] = useState({
    phone: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (localStorage.getItem('auth_token')) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (mode === 'login') {
      setRegisterErrors({ phone: '', email: '', password: '' });
    }
  }, [mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (loginError) {
      setLoginError('');
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (mode === 'register' && ['phone', 'email', 'password'].includes(name)) {
      setRegisterErrors((prev) => ({
        ...prev,
        [name]: validateRegisterField(name, value),
      }));
    }
  };

  const validateRegisterField = (name, value) => {
    const trimmed = String(value || '').trim();
    if (name === 'phone') {
      if (!trimmed) return '请输入手机号';
      if (!PHONE_REGEX.test(trimmed)) return '手机号格式不正确（11位，以1开头）';
      return '';
    }
    if (name === 'email') {
      if (!trimmed) return '请输入邮箱';
      if (!EMAIL_REGEX.test(trimmed)) return '邮箱格式不正确';
      return '';
    }
    if (name === 'password') {
      if (!trimmed) return '请输入密码';
      if (!PASSWORD_REGEX.test(trimmed)) return '密码需8-20位，且包含字母和数字';
      return '';
    }
    return '';
  };

  const validateRegisterForm = () => {
    const errors = {
      phone: validateRegisterField('phone', formData.phone),
      email: validateRegisterField('email', formData.email),
      password: validateRegisterField('password', formData.password),
    };
    setRegisterErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const persistAuth = (response) => {
    localStorage.setItem('auth_token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setLoginError('');
    try {
      const response = await authAPI.guestLogin();
      if (!response.success) return;
      persistAuth(response);
      toast.success('已进入游客模式，仅可浏览');
      navigate('/');
    } catch (error) {
      const message = error?.response?.data?.error || '游客登录失败';
      setLoginError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (mode === 'login' && (!formData.account || !formData.password)) {
      toast.error('请填写手机号和密码');
      return;
    }
    if (mode === 'register' && (!formData.phone || !formData.password || !formData.email)) {
      toast.error('请填写手机号、邮箱和密码');
      return;
    }
    if (mode === 'register' && !validateRegisterForm()) {
      const firstError = [
        validateRegisterField('phone', formData.phone),
        validateRegisterField('email', formData.email),
        validateRegisterField('password', formData.password),
      ].find(Boolean) || '请检查注册信息';
      toast.error(firstError);
      return;
    }

    setIsLoading(true);
    try {
      const request = mode === 'register'
        ? authAPI.register(formData.phone, formData.password, formData.email)
        : authAPI.login(formData.account, formData.password);

      const response = await request;
      if (!response.success) return;

      persistAuth(response);
      toast.success(mode === 'register' ? '注册成功，已自动登录' : '登录成功');
      navigate('/');
    } catch (error) {
      const fallback = mode === 'register'
        ? '注册失败，请稍后重试'
        : '登录失败，请检查手机号和密码后重试';
      const message = error?.response?.data?.error || fallback;
      setLoginError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-cyan-50 to-amber-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-36 -left-28 w-[30rem] h-[30rem] bg-cyan-200 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -right-24 w-[30rem] h-[30rem] bg-amber-200 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0f766e 1px, transparent 1px),
            linear-gradient(to bottom, #0f766e 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px'
        }}
      />

      <div className="max-w-md w-full space-y-7 relative z-10">
        {/* Logo 区域 */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-6 transform hover:scale-105 transition-transform duration-300">
            <Database className="h-8 w-8 text-white" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700 mb-3">OfferSQL</p>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-teal-900 to-cyan-900 bg-clip-text text-transparent">
            手撕 SQL，冲刺 Offer
          </h2>
          <p className="mt-3 text-gray-600 leading-relaxed">
            专注 SQL 面试训练的实战平台，覆盖手撕 SQL、面试真题、大厂题库。
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['手撕 SQL', '面试真题', '大厂题库'].map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-teal-700 border border-teal-100 shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 登录表单 */}
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-300/50 p-8 border border-white/60">
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === 'register' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              注册
            </button>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {loginError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {loginError}
              </div>
            )}
            {/* 手机号输入 */}
            <div className="relative">
              <label
                htmlFor={mode === 'register' ? 'phone' : 'account'}
                className={`absolute left-12 transition-all duration-200 pointer-events-none ${
                  focusedField === (mode === 'register' ? 'phone' : 'account')
                    || (mode === 'register' ? formData.phone : formData.account)
                    ? '-top-2 text-xs text-teal-700 bg-white px-1'
                    : 'top-3.5 text-gray-400'
                }`}
              >
                手机号
              </label>
              <div className="absolute left-4 top-3.5 text-gray-400">
                <User className="h-5 w-5" />
              </div>
              <input
                id={mode === 'register' ? 'phone' : 'account'}
                name={mode === 'register' ? 'phone' : 'account'}
                type="text"
                value={mode === 'register' ? formData.phone : formData.account}
                onChange={handleChange}
                onFocus={() => setFocusedField(mode === 'register' ? 'phone' : 'account')}
                onBlur={() => setFocusedField(null)}
                maxLength={mode === 'register' ? 11 : 64}
                inputMode={mode === 'register' ? 'numeric' : 'text'}
                className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 placeholder-transparent focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200 bg-gray-50/50"
                placeholder="手机号"
              />
              {mode === 'register' && registerErrors.phone && (
                <p className="mt-2 text-xs text-red-600">{registerErrors.phone}</p>
              )}
            </div>

            {/* 密码输入 */}
            {mode === 'register' && (
              <div className="relative">
                <label
                  htmlFor="email"
                  className={`absolute left-12 transition-all duration-200 pointer-events-none ${
                    focusedField === 'email' || formData.email
                      ? '-top-2 text-xs text-teal-700 bg-white px-1'
                      : 'top-3.5 text-gray-400'
                  }`}
                >
                  邮箱
                </label>
                <div className="absolute left-4 top-3.5 text-gray-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 placeholder-transparent focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200 bg-gray-50/50"
                  placeholder="邮箱"
                />
                {registerErrors.email && (
                  <p className="mt-2 text-xs text-red-600">{registerErrors.email}</p>
                )}
              </div>
            )}

            {/* 密码输入 */}
            <div className="relative">
              <label
                htmlFor="password"
                className={`absolute left-12 transition-all duration-200 pointer-events-none ${
                  focusedField === 'password' || formData.password
                    ? '-top-2 text-xs text-teal-700 bg-white px-1'
                    : 'top-3.5 text-gray-400'
                }`}
              >
                密码
              </label>
              <div className="absolute left-4 top-3.5 text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className="block w-full pl-12 pr-12 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 placeholder-transparent focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all duration-200 bg-gray-50/50"
                placeholder="密码"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
              {mode === 'register' && registerErrors.password && (
                <p className="mt-2 text-xs text-red-600">{registerErrors.password}</p>
              )}
              {mode === 'register' && !registerErrors.password && (
                <p className="mt-2 text-xs text-slate-500">密码需 8-20 位，至少包含字母和数字</p>
              )}
            </div>

            {mode === 'login' && (
              <div className="flex justify-end -mt-2">
                <Link
                  to="/forgot-password"
                  className="text-sm text-teal-700 hover:text-teal-800 font-medium"
                >
                  忘记密码？
                </Link>
              </div>
            )}


            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-0.5"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  处理中...
                </div>
              ) : (
                <div className="flex items-center">
                  {mode === 'register' ? '注册并登录' : '登录'}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="mt-4 w-full py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            游客浏览模式（只看不做）
          </button>

        </div>

        {/* 特性展示 */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { icon: Database, text: '手撕 SQL' },
            { icon: CheckCircle2, text: '面试真题' },
            { icon: ArrowRight, text: '大厂题库' }
          ].map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-white/55 backdrop-blur-sm border border-white/70"
            >
              <feature.icon className="h-6 w-6 text-teal-600 mb-2" />
              <span className="text-xs text-gray-600 font-medium">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
