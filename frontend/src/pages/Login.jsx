import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  Lock,
  Mail,
  QrCode,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d~!@#$%^&*()_+\-=[\]{}|;:'",.<>/?]{8,20}$/;
const WECHAT_SCRIPT_ID = 'offersql-wechat-login-sdk';
const WECHAT_SCRIPT_SRC = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function loadWechatLoginScript() {
  if (window.WxLogin) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(WECHAT_SCRIPT_ID);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = WECHAT_SCRIPT_ID;
    script.src = WECHAT_SCRIPT_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

const fieldBaseClassName =
  'block w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 py-3.5 text-[15px] text-slate-900 shadow-sm shadow-slate-200/40 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const wechatContainerId = useMemo(
    () => `wechat-login-container-${Math.random().toString(36).slice(2, 10)}`,
    []
  );
  const hasRenderedWechatRef = useRef(false);

  const [mode, setMode] = useState(location.state?.mode === 'register' ? 'register' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [registerErrors, setRegisterErrors] = useState({
    email: '',
    password: '',
  });
  const [wechatConfig, setWechatConfig] = useState({
    loading: true,
    enabled: false,
    appid: '',
    callbackUrl: '',
    state: '',
    error: '',
  });

  useEffect(() => {
    if (localStorage.getItem('auth_token')) {
      navigate('/app');
    }
  }, [navigate]);

  useEffect(() => {
    let mounted = true;

    const initWechat = async () => {
      try {
        const response = await authAPI.getWechatConfig();
        if (!mounted) return;

        if (!response?.success) {
          throw new Error('获取微信登录配置失败');
        }

        const config = response.data || {};
        if (!config.enabled) {
          setWechatConfig({
            loading: false,
            enabled: false,
            appid: '',
            callbackUrl: '',
            state: '',
            error: '',
          });
          return;
        }

        setWechatConfig({
          loading: false,
          enabled: true,
          appid: config.appid,
          callbackUrl: config.callbackUrl,
          state: config.state,
          error: '',
        });
      } catch (error) {
        if (!mounted) return;
        setWechatConfig({
          loading: false,
          enabled: false,
          appid: '',
          callbackUrl: '',
          state: '',
          error: error?.response?.data?.error || error.message || '微信登录暂不可用',
        });
      }
    };

    initWechat();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!wechatConfig.enabled || !wechatConfig.appid || !wechatConfig.state || mode !== 'login') {
      return undefined;
    }
    if (hasRenderedWechatRef.current) {
      return undefined;
    }

    let cancelled = false;

    const renderWechatLogin = async () => {
      try {
        await loadWechatLoginScript();
        if (cancelled || !window.WxLogin) {
          return;
        }

        const redirectUri = encodeURIComponent(wechatConfig.callbackUrl);
        const container = document.getElementById(wechatContainerId);
        if (!container) {
          return;
        }

        container.innerHTML = '';
        hasRenderedWechatRef.current = true;
        new window.WxLogin({
          self_redirect: false,
          id: wechatContainerId,
          appid: wechatConfig.appid,
          scope: 'snsapi_login',
          redirect_uri: redirectUri,
          state: wechatConfig.state,
          style: 'black',
          href: '',
        });
      } catch (error) {
        if (!cancelled) {
          setWechatConfig((prev) => ({
            ...prev,
            enabled: false,
            error: '微信扫码组件加载失败，请稍后重试',
          }));
        }
      }
    };

    renderWechatLogin();
    return () => {
      cancelled = true;
    };
  }, [mode, wechatConfig, wechatContainerId]);

  useEffect(() => {
    if (mode === 'login') {
      setRegisterErrors({ email: '', password: '' });
    } else {
      hasRenderedWechatRef.current = false;
    }
  }, [mode]);

  const persistAuth = (response) => {
    localStorage.setItem('auth_token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('isLoggedIn', 'true');
  };

  const validateRegisterField = (name, value) => {
    const trimmed = String(value || '').trim();
    if (name === 'email') {
      if (!trimmed) return '请输入邮箱';
      if (!EMAIL_REGEX.test(trimmed)) return '邮箱格式不正确';
      return '';
    }
    if (name === 'password') {
      if (!trimmed) return '请输入密码';
      if (!PASSWORD_REGEX.test(trimmed)) return '密码需 8-20 位，且包含字母和数字';
      return '';
    }
    return '';
  };

  const validateRegisterForm = () => {
    const errors = {
      email: validateRegisterField('email', formData.email),
      password: validateRegisterField('password', formData.password),
    };
    setRegisterErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (loginError) {
      setLoginError('');
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (mode === 'register' && ['email', 'password'].includes(name)) {
      setRegisterErrors((prev) => ({
        ...prev,
        [name]: validateRegisterField(name, value),
      }));
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setLoginError('');
    try {
      const response = await authAPI.guestLogin();
      if (!response.success) return;
      persistAuth(response);
      toast.success('已进入游客模式，仅可浏览');
      navigate('/app');
    } catch (error) {
      setLoginError(error?.response?.data?.error || '游客登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    const email = normalizeEmail(formData.email);
    if (!email || !formData.password) {
      toast.error('请填写邮箱和密码');
      return;
    }
    if (mode === 'register' && !validateRegisterForm()) {
      const firstError = [
        validateRegisterField('email', formData.email),
        validateRegisterField('password', formData.password),
      ].find(Boolean) || '请检查注册信息';
      toast.error(firstError);
      return;
    }

    setIsLoading(true);
    try {
      const response = mode === 'register'
        ? await authAPI.register(email, formData.password)
        : await authAPI.login(email, formData.password);

      if (!response.success) return;

      persistAuth(response);
      toast.success(mode === 'register' ? '注册成功，已自动登录' : '登录成功');
      navigate('/app');
    } catch (error) {
      const fallback = mode === 'register'
        ? '注册失败，请稍后重试'
        : '登录失败，请检查邮箱和密码后重试';
      setLoginError(error?.response?.data?.error || fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const renderWechatPanel = () => (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <QrCode className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">微信扫码登录</h2>
          <p className="mt-1 text-sm text-slate-500">打开微信扫一扫，快速回到练习区。</p>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 min-h-[360px] flex flex-col">
        {wechatConfig.loading && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-4 h-8 w-8 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin" />
            <p className="text-sm text-slate-600">正在加载微信登录...</p>
          </div>
        )}

        {!wechatConfig.loading && !wechatConfig.enabled && (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <QrCode className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">当前环境暂不可用</p>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              {wechatConfig.error || '请稍后重试微信登录。'}
            </p>
          </div>
        )}

        {!wechatConfig.loading && wechatConfig.enabled && (
          <>
            <div
              id={wechatContainerId}
              className="flex flex-1 items-center justify-center overflow-hidden rounded-[20px] bg-white"
            />
            <p className="mt-4 text-center text-xs leading-6 text-slate-500">
              扫码确认后会自动进入你的练习区。
            </p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f7fbfb_0%,_#f8fbff_54%,_#fbfcf8_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-md shadow-cyan-500/20">
            <Database className="h-7 w-7 text-white" />
          </div>
          <p className="mb-2 text-sm font-semibold text-teal-700">OfferSQL</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">欢迎回来</h1>
          <p className="mt-2 text-sm text-slate-500">继续你的 SQL 练习</p>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="grid">
            <section className="p-6 sm:p-8">
              <div className="mb-8 flex w-full rounded-2xl bg-slate-100 p-1.5">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`h-12 flex-1 rounded-xl text-sm font-semibold transition-all ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  登录
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`h-12 flex-1 rounded-xl text-sm font-semibold transition-all ${
                    mode === 'register'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  注册
                </button>
              </div>

              <div className={`${mode === 'login' ? 'max-w-none' : 'mx-auto max-w-xl'}`}>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {mode === 'login' ? '邮箱登录' : '创建邮箱账号'}
                  </h2>
                </div>

                {loginError && (
                  <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {loginError}
                  </div>
                )}

                <div className={`grid gap-8 ${mode === 'login' ? 'lg:grid-cols-[minmax(0,1fr)_300px]' : 'lg:grid-cols-1'}`}>
                  <div>
                    <form className="space-y-5" onSubmit={handleSubmit}>
                      <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                          邮箱
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                          <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete={mode === 'login' ? 'email' : 'new-email'}
                            value={formData.email}
                            onChange={handleChange}
                            className={`${fieldBaseClassName} pr-4`}
                            placeholder="you@example.com"
                          />
                        </div>
                        {mode === 'register' && registerErrors.email && (
                          <p className="mt-2 text-xs text-rose-600">{registerErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                            密码
                          </label>
                          {mode === 'login' && (
                            <Link
                              to="/forgot-password"
                              className="text-sm font-medium text-teal-700 hover:text-teal-800"
                            >
                              忘记密码？
                            </Link>
                          )}
                        </div>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            value={formData.password}
                            onChange={handleChange}
                            className={fieldBaseClassName}
                            placeholder={mode === 'login' ? '输入密码' : '8-20 位，包含字母和数字'}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {mode === 'register' && registerErrors.password && (
                          <p className="mt-2 text-xs text-rose-600">{registerErrors.password}</p>
                        )}
                        {mode === 'register' && !registerErrors.password && (
                          <p className="mt-2 text-xs text-slate-500">密码需 8-20 位，且至少包含字母和数字。</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="group flex h-[52px] w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition-all hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="mr-2 h-5 w-5 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                            处理中...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            {mode === 'register' ? '注册并开始练习' : '登录'}
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        )}
                      </button>
                    </form>

                    <div className="mt-5 flex items-center justify-between gap-4 text-sm">
                      <button
                        type="button"
                        onClick={handleGuestLogin}
                        disabled={isLoading}
                        className="font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        先随便看看
                      </button>
                    </div>
                  </div>

                  {mode === 'login' && (
                    <div className="lg:pl-2">
                      <div className="mb-4 hidden items-center gap-3 lg:flex">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs font-medium tracking-[0.18em] text-slate-400">或</span>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>
                      {renderWechatPanel()}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
