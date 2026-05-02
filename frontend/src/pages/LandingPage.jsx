import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  BookOpen,
  Briefcase,
  Code2,
  GitMerge,
  GraduationCap,
  Layers,
  LineChart,
  Play,
  ShieldCheck,
  Star,
  Table2,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { authAPI } from '../utils/api';

const isLoggedIn = () =>
  localStorage.getItem('isLoggedIn') === 'true' &&
  Boolean(localStorage.getItem('auth_token'));

const navItems = [
  { label: '题目分类', href: '#categories' },
  { label: '训练路径', href: '#audiences' },
  { label: '业务场景', href: '#scenarios' },
  { label: '常见问题', href: '#faq' },
];

const stats = [
  { value: '43+', label: '精选真题', sub: '覆盖核心考点', icon: BookOpen, tone: 'bg-cyan-300 text-slate-950' },
  { value: '7 类', label: '高频题型', sub: '系统化专项突破', icon: Layers, tone: 'bg-emerald-300 text-slate-950' },
  { value: '3 大', label: '业务方向', sub: '电商 / 社交 / 出行', icon: Briefcase, tone: 'bg-blue-100 text-slate-900' },
  { value: '15 道', label: '免费体验', sub: '注册即可上手', icon: Star, tone: 'bg-sky-100 text-slate-900' },
];

const categories = [
  {
    icon: BarChart2,
    name: '聚合统计',
    level: '简单',
    desc: '基础的数据求和、平均值计算等基础操作。',
    companies: '字节跳动、快手',
    tags: ['COUNT', 'SUM', 'AVG'],
    progress: '82%',
    bar: 'bg-teal-700',
  },
  {
    icon: GitMerge,
    name: '多表关联',
    level: '中等',
    desc: 'JOIN 操作实战，处理复杂业务关系的必备技能。',
    companies: '美团、滴滴',
    tags: ['LEFT JOIN', 'INNER JOIN'],
    progress: '64%',
    bar: 'bg-teal-700',
  },
  {
    icon: TrendingUp,
    name: '分组排序',
    level: '中等',
    desc: 'GROUP BY 与 ORDER BY 的综合运用。',
    companies: '腾讯、京东',
    tags: ['GROUP BY', 'HAVING'],
    progress: '56%',
    bar: 'bg-teal-700',
  },
  {
    icon: Layers,
    name: '窗口函数',
    level: '困难',
    desc: '入厂必考：排名、累计、滑动窗口高级分析。',
    companies: '阿里、字节、美团',
    tags: ['ROW_NUMBER', 'RANK', 'OVER'],
    progress: '28%',
    bar: 'bg-red-700',
  },
  {
    icon: Table2,
    name: '行列转换',
    level: '困难',
    desc: '数据透视核心，解决报表格式转换难题。',
    companies: '拼多多、网易',
    tags: ['CASE WHEN', 'PIVOT'],
    progress: '32%',
    bar: 'bg-red-700',
  },
  {
    icon: LineChart,
    name: '留存分析',
    level: '困难',
    desc: '经典业务场景，次日/七日留存率计算实战。',
    companies: '腾讯、小红书',
    tags: ['SELF JOIN', 'DATEDIFF'],
    progress: '24%',
    bar: 'bg-red-700',
  },
];

const audiences = [
  {
    icon: GraduationCap,
    title: '应届生冲刺',
    desc: '从基础语法到高频真题，快速建立面试答题手感。',
  },
  {
    icon: Users,
    title: '数据分析转岗',
    desc: '围绕指标、留存、漏斗和分群题，贴近真实业务分析。',
  },
  {
    icon: Code2,
    title: '数仓开发进阶',
    desc: '强化关联、窗口函数和复杂转换，补齐高阶 SQL 能力。',
  },
];

const scenarios = [
  '电商 GMV',
  '社交关系',
  '出行订单',
  '内容消费',
  '直播打赏',
  '金融风控',
];

const faqs = [
  { q: '题目是否可以在线运行？', a: '可以。练习区支持在线编写 SQL、运行并查看结果反馈。' },
  { q: '未付费能否体验？', a: '可以。平台保留免费题目和游客体验入口，适合先熟悉流程。' },
  { q: '适合零基础吗？', a: '适合。题型从聚合、分组开始，再逐步进入窗口函数和留存分析。' },
];

const levelClassName = {
  简单: 'bg-teal-50 text-teal-700 ring-teal-100',
  中等: 'bg-slate-100 text-slate-700 ring-slate-200',
  困难: 'bg-slate-100 text-slate-800 ring-slate-200',
};

const categoryToneMap = {
  简单: {
    icon: 'bg-slate-100 text-slate-900 ring-slate-200/70 group-hover:bg-teal-50 group-hover:text-teal-800 group-hover:ring-teal-100',
    chip: 'bg-slate-100/80 text-slate-600 ring-slate-200/70',
  },
  中等: {
    icon: 'bg-slate-100 text-slate-900 ring-slate-200/70 group-hover:bg-teal-50 group-hover:text-teal-800 group-hover:ring-teal-100',
    chip: 'bg-slate-100/80 text-slate-600 ring-slate-200/70',
  },
  困难: {
    icon: 'bg-slate-100 text-slate-900 ring-slate-200/70 group-hover:bg-teal-50 group-hover:text-teal-800 group-hover:ring-teal-100',
    chip: 'bg-slate-100/80 text-slate-600 ring-slate-200/70',
  },
};

const PageShell = ({ children, className = '' }) => (
  <section className={`px-5 sm:px-8 ${className}`}>
    <div className="mx-auto max-w-7xl">{children}</div>
  </section>
);

const SectionTitle = ({ eyebrow, title, desc }) => (
  <div className="mx-auto mb-12 max-w-2xl text-center">
    <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-teal-700">{eyebrow}</p>
    <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
    <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{desc}</p>
  </div>
);

const Navbar = ({ loggedIn, onStart, onRegister }) => (
  <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
      <button type="button" onClick={onStart} className="text-lg font-black tracking-tight text-slate-950">
        OfferSQL
      </button>

      <nav className="hidden items-center gap-10 text-sm font-medium text-slate-600 md:flex">
        {navItems.map((item) => (
          <a key={item.href} href={item.href} className="transition-colors hover:text-teal-700">
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {loggedIn ? (
          <button
            type="button"
            onClick={onStart}
            className="rounded-md bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            进入练习
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onStart}
              className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:border-teal-700 hover:text-teal-700"
            >
              登录
            </button>
            <button
              type="button"
              onClick={onRegister}
              className="rounded-md bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              立即注册
            </button>
          </>
        )}
      </div>
    </div>
  </header>
);

const SqlWorkbench = () => (
  <div className="relative mx-auto w-full max-w-[640px]">
    <div className="absolute -right-5 -top-5 z-10 hidden gap-2 lg:flex">
      {['真题收录', '数据分析师', '运行成功'].map((item, index) => (
        <span
          key={item}
          className={`rounded-full px-4 py-2 text-xs font-bold shadow-sm ${
            index === 1 ? 'bg-cyan-300 text-slate-950' : 'bg-emerald-300 text-slate-950'
          }`}
        >
          {item}
        </span>
      ))}
    </div>

    <div className="overflow-hidden rounded-lg border border-slate-950 bg-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded border border-slate-700 bg-slate-800 px-3 py-1 font-mono text-xs text-slate-300">
            workspace.sql
          </span>
          <span className="rounded bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-300">中等</span>
        </div>
      </div>

      <div className="grid min-h-[300px] grid-cols-[42px_1fr] bg-slate-950 text-sm sm:min-h-[350px]">
        <div className="select-none border-r border-slate-800 py-6 text-center font-mono text-xs leading-8 text-slate-600">
          <div>1</div>
          <div>2</div>
          <div>3</div>
          <div>4</div>
          <div>5</div>
          <div>6</div>
          <div>7</div>
        </div>
        <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-8 text-slate-100 sm:text-sm">
          <code>
            <span className="text-cyan-300">SELECT</span> user_id,{'\n'}
            {'       '}<span className="text-cyan-300">COUNT</span>(order_id) <span className="text-cyan-300">AS</span> total_orders{'\n'}
            <span className="text-rose-300">FROM</span> user_orders{'\n'}
            <span className="text-rose-300">WHERE</span> order_date &gt; <span className="text-amber-300">'2023-01-01'</span>{'\n'}
            <span className="text-rose-300">GROUP BY</span> user_id{'\n'}
            <span className="text-rose-300">HAVING</span> <span className="text-cyan-300">COUNT</span>(order_id) &gt; 5;
          </code>
        </pre>
      </div>

      <div className="border-t border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
          <span>查询结果（3 行）</span>
          <span>执行耗时 0.32s</span>
        </div>
        <div className="overflow-hidden rounded border border-slate-700">
          <div className="grid grid-cols-2 bg-slate-800 px-4 py-2 font-mono text-xs text-slate-300">
            <span>user_id</span>
            <span>total_orders</span>
          </div>
          {[
            ['10042', '12'],
            ['10087', '8'],
            ['10105', '6'],
          ].map((row) => (
            <div key={row[0]} className="grid grid-cols-2 border-t border-slate-800 px-4 py-2 font-mono text-xs text-slate-200">
              <span>{row[0]}</span>
              <span className="text-fuchsia-300">{row[1]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const HeroSection = ({ loggedIn, loading, onStart, onRegister, onGuest }) => (
  <div
    className="border-b border-slate-200 bg-slate-50 pt-16"
    style={{
      backgroundImage:
        'linear-gradient(to right, rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.045) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    }}
  >
    <PageShell className="py-16 sm:py-20">
      <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-xs font-bold text-teal-800">
            <Zap className="h-4 w-4" />
            真题训练 · 在线运行 · 即时反馈
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-6xl">
            刷大厂 SQL 真题，
            <span className="text-teal-700">提升数据岗拿 Offer 概率</span>
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
            精选字节、美团、滴滴等一线大厂真实面试题。支持在线实时编写与运行，告别配置环境烦恼，专注理解题目逻辑与业务场景。
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-teal-700 px-7 text-sm font-black text-white shadow-[0_12px_30px_rgba(15,118,110,0.22)] transition hover:bg-teal-800"
            >
              <Play className="h-4 w-4 fill-white" />
              免费开始练习
            </button>
            {!loggedIn && (
              <button
                type="button"
                onClick={onRegister}
                className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-7 text-sm font-bold text-slate-900 transition hover:border-teal-700 hover:text-teal-700"
              >
                立即注册
              </button>
            )}
            <button
              type="button"
              onClick={onGuest}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center text-sm font-medium text-slate-600 transition hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '游客入口加载中...' : '游客体验 ->'}
            </button>
          </div>
        </div>

        <SqlWorkbench />
      </div>
    </PageShell>
  </div>
);

const StatsSection = () => (
  <PageShell className="bg-[#eaf1fb] py-12">
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="rounded-lg border border-slate-300 bg-white/55 p-7 shadow-sm">
            <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-md ${item.tone}`}>
              <Icon className="h-6 w-6" />
            </div>
            <p className="text-3xl font-black tracking-tight text-slate-950">{item.value}</p>
            <p className="mt-2 font-bold text-slate-950">{item.label}</p>
            <p className="mt-2 text-sm text-slate-600">{item.sub}</p>
          </div>
        );
      })}
    </div>
  </PageShell>
);

const CategorySection = () => (
  <PageShell className="bg-slate-50 py-20">
    <div id="categories">
      <SectionTitle eyebrow="QUESTION TYPES" title="题型分类，精准打击" desc="针对真实面试痛点，按知识点细分题型。" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((item) => {
          const Icon = item.icon;
          const tone = categoryToneMap[item.level];
          return (
            <article
              key={item.name}
              className="group relative overflow-hidden rounded-2xl bg-white p-7 shadow-[0_18px_46px_rgba(15,23,42,0.07),0_2px_8px_rgba(15,23,42,0.035)] ring-1 ring-slate-200/75 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_28px_70px_rgba(15,23,42,0.12),0_8px_18px_rgba(15,23,42,0.05)] hover:ring-teal-200/70"
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-slate-100" />
              <div className="relative mb-7 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-[0_8px_20px_rgba(15,23,42,0.06)] ring-1 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_26px_rgba(15,23,42,0.1)] ${tone.icon}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-black text-slate-950">{item.name}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${levelClassName[item.level]}`}>{item.level}</span>
              </div>
              <p className="relative min-h-[48px] text-sm leading-6 text-slate-600">{item.desc}</p>
              <div className="relative mt-7 h-px bg-slate-100" />
              <div className="relative pt-5">
                <p className="text-xs font-bold text-slate-800">常考企业：<span className="font-medium text-slate-600">{item.companies}</span></p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className={`rounded-full px-3 py-1.5 font-mono text-[11px] ring-1 ${tone.chip}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100 shadow-inner ring-1 ring-slate-200/50">
                  <div
                    className="h-full rounded-full bg-teal-700 transition-all duration-300 group-hover:bg-teal-600"
                    style={{ width: item.progress }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  </PageShell>
);

const AudienceSection = () => (
  <PageShell className="bg-white py-16">
    <div id="audiences" className="grid gap-6 lg:grid-cols-3">
      {audiences.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="group rounded-xl bg-gradient-to-br from-white to-slate-50 p-7 shadow-[0_16px_42px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_58px_rgba(15,23,42,0.12)] hover:ring-teal-200/80"
          >
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-700 shadow-sm ring-1 ring-white transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-teal-100">
              <Icon className="h-6 w-6" />
            </span>
            <h3 className="text-xl font-black text-slate-950">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
          </div>
        );
      })}
    </div>
  </PageShell>
);

const ScenarioSection = () => (
  <PageShell className="bg-slate-50 py-16">
    <div id="scenarios" className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
      <div>
        <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-teal-700">REAL BUSINESS</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">从业务场景理解 SQL，而不是死记语法</h2>
        <p className="mt-5 text-base leading-8 text-slate-600">
          题目围绕订单、用户、内容、留存、转化等数据岗高频场景组织，让每条 SQL 都服务于一个明确的业务问题。
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {scenarios.map((item) => (
          <div
            key={item}
            className="rounded-xl bg-white/90 p-5 text-center font-bold text-slate-900 shadow-[0_14px_34px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,0.12)] hover:ring-teal-200/80"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  </PageShell>
);

const FAQSection = () => (
  <PageShell className="bg-white py-16">
    <div id="faq" className="mx-auto max-w-4xl">
      <SectionTitle eyebrow="FAQ" title="常见问题" desc="开始练习前，你可能关心这些问题。" />
      <div className="space-y-4">
        {faqs.map((item) => (
          <div key={item.q} className="rounded-lg border border-slate-300 bg-slate-50 p-6">
            <h3 className="font-black text-slate-950">{item.q}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  </PageShell>
);

const CTASection = ({ loggedIn, onStart, onRegister }) => (
  <section
    className="bg-slate-950 px-5 py-20 text-white sm:px-8"
    style={{
      backgroundImage:
        'linear-gradient(to right, rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.14) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    }}
  >
    <div className="mx-auto max-w-3xl text-center">
      <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-md bg-teal-400 text-slate-950">
        <ShieldCheck className="h-7 w-7" />
      </div>
      <h2 className="text-3xl font-black tracking-tight sm:text-4xl">现在开始，系统提升你的 SQL 面试能力</h2>
      <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
        加入真实题库训练，掌握核心面试考点，用可运行的 SQL 建立稳定答题能力。
      </p>
      <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex h-12 items-center justify-center rounded-md bg-teal-600 px-8 text-sm font-black text-white transition hover:bg-teal-500"
        >
          免费开始练习
        </button>
        {!loggedIn && (
          <button
            type="button"
            onClick={onRegister}
            className="inline-flex h-12 items-center justify-center rounded-md border border-slate-600 bg-slate-900 px-8 text-sm font-bold text-white transition hover:border-slate-400"
          >
            注册账号
          </button>
        )}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-slate-200 bg-white px-5 py-10 sm:px-8">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
      <p className="font-black text-slate-950">OfferSQL</p>
      <div className="flex flex-wrap gap-6">
        <span>隐私政策</span>
        <span>服务协议</span>
        <span>关于我们</span>
        <span>加入我们</span>
      </div>
      <p>© 2025 OfferSQL · 专注数据岗 SQL 面试训练</p>
    </div>
  </footer>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const [guestLoading, setGuestLoading] = useState(false);

  const handleStart = () => navigate(loggedIn ? '/app' : '/login');
  const handleRegister = () => navigate(loggedIn ? '/app' : '/login', { state: { mode: 'register' } });

  const handleGuest = async () => {
    if (loggedIn) {
      navigate('/app');
      return;
    }

    setGuestLoading(true);
    try {
      const res = await authAPI.guestLogin();
      if (res.data?.token) {
        localStorage.setItem('auth_token', res.data.token);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(res.data.user || {}));
      }
      navigate('/app');
    } catch {
      navigate('/login');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Navbar loggedIn={loggedIn} onStart={handleStart} onRegister={handleRegister} />
      <HeroSection
        loggedIn={loggedIn}
        loading={guestLoading}
        onStart={handleStart}
        onRegister={handleRegister}
        onGuest={handleGuest}
      />
      <StatsSection />
      <CategorySection />
      <AudienceSection />
      <ScenarioSection />
      <FAQSection />
      <CTASection loggedIn={loggedIn} onStart={handleStart} onRegister={handleRegister} />
      <Footer />
    </div>
  );
};

export default LandingPage;
