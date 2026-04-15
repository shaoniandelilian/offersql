const express = require('express');
const router = express.Router();
const database = require('../services/database');
const { validateSQL, isReadOnly, addLimit } = require('../utils/sqlValidator');
const { getQuestionById, canPracticeQuestion } = require('../services/questionCatalog');
const logger = require('../utils/logger');

/**
 * POST /api/query
 * 执行 SQL 查询
 */
router.post('/', async (req, res) => {
  const { sql, questionId } = req.body;
  const userId = req.user?.id || 'anonymous';
  const ipAddress = req.ip;

  if (req.user?.role === 'GUEST') {
    return res.status(403).json({
      success: false,
      error: '游客仅支持浏览，登录后可开始练习',
    });
  }

  if (questionId) {
    const question = getQuestionById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: '题目不存在',
      });
    }
    if (!canPracticeQuestion(req.user, question)) {
      return res.status(403).json({
        success: false,
        error: '当前账号没有该题库权限，请联系管理员开通',
      });
    }
  } else if (req.user?.plan !== 'PRO' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: '免费账号请在基础题目中练习',
    });
  }

  // 1. 基础验证
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'SQL 语句不能为空'
    });
  }

  // 2. SQL 安全审核
  const validation = validateSQL(sql);
  if (!validation.valid) {
    logger.warn(`SQL 审核失败 [${ipAddress}]: ${validation.message}`, { sql: sql.substring(0, 100) });
    return res.status(403).json({
      success: false,
      error: validation.message
    });
  }

  // 3. 添加 LIMIT 保护
  const maxRows = parseInt(process.env.MAX_ROWS || '1000');
  const safeSQL = addLimit(sql, maxRows);

  try {
    // 4. 执行查询
    const result = await database.query(safeSQL);

    // 5. 记录成功日志
    await database.logQuery({
      sql: safeSQL,
      userId,
      ipAddress,
      executionTime: result.executionTime,
      rowCount: result.rowCount,
      success: true,
      errorMessage: null
    });

    logger.info(`查询成功 [${ipAddress}]: ${result.rowCount} 行, ${result.executionTime}ms`);

    // 6. 如果有关联题目，记录题目提交
    if (questionId) {
      await database.logQuestionSubmission({
        questionId,
        sql: safeSQL,
        executionTime: result.executionTime,
        rowCount: result.rowCount,
        success: true,
        errorMessage: null
      });
    }

    // 7. 返回结果
    res.json({
      success: true,
      data: result.data,
      columns: result.columns,
      meta: {
        rowCount: result.rowCount,
        executionTime: result.executionTime,
        isReadOnly: isReadOnly(sql),
        limited: result.rowCount >= maxRows
      }
    });

  } catch (error) {
    // 记录失败日志
    await database.logQuery({
      sql: safeSQL,
      userId,
      ipAddress,
      executionTime: error.executionTime || 0,
      rowCount: 0,
      success: false,
      errorMessage: error.error
    });

    // 如果有关联题目，记录失败的提交
    if (questionId) {
      await database.logQuestionSubmission({
        questionId,
        sql: safeSQL,
        executionTime: error.executionTime || 0,
        rowCount: 0,
        success: false,
        errorMessage: error.error
      });
    }

    logger.error(`查询失败 [${ipAddress}]: ${error.error}`);

    res.status(400).json({
      success: false,
      error: error.error || '查询执行失败'
    });
  }
});

/**
 * POST /api/query/validate
 * 验证 SQL 语法（不执行）
 */
router.post('/validate', (req, res) => {
  const { sql } = req.body;
  const validation = validateSQL(sql);

  res.json({
    valid: validation.valid,
    message: validation.message,
    isReadOnly: isReadOnly(sql)
  });
});

/**
 * POST /api/query/explain
 * 分析查询执行计划
 */
router.post('/explain', async (req, res) => {
  const { sql } = req.body;

  // 验证 SQL
  const validation = validateSQL(sql);
  if (!validation.valid) {
    return res.status(403).json({
      success: false,
      error: validation.message
    });
  }

  try {
    // 添加 EXPLAIN
    const explainSQL = `EXPLAIN QUERY PLAN ${sql}`;
    const result = await database.query(explainSQL);

    res.json({
      success: true,
      plan: result.data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.error
    });
  }
});

module.exports = router;
