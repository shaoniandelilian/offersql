import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BarChart2,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Code2,
  Database,
  FileCode2,
  Flame,
  GitMerge,
  GraduationCap,
  Layers,
  LineChart,
  Play,
  ShieldCheck,
  Star,
  Table2,
  Target,
  Timer,
  TrendingUp,
  Trophy,
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
  {
    value: '43+',
    label: '精选真题',
    sub: '覆盖聚合、关联、窗口函数等核心考点',
    icon: BookOpen,
    accent: 'from-cyan-300 to-teal-200',
  },
  {
    value: '7 类',
    label: '高频题型',
    sub: '按面试命中率拆解专项训练路径',
    icon: Layers,
    accent: 'from-emerald-300 to-lime-200',
  },
  {
    value: '3 大',
    label: '业务方向',
    sub: '电商、社交、出行等真实指标场景',
    icon: Briefcase,
    accent: 'from-amber-300 to-orange-200',
  },
  {
    value: '15 道',
    label: '免费体验',
    sub: '注册即可进入在线 SQL 工作台',
    icon: Star,
    accent: 'from-sky-300 to-indigo-200',
  },
];

const categories = [
  {
    icon: BarChart2,
    name: '聚合统计',
    level: '简单',
    desc: '从指标口径出发，训练 COUNT、SUM、AVG 等基础聚合。',
    companies: '字节跳动、快手',
    tags: ['COUNT', 'SUM', 'AVG'],
    progress: '82%',
    gradient: 'from-teal-400 to-cyan-300',
  },
  {
    icon: GitMerge,
    name: '多表关联',
    level: '中等',
    desc: '用 JOIN 串起用户、订单、行为表，处理真实业务关系。',
    companies: '美团、滴滴',
    tags: ['LEFT JOIN', 'INNER JOIN'],
    progress: '64%',
    gradient: 'from-cyan-400 to-sky-300',
  },
  {
    icon: TrendingUp,
    name: '分组排序',
    level: '中等',
    desc: '围绕分层、排序、筛选，建立指标分析的基本肌肉记忆。',
    companies: '腾讯、京东',
    tags: ['GROUP BY', 'HAVING'],
    progress: '56%',
    gradient: 'from-emerald-400 to-teal-300',
  },
  {
    icon: Layers,
    name: '窗口函数',
    level: '困难',
    desc: '排名、累计、滑动窗口，大厂数据岗面试高频门槛题。',
    companies: '阿里、字节、美团',
    tags: ['ROW_NUMBER', 'RANK', 'OVER'],
    progress: '28%',
    gradient: 'from-amber-300 to-orange-400',
  },
  {
    icon: Table2,
    name: '行列转换',
    level: '困难',
    desc: '用 CASE WHEN 和透视思路解决报表格式转换问题。',
    companies: '拼多多、网易',
    tags: ['CASE WHEN', 'PIVOT'],
    progress: '32%',
    gradient: 'from-rose-300 to-orange-300',
  },
  {
    icon: LineChart,
    name: '留存分析',
    level: '困难',
    desc: '从活跃、回访到七日留存，训练业务 SQL 拆题能力。',
    companies: '腾讯、小红书',
    tags: ['SELF JOIN', 'DATEDIFF'],
    progress: '24%',
    gradient: 'from-fuchsia-300 to-rose-300',
  },
];

const audiences = [
  {
    icon: GraduationCap,
    title: '应届生冲刺',
    desc: '从语法到真题，快速建立面试答题手感。',
    metric: '14 天',
  },
  {
    icon: Users,
    title: '数据分析转岗',
    desc: '围绕指标、留存、漏斗和分群，贴近业务分析。',
    metric: '高频场景',
  },
  {
    icon: Code2,
    title: '数仓开发进阶',
    desc: '强化关联、窗口函数和复杂转换，补齐高阶能力。',
    metric: '复杂 SQL',
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
  简单: 'border-teal-300/40 bg-teal-300/12 text-teal-100',
  中等: 'border-cyan-300/35 bg-cyan-300/12 text-cyan-100',
  困难: 'border-amber-300/35 bg-amber-300/12 text-amber-100',
};

const PageShell = ({ children, className = '' }) => (
  <section className={`px-5 sm:px-8 ${className}`}>
    <div className="mx-auto max-w-7xl">{children}</div>
  </section>
);

const Reveal = ({ children, className = '' }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -72px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`offer-reveal ${visible ? 'is-visible' : ''} ${className}`}>
      {children}
    </div>
  );
};

const SectionTitle = ({ eyebrow, title, desc, align = 'center', inverted = false }) => (
  <div className={`${align === 'center' ? 'mx-auto text-center' : ''} mb-12 max-w-2xl`}>
    <p className={`mb-3 text-xs font-black tracking-[0.22em] ${inverted ? 'text-cyan-200' : 'text-teal-700'}`}>
      {eyebrow}
    </p>
    <h2 className={`text-3xl font-black leading-tight tracking-tight sm:text-4xl ${inverted ? 'text-white' : 'text-slate-950'}`}>
      {title}
    </h2>
    <p className={`mt-4 text-sm leading-7 sm:text-base ${inverted ? 'text-slate-300' : 'text-slate-600'}`}>{desc}</p>
  </div>
);

const Navbar = ({ loggedIn, onStart, onRegister }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-white/10 bg-slate-950/78 shadow-[0_18px_55px_rgba(2,6,23,0.28)] backdrop-blur-2xl'
          : 'border-white/8 bg-slate-950/35 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <button
          type="button"
          onClick={onStart}
          className="group flex items-center gap-2 text-lg font-black tracking-tight text-white transition hover:-translate-y-0.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300/12 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.2)]">
            <Database className="h-4 w-4" />
          </span>
          OfferSQL
        </button>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-300 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-cyan-200">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {loggedIn ? (
            <button
              type="button"
              onClick={onStart}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-cyan-300 px-4 text-sm font-black text-slate-950 shadow-[0_12px_28px_rgba(34,211,238,0.2)] transition hover:-translate-y-0.5 hover:bg-cyan-200"
            >
              进入练习
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onStart}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/14 px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-cyan-300/50 hover:text-cyan-100"
              >
                登录
              </button>
              <button
                type="button"
                onClick={onRegister}
                className="hidden h-10 items-center justify-center rounded-lg bg-cyan-300 px-4 text-sm font-black text-slate-950 shadow-[0_12px_28px_rgba(34,211,238,0.2)] transition hover:-translate-y-0.5 hover:bg-cyan-200 sm:inline-flex"
              >
                立即注册
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const SqlWorkbench = () => (
  <div className="offer-float relative mx-auto w-full max-w-[680px] lg:ml-auto">
    <div className="absolute -left-4 top-16 z-10 hidden w-40 rounded-2xl border border-white/10 bg-white/10 p-4 text-white shadow-[0_18px_46px_rgba(2,6,23,0.28)] backdrop-blur-xl lg:block">
      <p className="text-[11px] font-black tracking-[0.18em] text-cyan-200">TODAY</p>
      <p className="mt-2 text-2xl font-black">91%</p>
      <p className="mt-1 text-xs leading-5 text-slate-300">窗口函数专题正确率提升</p>
    </div>

    <div className="absolute -right-2 -top-5 z-10 hidden gap-2 lg:flex">
      {['真题收录', '在线判题', '运行成功'].map((item, index) => (
        <span
          key={item}
          className={`rounded-full border px-4 py-2 text-xs font-black shadow-[0_12px_28px_rgba(2,6,23,0.2)] backdrop-blur-xl ${
            index === 1
              ? 'border-amber-200/40 bg-amber-300/90 text-slate-950'
              : 'border-cyan-200/40 bg-cyan-300/90 text-slate-950'
          }`}
        >
          {item}
        </span>
      ))}
    </div>

    <div className="relative overflow-hidden rounded-[1.6rem] border border-white/12 bg-slate-950 shadow-[0_34px_120px_rgba(2,6,23,0.55)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_20%_30%,rgba(251,191,36,0.12),transparent_30%)]" />
      <div className="relative flex items-center justify-between border-b border-white/10 bg-white/[0.035] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-300" />
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden rounded-md border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-slate-300 sm:inline">
            offersql/workbench.sql
          </span>
          <span className="rounded-md border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs font-black text-amber-200">
            中等
          </span>
        </div>
      </div>

      <div className="relative grid gap-0 lg:grid-cols-[1fr_210px]">
        <div>
          <div className="border-b border-white/10 bg-slate-900/70 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300/12 px-3 py-1.5 font-bold text-cyan-100 ring-1 ring-cyan-300/20">
                <FileCode2 className="h-3.5 w-3.5" />
                次日留存分析
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1.5 font-bold text-slate-300 ring-1 ring-white/10">JOIN</span>
              <span className="rounded-full bg-white/5 px-3 py-1.5 font-bold text-slate-300 ring-1 ring-white/10">DATEDIFF</span>
            </div>
          </div>

          <div className="grid min-h-[300px] grid-cols-[38px_minmax(0,1fr)] bg-slate-950 text-sm sm:grid-cols-[46px_minmax(0,1fr)] sm:min-h-[360px]">
            <div className="select-none border-r border-white/10 py-6 text-center font-mono text-xs leading-8 text-slate-600">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
            <pre className="overflow-x-auto whitespace-pre p-4 font-mono text-[12px] leading-8 text-slate-100 sm:p-6 sm:text-[13px]">
              <code>
                <span className="text-cyan-300">WITH</span> first_order <span className="text-cyan-300">AS</span> ({'\n'}
                {'  '}<span className="text-cyan-300">SELECT</span> user_id, <span className="text-cyan-300">MIN</span>(order_date) first_dt{'\n'}
                {'  '}<span className="text-rose-300">FROM</span> orders <span className="text-rose-300">GROUP BY</span> user_id{'\n'}
                ){'\n'}
                <span className="text-cyan-300">SELECT</span> f.first_dt,{'\n'}
                {'  '}<span className="text-cyan-300">ROUND</span>(<span className="text-cyan-300">COUNT</span>(r.user_id) / <span className="text-cyan-300">COUNT</span>(*), 4) <span className="text-cyan-300">AS</span> retain_rate{'\n'}
                <span className="text-rose-300">FROM</span> first_order f <span className="text-rose-300">LEFT JOIN</span> orders r{'\n'}
                {'  '}<span className="text-rose-300">ON</span> f.user_id = r.user_id <span className="text-rose-300">AND</span> <span className="text-cyan-300">DATEDIFF</span>(r.order_date, f.first_dt) = <span className="text-amber-300">1</span>;
              </code>
            </pre>
          </div>
        </div>

        <aside className="border-t border-white/10 bg-white/[0.035] p-4 lg:border-l lg:border-t-0">
          <p className="text-xs font-black tracking-[0.18em] text-slate-400">SCHEMA</p>
          <div className="mt-4 space-y-3">
            {[
              ['orders', 'user_id, order_date'],
              ['users', 'city, channel'],
              ['events', 'event_time'],
            ].map(([table, fields]) => (
              <div key={table} className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <Database className="h-4 w-4 text-cyan-200" />
                  {table}
                </div>
                <p className="mt-1 font-mono text-[11px] text-slate-500">{fields}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
              Accepted
            </div>
            <p className="mt-1 text-xs text-emerald-100/70">执行耗时 0.32s</p>
          </div>
        </aside>
      </div>

      <div className="relative border-t border-white/10 bg-slate-900/90 p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
          <span>查询结果（3 行）</span>
          <span className="inline-flex items-center gap-1 text-emerald-200">
            <Timer className="h-3.5 w-3.5" />
            0.32s
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-3 bg-white/5 px-4 py-2 font-mono text-xs text-slate-300">
            <span>first_dt</span>
            <span>retain_rate</span>
            <span>rank</span>
          </div>
          {[
            ['2024-03-01', '0.4268', '1'],
            ['2024-03-02', '0.3891', '2'],
            ['2024-03-03', '0.3516', '3'],
          ].map((row) => (
            <div key={row[0]} className="grid grid-cols-3 border-t border-white/8 px-4 py-2 font-mono text-xs text-slate-200">
              <span>{row[0]}</span>
              <span className="text-cyan-200">{row[1]}</span>
              <span className="text-amber-200">{row[2]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const HeroSection = ({ loggedIn, loading, onStart, onRegister, onGuest }) => (
  <div className="offer-grid-bg relative overflow-hidden bg-slate-950 pt-16 text-white">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.24),transparent_31%),radial-gradient(circle_at_82%_16%,rgba(251,191,36,0.16),transparent_26%),linear-gradient(135deg,rgba(15,23,42,0),rgba(2,6,23,0.78))]" />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#f4f7f3] to-transparent" />
    <PageShell className="relative py-16 sm:py-20 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr]">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-100 shadow-[0_0_36px_rgba(34,211,238,0.12)]">
            <Zap className="h-4 w-4" />
            真题训练 · 在线运行 · 即时反馈
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            刷SQL真题 
            <span className="block bg-gradient-to-r from-cyan-200 via-teal-200 to-amber-200 bg-clip-text text-transparent">
              拿数据Offer
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            精选腾讯、阿里、字节、美团、滴滴等大厂 SQL 真题，面向实习、秋招及数据岗面试，模拟真实手撕 SQL 场景，覆盖数据分析、数据开发、数据产品等岗位，支持在线运行与即时反馈。
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-7 text-sm font-black text-slate-950 shadow-[0_18px_38px_rgba(34,211,238,0.24)] transition hover:-translate-y-1 hover:bg-cyan-200"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              免费开始练习
            </button>
            {!loggedIn && (
              <button
                type="button"
                onClick={onRegister}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/14 bg-white/5 px-7 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/50 hover:text-cyan-100"
              >
                立即注册
              </button>
            )}
            <button
              type="button"
              onClick={onGuest}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 text-sm font-bold text-slate-300 transition hover:-translate-y-0.5 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '游客入口加载中...' : '游客体验'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-9 grid max-w-xl grid-cols-3 gap-3 text-xs text-slate-300">
            {[
              ['SELECT / WITH', '安全练习'],
              ['0 配置', '打开即写'],
              ['场景题', '贴近面试'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 backdrop-blur">
                <p className="font-mono font-black text-cyan-100">{value}</p>
                <p className="mt-1 text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <SqlWorkbench />
      </div>
    </PageShell>
  </div>
);

const StatsSection = () => (
  <PageShell className="bg-[#f4f7f3] py-14">
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_28px_70px_rgba(15,23,42,0.13)]"
          >
            <div className={`absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${item.accent} opacity-40 blur-xl transition group-hover:opacity-70`} />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] font-black tracking-[0.18em] text-slate-400">METRIC</p>
                <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">{item.value}</p>
              </div>
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-slate-950 shadow-[0_12px_24px_rgba(15,23,42,0.12)]`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p className="relative mt-4 font-black text-slate-950">{item.label}</p>
            <p className="relative mt-2 text-sm leading-6 text-slate-600">{item.sub}</p>
          </div>
        );
      })}
    </div>
  </PageShell>
);

const CategorySection = () => (
  <PageShell className="bg-slate-950 py-20 text-white">
    <div id="categories" className="scroll-mt-24">
      <SectionTitle
        eyebrow="QUESTION TYPES"
        title="题型分类，精准打击"
        desc="把 SQL 面试拆成可训练的能力模块：先看题型，再看企业，再回到能运行的 SQL。"
        inverted
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((item, index) => {
          const Icon = item.icon;
          return (
            <article
              key={item.name}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.24)] backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:border-cyan-300/35 hover:bg-white/[0.07]"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.gradient}`} />
              <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl transition group-hover:bg-cyan-300/20" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-slate-950 shadow-[0_12px_26px_rgba(2,6,23,0.22)] transition group-hover:-translate-y-1`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-mono text-xs font-black text-slate-500">0{index + 1}</p>
                    <h3 className="text-lg font-black text-white">{item.name}</h3>
                  </div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-black ${levelClassName[item.level]}`}>{item.level}</span>
              </div>
              <p className="relative mt-6 min-h-[72px] text-sm leading-7 text-slate-300">{item.desc}</p>
              <div className="relative mt-5 rounded-xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs font-black text-slate-400">
                  常考企业：<span className="font-bold text-slate-200">{item.companies}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-mono text-[11px] font-bold text-cyan-100">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                    <div className={`h-full rounded-full bg-gradient-to-r ${item.gradient}`} style={{ width: item.progress }} />
                  </div>
                  <span className="font-mono text-xs font-black text-slate-300">{item.progress}</span>
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
  <PageShell className="bg-[#f4f7f3] py-16">
    <div id="audiences" className="scroll-mt-24 grid gap-6 lg:grid-cols-3">
      {audiences.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_76px_rgba(15,23,42,0.13)]"
          >
            <div className="absolute right-5 top-5 rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-black text-slate-500">
              {item.metric}
            </div>
            <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-cyan-200 shadow-[0_14px_30px_rgba(15,23,42,0.16)] transition group-hover:-translate-y-1">
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
  <PageShell className="bg-white py-16">
    <div id="scenarios" className="scroll-mt-24 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
      <div>
        <p className="mb-3 text-xs font-black tracking-[0.22em] text-teal-700">REAL BUSINESS</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">从业务场景理解 SQL，而不是死记语法</h2>
        <p className="mt-5 text-base leading-8 text-slate-600">
          题目围绕订单、用户、内容、留存、转化等数据岗高频场景组织，让每条 SQL 都服务于一个明确的业务问题。
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {scenarios.map((item) => (
          <div
            key={item}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center font-black text-slate-900 shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-2 hover:border-teal-200 hover:bg-white hover:shadow-[0_24px_58px_rgba(15,23,42,0.12)]"
          >
            <span className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm transition group-hover:bg-teal-50">
              <Target className="h-4 w-4" />
            </span>
            {item}
          </div>
        ))}
      </div>
    </div>
  </PageShell>
);

const FAQSection = () => (
  <PageShell className="bg-[#f4f7f3] py-16">
    <div id="faq" className="mx-auto max-w-4xl scroll-mt-24">
      <SectionTitle eyebrow="FAQ" title="常见问题" desc="开始练习前，你可能关心这些问题。" />
      <div className="space-y-4">
        {faqs.map((item) => (
          <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <h3 className="font-black text-slate-950">{item.q}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  </PageShell>
);

const CTASection = ({ loggedIn, onStart, onRegister }) => (
  <section className="offer-grid-bg relative overflow-hidden bg-slate-950 px-5 py-20 text-white sm:px-8">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_78%_30%,rgba(251,191,36,0.16),transparent_24%)]" />
    <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.78fr] lg:items-center">
      <div>
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-[0_18px_42px_rgba(34,211,238,0.22)]">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
          现在开始，把 SQL 面试题练成稳定得分项
        </h2>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          从真实题库进入在线工作台，围绕业务场景反复训练，形成能在面试现场讲清楚的 SQL 解题路径。
        </p>
        <div className="mt-9 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-8 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-200"
          >
            免费开始练习
            <ArrowRight className="h-4 w-4" />
          </button>
          {!loggedIn && (
            <button
              type="button"
              onClick={onRegister}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/14 bg-white/5 px-8 text-sm font-bold text-white transition hover:-translate-y-1 hover:border-cyan-300/40"
            >
              注册账号
            </button>
          )}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(2,6,23,0.28)] backdrop-blur">
        {[
          { icon: Flame, label: '今日冲刺', value: '窗口函数 6 题' },
          { icon: Trophy, label: '目标岗位', value: '数据分析师' },
          { icon: BadgeCheck, label: '训练状态', value: '可直接进入练习' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-4 border-b border-white/10 py-4 last:border-b-0">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/12 text-cyan-100 ring-1 ring-cyan-300/20">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-500">{item.label}</p>
                <p className="mt-1 font-black text-white">{item.value}</p>
              </div>
            </div>
          );
        })}
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
      <Reveal>
        <StatsSection />
      </Reveal>
      <Reveal>
        <CategorySection />
      </Reveal>
      <Reveal>
        <AudienceSection />
      </Reveal>
      <Reveal>
        <ScenarioSection />
      </Reveal>
      <Reveal>
        <FAQSection />
      </Reveal>
      <Reveal>
        <CTASection loggedIn={loggedIn} onStart={handleStart} onRegister={handleRegister} />
      </Reveal>
      <Footer />
    </div>
  );
};

export default LandingPage;
