const logger = require('../utils/logger');
const { validateSQL, isReadOnly } = require('../utils/sqlValidator');

const DEFAULT_KIMI_BASE_URL = 'https://api.moonshot.cn/v1/chat/completions';
const DEFAULT_KIMI_MODEL = 'kimi-k2.5';

function extractJsonObject(text) {
  const content = String(text || '').trim();
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch (error) {
    // ignore
  }

  const codeBlock = content.match(/```json\s*([\s\S]*?)```/i) || content.match(/```\s*([\s\S]*?)```/);
  if (codeBlock?.[1]) {
    try {
      return JSON.parse(codeBlock[1].trim());
    } catch (error) {
      // ignore
    }
  }

  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(content.slice(firstBrace, lastBrace + 1));
    } catch (error) {
      return null;
    }
  }
  return null;
}

function validateCreateInsertSql({ createTableSql, insertSql }) {
  const createStatements = String(createTableSql || '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  const insertStatements = String(insertSql || '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  const onlyCreate = createStatements.length > 0 && createStatements.every((s) => /^CREATE\s+TABLE/i.test(s));
  const onlyInsert = insertStatements.length > 0 && insertStatements.every((s) => /^INSERT\s+INTO/i.test(s));
  if (!onlyCreate || !onlyInsert) {
    throw new Error('AI 生成 SQL 不合法（仅允许 CREATE TABLE 与 INSERT INTO）');
  }
}

function validateReferenceSql(referenceSql) {
  const sql = String(referenceSql || '').trim();
  if (!sql) throw new Error('AI 返回缺少 reference_sql');
  const validation = validateSQL(sql);
  if (!validation.valid) throw new Error(`AI 参考 SQL 不合法: ${validation.message}`);
  if (!isReadOnly(sql)) throw new Error('AI 参考 SQL 必须是只读语句（SELECT/WITH/EXPLAIN）');
}

function buildValidationReport({ generatedTitle, createTableSql, insertSql, referenceSql }) {
  const createStatements = String(createTableSql || '').split(';').map((s) => s.trim()).filter(Boolean);
  const insertStatements = String(insertSql || '').split(';').map((s) => s.trim()).filter(Boolean);
  const referenceValidation = validateSQL(referenceSql);
  return {
    version: 'v1',
    checks: [
      { name: 'title_present', passed: Boolean(generatedTitle) },
      { name: 'create_only', passed: createStatements.length > 0 && createStatements.every((s) => /^CREATE\s+TABLE/i.test(s)) },
      { name: 'insert_only', passed: insertStatements.length > 0 && insertStatements.every((s) => /^INSERT\s+INTO/i.test(s)) },
      { name: 'reference_sql_valid', passed: referenceValidation.valid },
      { name: 'reference_sql_readonly', passed: isReadOnly(referenceSql) },
    ],
    stats: {
      createStatementCount: createStatements.length,
      insertStatementCount: insertStatements.length,
      referenceSqlLength: String(referenceSql || '').length,
    },
    summary: '按固定规则校验：标题必填、建表仅CREATE、插数仅INSERT、参考SQL需语法通过且只读。',
  };
}

async function generateContributionAssets(payload) {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error('KIMI_API_KEY 未配置');
  }

  const model = process.env.KIMI_MODEL || DEFAULT_KIMI_MODEL;
  const endpoint = process.env.KIMI_BASE_URL || DEFAULT_KIMI_BASE_URL;
  const timeoutMs = Number(process.env.KIMI_TIMEOUT_MS || 45000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const userPrompt = [
    '请把下面投稿信息转换成用于 SQL 练习题审核的完整资产。',
    '要求：',
    '1) 只输出 JSON，不要输出其他解释。',
    '2) JSON 字段必须是：generated_title, create_table_sql, insert_sql, solution_analysis, reference_sql。',
    '3) generated_title 为简洁中文标题（12~30字），不要带引号。',
    '4) create_table_sql 只包含 CREATE TABLE；insert_sql 只包含 INSERT INTO；不要使用 DROP/ALTER/TRUNCATE。',
    '5) solution_analysis 用 3~6 行中文说明解题思路，面向面试讲解，不要写成代码块。',
    '6) reference_sql 为可执行参考答案 SQL，且必须是只读语句（SELECT/WITH/EXPLAIN）。',
    '7) 需与题目描述、原始数据、期望结果保持一致。',
    '',
    `题目描述: ${payload.description || ''}`,
    `原始数据: ${payload.rawDataText || ''}`,
    `期望结果: ${payload.expectedResult || ''}`,
    `来源公司: ${payload.sourceCompany || ''}`,
    `岗位方向: ${payload.sourcePosition || ''}`,
    `标签: ${payload.tags || ''}`,
  ].join('\n');
  const promptText = userPrompt;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 1,
        messages: [
          {
            role: 'system',
            content: '你是 SQL 数据构造助手。严格输出合法 JSON。',
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || data?.message || `Kimi API 请求失败(${response.status})`;
      throw new Error(message);
    }

    const content = data?.choices?.[0]?.message?.content || '';
    const parsed = extractJsonObject(content);
    if (!parsed) {
      throw new Error('Kimi 返回内容无法解析为 JSON');
    }

    const generatedTitle = String(parsed.generated_title || '').trim();
    const createTableSql = String(parsed.create_table_sql || '').trim();
    const insertSql = String(parsed.insert_sql || '').trim();
    const solutionAnalysis = String(parsed.solution_analysis || '').trim();
    const referenceSql = String(parsed.reference_sql || '').trim();
    if (!generatedTitle) throw new Error('Kimi 返回缺少 generated_title');
    if (!solutionAnalysis) throw new Error('Kimi 返回缺少 solution_analysis');
    validateCreateInsertSql({ createTableSql, insertSql });
    validateReferenceSql(referenceSql);
    const validationReport = buildValidationReport({
      generatedTitle,
      createTableSql,
      insertSql,
      solutionAnalysis,
      referenceSql,
    });

    return {
      model,
      generatedTitle,
      createTableSql,
      insertSql,
      referenceSql,
      promptText,
      rawResponse: content,
      validationReport,
    };
  } catch (error) {
    logger.error('Kimi 生成 SQL 失败:', error);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  generateContributionAssets,
};
