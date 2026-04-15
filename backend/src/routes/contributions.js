const express = require('express');
const database = require('../services/database');
const { addLimit } = require('../utils/sqlValidator');
const { generateContributionAssets } = require('../services/aiSqlGenerator');

const router = express.Router();

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

function normalizeContributionForUser(row) {
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

function requireAdmin(req, res) {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: '仅管理员可操作',
    });
    return false;
  }
  return true;
}

function canManageContribution(req, contribution) {
  if (!contribution) return false;
  if (req.user?.role === 'ADMIN') return true;
  return String(req.user?.id || '') === String(contribution.contributor_user_id || '');
}

router.post('/', async (req, res) => {
  if (req.user?.role === 'GUEST') {
    return res.status(403).json({
      success: false,
      error: '游客不可投稿，请先注册登录',
    });
  }

  const {
    description,
    rawDataText = '',
    sandboxSetupSql = '',
    expectedResult = '',
    sourceCompany = '',
    sourcePosition = '',
    tags = '',
  } = req.body || {};

  if (!description) {
    return res.status(400).json({
      success: false,
      error: '题目描述不能为空',
    });
  }
  if (!rawDataText || !String(rawDataText).trim()) {
    return res.status(400).json({
      success: false,
      error: '请填写原始数据（面试题中给出的样例数据）',
    });
  }
  if (!expectedResult || !String(expectedResult).trim()) {
    return res.status(400).json({
      success: false,
      error: '请填写期望结果',
    });
  }
  if (!sourceCompany || !String(sourceCompany).trim()) {
    return res.status(400).json({
      success: false,
      error: '请填写公司标签',
    });
  }

  try {
    let aiAssets = null;
    let aiStatus = 'FAILED';
    let aiErrorMessage = '';
    const fallbackTitle = `待审核题目_${Date.now()}`;
    try {
      aiAssets = await generateContributionAssets({
        description: String(description).trim(),
        rawDataText: String(rawDataText).trim(),
        expectedResult: String(expectedResult).trim(),
        sourceCompany: String(sourceCompany).trim(),
        sourcePosition: String(sourcePosition).trim(),
        tags: String(tags).trim(),
      });
      aiStatus = 'SUCCESS';
    } catch (error) {
      aiStatus = 'FAILED';
      aiErrorMessage = error.message;
    }

    const contributionId = await database.createQuestionContribution({
      contributorUserId: String(req.user.id),
      contributorUsername: req.user.username,
      title: aiAssets?.generatedTitle || fallbackTitle,
      description: String(description).trim(),
      rawDataText: String(rawDataText).trim(),
      sandboxSetupSql: String(sandboxSetupSql).trim(),
      aiModel: aiAssets?.model || (process.env.KIMI_MODEL || 'kimi-k2.5'),
      aiPromptText: aiAssets?.promptText || '',
      aiRawResponse: aiAssets?.rawResponse || '',
      aiValidationReport: aiAssets?.validationReport ? JSON.stringify(aiAssets.validationReport) : '',
      aiSolutionAnalysis: aiAssets?.solutionAnalysis || '',
      aiCreateTableSql: aiAssets?.createTableSql || '',
      aiInsertSql: aiAssets?.insertSql || '',
      aiStatus,
      aiErrorMessage,
      referenceSql: aiAssets?.referenceSql || '',
      expectedResult: String(expectedResult).trim(),
      sourceCompany: String(sourceCompany).trim(),
      sourcePosition: String(sourcePosition).trim(),
      tags: String(tags).trim(),
    });

    const created = await database.getContributionById(contributionId);
    return res.json({
      success: true,
      message: '投稿成功，等待管理员审核',
      data: normalizeContributionForUser(created),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '投稿失败: ' + error.message,
    });
  }
});

router.post('/:id/ai-generate', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const contributionId = Number(req.params.id);
  if (!Number.isInteger(contributionId) || contributionId <= 0) {
    return res.status(400).json({
      success: false,
      error: '投稿ID无效',
    });
  }

  try {
    const contribution = await database.getContributionById(contributionId);
    if (!contribution) {
      return res.status(404).json({
        success: false,
        error: '投稿不存在',
      });
    }
    const aiResult = await generateContributionAssets({
      description: contribution.description,
      rawDataText: contribution.raw_data_text || '',
      expectedResult: contribution.expected_result || '',
      sourceCompany: contribution.source_company || '',
      sourcePosition: contribution.source_position || '',
      tags: contribution.tags || '',
    });

    await database.updateContributionAiResult({
      contributionId,
      aiModel: aiResult.model,
      aiPromptText: aiResult.promptText || '',
      aiRawResponse: aiResult.rawResponse || '',
      aiValidationReport: aiResult.validationReport ? JSON.stringify(aiResult.validationReport) : '',
      aiSolutionAnalysis: aiResult.solutionAnalysis || '',
      aiCreateTableSql: aiResult.createTableSql,
      aiInsertSql: aiResult.insertSql,
      title: aiResult.generatedTitle,
      referenceSql: aiResult.referenceSql,
      aiStatus: 'SUCCESS',
      aiErrorMessage: '',
    });

    const updated = await database.getContributionById(contributionId);
    return res.json({
      success: true,
      data: normalizeContribution(updated),
    });
  } catch (error) {
    await database.updateContributionAiResult({
      contributionId,
      aiModel: process.env.KIMI_MODEL || 'kimi-k2.5',
      aiCreateTableSql: '',
      aiInsertSql: '',
      aiStatus: 'FAILED',
      aiErrorMessage: error.message,
    });
    return res.status(500).json({
      success: false,
      error: 'AI 生成失败: ' + error.message,
    });
  }
});

router.post('/:id/test/setup', async (req, res) => {
  if (req.user?.role === 'GUEST') {
    return res.status(403).json({
      success: false,
      error: '游客不可操作',
    });
  }
  const contributionId = Number(req.params.id);
  if (!Number.isInteger(contributionId) || contributionId <= 0) {
    return res.status(400).json({
      success: false,
      error: '投稿ID无效',
    });
  }

  try {
    const contribution = await database.getContributionById(contributionId);
    if (!contribution) {
      return res.status(404).json({
        success: false,
        error: '投稿不存在',
      });
    }
    if (!canManageContribution(req, contribution)) {
      return res.status(403).json({
        success: false,
        error: '无权限操作该投稿',
      });
    }
    if (!contribution.ai_create_table_sql || !contribution.ai_insert_sql || !contribution.reference_sql) {
      try {
        const aiResult = await generateContributionAssets({
          description: contribution.description,
          rawDataText: contribution.raw_data_text || '',
          expectedResult: contribution.expected_result || '',
          sourceCompany: contribution.source_company || '',
          sourcePosition: contribution.source_position || '',
          tags: contribution.tags || '',
        });
        await database.updateContributionAiResult({
          contributionId,
          title: aiResult.generatedTitle,
          referenceSql: aiResult.referenceSql,
          aiModel: aiResult.model,
          aiPromptText: aiResult.promptText || '',
          aiRawResponse: aiResult.rawResponse || '',
          aiValidationReport: aiResult.validationReport ? JSON.stringify(aiResult.validationReport) : '',
          aiSolutionAnalysis: aiResult.solutionAnalysis || '',
          aiCreateTableSql: aiResult.createTableSql,
          aiInsertSql: aiResult.insertSql,
          aiStatus: 'SUCCESS',
          aiErrorMessage: '',
        });
      } catch (aiError) {
        await database.updateContributionAiResult({
          contributionId,
          aiModel: process.env.KIMI_MODEL || 'kimi-k2.5',
          aiStatus: 'FAILED',
          aiErrorMessage: aiError.message,
        });
        return res.status(400).json({
          success: false,
          error: 'AI 生成测试数据失败，请稍后重试',
        });
      }
    }

    const latestContribution = await database.getContributionById(contributionId);
    if (!latestContribution?.ai_create_table_sql || !latestContribution?.ai_insert_sql) {
      return res.status(400).json({
        success: false,
        error: '缺少 AI 生成 SQL，请稍后重试',
      });
    }

    const setup = await database.setupContributionTestTables({
      contributionId,
      createTableSql: latestContribution.ai_create_table_sql,
      insertSql: latestContribution.ai_insert_sql,
    });
    await database.updateContributionTestMeta({
      contributionId,
      testDatabaseName: setup.databaseName,
      testTableNames: setup.tableNames,
    });

    const updated = await database.getContributionById(contributionId);
    return res.json({
      success: true,
      data: normalizeContribution(updated),
      meta: {
        databaseName: setup.databaseName,
        tableNames: setup.tableNames,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '初始化测试表失败: ' + error.message,
    });
  }
});

router.post('/:id/test/query', async (req, res) => {
  if (req.user?.role === 'GUEST') {
    return res.status(403).json({
      success: false,
      error: '游客不可操作',
    });
  }
  const contributionId = Number(req.params.id);
  const sql = String(req.body?.sql || '').trim();

  if (!Number.isInteger(contributionId) || contributionId <= 0) {
    return res.status(400).json({
      success: false,
      error: '投稿ID无效',
    });
  }
  if (!sql) {
    return res.status(400).json({
      success: false,
      error: '测试 SQL 不能为空',
    });
  }

  try {
    const contribution = await database.getContributionById(contributionId);
    if (!contribution) {
      return res.status(404).json({
        success: false,
        error: '投稿不存在',
      });
    }
    if (!canManageContribution(req, contribution)) {
      return res.status(403).json({
        success: false,
        error: '无权限操作该投稿',
      });
    }
    const safeSql = addLimit(sql, Number(process.env.MAX_ROWS || 1000));
    const start = Date.now();
    const result = await database.runContributionTestQuery({
      contributionId,
      sql: safeSql,
    });
    return res.json({
      success: true,
      data: {
        rows: result.rows,
        columns: result.columns,
        rowCount: result.rowCount,
        executionTime: Date.now() - start,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: '测试 SQL 执行失败: ' + error.message,
    });
  }
});

router.delete('/:id/test/tables', async (req, res) => {
  if (req.user?.role === 'GUEST') {
    return res.status(403).json({
      success: false,
      error: '游客不可操作',
    });
  }
  const contributionId = Number(req.params.id);
  if (!Number.isInteger(contributionId) || contributionId <= 0) {
    return res.status(400).json({
      success: false,
      error: '投稿ID无效',
    });
  }

  try {
    const contribution = await database.getContributionById(contributionId);
    if (!contribution) {
      return res.status(404).json({
        success: false,
        error: '投稿不存在',
      });
    }
    if (!canManageContribution(req, contribution)) {
      return res.status(403).json({
        success: false,
        error: '无权限操作该投稿',
      });
    }
    const cleanup = await database.cleanupContributionTestTables(contributionId);
    await database.markContributionTestCleanup(contributionId);
    return res.json({
      success: true,
      data: cleanup,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '清理测试表失败: ' + error.message,
    });
  }
});

router.get('/mine', async (req, res) => {
  if (req.user?.role === 'GUEST') {
    return res.json({
      success: true,
      data: [],
      meta: {
        points: {
          totalPoints: 0,
          totalRecords: 0,
        },
      },
    });
  }

  const limit = Math.max(1, Math.min(Number(req.query.limit) || 100, 200));

  try {
    const [rows, pointSummary] = await Promise.all([
      database.getMyQuestionContributions(String(req.user.id), limit),
      database.getUserPointSummary(String(req.user.id)),
    ]);

    return res.json({
      success: true,
      data: rows.map(normalizeContributionForUser),
      meta: {
        points: {
          totalPoints: Number(pointSummary.total_points || 0),
          totalRecords: Number(pointSummary.total_records || 0),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: '获取投稿记录失败: ' + error.message,
    });
  }
});

module.exports = router;
