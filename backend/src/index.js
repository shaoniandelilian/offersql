const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

const logger = require('./utils/logger');
const database = require('./services/database');
const queryRoutes = require('./routes/query');
const schemaRoutes = require('./routes/schema');
const submissionRoutes = require('./routes/submissions');
const commentsRoutes = require('./routes/comments');
const questionsRoutes = require('./routes/questions');
const adminUsersRoutes = require('./routes/adminUsers');
const contributionsRoutes = require('./routes/contributions');
const adminContributionsRoutes = require('./routes/adminContributions');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
const createGeoAccessMiddleware = require('./middleware/geoAccess');

const app = express();
const PORT = process.env.PORT || 3001;
const trustProxyEnabled = String(process.env.TRUST_PROXY || 'false').toLowerCase() === 'true';
app.set('trust proxy', trustProxyEnabled);

// 安全中间件
app.use(helmet());
app.use(compression());

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 限制 100 次请求
  message: { error: '请求过于频繁，请稍后再试' }
});
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  app.use(limiter);
}

// SQL 查询接口单独限流（更严格）
const queryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 30, // 每分钟最多 30 次查询
  message: { error: '查询过于频繁，请稍后再试' }
});

// CORS 配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['http://localhost:3000']
    : '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析 JSON
app.use(express.json({ limit: '10mb' }));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// 地域访问控制（可选：仅允许中国 IP）
app.use(createGeoAccessMiddleware());

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: database.isConnected() ? 'connected' : 'disconnected'
  });
});

// 认证相关路由（无需鉴权）
app.use('/api/auth', authRoutes);

// 其余 API 全部需要鉴权
app.use('/api', authMiddleware);

// API 路由
if (isProduction) {
  app.use('/api/query', queryLimiter, queryRoutes);
} else {
  app.use('/api/query', queryRoutes);
}
app.use('/api/schema', schemaRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/contributions', contributionsRoutes);
app.use('/api/admin', adminUsersRoutes);
app.use('/api/admin', adminContributionsRoutes);

// 错误处理
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 初始化数据库并启动服务
async function startServer() {
  try {
    await database.connect();
    await database.initTables();

    app.listen(PORT, () => {
      logger.info(`后端服务已启动，端口: ${PORT}`);
      logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`数据库类型: ${process.env.DB_TYPE || 'sqlite'}`);
    });
  } catch (error) {
    logger.error('启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务...');
  await database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('收到 SIGINT 信号，正在关闭服务...');
  await database.close();
  process.exit(0);
});

startServer();
