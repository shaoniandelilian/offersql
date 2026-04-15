const express = require('express');
const router = express.Router();
const database = require('../services/database');

/**
 * GET /api/schema
 * 获取数据库 Schema 信息
 */
router.get('/', async (req, res) => {
  try {
    const schema = await database.getSchema();
    res.json({
      success: true,
      data: schema
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取 Schema 失败: ' + error.message
    });
  }
});

/**
 * GET /api/schema/:tableName
 * 获取指定表的详细信息
 */
router.get('/:tableName', async (req, res) => {
  const { tableName } = req.params;

  try {
    const tableInfo = await database.getTableInfo(tableName);

    if (!tableInfo) {
      return res.status(404).json({
        success: false,
        error: `表 '${tableName}' 不存在`
      });
    }

    // 获取样本数据（前 5 行）
    const sampleData = await database.query(`SELECT * FROM ${tableName} LIMIT 5`);

    // 获取行数统计
    const countResult = await database.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const totalRows = countResult.data[0]?.count || 0;

    res.json({
      success: true,
      data: {
        ...tableInfo,
        sampleData: sampleData.data,
        totalRows
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取表信息失败: ' + error.message
    });
  }
});

/**
 * GET /api/schema/:tableName/preview
 * 预览表数据
 */
router.get('/:tableName/preview', async (req, res) => {
  const { tableName } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 100, 1000);

  try {
    const result = await database.query(`SELECT * FROM ${tableName} LIMIT ${limit}`);

    res.json({
      success: true,
      data: result.data,
      columns: result.columns,
      meta: {
        rowCount: result.rowCount,
        limit
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: '预览数据失败: ' + error.error
    });
  }
});

module.exports = router;
