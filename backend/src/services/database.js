const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const mysql = require('mysql2/promise');

require('dotenv').config({
  path: path.resolve(__dirname, '../../../.env'),
});

const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.db = null;
    this.pool = null;
    this.type = process.env.DB_TYPE || 'sqlite';
  }

  /**
   * 连接数据库
   */
  async connect() {
    try {
      if (this.type === 'sqlite') {
        await this.connectSQLite();
      } else if (this.type === 'mysql') {
        await this.connectMySQL();
      } else if (this.type === 'postgres') {
        await this.connectPostgres();
      } else {
        throw new Error(`不支持的数据库类型: ${this.type}`);
      }
      logger.info(`数据库连接成功: ${this.type}`);
    } catch (error) {
      logger.error('数据库连接失败:', error);
      throw error;
    }
  }

  /**
   * 连接 SQLite
   */
  async connectSQLite() {
    const dbPath = process.env.DB_PATH || './data/sql-practice.db';

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.db.run('PRAGMA foreign_keys = ON', (pragmaErr) => {
          if (pragmaErr) {
            reject(pragmaErr);
          } else {
            resolve();
          }
        });
      });
    });
  }

  /**
   * 连接 MySQL
   */
  async connectMySQL() {
    const host = process.env.DB_HOST || '127.0.0.1';
    const port = parseInt(process.env.DB_PORT || '3306', 10);
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'sql_practice';

    const bootstrapPool = mysql.createPool({
      host,
      port,
      user,
      password,
      waitForConnections: true,
      connectionLimit: 2,
      charset: 'utf8mb4',
    });

    await bootstrapPool.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await bootstrapPool.end();

    this.pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 20,
      multipleStatements: true,
      charset: 'utf8mb4',
    });

    const conn = await this.pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
  }

  /**
   * 连接 PostgreSQL
   */
  async connectPostgres() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'sql_practice',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    const client = await this.pool.connect();
    await client.query('SELECT NOW()');
    client.release();
  }

  toPgPlaceholders(sql) {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
  }

  isSelectLike(sql) {
    const firstWord = (sql || '').trim().split(/\s+/)[0]?.toUpperCase();
    return ['SELECT', 'WITH', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'PRAGMA'].includes(firstWord);
  }

  getBaseInitSQL() {
    return `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        department_id INTEGER,
        salary DECIMAL(10, 2),
        hire_date DATE,
        FOREIGN KEY (department_id) REFERENCES departments(id)
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(50),
        price DECIMAL(10, 2),
        stock INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        total_amount DECIMAL(10, 2),
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS query_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sql TEXT NOT NULL,
        user_id VARCHAR(50),
        ip_address VARCHAR(45),
        execution_time_ms INTEGER,
        row_count INTEGER,
        success BOOLEAN,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS question_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id VARCHAR(20) NOT NULL,
        sql TEXT NOT NULL,
        execution_time_ms INTEGER,
        row_count INTEGER,
        success BOOLEAN,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS question_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id VARCHAR(20) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        username VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        parent_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS app_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'USER',
        plan VARCHAR(20) NOT NULL DEFAULT 'FREE',
        library_permissions VARCHAR(255) NOT NULL DEFAULT '[]',
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS student_courses (
        course VARCHAR(50),
        score INTEGER,
        y INTEGER
      );

      CREATE TABLE IF NOT EXISTS user_values (
        year INTEGER,
        user_id INTEGER,
        value DECIMAL(10,2)
      );

      CREATE TABLE IF NOT EXISTS student_scores (
        year INTEGER,
        subject VARCHAR(50),
        student VARCHAR(10),
        score INTEGER
      );

      CREATE TABLE IF NOT EXISTS employee_salary (
        id INTEGER,
        salary INTEGER
      );

      CREATE TABLE IF NOT EXISTS orders_detail (
        order_id INTEGER,
        user_id INTEGER,
        purchase_time TIMESTAMP,
        product_id INTEGER,
        amount DECIMAL(10,2)
      );

      CREATE TABLE IF NOT EXISTS median_numbers (
        num INTEGER
      );

      CREATE TABLE IF NOT EXISTS click_log (
        user_id INTEGER,
        click_time INTEGER
      );

      CREATE TABLE IF NOT EXISTS matches (
        uid INTEGER,
        dt DATE,
        res VARCHAR(10)
      );

      CREATE TABLE IF NOT EXISTS dau (
        user_id INTEGER,
        login_date DATE
      );

      CREATE TABLE IF NOT EXISTS consecutive_logs (
        id INTEGER,
        num INTEGER
      );

      CREATE TABLE IF NOT EXISTS weather (
        id INTEGER,
        recordDate DATE,
        temperature INTEGER
      );

      CREATE TABLE IF NOT EXISTS user_interests (
        user_id INTEGER,
        interests TEXT
      );

      CREATE TABLE IF NOT EXISTS row2col (
        col1 INTEGER,
        col2 VARCHAR(10),
        col3 INTEGER
      );

      CREATE TABLE IF NOT EXISTS col2row (
        a INTEGER,
        col_A INTEGER,
        col_B INTEGER
      );

      CREATE TABLE IF NOT EXISTS exam_scores (
        sid INTEGER,
        cid VARCHAR(10),
        score INTEGER
      );

      CREATE TABLE IF NOT EXISTS user_login_detail (
        user_id INTEGER,
        log_date DATE,
        login_time TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS login_status (
        uid INTEGER,
        login_ts TIMESTAMP,
        logout_ts TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS live_room_logs (
        user_id INTEGER,
        enter_time TIMESTAMP,
        leave_time TIMESTAMP,
        room_id INTEGER
      );

      CREATE TABLE IF NOT EXISTS player_activity (
        player_id INTEGER,
        device_id INTEGER,
        event_date DATE,
        games_played INTEGER
      );

      CREATE TABLE IF NOT EXISTS dau_events (
        user_id INTEGER,
        login_date DATE,
        event_type VARCHAR(20)
      );

      CREATE TABLE IF NOT EXISTS friend_requests (
        requester_id INTEGER,
        accepter_id INTEGER,
        accept_date DATE
      );

      CREATE TABLE IF NOT EXISTS followers (
        from_user INTEGER,
        to_user INTEGER
      );

      CREATE TABLE IF NOT EXISTS accepted_friends (
        requester_id INTEGER,
        accepter_id INTEGER,
        accept_date DATE
      );

      CREATE TABLE IF NOT EXISTS user_friends (
        user_id INTEGER,
        friend_id INTEGER
      );

      CREATE TABLE IF NOT EXISTS user_steps (
        user_id INTEGER,
        steps INTEGER,
        record_date DATE
      );

      CREATE TABLE IF NOT EXISTS product_prices (
        product_id INTEGER,
        new_price INTEGER,
        change_date DATE
      );

      CREATE TABLE IF NOT EXISTS stock_prices (
        code VARCHAR(10),
        ts TIMESTAMP,
        price DECIMAL(10,2)
      );

      CREATE TABLE IF NOT EXISTS login_logs (
        login_id INTEGER,
        user_id INTEGER,
        ip VARCHAR(20),
        login_time TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS article_views (
        article_id INTEGER,
        author_id INTEGER,
        viewer_id INTEGER,
        view_date DATE
      );

      CREATE TABLE IF NOT EXISTS question_contributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contributor_user_id VARCHAR(50) NOT NULL,
        contributor_username VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        raw_data_text TEXT,
        sandbox_setup_sql TEXT,
        ai_model VARCHAR(100),
        ai_prompt_text TEXT,
        ai_raw_response TEXT,
        ai_validation_report TEXT,
        ai_solution_analysis TEXT,
        ai_create_table_sql TEXT,
        ai_insert_sql TEXT,
        ai_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        ai_error_message TEXT,
        ai_generated_at TIMESTAMP,
        reference_sql TEXT,
        expected_result TEXT,
        source_company VARCHAR(100),
        source_position VARCHAR(100),
        tags VARCHAR(255),
        test_database_name VARCHAR(100),
        test_table_names TEXT,
        test_last_setup_at TIMESTAMP,
        test_last_cleanup_at TIMESTAMP,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        admin_note TEXT,
        reward_points INTEGER NOT NULL DEFAULT 0,
        reviewed_by_user_id VARCHAR(50),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_points_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(50) NOT NULL,
        contribution_id INTEGER UNIQUE,
        points INTEGER NOT NULL,
        reason VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone VARCHAR(20) NOT NULL,
        code_hash VARCHAR(128) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        request_ip VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS password_reset_email_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(100) NOT NULL,
        code_hash VARCHAR(128) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        request_ip VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  getInitSQL() {
    if (this.type !== 'mysql') {
      return this.getBaseInitSQL();
    }

    return this.getBaseInitSQL()
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'INT AUTO_INCREMENT PRIMARY KEY')
      .replace(/\bBOOLEAN\b/gi, 'TINYINT(1)')
      .replace(/\bsql TEXT NOT NULL\b/gi, 'sql_text TEXT NOT NULL');
  }

  /**
   * 初始化表结构
   */
  async initTables() {
    const initSQL = this.getInitSQL();

    try {
      if (this.type === 'sqlite') {
        await this.runSQLite(initSQL);
      } else {
        await this.pool.query(initSQL);
      }
      await this.ensureContributionSchema();
      await this.ensureAppUsersSchema();
      logger.info('数据库表初始化完成');
    } catch (error) {
      logger.error('数据库表初始化失败:', error);
      throw error;
    }
  }

  async ensureContributionSchema() {
    const columnsToEnsure = [
      { name: 'sandbox_setup_sql', type: 'TEXT' },
      { name: 'raw_data_text', type: 'TEXT' },
      { name: 'ai_model', type: 'VARCHAR(100)' },
      { name: 'ai_prompt_text', type: 'TEXT' },
      { name: 'ai_raw_response', type: 'TEXT' },
      { name: 'ai_validation_report', type: 'TEXT' },
      { name: 'ai_solution_analysis', type: 'TEXT' },
      { name: 'ai_create_table_sql', type: 'TEXT' },
      { name: 'ai_insert_sql', type: 'TEXT' },
      { name: 'ai_status', type: "VARCHAR(20) NOT NULL DEFAULT 'PENDING'" },
      { name: 'ai_error_message', type: 'TEXT' },
      { name: 'ai_generated_at', type: 'TIMESTAMP' },
      { name: 'test_database_name', type: 'VARCHAR(100)' },
      { name: 'test_table_names', type: 'TEXT' },
      { name: 'test_last_setup_at', type: 'TIMESTAMP' },
      { name: 'test_last_cleanup_at', type: 'TIMESTAMP' },
    ];

    if (this.type === 'sqlite') {
      const columns = await this.allSQLite('PRAGMA table_info(question_contributions)');
      for (const column of columnsToEnsure) {
        const exists = columns.some((col) => col.name === column.name);
        if (!exists) {
          await this.runWithChanges(`ALTER TABLE question_contributions ADD COLUMN ${column.name} ${column.type}`);
        }
      }
      return;
    }

    if (this.type === 'mysql') {
      const dbName = process.env.DB_NAME || 'sql_practice';
      const [rows] = await this.pool.execute(
        `
        SELECT COLUMN_NAME
        FROM information_schema.columns
        WHERE table_schema = ?
          AND table_name = 'question_contributions'
        `,
        [dbName]
      );
      const existing = new Set((rows || []).map((row) => row.COLUMN_NAME));
      for (const column of columnsToEnsure) {
        if (!existing.has(column.name)) {
          await this.pool.query(`ALTER TABLE question_contributions ADD COLUMN ${column.name} ${column.type}`);
        }
      }
      return;
    }

    const check = await this.pool.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'question_contributions'
      `
    );
    const existing = new Set((check.rows || []).map((row) => row.column_name));
    for (const column of columnsToEnsure) {
      if (!existing.has(column.name)) {
        await this.pool.query(`ALTER TABLE question_contributions ADD COLUMN ${column.name} ${column.type}`);
      }
    }
  }

  async ensureAppUsersSchema() {
    const columnsToEnsure = [
      { name: 'email', type: 'VARCHAR(100)' },
      { name: 'phone', type: 'VARCHAR(20)' },
      { name: 'library_permissions', type: "VARCHAR(255) NOT NULL DEFAULT '[]'" },
    ];

    if (this.type === 'sqlite') {
      const columns = await this.allSQLite('PRAGMA table_info(app_users)');
      for (const column of columnsToEnsure) {
        const exists = columns.some((col) => col.name === column.name);
        if (!exists) {
          await this.runWithChanges(`ALTER TABLE app_users ADD COLUMN ${column.name} ${column.type}`);
        }
      }
      await this.runWithChanges('CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email)');
      await this.runWithChanges('CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_phone ON app_users(phone)');
      return;
    }

    if (this.type === 'mysql') {
      const dbName = process.env.DB_NAME || 'sql_practice';
      const [rows] = await this.pool.execute(
        `
        SELECT COLUMN_NAME
        FROM information_schema.columns
        WHERE table_schema = ?
          AND table_name = 'app_users'
        `,
        [dbName]
      );
      const existing = new Set((rows || []).map((row) => row.COLUMN_NAME));
      for (const column of columnsToEnsure) {
        if (!existing.has(column.name)) {
          await this.pool.query(`ALTER TABLE app_users ADD COLUMN ${column.name} ${column.type}`);
        }
      }
      const [indexRows] = await this.pool.execute(
        `
        SELECT INDEX_NAME
        FROM information_schema.statistics
        WHERE table_schema = ?
          AND table_name = 'app_users'
          AND index_name = 'idx_app_users_phone'
        LIMIT 1
        `,
        [dbName]
      );
      if (!indexRows.length) {
        await this.pool.query('CREATE UNIQUE INDEX idx_app_users_phone ON app_users(phone)');
      }
      const [emailIndexRows] = await this.pool.execute(
        `
        SELECT INDEX_NAME
        FROM information_schema.statistics
        WHERE table_schema = ?
          AND table_name = 'app_users'
          AND index_name = 'idx_app_users_email'
        LIMIT 1
        `,
        [dbName]
      );
      if (!emailIndexRows.length) {
        await this.pool.query('CREATE UNIQUE INDEX idx_app_users_email ON app_users(email)');
      }
      return;
    }

    const check = await this.pool.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'app_users'
      `
    );
    const existing = new Set((check.rows || []).map((row) => row.column_name));
    for (const column of columnsToEnsure) {
      if (!existing.has(column.name)) {
        await this.pool.query(`ALTER TABLE app_users ADD COLUMN ${column.name} ${column.type}`);
      }
    }
    await this.pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email)');
    await this.pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_phone ON app_users(phone)');
  }

  runSQLite(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  allSQLite(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  runWithChanges(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function onRun(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes, lastID: this.lastID });
        }
      });
    });
  }

  /**
   * 执行 SQL 查询
   */
  async query(sql) {
    const startTime = Date.now();
    const maxRows = parseInt(process.env.MAX_ROWS || '1000', 10);

    try {
      let result;

      if (this.type === 'sqlite') {
        result = await this.querySQLite(sql, maxRows);
      } else if (this.type === 'mysql') {
        result = await this.queryMySQL(sql, maxRows);
      } else {
        result = await this.queryPostgres(sql, maxRows);
      }

      return {
        success: true,
        data: result.rows || [],
        rowCount: result.rowCount || (result.rows ? result.rows.length : 0),
        columns: result.columns || [],
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      throw {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  async querySQLite(sql, maxRows) {
    const isSelect = this.isSelectLike(sql);

    if (isSelect) {
      const rows = await this.allSQLite(sql);
      const limitedRows = rows.slice(0, maxRows);
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      return {
        rows: limitedRows,
        rowCount: rows.length,
        columns,
      };
    }

    const result = await this.runWithChanges(sql);
    return {
      rows: [],
      rowCount: result.changes,
      columns: [],
    };
  }

  async queryMySQL(sql, maxRows) {
    const [rows, fields] = await this.pool.query(sql);

    if (Array.isArray(rows)) {
      return {
        rows: rows.slice(0, maxRows),
        rowCount: rows.length,
        columns: (fields || []).map((f) => f.name),
      };
    }

    return {
      rows: [],
      rowCount: rows.affectedRows || 0,
      columns: [],
    };
  }

  async queryPostgres(sql, maxRows) {
    const client = await this.pool.connect();
    try {
      const queryTimeout = parseInt(process.env.QUERY_TIMEOUT || '30000', 10);
      await client.query(`SET statement_timeout = ${queryTimeout}`);
      const result = await client.query(sql);

      return {
        rows: result.rows.slice(0, maxRows),
        rowCount: result.rowCount,
        columns: result.fields.map((f) => f.name),
      };
    } finally {
      client.release();
    }
  }

  /**
   * 获取数据库 Schema 信息
   */
  async getSchema() {
    if (this.type === 'sqlite') {
      return this.getSQLiteSchema();
    }
    if (this.type === 'mysql') {
      return this.getMySQLSchema();
    }
    return this.getPostgresSchema();
  }

  async getSQLiteSchema() {
    const tables = await this.allSQLite(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'query_history'"
    );

    const schema = [];
    for (const table of tables) {
      const columns = await this.allSQLite(`PRAGMA table_info(${table.name})`);
      schema.push({
        name: table.name,
        columns: columns.map((col) => ({
          name: col.name,
          type: col.type,
          nullable: !col.notnull,
          primaryKey: col.pk === 1,
        })),
      });
    }

    return schema;
  }

  async getMySQLSchema() {
    const dbName = process.env.DB_NAME || 'sql_practice';
    const [rows] = await this.pool.execute(
      `
      SELECT
        TABLE_NAME as table_name,
        COLUMN_NAME as column_name,
        COLUMN_TYPE as column_type,
        IS_NULLABLE as is_nullable,
        COLUMN_KEY as column_key
      FROM information_schema.columns
      WHERE table_schema = ?
        AND table_name != 'query_history'
      ORDER BY table_name, ordinal_position
      `,
      [dbName]
    );

    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.table_name)) {
        map.set(row.table_name, []);
      }

      map.get(row.table_name).push({
        name: row.column_name,
        type: row.column_type,
        nullable: row.is_nullable === 'YES',
        primaryKey: row.column_key === 'PRI',
      });
    }

    return Array.from(map.entries()).map(([name, columns]) => ({
      name,
      columns,
    }));
  }

  async getPostgresSchema() {
    const result = await this.pool.query(`
      SELECT
        t.table_name,
        json_agg(json_build_object(
          'name', c.column_name,
          'type', c.data_type,
          'nullable', c.is_nullable = 'YES'
        ) ORDER BY c.ordinal_position) as columns
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name != 'query_history'
      GROUP BY t.table_name
    `);

    return result.rows.map((row) => ({
      name: row.table_name,
      columns: row.columns,
    }));
  }

  async getTableInfo(tableName) {
    const schema = await this.getSchema();
    return schema.find((t) => t.name === tableName);
  }

  async logQuery({ sql, userId, ipAddress, executionTime, rowCount, success, errorMessage }) {
    try {
      const params = [sql, userId, ipAddress, executionTime, rowCount, success ? 1 : 0, errorMessage];

      if (this.type === 'sqlite') {
        const logSQL = `
          INSERT INTO query_history (sql, user_id, ip_address, execution_time_ms, row_count, success, error_message)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await this.runWithChanges(logSQL, params);
      } else if (this.type === 'mysql') {
        const logSQL = `
          INSERT INTO query_history (sql_text, user_id, ip_address, execution_time_ms, row_count, success, error_message)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await this.pool.execute(logSQL, params);
      } else {
        const logSQL = `
          INSERT INTO query_history (sql, user_id, ip_address, execution_time_ms, row_count, success, error_message)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await this.pool.query(this.toPgPlaceholders(logSQL), params);
      }
    } catch (error) {
      logger.error('记录查询历史失败:', error);
    }
  }

  async getQueryHistory(limit = 100) {
    if (this.type === 'sqlite') {
      const sql = 'SELECT * FROM query_history ORDER BY created_at DESC LIMIT ?';
      return this.allSQLite(sql, [limit]);
    }
    if (this.type === 'mysql') {
      const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
      const sql = `
        SELECT
          id,
          sql_text AS sql_query,
          user_id,
          ip_address,
          execution_time_ms,
          row_count,
          success,
          error_message,
          created_at
        FROM query_history
        ORDER BY created_at DESC
        LIMIT ${safeLimit}
      `;
      const [rows] = await this.pool.query(sql);
      return rows.map((row) => ({ ...row, sql: row.sql_query }));
    }

    const sql = 'SELECT * FROM query_history ORDER BY created_at DESC LIMIT ?';
    const result = await this.pool.query(this.toPgPlaceholders(sql), [limit]);
    return result.rows;
  }

  async getTodayHistoryStats() {
    let sql = `
      SELECT
        COUNT(*) as total_queries,
        COUNT(CASE WHEN success = 1 THEN 1 END) as success_count,
        COUNT(CASE WHEN success = 0 THEN 1 END) as error_count,
        AVG(execution_time_ms) as avg_execution_time
      FROM query_history
      WHERE DATE(created_at) = DATE('now')
    `;

    if (this.type === 'mysql') {
      sql = `
        SELECT
          COUNT(*) as total_queries,
          COUNT(CASE WHEN success = 1 THEN 1 END) as success_count,
          COUNT(CASE WHEN success = 0 THEN 1 END) as error_count,
          AVG(execution_time_ms) as avg_execution_time
        FROM query_history
        WHERE DATE(created_at) = CURDATE()
      `;
      const [rows] = await this.pool.query(sql);
      return rows[0] || null;
    }

    if (this.type === 'postgres') {
      sql = `
        SELECT
          COUNT(*) as total_queries,
          COUNT(CASE WHEN success = 1 THEN 1 END) as success_count,
          COUNT(CASE WHEN success = 0 THEN 1 END) as error_count,
          AVG(execution_time_ms) as avg_execution_time
        FROM query_history
        WHERE DATE(created_at) = CURRENT_DATE
      `;
      const result = await this.pool.query(sql);
      return result.rows[0] || null;
    }

    const rows = await this.allSQLite(sql);
    return rows[0] || null;
  }

  async logQuestionSubmission({ questionId, sql, executionTime, rowCount, success, errorMessage }) {
    try {
      const params = [questionId, sql, executionTime, rowCount, success ? 1 : 0, errorMessage];

      if (this.type === 'sqlite') {
        const logSQL = `
          INSERT INTO question_submissions (question_id, sql, execution_time_ms, row_count, success, error_message)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        await this.runWithChanges(logSQL, params);
      } else if (this.type === 'mysql') {
        const logSQL = `
          INSERT INTO question_submissions (question_id, sql_text, execution_time_ms, row_count, success, error_message)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        await this.pool.execute(logSQL, params);
      } else {
        const logSQL = `
          INSERT INTO question_submissions (question_id, sql, execution_time_ms, row_count, success, error_message)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        await this.pool.query(this.toPgPlaceholders(logSQL), params);
      }
    } catch (error) {
      logger.error('记录题目提交失败:', error);
    }
  }

  async getQuestionSubmissions(questionId, limit = 50) {
    const params = [questionId, limit];

    if (this.type === 'sqlite') {
      const sql = 'SELECT * FROM question_submissions WHERE question_id = ? ORDER BY created_at DESC LIMIT ?';
      return this.allSQLite(sql, params);
    }
    if (this.type === 'mysql') {
      const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
      const sql = `
        SELECT
          id,
          question_id,
          sql_text AS sql_query,
          execution_time_ms,
          row_count,
          success,
          error_message,
          created_at
        FROM question_submissions
        WHERE question_id = ?
        ORDER BY created_at DESC
        LIMIT ${safeLimit}
      `;
      const [rows] = await this.pool.execute(sql, [questionId]);
      return rows.map((row) => ({ ...row, sql: row.sql_query }));
    }

    const sql = 'SELECT * FROM question_submissions WHERE question_id = ? ORDER BY created_at DESC LIMIT ?';
    const result = await this.pool.query(this.toPgPlaceholders(sql), params);
    return result.rows;
  }

  async getAllQuestionSubmissionStats() {
    const sql = `
      SELECT
        question_id,
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN success = 1 THEN 1 END) as success_count,
        MAX(created_at) as last_attempt_at
      FROM question_submissions
      GROUP BY question_id
    `;

    if (this.type === 'sqlite') {
      return this.allSQLite(sql);
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.query(sql);
      return rows;
    }

    const result = await this.pool.query(sql);
    return result.rows;
  }

  async getQuestionComments(questionId) {
    const sql = `
      SELECT id, question_id, user_id, username, content, parent_id, created_at
      FROM question_comments
      WHERE question_id = ?
      ORDER BY created_at ASC
    `;

    if (this.type === 'sqlite') {
      return this.allSQLite(sql, [questionId]);
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.execute(sql, [questionId]);
      return rows;
    }

    const result = await this.pool.query(this.toPgPlaceholders(sql), [questionId]);
    return result.rows;
  }

  async addQuestionComment({ questionId, userId, username, content, parentId = null }) {
    const sql = `
      INSERT INTO question_comments (question_id, user_id, username, content, parent_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [questionId, userId, username, content, parentId];

    if (this.type === 'sqlite') {
      const result = await this.runWithChanges(sql, params);
      return result.lastID;
    }

    if (this.type === 'mysql') {
      const [result] = await this.pool.execute(sql, params);
      return result.insertId;
    }

    const result = await this.pool.query(
      `INSERT INTO question_comments (question_id, user_id, username, content, parent_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      params
    );
    return result.rows[0]?.id;
  }

  async getQuestionCommentById(commentId) {
    const sql = `
      SELECT id, question_id, user_id, username, content, parent_id, created_at
      FROM question_comments
      WHERE id = ?
      LIMIT 1
    `;

    if (this.type === 'sqlite') {
      const rows = await this.allSQLite(sql, [commentId]);
      return rows[0] || null;
    }

    if (this.type === 'mysql') {
      const [rows] = await this.pool.execute(sql, [commentId]);
      return rows[0] || null;
    }

    const result = await this.pool.query(this.toPgPlaceholders(sql), [commentId]);
    return result.rows[0] || null;
  }

  async findAuthUserByUsername(username) {
    const sql = `
      SELECT id, username, email, phone, password_hash, role, plan, library_permissions, status, created_at
      FROM app_users
      WHERE username = ?
      LIMIT 1
    `;

    if (this.type === 'sqlite') {
      const rows = await this.allSQLite(sql, [username]);
      return rows[0] || null;
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.execute(sql, [username]);
      return rows[0] || null;
    }

    const result = await this.pool.query(this.toPgPlaceholders(sql), [username]);
    return result.rows[0] || null;
  }

  async findAuthUserById(id) {
    const sql = `
      SELECT id, username, email, phone, password_hash, role, plan, library_permissions, status, created_at
      FROM app_users
      WHERE id = ?
      LIMIT 1
    `;

    if (this.type === 'sqlite') {
      const rows = await this.allSQLite(sql, [id]);
      return rows[0] || null;
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.execute(sql, [id]);
      return rows[0] || null;
    }

    const result = await this.pool.query(this.toPgPlaceholders(sql), [id]);
    return result.rows[0] || null;
  }

  async findAuthUserByPhone(phone) {
    const sql = `
      SELECT id, username, email, phone, password_hash, role, plan, library_permissions, status, created_at
      FROM app_users
      WHERE phone = ?
      LIMIT 1
    `;

    if (this.type === 'sqlite') {
      const rows = await this.allSQLite(sql, [phone]);
      return rows[0] || null;
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.execute(sql, [phone]);
      return rows[0] || null;
    }

    const result = await this.pool.query(this.toPgPlaceholders(sql), [phone]);
    return result.rows[0] || null;
  }

  async createAuthUser({ username, phone = null, passwordHash, role = 'USER', plan = 'FREE', libraryPermissions = [] }) {
    return this.createAuthUserWithProfile({
      username,
      email: null,
      phone,
      passwordHash,
      role,
      plan,
      libraryPermissions,
    });
  }

  async findAuthUserByEmail(email) {
    const sql = `
      SELECT id, username, email, phone, password_hash, role, plan, library_permissions, status, created_at
      FROM app_users
      WHERE email = ?
      LIMIT 1
    `;

    if (this.type === 'sqlite') {
      const rows = await this.allSQLite(sql, [email]);
      return rows[0] || null;
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.execute(sql, [email]);
      return rows[0] || null;
    }

    const result = await this.pool.query(this.toPgPlaceholders(sql), [email]);
    return result.rows[0] || null;
  }

  async createAuthUserWithProfile({ username, email = null, phone = null, passwordHash, role = 'USER', plan = 'FREE', libraryPermissions = [] }) {
    const normalizedPermissions = JSON.stringify(
      Array.isArray(libraryPermissions)
        ? [...new Set(libraryPermissions.map((x) => String(x).trim()).filter(Boolean))]
        : []
    );
    const sql = `
      INSERT INTO app_users (username, email, phone, password_hash, role, plan, library_permissions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [username, email, phone, passwordHash, role, plan, normalizedPermissions];

    if (this.type === 'sqlite') {
      const result = await this.runWithChanges(sql, params);
      return result.lastID;
    }
    if (this.type === 'mysql') {
      const [result] = await this.pool.execute(sql, params);
      return result.insertId;
    }

    const result = await this.pool.query(
      'INSERT INTO app_users (username, email, phone, password_hash, role, plan, library_permissions) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      params
    );
    return result.rows[0]?.id;
  }

  async updateAuthUserPlan(userId, plan) {
    const sql = 'UPDATE app_users SET plan = ? WHERE id = ?';
    const params = [plan, userId];

    if (this.type === 'sqlite') {
      await this.runWithChanges(sql, params);
      return;
    }
    if (this.type === 'mysql') {
      await this.pool.execute(sql, params);
      return;
    }

    await this.pool.query(this.toPgPlaceholders(sql), params);
  }

  async updateAuthUserLibraryPermissions(userId, libraryPermissions = []) {
    const normalizedPermissions = JSON.stringify(
      Array.isArray(libraryPermissions)
        ? [...new Set(libraryPermissions.map((x) => String(x).trim()).filter(Boolean))]
        : []
    );
    const sql = 'UPDATE app_users SET library_permissions = ? WHERE id = ?';
    const params = [normalizedPermissions, userId];

    if (this.type === 'sqlite') {
      await this.runWithChanges(sql, params);
      return;
    }
    if (this.type === 'mysql') {
      await this.pool.execute(sql, params);
      return;
    }

    await this.pool.query(this.toPgPlaceholders(sql), params);
  }

  async listAuthUsers() {
    const sql = `
      SELECT id, username, email, phone, role, plan, library_permissions, status, created_at
      FROM app_users
      ORDER BY created_at DESC
    `;

    if (this.type === 'sqlite') {
      return this.allSQLite(sql);
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.query(sql);
      return rows;
    }

    const result = await this.pool.query(sql);
    return result.rows;
  }

  async updateAuthUserPasswordHashById(userId, passwordHash) {
    const sql = 'UPDATE app_users SET password_hash = ? WHERE id = ?';
    const params = [passwordHash, userId];

    if (this.type === 'sqlite') {
      await this.runWithChanges(sql, params);
      return;
    }
    if (this.type === 'mysql') {
      await this.pool.execute(sql, params);
      return;
    }
    await this.pool.query(this.toPgPlaceholders(sql), params);
  }

  async createPasswordResetCode({ phone, codeHash, expiresAt, requestIp = '' }) {
    const sql = `
      INSERT INTO password_reset_codes (phone, code_hash, expires_at, request_ip)
      VALUES (?, ?, ?, ?)
    `;
    const params = [phone, codeHash, expiresAt, requestIp || null];

    if (this.type === 'sqlite') {
      const result = await this.runWithChanges(sql, params);
      return result.lastID;
    }
    if (this.type === 'mysql') {
      const [result] = await this.pool.execute(sql, params);
      return result.insertId;
    }
    const result = await this.pool.query(
      'INSERT INTO password_reset_codes (phone, code_hash, expires_at, request_ip) VALUES ($1, $2, $3, $4) RETURNING id',
      params
    );
    return result.rows[0]?.id;
  }

  async getLatestActivePasswordResetCode(phone) {
    const sql = `
      SELECT id, phone, code_hash, expires_at, used_at, attempt_count, request_ip, created_at
      FROM password_reset_codes
      WHERE phone = ?
        AND used_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (this.type === 'sqlite') {
      const rows = await this.allSQLite(sql, [phone]);
      return rows[0] || null;
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.execute(sql, [phone]);
      return rows[0] || null;
    }
    const result = await this.pool.query(this.toPgPlaceholders(sql), [phone]);
    return result.rows[0] || null;
  }

  async markPasswordResetCodeUsed(id) {
    const sql = 'UPDATE password_reset_codes SET used_at = CURRENT_TIMESTAMP WHERE id = ?';
    const params = [id];
    if (this.type === 'sqlite') {
      await this.runWithChanges(sql, params);
      return;
    }
    if (this.type === 'mysql') {
      await this.pool.execute(sql, params);
      return;
    }
    await this.pool.query(this.toPgPlaceholders(sql), params);
  }

  async incrementPasswordResetCodeAttempt(id) {
    const sql = 'UPDATE password_reset_codes SET attempt_count = attempt_count + 1 WHERE id = ?';
    const params = [id];
    if (this.type === 'sqlite') {
      await this.runWithChanges(sql, params);
      return;
    }
    if (this.type === 'mysql') {
      await this.pool.execute(sql, params);
      return;
    }
    await this.pool.query(this.toPgPlaceholders(sql), params);
  }

  async invalidateActivePasswordResetCodes(phone) {
    const sql = `
      UPDATE password_reset_codes
      SET used_at = CURRENT_TIMESTAMP
      WHERE phone = ?
        AND used_at IS NULL
    `;
    const params = [phone];
    if (this.type === 'sqlite') {
      await this.runWithChanges(sql, params);
      return;
    }
    if (this.type === 'mysql') {
      await this.pool.execute(sql, params);
      return;
    }
    await this.pool.query(this.toPgPlaceholders(sql), params);
  }

  async listRecentPasswordResetCodesByPhone(phone, limit = 10) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
    const sql = `
      SELECT id, phone, code_hash, expires_at, used_at, attempt_count, request_ip, created_at
      FROM password_reset_codes
      WHERE phone = ?
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `;

    if (this.type === 'sqlite') {
      return this.allSQLite(sql, [phone]);
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.execute(sql, [phone]);
      return rows;
    }
    const result = await this.pool.query(this.toPgPlaceholders(sql), [phone]);
    return result.rows;
  }

  async listRecentPasswordResetCodesByIp(requestIp, limit = 30) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
    const sql = `
      SELECT id, phone, code_hash, expires_at, used_at, attempt_count, request_ip, created_at
      FROM password_reset_codes
      WHERE request_ip = ?
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `;

    if (this.type === 'sqlite') {
      return this.allSQLite(sql, [requestIp]);
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.execute(sql, [requestIp]);
      return rows;
    }
    const result = await this.pool.query(this.toPgPlaceholders(sql), [requestIp]);
    return result.rows;
  }

  async createPasswordResetEmailCode({ email, codeHash, expiresAt, requestIp = '' }) {
    const sql = `
      INSERT INTO password_reset_email_codes (email, code_hash, expires_at, request_ip)
      VALUES (?, ?, ?, ?)
    `;
    const params = [email, codeHash, expiresAt, requestIp || null];

    if (this.type === 'sqlite') {
      const result = await this.runWithChanges(sql, params);
      return result.lastID;
    }
    if (this.type === 'mysql') {
      const [result] = await this.pool.execute(sql, params);
      return result.insertId;
    }
    const result = await this.pool.query(
      'INSERT INTO password_reset_email_codes (email, code_hash, expires_at, request_ip) VALUES ($1, $2, $3, $4) RETURNING id',
      params
    );
    return result.rows[0]?.id;
  }

  async getLatestActivePasswordResetEmailCode(email) {
    const sql = `
      SELECT id, email, code_hash, expires_at, used_at, attempt_count, request_ip, created_at
      FROM password_reset_email_codes
      WHERE email = ?
        AND used_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (this.type === 'sqlite') {
      const rows = await this.allSQLite(sql, [email]);
      return rows[0] || null;
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.execute(sql, [email]);
      return rows[0] || null;
    }
    const result = await this.pool.query(this.toPgPlaceholders(sql), [email]);
    return result.rows[0] || null;
  }

  async markPasswordResetEmailCodeUsed(id) {
    const sql = 'UPDATE password_reset_email_codes SET used_at = CURRENT_TIMESTAMP WHERE id = ?';
    const params = [id];
    if (this.type === 'sqlite') {
      await this.runWithChanges(sql, params);
      return;
    }
    if (this.type === 'mysql') {
      await this.pool.execute(sql, params);
      return;
    }
    await this.pool.query(this.toPgPlaceholders(sql), params);
  }

  async incrementPasswordResetEmailCodeAttempt(id) {
    const sql = 'UPDATE password_reset_email_codes SET attempt_count = attempt_count + 1 WHERE id = ?';
    const params = [id];
    if (this.type === 'sqlite') {
      await this.runWithChanges(sql, params);
      return;
    }
    if (this.type === 'mysql') {
      await this.pool.execute(sql, params);
      return;
    }
    await this.pool.query(this.toPgPlaceholders(sql), params);
  }

  async invalidateActivePasswordResetEmailCodes(email) {
    const sql = `
      UPDATE password_reset_email_codes
      SET used_at = CURRENT_TIMESTAMP
      WHERE email = ?
        AND used_at IS NULL
    `;
    const params = [email];
    if (this.type === 'sqlite') {
      await this.runWithChanges(sql, params);
      return;
    }
    if (this.type === 'mysql') {
      await this.pool.execute(sql, params);
      return;
    }
    await this.pool.query(this.toPgPlaceholders(sql), params);
  }

  async listRecentPasswordResetEmailCodesByEmail(email, limit = 10) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
    const sql = `
      SELECT id, email, code_hash, expires_at, used_at, attempt_count, request_ip, created_at
      FROM password_reset_email_codes
      WHERE email = ?
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `;
    if (this.type === 'sqlite') {
      return this.allSQLite(sql, [email]);
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.execute(sql, [email]);
      return rows;
    }
    const result = await this.pool.query(this.toPgPlaceholders(sql), [email]);
    return result.rows;
  }

  async listRecentPasswordResetEmailCodesByIp(requestIp, limit = 30) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
    const sql = `
      SELECT id, email, code_hash, expires_at, used_at, attempt_count, request_ip, created_at
      FROM password_reset_email_codes
      WHERE request_ip = ?
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `;
    if (this.type === 'sqlite') {
      return this.allSQLite(sql, [requestIp]);
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.execute(sql, [requestIp]);
      return rows;
    }
    const result = await this.pool.query(this.toPgPlaceholders(sql), [requestIp]);
    return result.rows;
  }

  async createQuestionContribution({
    contributorUserId,
    contributorUsername,
    title,
    description,
    rawDataText = '',
    sandboxSetupSql = '',
    aiModel = '',
    aiPromptText = '',
    aiRawResponse = '',
    aiValidationReport = '',
    aiSolutionAnalysis = '',
    aiCreateTableSql = '',
    aiInsertSql = '',
    aiStatus = 'PENDING',
    aiErrorMessage = '',
    referenceSql = '',
    expectedResult = '',
    sourceCompany = '',
    sourcePosition = '',
    tags = '',
  }) {
    const sql = `
      INSERT INTO question_contributions (
        contributor_user_id,
        contributor_username,
        title,
        description,
        raw_data_text,
        sandbox_setup_sql,
        ai_model,
        ai_prompt_text,
        ai_raw_response,
        ai_validation_report,
        ai_solution_analysis,
        ai_create_table_sql,
        ai_insert_sql,
        ai_status,
        ai_error_message,
        ai_generated_at,
        reference_sql,
        expected_result,
        source_company,
        source_position,
        tags
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)
    `;
    const params = [
      contributorUserId,
      contributorUsername,
      title,
      description,
      rawDataText,
      sandboxSetupSql,
      aiModel,
      aiPromptText,
      aiRawResponse,
      aiValidationReport,
      aiSolutionAnalysis,
      aiCreateTableSql,
      aiInsertSql,
      aiStatus,
      aiErrorMessage,
      referenceSql,
      expectedResult,
      sourceCompany,
      sourcePosition,
      tags,
    ];

    if (this.type === 'sqlite') {
      const result = await this.runWithChanges(sql, params);
      return result.lastID;
    }
    if (this.type === 'mysql') {
      const [result] = await this.pool.execute(sql, params);
      return result.insertId;
    }

    const result = await this.pool.query(
      `INSERT INTO question_contributions (
        contributor_user_id, contributor_username, title, description, raw_data_text, sandbox_setup_sql, ai_model, ai_prompt_text, ai_raw_response, ai_validation_report, ai_solution_analysis, ai_create_table_sql, ai_insert_sql, ai_status, ai_error_message, ai_generated_at, reference_sql, expected_result, source_company, source_position, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, $16, $17, $18, $19, $20)
      RETURNING id`,
      params
    );
    return result.rows[0]?.id;
  }

  async getContributionById(contributionId) {
    const sql = `
      SELECT
        id, contributor_user_id, contributor_username, title, description,
        raw_data_text, sandbox_setup_sql, ai_model, ai_prompt_text, ai_raw_response, ai_validation_report, ai_solution_analysis, ai_create_table_sql, ai_insert_sql, ai_status, ai_error_message, ai_generated_at,
        reference_sql, expected_result, source_company, source_position, tags,
        test_database_name, test_table_names, test_last_setup_at, test_last_cleanup_at,
        status, admin_note, reward_points, reviewed_by_user_id, reviewed_at, created_at
      FROM question_contributions
      WHERE id = ?
      LIMIT 1
    `;

    if (this.type === 'sqlite') {
      const rows = await this.allSQLite(sql, [contributionId]);
      return rows[0] || null;
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.execute(sql, [contributionId]);
      return rows[0] || null;
    }

    const result = await this.pool.query(this.toPgPlaceholders(sql), [contributionId]);
    return result.rows[0] || null;
  }

  async getMyQuestionContributions(userId, limit = 100) {
    const sql = `
      SELECT
        id, contributor_user_id, contributor_username, title, description,
        raw_data_text, sandbox_setup_sql, ai_model, ai_prompt_text, ai_raw_response, ai_validation_report, ai_solution_analysis, ai_create_table_sql, ai_insert_sql, ai_status, ai_error_message, ai_generated_at,
        reference_sql, expected_result, source_company, source_position, tags,
        test_database_name, test_table_names, test_last_setup_at, test_last_cleanup_at,
        status, admin_note, reward_points, reviewed_by_user_id, reviewed_at, created_at
      FROM question_contributions
      WHERE contributor_user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const params = [userId, limit];

    if (this.type === 'sqlite') {
      return this.allSQLite(sql, params);
    }
    if (this.type === 'mysql') {
      const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 200));
      const [rows] = await this.pool.execute(
        `
        SELECT
          id, contributor_user_id, contributor_username, title, description,
          raw_data_text, sandbox_setup_sql, ai_model, ai_prompt_text, ai_raw_response, ai_validation_report, ai_solution_analysis, ai_create_table_sql, ai_insert_sql, ai_status, ai_error_message, ai_generated_at,
          reference_sql, expected_result, source_company, source_position, tags,
          test_database_name, test_table_names, test_last_setup_at, test_last_cleanup_at,
          status, admin_note, reward_points, reviewed_by_user_id, reviewed_at, created_at
        FROM question_contributions
        WHERE contributor_user_id = ?
        ORDER BY created_at DESC
        LIMIT ${safeLimit}
      `,
        [userId]
      );
      return rows;
    }

    const result = await this.pool.query(this.toPgPlaceholders(sql), params);
    return result.rows;
  }

  async listQuestionContributions({ status = 'ALL', limit = 200 } = {}) {
    const normalizedStatus = String(status || 'ALL').toUpperCase();

    let sql = `
      SELECT
        id, contributor_user_id, contributor_username, title, description,
        raw_data_text, sandbox_setup_sql, ai_model, ai_prompt_text, ai_raw_response, ai_validation_report, ai_solution_analysis, ai_create_table_sql, ai_insert_sql, ai_status, ai_error_message, ai_generated_at,
        reference_sql, expected_result, source_company, source_position, tags,
        test_database_name, test_table_names, test_last_setup_at, test_last_cleanup_at,
        status, admin_note, reward_points, reviewed_by_user_id, reviewed_at, created_at
      FROM question_contributions
    `;
    const params = [];
    if (normalizedStatus !== 'ALL') {
      sql += ' WHERE status = ?';
      params.push(normalizedStatus);
    }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    if (this.type === 'sqlite') {
      return this.allSQLite(sql, params);
    }
    if (this.type === 'mysql') {
      const safeLimit = Math.max(1, Math.min(Number(limit) || 200, 500));
      if (normalizedStatus === 'ALL') {
        const [rows] = await this.pool.query(
          `
          SELECT
            id, contributor_user_id, contributor_username, title, description,
            raw_data_text, sandbox_setup_sql, ai_model, ai_prompt_text, ai_raw_response, ai_validation_report, ai_solution_analysis, ai_create_table_sql, ai_insert_sql, ai_status, ai_error_message, ai_generated_at,
            reference_sql, expected_result, source_company, source_position, tags,
            test_database_name, test_table_names, test_last_setup_at, test_last_cleanup_at,
            status, admin_note, reward_points, reviewed_by_user_id, reviewed_at, created_at
          FROM question_contributions
          ORDER BY created_at DESC
          LIMIT ${safeLimit}
        `
        );
        return rows;
      }
      const [rows] = await this.pool.execute(
        `
        SELECT
          id, contributor_user_id, contributor_username, title, description,
          raw_data_text, sandbox_setup_sql, ai_model, ai_prompt_text, ai_raw_response, ai_validation_report, ai_solution_analysis, ai_create_table_sql, ai_insert_sql, ai_status, ai_error_message, ai_generated_at,
          reference_sql, expected_result, source_company, source_position, tags,
          test_database_name, test_table_names, test_last_setup_at, test_last_cleanup_at,
          status, admin_note, reward_points, reviewed_by_user_id, reviewed_at, created_at
        FROM question_contributions
        WHERE status = ?
        ORDER BY created_at DESC
        LIMIT ${safeLimit}
      `,
        [normalizedStatus]
      );
      return rows;
    }

    const result = await this.pool.query(this.toPgPlaceholders(sql), params);
    return result.rows;
  }

  async reviewQuestionContribution({ contributionId, status, adminNote = '', rewardPoints = 0, reviewedByUserId }) {
    const sql = `
      UPDATE question_contributions
      SET status = ?, admin_note = ?, reward_points = ?, reviewed_by_user_id = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const params = [status, adminNote, rewardPoints, reviewedByUserId, contributionId];

    if (this.type === 'sqlite') {
      await this.runWithChanges(sql, params);
      return;
    }
    if (this.type === 'mysql') {
      await this.pool.execute(sql, params);
      return;
    }

    await this.pool.query(this.toPgPlaceholders(sql), params);
  }

  async grantContributionReward({ userId, contributionId, points, reason = '题目贡献审核通过' }) {
    const sql = `
      INSERT INTO user_points_ledger (user_id, contribution_id, points, reason)
      VALUES (?, ?, ?, ?)
    `;
    const params = [userId, contributionId, points, reason];

    if (this.type === 'sqlite') {
      const result = await this.runWithChanges(sql, params);
      return result.lastID;
    }
    if (this.type === 'mysql') {
      const [result] = await this.pool.execute(sql, params);
      return result.insertId;
    }

    const result = await this.pool.query(
      'INSERT INTO user_points_ledger (user_id, contribution_id, points, reason) VALUES ($1, $2, $3, $4) RETURNING id',
      params
    );
    return result.rows[0]?.id;
  }

  async getUserPointSummary(userId) {
    const sql = `
      SELECT
        COALESCE(SUM(points), 0) AS total_points,
        COUNT(*) AS total_records
      FROM user_points_ledger
      WHERE user_id = ?
    `;

    if (this.type === 'sqlite') {
      const rows = await this.allSQLite(sql, [userId]);
      return rows[0] || { total_points: 0, total_records: 0 };
    }
    if (this.type === 'mysql') {
      const [rows] = await this.pool.execute(sql, [userId]);
      return rows[0] || { total_points: 0, total_records: 0 };
    }

    const result = await this.pool.query(this.toPgPlaceholders(sql), [userId]);
    return result.rows[0] || { total_points: 0, total_records: 0 };
  }

  async updateContributionAiResult({
    contributionId,
    title = '',
    referenceSql = '',
    aiModel = '',
    aiPromptText = '',
    aiRawResponse = '',
    aiValidationReport = '',
    aiSolutionAnalysis = '',
    aiCreateTableSql = '',
    aiInsertSql = '',
    aiStatus = 'SUCCESS',
    aiErrorMessage = '',
  }) {
    const sql = `
      UPDATE question_contributions
      SET
        title = COALESCE(NULLIF(?, ''), title),
        reference_sql = COALESCE(NULLIF(?, ''), reference_sql),
        ai_model = ?,
        ai_prompt_text = COALESCE(NULLIF(?, ''), ai_prompt_text),
        ai_raw_response = COALESCE(NULLIF(?, ''), ai_raw_response),
        ai_validation_report = COALESCE(NULLIF(?, ''), ai_validation_report),
        ai_solution_analysis = COALESCE(NULLIF(?, ''), ai_solution_analysis),
        ai_create_table_sql = ?,
        ai_insert_sql = ?,
        ai_status = ?,
        ai_error_message = ?,
        ai_generated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const params = [
      title,
      referenceSql,
      aiModel,
      aiPromptText,
      aiRawResponse,
      aiValidationReport,
      aiSolutionAnalysis,
      aiCreateTableSql,
      aiInsertSql,
      aiStatus,
      aiErrorMessage,
      contributionId,
    ];

    if (this.type === 'sqlite') {
      await this.runWithChanges(sql, params);
      return;
    }
    if (this.type === 'mysql') {
      await this.pool.execute(sql, params);
      return;
    }
    await this.pool.query(this.toPgPlaceholders(sql), params);
  }

  async updateContributionTestMeta({ contributionId, testDatabaseName = '', testTableNames = [] }) {
    const tableNamesText = JSON.stringify(testTableNames || []);
    const sql = `
      UPDATE question_contributions
      SET
        test_database_name = ?,
        test_table_names = ?,
        test_last_setup_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const params = [testDatabaseName, tableNamesText, contributionId];

    if (this.type === 'sqlite') {
      await this.runWithChanges(sql, params);
      return;
    }
    if (this.type === 'mysql') {
      await this.pool.execute(sql, params);
      return;
    }
    await this.pool.query(this.toPgPlaceholders(sql), params);
  }

  async markContributionTestCleanup(contributionId) {
    const sql = `
      UPDATE question_contributions
      SET test_last_cleanup_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const params = [contributionId];

    if (this.type === 'sqlite') {
      await this.runWithChanges(sql, params);
      return;
    }
    if (this.type === 'mysql') {
      await this.pool.execute(sql, params);
      return;
    }
    await this.pool.query(this.toPgPlaceholders(sql), params);
  }

  getContributionTestDatabaseName(contributionId) {
    const id = Number(contributionId) || 0;
    const prefix = String(process.env.CONTRIB_TEST_DB_PREFIX || 'offersql_test_c_').trim();
    return `${prefix}${id}`;
  }

  splitSqlStatements(sqlText) {
    return String(sqlText || '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  extractCreateTableNames(sqlText) {
    const names = [];
    const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/gi;
    let match = regex.exec(String(sqlText || ''));
    while (match) {
      names.push(match[1]);
      match = regex.exec(String(sqlText || ''));
    }
    return [...new Set(names)];
  }

  normalizeCreateTableStatement(sqlStatement) {
    const statement = String(sqlStatement || '').trim();
    if (!statement) return statement;
    if (!/^CREATE\s+TABLE\b/i.test(statement)) return statement;
    if (/^CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\b/i.test(statement)) return statement;
    return statement.replace(/^CREATE\s+TABLE\b/i, 'CREATE TABLE IF NOT EXISTS');
  }

  getMySQLRuntimeConfig(databaseName) {
    return {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: databaseName,
      multipleStatements: true,
      charset: 'utf8mb4',
    };
  }

  getContributionTestDbConfig(databaseName = '') {
    return {
      host: process.env.CONTRIB_TEST_DB_HOST || process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.CONTRIB_TEST_DB_PORT || process.env.DB_PORT || '3306', 10),
      user: process.env.CONTRIB_TEST_DB_USER || process.env.DB_USER || 'root',
      password: process.env.CONTRIB_TEST_DB_PASSWORD || process.env.DB_PASSWORD || '',
      database: databaseName || undefined,
      multipleStatements: true,
      charset: 'utf8mb4',
    };
  }

  async getMySQLConnection(databaseName) {
    return mysql.createConnection({
      ...this.getMySQLRuntimeConfig(databaseName),
    });
  }

  async getContributionTestDbConnection(databaseName) {
    return mysql.createConnection({
      ...this.getContributionTestDbConfig(databaseName),
    });
  }

  async ensureContributionTestDatabase(databaseName) {
    const conn = await mysql.createConnection(this.getContributionTestDbConfig());
    try {
      await conn.query(
        `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    } finally {
      await conn.end();
    }
  }

  async setupContributionTestTables({ contributionId, createTableSql, insertSql }) {
    if (this.type !== 'mysql') {
      throw new Error('当前仅支持 MySQL 测试库');
    }

    const dbName = this.getContributionTestDatabaseName(contributionId);
    await this.ensureContributionTestDatabase(dbName);

    const conn = await this.getContributionTestDbConnection(dbName);
    try {
      const [existingTables] = await conn.query(
        `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = ?
          AND table_type = 'BASE TABLE'
        `,
        [dbName]
      );
      for (const row of existingTables) {
        await conn.query(`DROP TABLE IF EXISTS \`${row.table_name}\``);
      }

      for (const statement of this.splitSqlStatements(createTableSql)) {
        const normalizedCreate = this.normalizeCreateTableStatement(statement);
        try {
          await conn.query(normalizedCreate);
        } catch (error) {
          if (error && (error.code === 'ER_TABLE_EXISTS_ERROR' || /already exists/i.test(String(error.message || '')))) {
            // 并发重复初始化时允许已存在表直接跳过，保持幂等
            continue;
          }
          throw error;
        }
      }
      for (const statement of this.splitSqlStatements(insertSql)) {
        await conn.query(statement);
      }

      return {
        databaseName: dbName,
        tableNames: this.extractCreateTableNames(createTableSql),
      };
    } finally {
      await conn.end();
    }
  }

  async runContributionTestQuery({ contributionId, sql }) {
    if (this.type !== 'mysql') {
      throw new Error('当前仅支持 MySQL 测试库');
    }

    const dbName = this.getContributionTestDatabaseName(contributionId);
    await this.ensureContributionTestDatabase(dbName);
    const conn = await this.getContributionTestDbConnection(dbName);
    const maxRows = parseInt(process.env.MAX_ROWS || '1000', 10);
    try {
      const [rows, fields] = await conn.query(sql);
      if (!Array.isArray(rows)) {
        return {
          rows: [],
          rowCount: rows.affectedRows || 0,
          columns: [],
        };
      }
      return {
        rows: rows.slice(0, maxRows),
        rowCount: rows.length,
        columns: (fields || []).map((f) => f.name),
      };
    } finally {
      await conn.end();
    }
  }

  async cleanupContributionTestTables(contributionId) {
    if (this.type !== 'mysql') {
      throw new Error('当前仅支持 MySQL 测试库');
    }

    const dbName = this.getContributionTestDatabaseName(contributionId);
    const conn = await this.getContributionTestDbConnection(dbName);
    try {
      const [tables] = await conn.query(
        `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = ?
          AND table_type = 'BASE TABLE'
        `,
        [dbName]
      );
      for (const row of tables) {
        await conn.query(`DROP TABLE IF EXISTS \`${row.table_name}\``);
      }
      return {
        databaseName: dbName,
        droppedTableCount: tables.length,
      };
    } finally {
      await conn.end();
    }
  }

  isConnected() {
    return this.db !== null || this.pool !== null;
  }

  async close() {
    if (this.db) {
      await new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            logger.error('关闭数据库连接失败:', err);
          }
          resolve();
        });
      });
      this.db = null;
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }

    logger.info('数据库连接已关闭');
  }
}

module.exports = new DatabaseService();
