import axios from 'axios';
import toast from 'react-hot-toast';

// API 基础配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 35000, // 35 秒超时（后端是 30 秒）
  headers: {
    'Content-Type': 'application/json',
  },
});

function clearAuthState() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('user');
}

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const suppressErrorToast = Boolean(error.config?.suppressErrorToast);

    if (error.response?.status === 401) {
      clearAuthState();
      if (!suppressErrorToast && window.location.pathname !== '/login') {
        toast.error('登录已过期，请重新登录');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    const message = error.response?.data?.error || '请求失败';
    if (!suppressErrorToast) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

// API 方法
export const queryAPI = {
  // 执行 SQL 查询（支持关联题目）
  execute: (sql, questionId) => api.post('/query', { sql, questionId }),

  // 验证 SQL
  validate: (sql) => api.post('/query/validate', { sql }),

  // 分析查询计划
  explain: (sql) => api.post('/query/explain', { sql }),
};

export const schemaAPI = {
  // 获取所有表结构
  getSchema: () => api.get('/schema'),

  // 获取单表详情
  getTableInfo: (tableName) => api.get(`/schema/${tableName}`),

  // 预览表数据
  previewTable: (tableName, limit = 100) =>
    api.get(`/schema/${tableName}/preview?limit=${limit}`),
};

export const submissionAPI = {
  // 获取题目的提交历史
  getSubmissions: (questionId, limit = 50) =>
    api.get(`/submissions/${questionId}?limit=${limit}`),

  // 获取所有题目的提交统计
  getStats: () => api.get('/submissions/stats/overview'),
};

export const commentsAPI = {
  // 获取题目评论
  getComments: (questionId) => api.get(`/comments/${questionId}`),

  // 发表评论/回复
  createComment: (questionId, content, parentId = null) =>
    api.post('/comments', { questionId, content, parentId }),
};

export const authAPI = {
  login: (email, password, config = {}) => api.post('/auth/login', { email, password }, config),
  register: (email, password, config = {}) => api.post('/auth/register', { email, password }, config),
  guestLogin: () => api.post('/auth/guest-login'),
  getWechatConfig: () => api.get('/auth/wechat/config'),
  me: () => api.get('/auth/me'),
  sendResetCode: (email, config = {}) => api.post('/auth/password-reset/send-code', { email }, config),
  confirmResetPassword: (email, code, newPassword, config = {}) =>
    api.post('/auth/password-reset/confirm', { email, code, newPassword }, config),
};

export const questionsAPI = {
  getQuestions: () => api.get('/questions'),
  getQuestion: (questionId) => api.get(`/questions/${questionId}`),
};

export const adminAPI = {
  listUsers: () => api.get('/admin/users'),
  updateUserPlan: (userId, plan) => api.patch(`/admin/users/${userId}/plan`, { plan }),
  updateUserLibraryPermissions: (userId, libraryPermissions) =>
    api.patch(`/admin/users/${userId}/library-permissions`, { libraryPermissions }),
  listContributions: (status = 'ALL') => api.get(`/admin/contributions?status=${encodeURIComponent(status)}`),
  reviewContribution: (id, payload) => api.patch(`/admin/contributions/${id}/review`, payload),
};

export const contributionAPI = {
  create: (payload) => api.post('/contributions', payload),
  getMine: (limit = 100) => api.get(`/contributions/mine?limit=${limit}`),
  regenerateAI: (id) => api.post(`/contributions/${id}/ai-generate`),
  setupTestTables: (id) => api.post(`/contributions/${id}/test/setup`),
  runTestQuery: (id, sql) => api.post(`/contributions/${id}/test/query`, { sql }),
  cleanupTestTables: (id) => api.delete(`/contributions/${id}/test/tables`),
};

export default api;
