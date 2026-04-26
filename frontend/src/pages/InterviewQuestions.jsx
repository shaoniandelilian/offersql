import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Code2,
  CheckCircle,
  Circle,
  ArrowLeft,
  Play,
  Eye,
  EyeOff,
  Database,
  Table,
  TrendingUp,
  Award,
  Target,
  Search,
  X,
  Zap,
  CheckSquare,
  Square,
  LayoutGrid,
  List,
  Clock,
  XCircle,
  MessageCircle,
  Send,
  Reply,
  Lock
} from 'lucide-react';
import { schemaAPI, submissionAPI, commentsAPI, questionsAPI } from '../utils/api';
import { usePageState } from '../hooks/usePageState';
import toast from 'react-hot-toast';

// 难度配置
const difficultyConfig = {
  '简单': {
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    bg: 'bg-emerald-50',
    icon: Zap,
    barColor: 'bg-emerald-500'
  },
  '中等': {
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    bg: 'bg-amber-50',
    icon: Target,
    barColor: 'bg-amber-500'
  },
  '困难': {
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    bg: 'bg-rose-50',
    icon: Award,
    barColor: 'bg-rose-500'
  }
};

const InterviewQuestions = () => {
  const navigate = useNavigate();

  // 使用状态保持 hook
  const [pageState, updatePageState] = usePageState('interviewQuestions', {
    selectedLibrary: 'beginner',
    selectedCategory: 'all',
    selectedDifficulty: 'all',
    selectedQuestion: null,
    showHint: false,
    showSolution: false,
    viewMode: 'list', // 'list' | 'card'
  });

  const [selectedLibrary, setSelectedLibrary] = useState(pageState.selectedLibrary || 'beginner');
  const [selectedCategory, setSelectedCategory] = useState(pageState.selectedCategory);
  const [selectedDifficulty, setSelectedDifficulty] = useState(pageState.selectedDifficulty);
  const [selectedQuestion, setSelectedQuestion] = useState(pageState.selectedQuestion);
  const [showHint, setShowHint] = useState(pageState.showHint);
  const [showSolution, setShowSolution] = useState(pageState.showSolution);
  const [viewMode, setViewMode] = useState(pageState.viewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [completedQuestions, setCompletedQuestions] = useState(() => {
    const saved = localStorage.getItem('completed_questions');
    return saved ? JSON.parse(saved) : [];
  });
  const [tableSchemas, setTableSchemas] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [expandedReplyThreads, setExpandedReplyThreads] = useState({});
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // 状态变化时保存
  useEffect(() => {
    updatePageState({
      selectedLibrary,
      selectedCategory,
      selectedDifficulty,
      selectedQuestion,
      showHint,
      showSolution,
      viewMode,
    });
  }, [selectedLibrary, selectedCategory, selectedDifficulty, selectedQuestion, showHint, showSolution, viewMode, updatePageState]);

  // 获取表结构信息
  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        const response = await schemaAPI.getSchema();
        if (response.success) {
          const schemaMap = {};
          response.data.forEach(table => {
            schemaMap[table.name] = table;
          });
          setTableSchemas(schemaMap);
        }
      } catch (error) {
        console.error('获取表结构失败:', error);
      }
    };
    fetchSchemas();
  }, []);

  useEffect(() => {
    const fetchQuestions = async () => {
      setQuestionsLoading(true);
      try {
        const response = await questionsAPI.getQuestions();
        if (response.success) {
          setQuestions(response.data || []);
          setLibraries(response.meta?.libraries || []);
        }
      } catch (error) {
        console.error('获取题库失败:', error);
      } finally {
        setQuestionsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!selectedQuestion?.id) return;
      try {
        const response = await questionsAPI.getQuestion(selectedQuestion.id);
        if (response.success) {
          setSelectedQuestion(response.data);
        }
      } catch (error) {
        console.error('获取题目详情失败:', error);
      }
    };
    fetchDetail();
  }, [selectedQuestion?.id]);

  // 保存完成的题目
  useEffect(() => {
    localStorage.setItem('completed_questions', JSON.stringify(completedQuestions));
  }, [completedQuestions]);

  // 监听自动完成事件
  useEffect(() => {
    const handleQuestionCompleted = (event) => {
      const { questionId } = event.detail;
      setCompletedQuestions(prev => {
        if (!prev.includes(questionId)) {
          return [...prev, questionId];
        }
        return prev;
      });
    };

    window.addEventListener('questionCompleted', handleQuestionCompleted);
    return () => {
      window.removeEventListener('questionCompleted', handleQuestionCompleted);
    };
  }, []);

  // 当题目变化时获取提交历史
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (selectedQuestion) {
        try {
          const response = await submissionAPI.getSubmissions(selectedQuestion.id);
          if (response.success) {
            setSubmissions(response.data);
          }
        } catch (error) {
          console.error('获取提交历史失败:', error);
        }
      } else {
        setSubmissions([]);
      }
    };
    fetchSubmissions();
  }, [selectedQuestion]);

  // 当题目变化时获取评论
  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedQuestion) {
        setComments([]);
        setReplyDrafts({});
        setExpandedReplyThreads({});
        setCommentInput('');
        return;
      }

      setCommentsLoading(true);
      try {
        const response = await commentsAPI.getComments(selectedQuestion.id);
        if (response.success) {
          setComments(response.data);
        }
      } catch (error) {
        console.error('获取评论失败:', error);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [selectedQuestion]);

  // 计算统计数据
  const stats = useMemo(() => {
    const scopedQuestions = questions.filter((q) => (q.libraries || []).includes(selectedLibrary));
    const total = scopedQuestions.length;
    const byDifficulty = {
      '简单': scopedQuestions.filter(q => q.difficulty === '简单').length,
      '中等': scopedQuestions.filter(q => q.difficulty === '中等').length,
      '困难': scopedQuestions.filter(q => q.difficulty === '困难').length,
    };

    const completedByDifficulty = {
      '简单': scopedQuestions.filter(q => q.difficulty === '简单' && completedQuestions.includes(q.id)).length,
      '中等': scopedQuestions.filter(q => q.difficulty === '中等' && completedQuestions.includes(q.id)).length,
      '困难': scopedQuestions.filter(q => q.difficulty === '困难' && completedQuestions.includes(q.id)).length,
    };

    const scopedCompleted = scopedQuestions.filter((q) => completedQuestions.includes(q.id)).length;

    return {
      total,
      completed: scopedCompleted,
      byDifficulty,
      completedByDifficulty,
      progress: total > 0 ? (scopedCompleted / total) * 100 : 0
    };
  }, [completedQuestions, questions, selectedLibrary]);

  const categories = useMemo(() => {
    const scopedQuestions = questions.filter((q) => (q.libraries || []).includes(selectedLibrary));
    const list = [
      { id: 'all', name: '全部题目', count: scopedQuestions.length },
    ];
    const allCategories = Array.from(new Set(scopedQuestions.map(q => q.category)));
    allCategories.forEach((name) => {
      list.push({
        id: name,
        name,
        count: scopedQuestions.filter(q => q.category === name).length,
      });
    });
    return list;
  }, [questions, selectedLibrary]);

  const libraryNameMap = useMemo(() => {
    const map = {};
    libraries.forEach((lib) => {
      map[lib.id] = lib.name;
    });
    return map;
  }, [libraries]);

  const currentUsername = useMemo(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      return savedUser.username || 'U';
    } catch (error) {
      return 'U';
    }
  }, []);

  const currentUserRole = useMemo(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      return savedUser.role || 'USER';
    } catch (error) {
      return 'USER';
    }
  }, []);

  const currentUserPlan = useMemo(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      return savedUser.plan || 'FREE';
    } catch (error) {
      return 'FREE';
    }
  }, []);

  const currentUserLibraryPermissions = useMemo(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (!Array.isArray(savedUser.libraryPermissions)) return [];
      return savedUser.libraryPermissions.map((x) => String(x).trim()).filter(Boolean);
    } catch (error) {
      return [];
    }
  }, []);

  // 过滤题目
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchLibrary = (q.libraries || []).includes(selectedLibrary);
      const matchCategory = selectedCategory === 'all' || q.category === selectedCategory;
      const matchDifficulty = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
      const matchSearch = !searchQuery ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.id.includes(searchQuery);
      return matchLibrary && matchCategory && matchDifficulty && matchSearch;
    });
  }, [selectedLibrary, selectedCategory, selectedDifficulty, searchQuery, questions]);

  useEffect(() => {
    if (!libraries.length) return;
    const isAccessible = (lib) => {
      if (!lib) return false;
      if (typeof lib.canAccess === 'boolean') return lib.canAccess;
      if (lib.free) return true;
      return currentUserRole === 'ADMIN'
        || currentUserPlan === 'PRO'
        || currentUserLibraryPermissions.includes(lib.id);
    };
    const fallback = (
      libraries.find((lib) => lib.id === 'beginner' && isAccessible(lib))
      || libraries.find((lib) => isAccessible(lib))
      || libraries.find((lib) => lib.id === 'beginner')
      || libraries[0]
    )?.id;

    const selected = libraries.find((l) => l.id === selectedLibrary);
    if (!selected) {
      if (fallback) setSelectedLibrary(fallback);
      return;
    }
    const isAllowed = typeof selected.canAccess === 'boolean'
      ? selected.canAccess
      : (
        selected.free
        || currentUserRole === 'ADMIN'
        || currentUserPlan === 'PRO'
        || currentUserLibraryPermissions.includes(selected.id)
    );
    if (!isAllowed) {
      if (fallback) setSelectedLibrary(fallback);
    }
  }, [selectedLibrary, libraries, currentUserRole, currentUserPlan, currentUserLibraryPermissions]);

  useEffect(() => {
    const validCategoryIds = new Set(categories.map((c) => c.id));
    if (!validCategoryIds.has(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  // 标记题目完成
  const toggleComplete = (questionId, e) => {
    if (e) e.stopPropagation();
    setCompletedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  // 开始练习
  const startPractice = (question, e) => {
    if (e) e.stopPropagation();
    if (!question.canPractice) {
      toast.error('当前账号无此题练习权限，请升级后解锁');
      return;
    }
    localStorage.removeItem('sql_editor_content');
    localStorage.removeItem('sql_editor_result');
    localStorage.setItem('sql_editor_question', JSON.stringify(question));
    navigate('/app');
    toast.success('已加载题目到 SQL 编辑器');
  };

  // 查看表结构
  const viewTableSchema = (tableName) => {
    const schema = tableSchemas[tableName];
    if (schema) {
      const columns = schema.columns.map(c => `${c.name} (${c.type})`).join('\n--   ');
      const schemaInfo = `-- ${tableName} 表结构：\n--   ${columns}\n`;
      toast.success(`表 ${tableName} 结构已显示在控制台`);
      console.log(schemaInfo);
    }
  };

  // 清除所有筛选
  const clearFilters = () => {
    const fallback = (
      libraries.find((lib) => lib.id === 'beginner' && canAccessLibrary(lib))
      || libraries.find((lib) => canAccessLibrary(lib))
      || libraries.find((lib) => lib.id === 'beginner')
      || libraries[0]
    )?.id;
    if (fallback) setSelectedLibrary(fallback);
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setSearchQuery('');
  };

  const commentById = useMemo(() => {
    const map = new Map();
    comments.forEach((comment) => map.set(comment.id, comment));
    return map;
  }, [comments]);

  const childrenMap = useMemo(() => {
    const map = new Map();
    comments.forEach((comment) => {
      const key = comment.parentId ?? null;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(comment);
    });

    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    return map;
  }, [comments]);

  const commentThreads = useMemo(() => {
    return childrenMap.get(null) || [];
  }, [childrenMap]);

  const formatCommentTime = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canAccessLibrary = (library) => {
    if (!library) return true;
    if (typeof library.canAccess === 'boolean') return library.canAccess;
    if (library.free) return true;
    return currentUserRole === 'ADMIN'
      || currentUserPlan === 'PRO'
      || currentUserLibraryPermissions.includes(library.id);
  };

  const handleSelectLibrary = (library) => {
    if (!canAccessLibrary(library)) {
      toast.error('该题库需管理员开通对应权限后可使用');
      return;
    }
    setSelectedLibrary(library?.id || 'beginner');
  };

  const avatarPalettes = [
    { bg: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', border: '#bfdbfe' },
    { bg: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)', border: '#99f6e4' },
    { bg: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', border: '#ddd6fe' },
    { bg: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', border: '#fed7aa' },
    { bg: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)', border: '#bbf7d0' },
    { bg: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', border: '#cbd5e1' },
  ];

  const getAvatarTheme = (username) => {
    const value = (username || 'U').trim();
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % avatarPalettes.length;
    return avatarPalettes[index];
  };

  const getAvatarSizeClass = (size) => {
    if (size === 'sm') return 'w-9 h-9 text-[10px]';
    if (size === 'md') return 'w-12 h-12 text-[11px]';
    return 'w-10 h-10 text-[11px]';
  };

  const renderAvatar = (username, size = 'md') => {
    const name = username || 'U';
    const theme = getAvatarTheme(name);
    return (
      <div
        className={`${getAvatarSizeClass(size)} rounded-full text-white flex items-center justify-center font-semibold flex-shrink-0 shadow-sm border overflow-hidden`}
        style={{
          background: theme.bg,
          borderColor: theme.border,
        }}
        title={name}
      >
        <span
          className="block w-full px-1 text-center leading-none whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {name}
        </span>
      </div>
    );
  };

  const submitComment = async (parentId = null) => {
    if (!selectedQuestion) return;

    const content = parentId ? (replyDrafts[parentId] || '') : commentInput;
    if (!content.trim()) {
      toast.error('评论内容不能为空');
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await commentsAPI.createComment(selectedQuestion.id, content.trim(), parentId);
      if (response.success) {
        if (parentId) {
          setReplyDrafts(prev => {
            const next = { ...prev };
            delete next[parentId];
            return next;
          });
        } else {
          setCommentInput('');
        }

        const commentsRes = await commentsAPI.getComments(selectedQuestion.id);
        if (commentsRes.success) {
          setComments(commentsRes.data);
        }

        toast.success(parentId ? '回复成功' : '评论发布成功');
      }
    } catch (error) {
      console.error('发表评论失败:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const getFlattenReplies = (rootId) => {
    const result = [];
    const stack = [...(childrenMap.get(rootId) || [])];

    while (stack.length > 0) {
      const node = stack.shift();
      result.push(node);
      const children = childrenMap.get(node.id) || [];
      stack.unshift(...children);
    }

    return result;
  };

  // 卡片视图组件
  const CardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
      {filteredQuestions.map((question) => {
        const isCompleted = completedQuestions.includes(question.id);
        const diffConfig = difficultyConfig[question.difficulty];
        const DiffIcon = diffConfig.icon;

        return (
          <div
            key={question.id}
            onClick={() => setSelectedQuestion(question)}
            className={`group bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg ${
              isCompleted ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-gray-400">#{question.id}</span>
                <span className={`px-2 py-0.5 text-xs rounded-md font-medium ${diffConfig.color}`}>
                  <DiffIcon size={12} className="inline mr-1" />
                  {question.difficulty}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-md font-medium ${question.accessLevel === 'PRO' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                  {question.accessLevel}
                </span>
              </div>
              <button
                onClick={(e) => toggleComplete(question.id, e)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {isCompleted ? (
                  <CheckCircle size={20} className="text-emerald-500" />
                ) : (
                  <Circle size={20} className="text-gray-300" />
                )}
              </button>
            </div>

            <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {question.title}
            </h3>

            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
              {question.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md font-medium">
                  {question.category}
                </span>
                {(question.libraries || []).slice(0, 1).map((libId) => (
                  <span key={libId} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-md font-medium">
                    {libraryNameMap[libId] || libId}
                  </span>
                ))}
              </div>
              <button
                onClick={(e) => startPractice(question, e)}
                className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded-md transition-colors ${
                  question.canPractice ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Play size={12} />
                <span>{question.canPractice ? '开始练习' : '已锁定'}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="h-full flex bg-gray-50">
      {/* 左侧边栏 */}
      <div className="w-72 bg-white border-r flex flex-col overflow-y-auto">
        {/* 头部 */}
        <div className="p-5 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
          <h2 className="text-xl font-bold text-white flex items-center">
            <BookOpen className="mr-2" size={24} />
            SQL 面试题库
          </h2>
          <p className="text-sm text-blue-100 mt-1">
            大厂秋招必刷 30 题
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="p-4 space-y-3">
          {/* 总进度 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp size={18} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">总进度</span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {stats.completed}/{stats.total}
              </span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">已完成 {Math.round(stats.progress)}%</p>
          </div>

          {/* 题库选择 */}
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <BookOpen size={16} className="mr-1.5" />
            题库选择
          </h3>
          <div className="space-y-1 mb-4">
            {libraries.map((lib) => (
              <button
                key={lib.id}
                onClick={() => handleSelectLibrary(lib)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  selectedLibrary === lib.id
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                title={lib.description}
              >
                <span className="truncate flex items-center gap-1">
                  {lib.name}
                  {!canAccessLibrary(lib) && <Lock size={12} className="text-amber-500" />}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  selectedLibrary === lib.id
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {lib.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedQuestion ? (
          // 题目详情视图
          <div className="flex-1 overflow-auto p-6">
            <button
              onClick={() => {
                setSelectedQuestion(null);
                setShowHint(false);
                setShowSolution(false);
              }}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
            >
              <ArrowLeft size={18} />
              <span>返回列表</span>
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-sm text-gray-400 font-mono">#{selectedQuestion.id}</span>
                    <span className={`px-2.5 py-1 text-xs rounded-md font-medium ${difficultyConfig[selectedQuestion.difficulty]?.color}`}>
                      {selectedQuestion.difficulty}
                    </span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs rounded-md font-medium">
                      {selectedQuestion.category}
                    </span>
                    {(selectedQuestion.libraries || []).map((libId) => (
                      <span key={libId} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-md font-medium">
                        {libraryNameMap[libId] || libId}
                      </span>
                    ))}
                    {completedQuestions.includes(selectedQuestion.id) && (
                      <span className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-md font-medium">
                        <CheckCircle size={12} />
                        <span>已完成</span>
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {selectedQuestion.title}
                  </h1>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleComplete(selectedQuestion.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      completedQuestions.includes(selectedQuestion.id)
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {completedQuestions.includes(selectedQuestion.id) ? (
                      <>
                        <CheckSquare size={18} />
                        <span className="font-medium">已完成</span>
                      </>
                    ) : (
                      <>
                        <Square size={18} />
                        <span className="font-medium">标记完成</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* 题目描述 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Target size={16} className="mr-1.5 text-blue-500" />
                    题目描述
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{selectedQuestion.description}</p>
                </div>

                {/* 相关表 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Database size={16} className="mr-1.5 text-purple-500" />
                    相关数据表
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedQuestion.tables.map(table => (
                      <button
                        key={table}
                        onClick={() => viewTableSchema(table)}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
                      >
                        <Table size={14} />
                        <span className="font-medium">{table}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 提示 */}
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <Lightbulb size={18} className="text-amber-600" />
                      <span className="font-medium text-amber-800">解题思路</span>
                    </div>
                    {showHint ? <EyeOff size={16} className="text-amber-600" /> : <Eye size={16} className="text-amber-600" />}
                  </button>
                  {showHint && (selectedQuestion.hint
                    ? <p className="mt-3 text-amber-700 text-sm leading-relaxed">{selectedQuestion.hint}</p>
                    : <p className="mt-3 text-amber-700 text-sm">当前账号暂无该题提示权限</p>
                  )}
                </div>

                {/* 参考答案 */}
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <button
                    onClick={() => setShowSolution(!showSolution)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <Award size={18} className="text-yellow-500" />
                      <span className="font-medium text-gray-300">参考答案</span>
                    </div>
                    {showSolution ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-gray-400" />}
                  </button>
                  {showSolution && (selectedQuestion.solution ? (
                    <pre className="mt-3 overflow-x-auto">
                      <code className="text-green-400 text-sm font-mono">{selectedQuestion.solution}</code>
                    </pre>
                  ) : (
                    <p className="mt-3 text-sm text-yellow-300">升级后可查看参考答案</p>
                  ))}
                </div>

                {/* 提交历史 */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setShowSubmissions(!showSubmissions)}
                    className="w-full flex items-center justify-between p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Clock size={18} className="text-blue-500" />
                      <span className="font-medium text-gray-700">提交历史</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                        {submissions.length}
                      </span>
                    </div>
                    {showSubmissions ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-gray-400" />}
                  </button>
                  {showSubmissions && (
                    <div className="max-h-64 overflow-auto">
                      {submissions.length === 0 ? (
                        <p className="p-4 text-gray-400 text-sm text-center">暂无提交记录</p>
                      ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">执行时间</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">结果</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">提交时间</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {submissions.map((sub) => (
                              <tr key={sub.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2">
                                  {sub.success ? (
                                    <span className="flex items-center text-emerald-600 text-sm">
                                      <CheckCircle size={14} className="mr-1" /> 成功
                                    </span>
                                  ) : (
                                    <span className="flex items-center text-red-600 text-sm">
                                      <XCircle size={14} className="mr-1" /> 失败
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">{sub.executionTime}ms</td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  {sub.success ? `${sub.rowCount} 行` : sub.errorMessage}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                  {new Date(sub.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>

                {/* 题目评论区 */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="w-full p-4 border-b bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageCircle size={18} className="text-indigo-500" />
                        <span className="font-medium text-gray-700">题目讨论区</span>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded-full">
                          {comments.length}
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform ${showComments ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {showComments && (
                    <>
                      {currentUserRole === 'GUEST' ? (
                        <div className="p-4 border-b bg-amber-50 text-amber-700 text-sm">
                          游客仅可浏览评论，注册后可参与讨论。
                        </div>
                      ) : (
                        <div className="p-4 border-b bg-white">
                          <div className="flex items-start space-x-3">
                            {renderAvatar(currentUsername, 'base')}
                            <div className="flex-1 space-y-2">
                              <textarea
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="发一条友善评论，分享你的解法和思路"
                                rows={3}
                                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                              <div className="flex justify-end">
                                <button
                                  onClick={() => submitComment()}
                                  disabled={submittingComment}
                                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                  <Send size={14} />
                                  <span>{submittingComment ? '发布中...' : '发布评论'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="max-h-80 overflow-auto">
                        {commentsLoading ? (
                          <p className="p-4 text-sm text-gray-400 text-center">评论加载中...</p>
                        ) : commentThreads.length === 0 ? (
                          <p className="p-4 text-sm text-gray-400 text-center">暂无评论，来抢沙发吧</p>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {commentThreads.map((comment) => {
                              const replies = getFlattenReplies(comment.id);
                              const expanded = Boolean(expandedReplyThreads[comment.id]);

                              return (
                                <div key={comment.id} className="p-4">
                                  <div className="flex items-start space-x-3">
                                    {renderAvatar(comment.username, 'md')}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center">
                                        <span className="text-sm font-medium text-gray-800">{comment.username}</span>
                                      </div>
                                      <p className="mt-1.5 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                                      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                                        <span>{formatCommentTime(comment.createdAt)}</span>
                                        {currentUserRole !== 'GUEST' && (
                                          <button
                                            onClick={() => setReplyDrafts(prev => ({ ...prev, [comment.id]: prev[comment.id] ?? '' }))}
                                            className="inline-flex items-center space-x-1 text-gray-500 hover:text-indigo-600"
                                          >
                                            <Reply size={12} />
                                            <span>回复</span>
                                          </button>
                                        )}
                                      </div>

                                      {replyDrafts[comment.id] !== undefined && (
                                        <div className="mt-3 space-y-2">
                                          <div className="inline-flex items-center text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                                            <Reply size={11} className="mr-1" />
                                            回复 @{comment.username} · {formatCommentTime(comment.createdAt)}
                                          </div>
                                          <textarea
                                            value={replyDrafts[comment.id]}
                                            onChange={(e) => setReplyDrafts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                            placeholder={`回复 @${comment.username}`}
                                            rows={2}
                                            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                          />
                                          <div className="flex items-center justify-end space-x-2">
                                            <button
                                              onClick={() => setReplyDrafts(prev => {
                                                const next = { ...prev };
                                                delete next[comment.id];
                                                return next;
                                              })}
                                              className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700"
                                            >
                                              取消
                                            </button>
                                            <button
                                              onClick={() => submitComment(comment.id)}
                                              disabled={submittingComment}
                                              className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                              回复
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {replies.length > 0 && (
                                        <div className="mt-3">
                                          <button
                                            onClick={() => setExpandedReplyThreads(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                                            className="text-xs text-gray-500 hover:text-indigo-600"
                                          >
                                            {expanded ? '收起回复' : `展开 ${replies.length} 条回复`}
                                          </button>
                                        </div>
                                      )}

                                      {expanded && replies.length > 0 && (
                                        <div className="mt-3 space-y-3">
                                          {replies.map((reply) => {
                                            const parentName = reply.parentId ? (commentById.get(reply.parentId)?.username || '某用户') : null;
                                            return (
                                              <div key={reply.id} className="flex items-start space-x-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
                                                {renderAvatar(reply.username, 'sm')}
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center">
                                                    <span className="text-xs font-medium text-gray-700">{reply.username}</span>
                                                  </div>
                                                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                    {parentName && (
                                                      <span className="inline-flex items-center text-gray-500 mr-1">
                                                        <Reply size={12} className="mr-1" />
                                                        @{parentName}：
                                                      </span>
                                                    )}
                                                    {reply.content}
                                                  </p>
                                                  <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
                                                    <span>{formatCommentTime(reply.createdAt)}</span>
                                                    {currentUserRole !== 'GUEST' && (
                                                      <button
                                                        onClick={() => setReplyDrafts(prev => ({ ...prev, [reply.id]: prev[reply.id] ?? '' }))}
                                                        className="inline-flex items-center space-x-1 text-xs text-gray-500 hover:text-indigo-600"
                                                      >
                                                        <Reply size={11} />
                                                        <span>回复</span>
                                                      </button>
                                                    )}
                                                  </div>

                                                  {replyDrafts[reply.id] !== undefined && (
                                                    <div className="mt-2 space-y-2">
                                                      <div className="inline-flex items-center text-xs text-gray-500 bg-white rounded px-2 py-1 border border-gray-200">
                                                        <Reply size={11} className="mr-1" />
                                                        回复 @{reply.username} · {formatCommentTime(reply.createdAt)}
                                                      </div>
                                                      <textarea
                                                        value={replyDrafts[reply.id]}
                                                        onChange={(e) => setReplyDrafts(prev => ({ ...prev, [reply.id]: e.target.value }))}
                                                        placeholder={`回复 @${reply.username}`}
                                                        rows={2}
                                                        className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                      />
                                                      <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                          onClick={() => setReplyDrafts(prev => {
                                                            const next = { ...prev };
                                                            delete next[reply.id];
                                                            return next;
                                                          })}
                                                          className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700"
                                                        >
                                                          取消
                                                        </button>
                                                        <button
                                                          onClick={() => submitComment(reply.id)}
                                                          disabled={submittingComment}
                                                          className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                                        >
                                                          回复
                                                        </button>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* 开始练习按钮 */}
                <div className="pt-4 border-t">
                  <button
                    onClick={() => startPractice(selectedQuestion)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors font-medium ${
                      selectedQuestion.canPractice
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Code2 size={20} />
                    <span>{selectedQuestion.canPractice ? '开始练习' : '当前题目已锁定'}</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 题目列表视图
          <>
            {/* 顶部工具栏 */}
            <div className="bg-white border-b px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <LayoutGrid size={22} className="mr-2 text-blue-600" />
                  {libraries.find((l) => l.id === selectedLibrary)?.name || selectedLibrary}
                </h2>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  共 {filteredQuestions.length} 题
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px]">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索题目..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>

                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedDifficulty('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      selectedDifficulty === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    全部
                  </button>
                  {Object.keys(difficultyConfig).map(diff => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? 'all' : diff)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        selectedDifficulty === diff
                          ? 'bg-white shadow-sm ' + difficultyConfig[diff].color.split(' ')[1]
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>

                <div className="ml-auto flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                    }`}
                    title="列表视图"
                  >
                    <List size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('card')}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                    }`}
                    title="卡片视图"
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>
              </div>

              {(selectedCategory !== 'all' || selectedDifficulty !== 'all' || searchQuery) && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-gray-500">筛选条件:</span>
                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-md">
                      分类: {categories.find(c => c.id === selectedCategory)?.name}
                      <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:text-blue-900">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedDifficulty !== 'all' && (
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-md ${difficultyConfig[selectedDifficulty].color}`}>
                      难度: {selectedDifficulty}
                      <button onClick={() => setSelectedDifficulty('all')} className="ml-1 hover:opacity-70">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md">
                      搜索: {searchQuery}
                      <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-gray-900">
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    清除全部
                  </button>
                </div>
              )}
            </div>

            {/* 题目列表 */}
            <div className="flex-1 overflow-auto">
              {questionsLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <p className="text-lg">题库加载中...</p>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Search size={48} className="mb-4 opacity-30" />
                  <p className="text-lg">没有找到匹配的题目</p>
                  <p className="text-sm mt-2">
                    当前筛选: 分类={selectedCategory}, 难度={selectedDifficulty}, 搜索={searchQuery || '无'}
                  </p>
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    清除筛选条件
                  </button>
                </div>
              ) : viewMode === 'card' ? (
                <CardView />
              ) : (
                <div className="p-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12"></th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">编号</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">题目</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-28">分类</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">题库</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">难度</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">操作</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredQuestions.map(q => (
                          <tr
                            key={q.id}
                            onClick={() => setSelectedQuestion(q)}
                            className="hover:bg-blue-50 cursor-pointer"
                          >
                            <td className="px-4 py-3">
                              <button
                                onClick={(e) => toggleComplete(q.id, e)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                {completedQuestions.includes(q.id) ? (
                                  <CheckCircle size={18} className="text-emerald-500" />
                                ) : (
                                  <Circle size={18} className="text-gray-300" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 font-mono">{q.id}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-800">{q.title}</span>
                                {completedQuestions.includes(q.id) && (
                                  <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">已完成</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md">{q.category}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-md">
                                {libraryNameMap[q.libraries?.[0]] || '未分组'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-md ${difficultyConfig[q.difficulty]?.color}`}>
                                {q.difficulty}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={(e) => startPractice(q, e)}
                                className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md ${
                                  q.canPractice ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                <Play size={14} />
                                <span>{q.canPractice ? '练习' : '锁定'}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewQuestions;
