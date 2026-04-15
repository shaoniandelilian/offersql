const express = require('express');
const router = express.Router();
const database = require('../services/database');
const { getQuestionById, canPracticeQuestion } = require('../services/questionCatalog');

/**
 * POST /api/submissions
 * 记录题目提交
 */
router.post('/', async (req, res) => {
  const { questionId, sql, executionTime, rowCount, success, errorMessage } = req.body;

  if (req.user?.role === 'GUEST') {
    return res.status(403).json({
      success: false,
      error: '游客不可提交题目',
    });
  }

  if (!questionId || !sql) {
    return res.status(400).json({
      success: false,
      error: '题目ID和SQL语句不能为空'
    });
  }

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
      error: '当前账号仅可练习基础题',
    });
  }

  try {
    await database.logQuestionSubmission({
      questionId,
      sql,
      executionTime,
      rowCount,
      success,
      errorMessage
    });

    res.json({
      success: true,
      message: '提交记录已保存'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '保存提交记录失败: ' + error.message
    });
  }
});

/**
 * GET /api/submissions/:questionId
 * 获取指定题目的提交历史
 */
router.get('/:questionId', async (req, res) => {
  const { questionId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);

  try {
    const submissions = await database.getQuestionSubmissions(questionId, limit);

    res.json({
      success: true,
      data: submissions.map(s => ({
        id: s.id,
        questionId: s.question_id,
        sql: s.sql,
        executionTime: s.execution_time_ms,
        rowCount: s.row_count,
        success: s.success,
        errorMessage: s.error_message,
        createdAt: s.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取提交记录失败: ' + error.message
    });
  }
});

/**
 * GET /api/submissions/stats/overview
 * 获取所有题目的提交统计
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await database.getAllQuestionSubmissionStats();

    res.json({
      success: true,
      data: stats.map(s => ({
        questionId: s.question_id,
        totalAttempts: s.total_attempts,
        successCount: s.success_count,
        lastAttemptAt: s.last_attempt_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取统计数据失败: ' + error.message
    });
  }
});

module.exports = router;
