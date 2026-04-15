import React, { useEffect, useMemo, useState } from 'react';
import { Gift, Send, Clock3, CheckCircle2, XCircle, ChevronDown, ChevronRight, Copy, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { contributionAPI } from '../utils/api';
import { format as formatSQL } from 'sql-formatter';

const initialForm = {
  description: '',
  rawDataText: '',
  expectedResult: '',
  sourceCompany: '',
  sourcePosition: '',
  tags: '',
};

function statusBadge(status) {
  if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-700';
  if (status === 'REJECTED') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

function previewText(text, max = 120) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(String(text || ''));
    toast.success('已复制');
  } catch (error) {
    toast.error('复制失败，请手动复制');
  }
};

const UserSqlPanel = ({ label, sql }) => {
  const content = String(sql || '').trim();
  if (!content) return null;
  return (
    <div className="mt-2 border rounded-lg overflow-hidden bg-slate-950">
      <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-300">{label}</span>
        <button
          type="button"
          onClick={() => copyText(content)}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700"
        >
          <Copy size={12} />
          复制
        </button>
      </div>
      <pre className="p-2.5 text-xs leading-6 font-mono text-slate-100 overflow-auto max-h-64 whitespace-pre-wrap">{content}</pre>
    </div>
  );
};

const Contributions = () => {
  const [form, setForm] = useState(initialForm);
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({ totalPoints: 0, totalRecords: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedMap, setExpandedMap] = useState({});
  const [testSqlDraft, setTestSqlDraft] = useState({});
  const [testState, setTestState] = useState({});
  const [testingMap, setTestingMap] = useState({});
  const [aiFoldMap, setAiFoldMap] = useState({});
  const [testFoldMap, setTestFoldMap] = useState({});

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      return {};
    }
  }, []);

  const isGuest = currentUser.role === 'GUEST';

  const loadMine = async () => {
    setLoading(true);
    try {
      const response = await contributionAPI.getMine(100);
      if (!response.success) return;
      setList(response.data || []);
      setSummary(response.meta?.points || { totalPoints: 0, totalRecords: 0 });
    } catch (error) {
      console.error('加载投稿记录失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMine();
  }, []);

  const statusStats = useMemo(() => {
    return list.reduce(
      (acc, item) => {
        if (item.status === 'APPROVED') acc.approved += 1;
        else if (item.status === 'REJECTED') acc.rejected += 1;
        else acc.pending += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
  }, [list]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isGuest) {
      toast.error('游客不可投稿，请先注册登录');
      return;
    }
    if (!form.description.trim()) {
      toast.error('请填写题目描述');
      return;
    }
    if (!form.rawDataText.trim()) {
      toast.error('请填写原始数据');
      return;
    }
    if (!form.expectedResult.trim()) {
      toast.error('请填写期望结果');
      return;
    }
    if (!form.sourceCompany.trim()) {
      toast.error('请填写公司标签');
      return;
    }

    setSubmitting(true);
    try {
      const response = await contributionAPI.create(form);
      if (!response.success) return;
      toast.success(response.message || '投稿成功');
      setForm(initialForm);
      setList((prev) => [response.data, ...prev]);
    } catch (error) {
      console.error('投稿失败', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isExpanded = (itemId) => Boolean(expandedMap[itemId]);
  const toggleExpanded = (itemId) => {
    setExpandedMap((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };
  const isAiFoldOpen = (itemId) => Boolean(aiFoldMap[itemId]);
  const toggleAiFold = (itemId) => {
    setAiFoldMap((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };
  const isTestFoldOpen = (itemId) => Boolean(testFoldMap[itemId]);
  const toggleTestFold = (itemId) => {
    setTestFoldMap((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };
  const markTesting = (itemId, action, value) => {
    setTestingMap((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [action]: value,
      },
    }));
  };
  const onRunTest = async (item) => {
    const sql = String(testSqlDraft[item.id] || '').trim();
    if (!sql) {
      toast.error('请输入测试 SQL');
      return;
    }
    markTesting(item.id, 'query', true);
    try {
      const response = await contributionAPI.runTestQuery(item.id, sql);
      if (!response.success) return;
      setTestState((prev) => ({
        ...prev,
        [item.id]: {
          ...(prev[item.id] || {}),
          queryResult: response.data,
        },
      }));
      toast.success('SQL 测试完成');
    } catch (error) {
      console.error('执行测试 SQL 失败', error);
    } finally {
      markTesting(item.id, 'query', false);
    }
  };
  const onFormatTestSql = (itemId) => {
    const raw = String(testSqlDraft[itemId] || '').trim();
    if (!raw) {
      toast.error('请先输入测试 SQL');
      return;
    }
    try {
      const formatted = formatSQL(raw, {
        language: 'mysql',
        keywordCase: 'upper',
        linesBetweenQueries: 1,
      });
      setTestSqlDraft((prev) => ({ ...prev, [itemId]: formatted }));
      toast.success('SQL 已格式化');
    } catch (error) {
      toast.error('SQL 格式化失败，请检查语法');
    }
  };
  const onUseReferenceSql = (item) => {
    const ref = String(item.referenceSql || '').trim();
    if (!ref) {
      toast.error('当前投稿暂无 AI 参考 SQL');
      return;
    }
    setTestSqlDraft((prev) => ({ ...prev, [item.id]: ref }));
    toast.success('已填入 AI 参考 SQL');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">题目贡献中心</h1>
        <p className="text-sm text-gray-500 mt-1">投稿你在面试中遇到的 SQL 题，审核通过可获得积分奖励。</p>
      </div>

      <div className="p-6 flex-1 overflow-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-500">总积分</div>
            <div className="mt-2 flex items-center text-2xl font-bold text-amber-600">
              <Gift size={22} className="mr-2" />
              {summary.totalPoints || 0}
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-500">待审核</div>
            <div className="mt-2 text-2xl font-bold text-amber-600">{statusStats.pending}</div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-500">已通过</div>
            <div className="mt-2 text-2xl font-bold text-emerald-600">{statusStats.approved}</div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-500">已驳回</div>
            <div className="mt-2 text-2xl font-bold text-red-600">{statusStats.rejected}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">提交新题目</h2>
            {isGuest && (
              <div className="mb-4 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-700">
                游客仅可浏览，注册后可提交题目并获得积分。
              </div>
            )}
            <form className="space-y-3" onSubmit={onSubmit}>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="题目描述（必填，管理员侧会根据描述自动生成题目标题）"
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                name="rawDataText"
                value={form.rawDataText}
                onChange={onChange}
                placeholder="原始数据（必填，可贴面试题中的样例表格/文本数据）"
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                name="expectedResult"
                value={form.expectedResult}
                onChange={onChange}
                placeholder="期望结果描述（必填）"
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  name="sourceCompany"
                  value={form.sourceCompany}
                  onChange={onChange}
                  placeholder="公司标签（必填）"
                  className="border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  name="sourcePosition"
                  value={form.sourcePosition}
                  onChange={onChange}
                  placeholder="岗位方向（可选）"
                  className="border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  name="tags"
                  value={form.tags}
                  onChange={onChange}
                  placeholder="标签，如窗口函数"
                  className="border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isGuest || submitting}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 disabled:opacity-50"
              >
                <Send size={16} />
                {submitting ? '提交中...' : '提交审核'}
              </button>
            </form>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">我的投稿记录</h2>
            {loading ? (
              <div className="text-gray-500 text-sm">加载中...</div>
            ) : list.length === 0 ? (
              <div className="text-gray-500 text-sm">暂无投稿记录</div>
            ) : (
              <div className="space-y-3 max-h-[680px] overflow-auto pr-1">
                {list.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.id)}
                        className="min-w-0 flex items-center gap-1.5 text-left"
                      >
                        {isExpanded(item.id) ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                        <span className="font-medium text-gray-800 truncate">{item.title}</span>
                      </button>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusBadge(item.status)}`}>
                        {item.status === 'PENDING' ? '待审核' : item.status === 'APPROVED' ? '已通过' : '已驳回'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(item.createdAt).toLocaleString('zh-CN')}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{isExpanded(item.id) ? item.description : previewText(item.description)}</p>
                    {isExpanded(item.id) && item.rawDataText && (
                      <div className="mt-2 text-xs bg-gray-50 border rounded-lg p-2 text-gray-600 whitespace-pre-wrap">
                        原始数据：{item.rawDataText}
                      </div>
                    )}
                    {isExpanded(item.id) && item.expectedResult && (
                      <div className="mt-2 text-xs bg-gray-50 border rounded-lg p-2 text-gray-600 whitespace-pre-wrap">
                        期望结果：{item.expectedResult}
                      </div>
                    )}
                    {isExpanded(item.id) && (
                      <div className="mt-2 border rounded-lg bg-white">
                        <button
                          type="button"
                          onClick={() => toggleAiFold(item.id)}
                          className="w-full px-2.5 py-2 border-b text-left flex items-center justify-between"
                        >
                          <span className="text-xs text-slate-700">
                            AI 生成 SQL
                            <span className="ml-2 text-[11px] text-slate-500">状态：{item.aiStatus || 'PENDING'}</span>
                          </span>
                          {isAiFoldOpen(item.id) ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                        </button>
                        {isAiFoldOpen(item.id) && (
                          <div className="p-2.5">
                            <UserSqlPanel label="AI 建表 SQL" sql={item.aiCreateTableSql} />
                            <UserSqlPanel label="AI 插入数据 SQL" sql={item.aiInsertSql} />
                            <UserSqlPanel label="AI 参考答案 SQL" sql={item.referenceSql} />
                            {item.aiErrorMessage && (
                              <div className="mt-2 text-xs rounded bg-red-50 border border-red-100 px-2 py-1 text-red-600">
                                AI 生成失败：{item.aiErrorMessage}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {isExpanded(item.id) && (
                      <div className="mt-2 border rounded-lg bg-slate-50">
                        <button
                          type="button"
                          onClick={() => toggleTestFold(item.id)}
                          className="w-full px-2.5 py-2 border-b text-left flex items-center justify-between"
                        >
                          <span className="text-xs text-slate-700">测试验证（独立测试库，不影响业务库）</span>
                          {isTestFoldOpen(item.id) ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                        </button>
                        {isTestFoldOpen(item.id) && (
                          <div className="p-2.5">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => onFormatTestSql(item.id)}
                                className="px-2.5 py-1.5 text-xs rounded bg-cyan-600 text-white inline-flex items-center gap-1"
                              >
                                <Wand2 size={12} />
                                格式化 SQL
                              </button>
                              <button
                                type="button"
                                onClick={() => onUseReferenceSql(item)}
                                className="px-2.5 py-1.5 text-xs rounded bg-indigo-600 text-white"
                              >
                                使用 AI 参考 SQL
                              </button>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              手动步骤：先执行 AI 建表 SQL，再执行 AI 插入 SQL，最后执行你的测试 SQL。
                            </div>
                            <div className="mt-2 border rounded-lg overflow-hidden bg-slate-950">
                              <div className="px-2.5 py-1.5 border-b border-slate-800 text-[11px] text-slate-300">测试 SQL</div>
                              <textarea
                                value={testSqlDraft[item.id] || ''}
                                onChange={(e) => setTestSqlDraft((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                placeholder="输入测试 SQL（连接独立测试库）"
                                rows={4}
                                className="w-full px-3 py-2 bg-slate-950 text-slate-100 text-xs font-mono outline-none resize-y"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => onRunTest(item)}
                              disabled={Boolean(testingMap[item.id]?.query)}
                              className="mt-2 px-2.5 py-1.5 text-xs rounded bg-emerald-600 text-white disabled:opacity-50"
                            >
                              {testingMap[item.id]?.query ? '执行中...' : '运行测试 SQL'}
                            </button>
                            {testState[item.id]?.queryResult && (
                              <div className="mt-2 text-xs text-slate-600">
                                <div>返回行数：{testState[item.id].queryResult.rowCount}</div>
                                <div>耗时：{testState[item.id].queryResult.executionTime} ms</div>
                                <pre className="mt-1 bg-white border rounded p-2 overflow-auto max-h-56">
                                  {JSON.stringify(testState[item.id].queryResult.rows || [], null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      <span className="inline-flex items-center text-gray-600">
                        {item.status === 'APPROVED' ? (
                          <CheckCircle2 size={14} className="mr-1 text-emerald-600" />
                        ) : item.status === 'REJECTED' ? (
                          <XCircle size={14} className="mr-1 text-red-600" />
                        ) : (
                          <Clock3 size={14} className="mr-1 text-amber-600" />
                        )}
                        奖励积分：{item.rewardPoints || 0}
                      </span>
                      {item.tags && <span className="text-gray-500">标签：{item.tags}</span>}
                      {item.sourceCompany && <span className="text-gray-500">公司：{item.sourceCompany}</span>}
                    </div>
                    {item.adminNote && (
                      <div className="mt-2 text-xs rounded bg-gray-50 border border-gray-100 px-2 py-1 text-gray-600">
                        审核备注：{item.adminNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contributions;
