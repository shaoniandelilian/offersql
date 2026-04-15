/**
 * SQL 语句验证工具
 * 用于拦截危险的 SQL 操作
 */

// 危险操作模式列表
const DANGEROUS_PATTERNS = [
  { pattern: /DROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW)/i, message: '不允许执行 DROP 操作' },
  { pattern: /TRUNCATE\s+TABLE/i, message: '不允许执行 TRUNCATE 操作' },
  { pattern: /ALTER\s+TABLE\s+.*\s+DROP/i, message: '不允许删除表字段' },
  { pattern: /DELETE\s+FROM\s+\w+\s*;?\s*$/i, message: 'DELETE 语句必须包含 WHERE 条件' },
  { pattern: /DELETE\s+FROM\s+\w+\s+;?$/i, message: 'DELETE 语句必须包含 WHERE 条件' },
];

/**
 * 移除 SQL 中的注释
 * @param {string} sql - SQL 语句
 * @returns {string} - 移除注释后的 SQL
 */
function removeComments(sql) {
  // 移除单行注释 (-- 到行尾)
  let result = sql.replace(/--.*$/gm, '');
  // 移除多行注释 (/* */)
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  return result;
}

// 只允许的操作类型（白名单）
const ALLOWED_OPERATIONS = [
  'SELECT',
  'WITH',      // CTE
  'EXPLAIN',   // 查询分析
];

/**
 * 验证 SQL 语句是否安全
 * @param {string} sql - SQL 语句
 * @returns {Object} - { valid: boolean, message?: string }
 */
function validateSQL(sql) {
  if (!sql || typeof sql !== 'string') {
    return { valid: false, message: 'SQL 语句不能为空' };
  }

  // 移除注释后再处理
  const sqlWithoutComments = removeComments(sql).trim();

  if (sqlWithoutComments.length === 0) {
    return { valid: false, message: 'SQL 语句不能为空' };
  }

  if (sqlWithoutComments.length > 10000) {
    return { valid: false, message: 'SQL 语句长度超过限制（最大 10000 字符）' };
  }

  // 检查危险模式
  for (const { pattern, message } of DANGEROUS_PATTERNS) {
    if (pattern.test(sqlWithoutComments)) {
      return { valid: false, message };
    }
  }

  // 检查是否以允许的操作开头
  const firstWord = sqlWithoutComments.split(/\s+/)[0].toUpperCase();
  if (!ALLOWED_OPERATIONS.includes(firstWord)) {
    return {
      valid: false,
      message: `不允许的操作类型: ${firstWord}。只允许: ${ALLOWED_OPERATIONS.join(', ')}`
    };
  }

  // 特殊检查：UPDATE 和 DELETE 必须有 WHERE（除非是子查询中的）
  if (/^(UPDATE|DELETE)/i.test(sqlWithoutComments)) {
    // 移除字符串内容，避免误判
    const sqlWithoutStrings = sqlWithoutComments.replace(/'[^']*'/g, '');

    // 检查是否在顶层有 WHERE
    const upperSQL = sqlWithoutStrings.toUpperCase();

    if (firstWord === 'DELETE') {
      // DELETE 必须有 WHERE
      if (!/WHERE/i.test(upperSQL)) {
        return { valid: false, message: 'DELETE 语句必须包含 WHERE 条件' };
      }
    }

    if (firstWord === 'UPDATE') {
      // UPDATE 必须有 WHERE
      if (!/WHERE/i.test(upperSQL)) {
        return { valid: false, message: 'UPDATE 语句必须包含 WHERE 条件' };
      }
    }
  }

  return { valid: true };
}

/**
 * 检查 SQL 是否为只读查询
 * @param {string} sql - SQL 语句
 * @returns {boolean}
 */
function isReadOnly(sql) {
  if (!sql) return false;
  const sqlWithoutComments = removeComments(sql).trim();
  const firstWord = sqlWithoutComments.split(/\s+/)[0].toUpperCase();
  return firstWord === 'SELECT' || firstWord === 'EXPLAIN' || firstWord === 'WITH';
}

/**
 * 提取 SQL 中涉及的表名
 * @param {string} sql - SQL 语句
 * @returns {string[]} - 表名列表
 */
function extractTables(sql) {
  const tables = [];
  const upperSQL = sql.toUpperCase();

  // FROM 子句
  const fromMatches = sql.match(/FROM\s+(\w+)/gi);
  if (fromMatches) {
    fromMatches.forEach(match => {
      const table = match.replace(/FROM\s+/i, '').trim();
      if (table) tables.push(table);
    });
  }

  // JOIN 子句
  const joinMatches = sql.match(/JOIN\s+(\w+)/gi);
  if (joinMatches) {
    joinMatches.forEach(match => {
      const table = match.replace(/JOIN\s+/i, '').trim();
      if (table) tables.push(table);
    });
  }

  // INTO 子句 (INSERT)
  const intoMatches = sql.match(/INTO\s+(\w+)/gi);
  if (intoMatches) {
    intoMatches.forEach(match => {
      const table = match.replace(/INTO\s+/i, '').trim();
      if (table) tables.push(table);
    });
  }

  // UPDATE 表名
  const updateMatches = sql.match(/UPDATE\s+(\w+)/gi);
  if (updateMatches) {
    updateMatches.forEach(match => {
      const table = match.replace(/UPDATE\s+/i, '').trim();
      if (table) tables.push(table);
    });
  }

  return [...new Set(tables)]; // 去重
}

/**
 * 改写 SQL 添加 LIMIT
 * @param {string} sql - 原始 SQL
 * @param {number} maxRows - 最大行数
 * @returns {string} - 改写后的 SQL
 */
function addLimit(sql, maxRows) {
  const raw = String(sql || '');
  const trimmedSql = raw.trim();
  if (!trimmedSql) return raw;

  // 如果已经有 LIMIT，不再添加
  if (/LIMIT\s+\d+/i.test(trimmedSql)) {
    return trimmedSql;
  }

  // 移除注释后检查是否为 SELECT
  const sqlWithoutComments = removeComments(trimmedSql).trim();

  // 为只读查询添加 LIMIT；去掉末尾分号，避免出现 "...; LIMIT n" 语法错误
  if (/^(SELECT|WITH|EXPLAIN)\b/i.test(sqlWithoutComments)) {
    const noTrailingSemicolon = trimmedSql.replace(/;\s*$/g, '');
    return `${noTrailingSemicolon} LIMIT ${maxRows}`;
  }

  return trimmedSql;
}

module.exports = {
  validateSQL,
  isReadOnly,
  extractTables,
  addLimit,
  DANGEROUS_PATTERNS,
  ALLOWED_OPERATIONS
};
