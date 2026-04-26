const interviewQuestions = require('../questionData/interviewQuestions');

const LIBRARY_DEFS = [
  {
    id: 'beginner',
    name: '入门题库',
    description: '面向新同学的 SQL 语法与基础查询练习（完全免费）',
    free: true,
  },
  {
    id: 'analysis_product',
    name: '数据分析与产品题库',
    description: '偏分析与业务指标题，覆盖留存、分组统计、用户行为分析',
    free: false,
  },
  {
    id: 'data_engineering',
    name: '数据开发题库',
    description: '偏数据开发与复杂 SQL 处理，覆盖窗口函数、递归、连续区间等',
    free: false,
  },
];

const LEGACY_BEGINNER_QUESTION_IDS = new Set([
  '1.1',
  '1.2',
  '1.3-1',
  '1.4',
  '1.5',
  '2.3',
  '2.6',
  '3.2-1',
  '3.2-2',
  '4.1',
  '7.1',
  '8.5',
]);

const BEGINNER_QUESTION_IDS = new Set([
  'B1',
  'B2',
  'B3',
  'B4',
  'B5',
  'B6',
  'B7',
  'B8',
  'B9',
  'B10',
  'B11',
  'B12',
  'B13',
  'B14',
  'B15',
]);

const ANALYSIS_PRODUCT_IDS = new Set([
  ...LEGACY_BEGINNER_QUESTION_IDS,
  '5.1',
  '6.1',
  '7.2',
  '8.1',
  '8.3',
]);

let cachedQuestions = null;

function getLibrariesForQuestion(questionId) {
  const libraries = [];
  if (BEGINNER_QUESTION_IDS.has(questionId)) {
    libraries.push('beginner');
  }
  if (ANALYSIS_PRODUCT_IDS.has(questionId)) {
    libraries.push('analysis_product');
  }
  // 数据开发题库 = 全量进阶题库（包含数据分析题库全部内容）
  // 新增的入门题(B1~B15)仅放在免费入门题库
  if (!BEGINNER_QUESTION_IDS.has(questionId)) {
    libraries.push('data_engineering');
  }
  return libraries;
}

function getAccessLevelByLibraries(libraries) {
  if (!libraries || libraries.length === 0) {
    return 'PRO';
  }
  const libraryMap = new Map(LIBRARY_DEFS.map((lib) => [lib.id, lib]));
  const allFree = libraries.every((libId) => libraryMap.get(libId)?.free === true);
  return allFree ? 'BASIC' : 'PRO';
}

function normalizeLibraryPermissions(value) {
  if (Array.isArray(value)) {
    return value.map((x) => String(x).trim()).filter(Boolean);
  }
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x).trim()).filter(Boolean);
  } catch (error) {
    return [];
  }
}

function canAccessLibrary(user, libraryId) {
  const lib = LIBRARY_DEFS.find((item) => item.id === libraryId);
  if (!lib) return false;
  if (lib.free) return true;
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.plan === 'PRO') return true;
  const permissions = normalizeLibraryPermissions(user.libraryPermissions || user.library_permissions);
  return permissions.includes(libraryId);
}

function loadQuestions() {
  if (cachedQuestions) {
    return cachedQuestions;
  }

  cachedQuestions = interviewQuestions.map((q) => {
    const libraries = getLibrariesForQuestion(q.id);
    return {
      ...q,
      accessLevel: getAccessLevelByLibraries(libraries),
      libraries,
    };
  });
  return cachedQuestions;
}

function getQuestionById(questionId) {
  return loadQuestions().find((q) => q.id === questionId) || null;
}

function canPracticeQuestion(user, question) {
  if (!user || !question) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'GUEST') return false;
  const libraries = question.libraries || [];
  if (libraries.length === 0) {
    return user.plan === 'PRO';
  }
  return libraries.some((libraryId) => canAccessLibrary(user, libraryId));
}

function canViewSolution(user, question) {
  if (!user || !question) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'GUEST') return false;
  const libraries = question.libraries || [];
  if (libraries.length === 0) {
    return user.plan === 'PRO';
  }
  return libraries.some((libraryId) => canAccessLibrary(user, libraryId));
}

function toQuestionSummary(question, user) {
  const canPractice = canPracticeQuestion(user, question);
  return {
    id: question.id,
    category: question.category,
    title: question.title,
    description: question.description,
    difficulty: question.difficulty,
    tables: question.tables,
    libraries: question.libraries || [],
    accessLevel: question.accessLevel,
    canPractice,
    locked: !canPractice,
  };
}

function toQuestionDetail(question, user) {
  const summary = toQuestionSummary(question, user);
  const canSolution = canViewSolution(user, question);

  return {
    ...summary,
    hint: canPracticeQuestion(user, question) ? question.hint : null,
    solution: canSolution ? question.solution : null,
  };
}

function getLibrariesMeta(questions, user) {
  const list = questions || loadQuestions();
  return LIBRARY_DEFS.map((lib) => ({
    ...lib,
    count: list.filter((q) => (q.libraries || []).includes(lib.id)).length,
    canAccess: canAccessLibrary(user, lib.id),
  }));
}

module.exports = {
  loadQuestions,
  getQuestionById,
  canPracticeQuestion,
  toQuestionSummary,
  toQuestionDetail,
  getLibrariesMeta,
};
