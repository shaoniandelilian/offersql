import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Database, BarChart2, GitMerge, TrendingUp, Layers,
  Users, ShoppingCart, Radio, Heart, ArrowRight,
  CheckCircle, Star, Zap, BookOpen, Award, Target,
  Code2, Briefcase, GraduationCap, DollarSign, MapPin, Film
} from 'lucide-react';
import { authAPI } from '../utils/api';

const isLoggedIn = () =>
  localStorage.getItem('isLoggedIn') === 'true' &&
  Boolean(localStorage.getItem('auth_token'));

// ─── Shared ────────────────────────────────────────────────────────────────

const SectionHeader = ({ badge, title, sub }) => (
  <div className="text-center">
    <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-widest border border-teal-100 mb-4">
      {badge}
    </span>
    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">{title}</h2>
    {sub && <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">{sub}</p>}
  </div>
);

const DiffTag = ({ level }) => {
  const map = {
    简单: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    中等: 'bg-amber-50 text-amber-700 border-amber-200',
    困难: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${map[level]}`}>
      {level}
    </span>
  );
};

// ─── Navbar ─────────────────────────────────────────────────────────────────

const Navbar = ({ loggedIn }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md shadow-cyan-500/20">
          <Database className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">OfferSQL</span>
      </div>
      <Link
        to={loggedIn ? '/app' : '/login'}
        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-semibold shadow-md shadow-cyan-500/25 hover:shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-0.5 transition-all duration-200"
      >
        {loggedIn ? '进入练习' : '登录'}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </nav>
);

// ─── Hero ────────────────────────────────────────────────────────────────────

const HeroSection = ({ onStart, onGuest, loading }) => (
  <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden bg-gradient-to-br from-slate-100 via-cyan-50 to-amber-50">
    {/* 装饰球 */}
    <div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] bg-cyan-200 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-pulse" />
    <div
      className="absolute -bottom-48 -right-28 w-[36rem] h-[36rem] bg-amber-200 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-pulse"
      style={{ animationDelay: '2s' }}
    />
    {/* 网格纹理 */}
    <div
      className="absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage:
          'linear-gradient(to right,#0f766e 1px,transparent 1px),linear-gradient(to bottom,#0f766e 1px,transparent 1px)',
        backgroundSize: '56px 56px',
      }}
    />

    <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-sm font-semibold mb-8">
        <Star className="w-4 h-4 fill-teal-500 text-teal-500" />
        互联网大厂 SQL 真题库 · 专为秋招实习打造
      </div>

      <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
        大厂 SQL 真题
        <br />
        <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
          刷出 Offer
        </span>
      </h1>

      <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10">
        覆盖字节、美团、滴滴等大厂高频面试场景，在线 SQL 编辑器实时运行验证，
        从入门到进阶系统训练，助你拿下数据岗 Offer。
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onStart}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-lg font-semibold shadow-xl shadow-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all duration-200"
        >
          免费开始练习 <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={onGuest}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white border-2 border-gray-200 text-gray-700 text-lg font-semibold hover:border-teal-300 hover:text-teal-700 hover:-translate-y-0.5 transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? '进入中…' : '游客体验'}
        </button>
      </div>

      <p className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-1.5">
        <CheckCircle className="w-4 h-4 text-teal-500" />
        前 15 道入门题永久免费，无需付费即可上手
      </p>
    </div>
  </section>
);

// ─── Stats ───────────────────────────────────────────────────────────────────

const stats = [
  { value: '43', label: '精选题目', sub: '持续更新中', icon: BookOpen },
  { value: '7', label: '题型分类', sub: '覆盖核心考点', icon: Layers },
  { value: '3 大', label: '业务方向', sub: '分析 / 开发 / 入门', icon: Award },
  { value: '15 道', label: '永久免费', sub: '注册即可练习', icon: Zap },
];

const StatsSection = () => (
  <section className="py-20 bg-white">
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center text-center hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-teal-600" />
              </div>
              <div className="text-3xl font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-1">
                {s.value}
              </div>
              <div className="text-sm font-semibold text-gray-900 mb-0.5">{s.label}</div>
              <div className="text-xs text-gray-500">{s.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// ─── Categories ───────────────────────────────────────────────────────────────

const categories = [
  {
    icon: BarChart2,
    name: '聚合统计',
    desc: 'COUNT / SUM / AVG 等聚合函数实战运用，报表建设必考',
    tags: ['简单', '中等'],
  },
  {
    icon: GitMerge,
    name: '多表关联',
    desc: 'JOIN / LEFT JOIN / 子查询跨表分析，面试高频场景',
    tags: ['中等', '困难'],
  },
  {
    icon: TrendingUp,
    name: '分组排序',
    desc: 'GROUP BY + ORDER BY 排名与 Top-N 问题',
    tags: ['简单', '中等'],
  },
  {
    icon: Layers,
    name: '窗口函数',
    desc: 'ROW_NUMBER / RANK / LAG / LEAD 等高频考点，进阶必备',
    tags: ['中等', '困难'],
  },
  {
    icon: Database,
    name: '行列转换',
    desc: 'PIVOT / CASE WHEN 实现交叉表与逆透视',
    tags: ['中等'],
  },
  {
    icon: Users,
    name: '留存分析',
    desc: '次日 / 7 日 / 30 日留存漏斗，经典大厂必考题',
    tags: ['中等', '困难'],
  },
  {
    icon: Heart,
    name: '社交关系',
    desc: '关注 / 粉丝 / 共同好友等图关系分析',
    tags: ['中等', '困难'],
  },
];

const CategorySection = () => (
  <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
    <div className="max-w-6xl mx-auto px-6">
      <SectionHeader
        badge="题型覆盖"
        title="7 大核心题型，系统覆盖"
        sub="从 SQL 基础到高阶窗口函数，精准对齐大厂数据岗面试考点"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.name}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                  <Icon className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {cat.tags.map((t) => (
                    <DiffTag key={t} level={t} />
                  ))}
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{cat.name}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{cat.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// ─── Audience ─────────────────────────────────────────────────────────────────

const audiences = [
  {
    icon: Target,
    title: '数据分析岗',
    sub: '面向业务指标分析、报表建设',
    color: 'teal',
    points: ['聚合统计 / 分组排序实操', '留存漏斗 / 转化分析', '大厂业务场景真题'],
  },
  {
    icon: Code2,
    title: '数据开发岗',
    sub: '面向数仓建设、ETL 开发',
    color: 'blue',
    points: ['窗口函数 / 行列转换', '多表关联 / 子查询调优', '社交关系图遍历'],
  },
  {
    icon: GraduationCap,
    title: '初学入门',
    sub: '零基础到能独立做 SQL 分析',
    color: 'violet',
    points: ['15 道免费入门题', '循序渐进难度设计', '实时运行验证答案'],
  },
];

const colorMap = {
  teal: {
    bg: 'bg-teal-50',
    icon: 'text-teal-600',
    dot: 'bg-teal-500',
    border: 'border-teal-100',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    dot: 'bg-blue-500',
    border: 'border-blue-100',
  },
  violet: {
    bg: 'bg-violet-50',
    icon: 'text-violet-600',
    dot: 'bg-violet-500',
    border: 'border-violet-100',
  },
};

const AudienceSection = ({ onStart }) => (
  <section className="py-20 bg-white">
    <div className="max-w-6xl mx-auto px-6">
      <SectionHeader
        badge="适合人群"
        title="不同阶段，都能找到起点"
        sub="无论你是在校生、应届生还是转行者，这里都有适合你的题目"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {audiences.map((a) => {
          const Icon = a.icon;
          const c = colorMap[a.color];
          return (
            <div
              key={a.title}
              className={`rounded-2xl border ${c.border} ${c.bg} p-8 flex flex-col hover:-translate-y-0.5 transition-all duration-200`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-5`}>
                <Icon className={`w-7 h-7 ${c.icon}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{a.title}</h3>
              <p className="text-sm text-gray-500 mb-6">{a.sub}</p>
              <ul className="space-y-3 flex-1">
                {a.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                    {pt}
                  </li>
                ))}
              </ul>
              <button
                onClick={onStart}
                className="mt-8 w-full py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:border-gray-300 hover:shadow-sm transition-all duration-200"
              >
                立即开始
              </button>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// ─── Scenarios ────────────────────────────────────────────────────────────────

const scenarios = [
  { icon: ShoppingCart, name: '电商', desc: 'GMV / 复购率 / 用户漏斗', color: 'orange' },
  { icon: Users, name: '社交', desc: '粉丝关系 / 互动率 / 共同好友', color: 'blue' },
  { icon: Radio, name: '直播', desc: '打赏 / 在线时长 / 留存', color: 'rose' },
  { icon: DollarSign, name: '金融', desc: '交易流水 / 风控 / 授信', color: 'teal' },
  { icon: MapPin, name: '出行', desc: '订单分配 / 司机收益分析', color: 'amber' },
  { icon: Film, name: '内容', desc: '消费行为 / 创作者留存', color: 'violet' },
];

const scenarioColorMap = {
  orange: 'bg-orange-50 border-orange-100 text-orange-600',
  blue: 'bg-blue-50 border-blue-100 text-blue-600',
  rose: 'bg-rose-50 border-rose-100 text-rose-600',
  teal: 'bg-teal-50 border-teal-100 text-teal-600',
  amber: 'bg-amber-50 border-amber-100 text-amber-600',
  violet: 'bg-violet-50 border-violet-100 text-violet-600',
};

const ScenarioSection = () => (
  <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
    <div className="max-w-6xl mx-auto px-6">
      <SectionHeader
        badge="业务场景"
        title="6 大真实业务场景"
        sub="题目源自真实大厂数据岗面试，覆盖主流互联网业务线"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-12">
        {scenarios.map((s) => {
          const Icon = s.icon;
          const cls = scenarioColorMap[s.color];
          return (
            <div
              key={s.name}
              className={`rounded-xl border p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-all duration-200 bg-white shadow-sm`}
            >
              <div className={`w-11 h-11 rounded-xl border flex-shrink-0 flex items-center justify-center ${cls}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">{s.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// ─── CTA ─────────────────────────────────────────────────────────────────────

const CTASection = ({ onStart }) => (
  <section className="py-24 bg-gradient-to-br from-teal-600 to-cyan-600 relative overflow-hidden">
    <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
    <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
      <h2 className="text-4xl font-extrabold text-white mb-4">现在开始，免费刷题</h2>
      <p className="text-teal-100 text-lg mb-10">
        15 道入门题永久免费，注册即可开始练习，无需付费
      </p>
      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-white text-teal-700 text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
      >
        免费注册 <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────────

const Footer = () => (
  <footer className="py-8 bg-slate-900 text-center text-slate-500 text-sm">
    © 2025 OfferSQL · 专注数据岗 SQL 面试训练
  </footer>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const LandingPage = () => {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const [guestLoading, setGuestLoading] = useState(false);

  const handleStart = () => navigate(loggedIn ? '/app' : '/login');

  const handleGuest = async () => {
    if (loggedIn) { navigate('/app'); return; }
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
    <div className="min-h-screen bg-white">
      <Navbar loggedIn={loggedIn} />
      <HeroSection onStart={handleStart} onGuest={handleGuest} loading={guestLoading} />
      <StatsSection />
      <CategorySection />
      <AudienceSection onStart={handleStart} />
      <ScenarioSection />
      <CTASection onStart={handleStart} />
      <Footer />
    </div>
  );
};

export default LandingPage;
