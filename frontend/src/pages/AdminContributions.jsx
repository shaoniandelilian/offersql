import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, X, RefreshCw, ShieldCheck, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../utils/api';

const statusOptions = [
  { value: 'ALL', label: '全部' },
  { value: 'PENDING', label: '待审核' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已驳回' },
];

function statusBadge(status) {
  if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-700';
  if (status === 'REJECTED') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

function previewText(text, max = 110) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function deriveAnalysisFromSql(sqlText) {
  const sql = String(sqlText || '').trim();
  if (!sql) return '';

  const upper = sql.toUpperCase();
  const points = [];

  points.push('先明确目标输出字段与粒度，并以该粒度组织查询结果。');

  if (upper.includes('COUNT(DISTINCT')) {
    points.push('使用 COUNT(DISTINCT ...) 做去重统计，避免同一对象重复计数。');
  } else if (upper.includes('COUNT(')) {
    points.push('使用 COUNT(...) 做聚合统计，并确认是否需要去重。');
  }

  if (upper.includes('GROUP BY')) {
    points.push('通过 GROUP BY 按业务维度聚合，确保每组只输出一行结果。');
  }

  if (upper.includes('JOIN')) {
    points.push('通过 JOIN 关联多表，注意连接条件与数据放大问题。');
  }

  if (upper.includes('WITH')) {
    points.push('使用 CTE（WITH）分步骤拆解逻辑，提升可读性与可维护性。');
  }

  if (upper.includes('ORDER BY')) {
    points.push('最后使用 ORDER BY 保证结果排序与题目要求一致。');
  }

  return points.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
}

const DetailPanel = ({ label, content, kind = 'text' }) => {
  const isSql = kind === 'sql';
  const [collapsed, setCollapsed] = useState(isSql);
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(content));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  };

  return (
    <div className={`rounded-xl border overflow-hidden ${
      isSql ? 'border-slate-800 bg-slate-950 shadow-[0_8px_24px_rgba(2,6,23,0.28)]' : 'border-slate-200 bg-white'
    }`}
    >
      <div className={`flex items-center justify-between px-3 py-2.5 ${
        isSql ? 'bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800' : 'bg-slate-50 border-b border-slate-200'
      }`}
      >
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
            isSql ? 'text-slate-200 hover:text-white' : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          {label}
        </button>

        <div className="flex items-center gap-2">
          {isSql && <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">SQL</span>}
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] ${
              isSql ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Copy size={12} />
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      {!collapsed && (
        isSql ? (
          <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-6 text-slate-100">
            {content}
          </pre>
        ) : (
          <div className="whitespace-pre-wrap px-4 py-3.5 text-[14px] leading-7 text-slate-700">{content}</div>
        )
      )}
    </div>
  );
};

const AdminContributions = () => {
  const [status, setStatus] = useState('PENDING');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [expandedMap, setExpandedMap] = useState({});

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      return {};
    }
  }, []);

  const loadList = useCallback(async (statusFilter) => {
    setLoading(true);
    try {
      const response = await adminAPI.listContributions(statusFilter);
      if (response.success) {
        setList(response.data || []);
      }
    } catch (error) {
      console.error('加载投稿失败', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList(status);
  }, [loadList, status]);

  const getDraft = (itemId) => reviewDrafts[itemId] || { rewardPoints: '30', adminNote: '' };
  const setDraft = (itemId, patch) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [itemId]: {
        ...getDraft(itemId),
        ...patch,
      },
    }));
  };
  const isExpanded = (itemId) => Boolean(expandedMap[itemId]);
  const toggleExpanded = (itemId) => {
    setExpandedMap((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleReview = async (item, action) => {
    const draft = getDraft(item.id);
    let rewardPoints = 0;
    if (action === 'APPROVED') {
      rewardPoints = Number(draft.rewardPoints || 0);
      if (!Number.isFinite(rewardPoints) || rewardPoints < 1 || rewardPoints > 1000) {
        toast.error('积分范围为 1 ~ 1000');
        return;
      }
    }

    const adminNote = String(draft.adminNote || '');

    setActingId(item.id);
    try {
      const response = await adminAPI.reviewContribution(item.id, {
        action,
        adminNote,
        rewardPoints,
      });
      if (!response.success) return;
      toast.success(action === 'APPROVED' ? '已通过并发放积分' : '已驳回投稿');
      setList((prev) => prev.map((row) => (row.id === item.id ? response.data : row)));
    } catch (error) {
      console.error('审核投稿失败', error);
    } finally {
      setActingId(null);
    }
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

  const summary = list.reduce((acc, item) => {
    if (item.status === 'PENDING') acc.pending += 1;
    if (item.status === 'APPROVED') acc.approved += 1;
    if (item.status === 'REJECTED') acc.rejected += 1;
    return acc;
  }, { pending: 0, approved: 0, rejected: 0 });

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-white/90 backdrop-blur border-b px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <ShieldCheck className="mr-2 text-indigo-600" size={26} />
            题目贡献审核
          </h1>
          <p className="text-sm text-gray-500 mt-1">审核用户投稿并发放积分奖励</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => loadList(status)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <RefreshCw size={16} />
            刷新
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">待审核</div>
            <div className="mt-1 text-2xl font-bold text-amber-600">{summary.pending}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">已通过</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">{summary.approved}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">已驳回</div>
            <div className="mt-1 text-2xl font-bold text-rose-600">{summary.rejected}</div>
          </div>
        </div>
        {loading ? (
          <div className="text-gray-500">加载中...</div>
        ) : list.length === 0 ? (
          <div className="bg-white border rounded-xl p-6 text-gray-500">暂无数据</div>
        ) : (
          <div className="space-y-4">
            {list.map((item) => (
              <div key={item.id} className="bg-white border rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.id)}
                        className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-slate-100 text-slate-500"
                        title={isExpanded(item.id) ? '收起' : '展开'}
                      >
                        {isExpanded(item.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <h3 className="font-semibold text-gray-800 text-base leading-6 truncate">{item.title}</h3>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 pl-8">
                      投稿人：{item.contributorUsername}（ID: {item.contributorUserId}） · {new Date(item.createdAt).toLocaleString('zh-CN')}
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-slate-600 pl-8">{previewText(item.description)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusBadge(item.status)}`}>
                    {item.status === 'PENDING' ? '待审核' : item.status === 'APPROVED' ? '已通过' : '已驳回'}
                  </span>
                </div>

                <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-4">
                  {item.tags && <span>标签：{item.tags}</span>}
                  {item.sourceCompany && <span>来源公司：{item.sourceCompany}</span>}
                  {item.sourcePosition && <span>岗位方向：{item.sourcePosition}</span>}
                  <span>AI状态：{item.aiStatus || 'PENDING'}</span>
                  <span>奖励积分：{item.rewardPoints || 0}</span>
                </div>

                {isExpanded(item.id) && (
                  <div className="mt-3 space-y-3">
                    <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] leading-7 text-slate-700 whitespace-pre-wrap">
                      {item.description}
                    </p>
                    <DetailPanel label="原始数据" content={item.rawDataText} />
                    <DetailPanel label="期望结果" content={item.expectedResult} />
                    <DetailPanel label="AI 建表 SQL" content={item.aiCreateTableSql} kind="sql" />
                    <DetailPanel label="AI 插入数据 SQL" content={item.aiInsertSql} kind="sql" />
                    <DetailPanel label="思路解析" content={item.aiSolutionAnalysis || deriveAnalysisFromSql(item.referenceSql)} />
                    <DetailPanel label="参考答案 SQL" content={item.referenceSql} kind="sql" />
                    {item.aiErrorMessage && (
                      <div className="text-xs rounded bg-red-50 border border-red-100 px-2 py-1 text-red-600">
                        AI错误：{item.aiErrorMessage}
                      </div>
                    )}
                    {item.adminNote && (
                      <div className="text-xs rounded bg-gray-50 border border-gray-100 px-2 py-1 text-gray-600">
                        审核备注：{item.adminNote}
                      </div>
                    )}

                    {item.status === 'PENDING' && (
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                        <div className="text-xs font-semibold text-indigo-700 mb-2">审核操作</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">通过奖励积分（1~1000）</div>
                            <input
                              type="number"
                              min="1"
                              max="1000"
                              value={getDraft(item.id).rewardPoints}
                              onChange={(e) => setDraft(item.id, { rewardPoints: e.target.value })}
                              className="w-full border rounded-lg px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">审核备注（可选）</div>
                            <input
                              type="text"
                              value={getDraft(item.id).adminNote}
                              onChange={(e) => setDraft(item.id, { adminNote: e.target.value })}
                              className="w-full border rounded-lg px-2 py-1.5 text-sm"
                              placeholder="例如：题目质量高，可收录"
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            disabled={actingId === item.id}
                            onClick={() => handleReview(item, 'APPROVED')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-50"
                          >
                            <Check size={14} />
                            通过并发积分
                          </button>
                          <button
                            disabled={actingId === item.id}
                            onClick={() => handleReview(item, 'REJECTED')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-50"
                          >
                            <X size={14} />
                            驳回
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContributions;
