/**
 * 数据库初始化脚本
 */
const database = require('../src/services/database');

async function init() {
  try {
    await database.connect();
    await database.initTables();
    console.log('数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

init();