const express = require('express');
const database = require('../services/database');

const router = express.Router();

const REVIEW_STATUS = new Set(['APPROVED', 'REJECTED']);
const FILTER_STATUS = new Set(['ALL', 'PENDING', 'APPROVED', 'REJECTED']);

function parseJsonSafe(text, fallback = null) {
  try {
    return JSON.parse(String(text || ''));
  } catch (error) {
    return fallback;
  }
}

function normalizeContribution(row) {
  let testTableNames = [];
  try {
    testTableNames = JSON.parse(row.test_table_names || '[]');
  } catch (error) {
    testTableNames = [];
  }

  return {
    id: row.id,
    contributorUserId: row.contributor_user_id,
    contributorUsername: row.contributor_username,
    title: row.title,
    description: row.description,
    rawDataText: row.raw_data_text || '',
    sandboxSetupSql: row.sandbox_setup_sql || '',
    aiModel: row.ai_model || '',
    aiPromptText: row.ai_prompt_text || '',
    aiRawResponse: row.ai_raw_response || '',
    aiValidationReport: parseJsonSafe(row.ai_validation_report, null),
    aiSolutionAnalysis: row.ai_solution_analysis || '',
    aiCreateTableSql: row.ai_create_table_sql || '',
    aiInsertSql: row.ai_insert_sql || '',
    aiStatus: row.ai_status || 'PENDING',
    aiErrorMessage: row.ai_error_message || '',
    aiGeneratedAt: row.ai_generated_at || null,
    referenceSql: row.reference_sql || '',
    expectedResult: row.expected_result || '',
    sourceCompany: row.source_company || '',
    sourcePosition: row.source_position || '',
    tags: row.tags || '',
    testDatabaseName: row.test_database_name || '',
    testTableNames,
    testLastSetupAt: row.test_last_setup_at || null,
    testLastCleanupAt: row.test_last_cleanup_at || null,
    status: row.status,
    adminNote: row.admin_note || '',
    rewardPoints: Number(row.reward_points || 0),
    reviewedByUserId: row.reviewed_by_user_id || null,
    reviewedAt: row.reviewed_at || null,
    createdAt: row.created_at,
  };
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: '仅管理员可访问',
    });
  }
  return next();
}

router.use(requireAdmin);

router.get('/contributions', async (req, res) => {
  const status = String(req.query.status || 'ALL').toUpperCase();
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 200, 500));

  if (!FILTER_STATUS.has(status)) {
    return res.status(400).json({
      success: false,
      error: '无效状态筛选',
    });
  }

  try {
    const rows = await database.listQuestionContributions({ status, limit });
    return res.json({
      success: true,
      data: rows.map(normalizeContribution),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '获取投稿列表失败: ' + error.message,
    });
  }
});

router.patch('/contributions/:id/review', async (req, res) => {
  const contributionId = Number(req.params.id);
  const { action, adminNote = '', rewardPoints = 0 } = req.body || {};
  const normalizedAction = String(action || '').toUpperCase();
  const normalizedRewardPoints = Number(rewardPoints) || 0;

  if (!Number.isInteger(contributionId) || contributionId <= 0) {
    return res.status(400).json({
      success: false,
      error: '投稿ID无效',
    });
  }
  if (!REVIEW_STATUS.has(normalizedAction)) {
    return res.status(400).json({
      success: false,
      error: '审核操作仅支持 APPROVED 或 REJECTED',
    });
  }
  if (normalizedAction === 'APPROVED' && (normalizedRewardPoints < 1 || normalizedRewardPoints > 1000)) {
    return res.status(400).json({
      success: false,
      error: '通过时奖励积分范围为 1 ~ 1000',
    });
  }

  try {
    const existing = await database.getContributionById(contributionId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: '投稿不存在',
      });
    }

    if (existing.status !== 'PENDING') {
      return res.status(409).json({
        success: false,
        error: '该投稿已审核，不能重复审核',
      });
    }

    const finalPoints = normalizedAction === 'APPROVED' ? normalizedRewardPoints : 0;

    await database.reviewQuestionContribution({
      contributionId,
      status: normalizedAction,
      adminNote: String(adminNote).trim(),
      rewardPoints: finalPoints,
      reviewedByUserId: String(req.user.id),
    });

    if (normalizedAction === 'APPROVED' && finalPoints > 0) {
      await database.grantContributionReward({
        userId: existing.contributor_user_id,
        contributionId,
        points: finalPoints,
        reason: '题目贡献审核通过',
      });
    }

    const updated = await database.getContributionById(contributionId);
    return res.json({
      success: true,
      data: normalizeContribution(updated),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '审核失败: ' + error.message,
    });
  }
});

module.exports = router;
