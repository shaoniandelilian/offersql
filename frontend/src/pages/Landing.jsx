import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  GraduationCap,
  Loader2,
  Play,
  Sparkles,
  Table2,
  TerminalSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';

const storeAuth = (response) => {
  localStorage.setItem('auth_token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  localStorage.setItem('isLoggedIn', 'true');
};

const Landing = () => {
  const navigate = useNavigate();
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const isLoggedIn = useMemo(
    () => Boolean(localStorage.getItem('auth_token')),
    []
  );

  const handlePrimaryAction = async () => {
    if (isLoggedIn) {
      navigate('/app');
      return;
    }

    setIsGuestLoading(true);
    try {
      const response = await authAPI.guestLogin();
      if (!response.success) return;
      storeAuth(response);
      toast.success('已进入游客模式，先体验刷题流程');
      navigate('/app');
    } catch (error) {
      const message = error?.response?.data?.error || '游客登录失败，请稍后重试';
      toast.error(message);
    } finally {
      setIsGuestLoading(false);
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: '面试真题训练',
      description: '按题库和难度筛题，覆盖秋招、实习常见的数据分析与数据开发题型。',
      meta: '先练高频题，再补薄弱点',
    },
    {
      icon: TerminalSquare,
      title: '在线写 SQL',
      description: '内置编辑器、表结构和执行结果，不用本地搭库也能完整走完练习闭环。',
      meta: '打开网页就能进入状态',
    },
    {
      icon: CheckCircle2,
      title: '低门槛体验',
      description: '游客模式可直接进入平台浏览，确认练习节奏合适后再注册保存长期进度。',
      meta: '先试一题，再决定长期使用',
    },
  ];

  const steps = [
    { title: '选题', detail: '从入门到进阶，按岗位方向挑选练习题。' },
    { title: '写 SQL', detail: '参考表结构，在编辑器里完成查询逻辑。' },
    { title: '看结果', detail: '运行、对比、复盘，把套路练成手感。' },
  ];

  const heroCards = [
    { title: '真题题库', detail: '常见面试场景直接练' },
    { title: '在线执行', detail: '写完立刻看结果反馈' },
    { title: '游客体验', detail: '先试一题再决定注册' },
  ];

  return (
    <div className="min-h-screen bg-[#f7fbfc] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-3 text-left"
            aria-label="OfferSQL 首页"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Database size={22} />
            </span>
            <span>
              <span className="block text-lg font-extrabold tracking-tight">OfferSQL</span>
              <span className="block text-xs font-medium tracking-[0.08em] text-slate-500">秋招 SQL 练习场</span>
            </span>
          </button>

          <nav className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              登录/注册
            </Link>
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isGuestLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isGuestLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {isLoggedIn ? '进入练习' : '免费开始练习'}
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div
            className="absolute inset-0 opacity-[0.045]"
            style={{
              backgroundImage:
                'linear-gradient(#0f766e 1px, transparent 1px), linear-gradient(90deg, #0f766e 1px, transparent 1px)',
              backgroundSize: '42px 42px',
            }}
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-6 lg:grid-cols-[0.94fr_1.06fr] lg:px-8 lg:pb-20 lg:pt-18">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                <GraduationCap size={16} />
                面向大学生秋招与实习备考
              </div>
              <h1 className="max-w-3xl text-[3.15rem] font-extrabold leading-[0.96] tracking-[-0.03em] text-slate-950 sm:text-[3.9rem] lg:text-[4.65rem]">
                <span className="block sm:whitespace-nowrap">手撕 <span className="text-slate-950">SQL</span>，</span>
                <span className="block text-teal-700 sm:whitespace-nowrap">冲刺 Offer</span>
              </h1>
              <div className="mt-7 max-w-xl space-y-3 text-base leading-8 text-slate-600 sm:text-lg">
                <p>
                  OfferSQL 把面试真题、在线 SQL 编辑器、表结构和运行结果放在同一个练习流里，
                  让你不用来回切换资料和环境。
                </p>
                <p>
                  从入门 CRUD 到进阶分析题，按题型反复练习，在秋招和实习面试前把 SQL 写出手感。
                </p>
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  disabled={isGuestLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isGuestLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                  {isLoggedIn ? '进入练习' : '免费开始练习'}
                </button>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-4 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  登录/注册
                </Link>
              </div>

              <div className="mt-9 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
                {heroCards.map((item) => (
                  <div key={item.title} className="rounded-xl border border-slate-200 bg-white/92 px-4 py-4 shadow-sm shadow-slate-200/50">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-3 shadow-2xl shadow-slate-900/20">
                <div className="mb-3 flex items-center justify-between px-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-300" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs font-medium tracking-[0.08em] text-slate-400">offersql.practice</span>
                </div>

                <div className="grid gap-3 lg:grid-cols-[0.75fr_1.25fr]">
                  <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                    <div className="mb-3 flex items-center gap-2 text-emerald-300">
                      <BookOpen size={17} />
                      <span className="text-sm font-semibold">今日练习</span>
                    </div>
                    <p className="text-lg font-semibold tracking-tight text-white">连续登录用户留存</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      查询近 7 天每天都有登录记录的用户，并统计他们的提交次数。
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {['JOIN', 'GROUP BY', 'HAVING'].map((tag) => (
                        <span key={tag} className="rounded-md bg-teal-400/10 px-2 py-1 text-xs font-bold text-teal-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-xl border border-slate-700 bg-[#101827] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                        <TerminalSquare size={17} />
                        SQL 编辑器
                      </span>
                      <span className="rounded-md bg-emerald-400 px-2 py-1 text-xs font-semibold text-slate-950">
                        SELECT only
                      </span>
                    </div>
                    <pre className="overflow-hidden rounded-lg bg-slate-950 p-4 text-sm leading-7 text-cyan-100">
{`SELECT user_id, COUNT(*) AS submits
FROM submissions
WHERE created_at >= CURRENT_DATE - INTERVAL 7 DAY
GROUP BY user_id
HAVING COUNT(DISTINCT DATE(created_at)) = 7;`}
                    </pre>
                  </section>
                </div>

                <section className="mt-3 rounded-xl border border-slate-700 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Table2 size={17} />
                      运行结果
                    </span>
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                      通过
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <div className="grid grid-cols-3 bg-slate-100 text-xs font-black uppercase text-slate-500">
                      <span className="px-3 py-2">user_id</span>
                      <span className="px-3 py-2">submits</span>
                      <span className="px-3 py-2">status</span>
                    </div>
                    {[
                      ['U1024', '18', 'stable'],
                      ['U2048', '23', 'stable'],
                      ['U4096', '15', 'stable'],
                    ].map((row) => (
                      <div key={row[0]} className="grid grid-cols-3 border-t border-slate-100 text-sm text-slate-700">
                        {row.map((cell) => (
                          <span key={cell} className="px-3 py-2 font-semibold">
                            {cell}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-[0.12em] text-teal-700">核心能力 · Core capabilities</p>
              <h2 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                刷 SQL 需要的核心能力，放在一个页面里
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <Icon size={24} />
                  </div>
                  <p className="text-sm font-medium text-teal-700">{feature.meta}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:px-8">
            <div>
              <p className="text-sm font-semibold tracking-[0.12em] text-emerald-700">练习路径 · Practice flow</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">三步把 SQL 练成面试手感</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                不做空泛教程，直接围绕题目、表结构、运行反馈来训练。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <article key={step.title} className="rounded-2xl border border-slate-200 bg-[#f7fbfc] p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{step.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-slate-950 px-6 py-10 text-white shadow-xl shadow-slate-900/15 sm:px-10 lg:flex lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-teal-100">
                <Sparkles size={16} />
                先体验题目，再决定是否长期使用
              </div>
              <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                现在进入 OfferSQL，从第一道 SQL 面试题开始
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                游客模式可快速体验，注册后再保存进度和解锁更多练习能力。
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0">
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={isGuestLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-base font-semibold text-slate-950 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isGuestLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                {isLoggedIn ? '进入练习' : '先体验一题'}
              </button>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                登录/注册
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
