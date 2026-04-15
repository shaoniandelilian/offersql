/**
 * 大厂秋招面试 SQL 必刷 30 题 - 数据初始化
 */
const database = require('../src/services/database');

const interviewQuestionsData = {
  // 1.1 学生课程成绩表
  student_courses: [
    { course: '语文', score: 60, y: 2018 },
    { course: '语文', score: 70, y: 2018 },
    { course: '语文', score: 80, y: 2018 },
    { course: '语文', score: 90, y: 2018 },
    { course: '数学', score: 50, y: 2018 },
    { course: '数学', score: 60, y: 2018 },
    { course: '数学', score: 95, y: 2018 },
    { course: '语文', score: 55, y: 2019 },
    { course: '语文', score: 85, y: 2019 },
    { course: '数学', score: 70, y: 2019 },
  ],

  // 1.2 用户价值表
  user_values: [
    { year: 2021, user_id: 101, value: 150.00 },
    { year: 2021, user_id: 102, value: 80.00 },
    { year: 2021, user_id: 103, value: 300.00 },
    { year: 2021, user_id: 104, value: 50.00 },
    { year: 2022, user_id: 105, value: 200.00 },
    { year: 2022, user_id: 106, value: 180.00 },
  ],

  // 1.3 学生成绩表
  student_scores: [
    { year: 2018, subject: '语文', student: 'A', score: 84 },
    { year: 2018, subject: '数学', student: 'A', score: 59 },
    { year: 2018, subject: '英语', student: 'A', score: 30 },
    { year: 2018, subject: '语文', student: 'B', score: 44 },
    { year: 2018, subject: '数学', student: 'B', score: 76 },
    { year: 2018, subject: '英语', student: 'B', score: 68 },
    { year: 2019, subject: '语文', student: 'A', score: 51 },
    { year: 2019, subject: '数学', student: 'A', score: 94 },
    { year: 2019, subject: '英语', student: 'A', score: 71 },
    { year: 2019, subject: '语文', student: 'B', score: 87 },
    { year: 2019, subject: '数学', student: 'B', score: 44 },
    { year: 2019, subject: '英语', student: 'B', score: 38 },
    { year: 2020, subject: '语文', student: 'A', score: 91 },
    { year: 2020, subject: '数学', student: 'A', score: 50 },
    { year: 2020, subject: '英语', student: 'A', score: 89 },
    { year: 2020, subject: '语文', student: 'B', score: 81 },
    { year: 2020, subject: '数学', student: 'B', score: 84 },
    { year: 2020, subject: '英语', student: 'B', score: 98 },
  ],

  // 1.4 员工薪水表
  employee_salary: [
    { id: 1, salary: 100 },
    { id: 2, salary: 200 },
    { id: 3, salary: 300 },
  ],

  // 1.5 订单表
  orders_detail: [
    { order_id: 1001, user_id: 101, purchase_time: '2023-01-01 10:00:00', product_id: 501, amount: 99.99 },
    { order_id: 1002, user_id: 101, purchase_time: '2023-01-05 15:30:00', product_id: 502, amount: 149.50 },
    { order_id: 1003, user_id: 101, purchase_time: '2023-01-15 14:30:00', product_id: 503, amount: 299.00 },
    { order_id: 1004, user_id: 102, purchase_time: '2023-01-03 09:15:00', product_id: 601, amount: 49.99 },
    { order_id: 1005, user_id: 103, purchase_time: '2023-01-05 16:40:00', product_id: 701, amount: 199.00 },
    { order_id: 1006, user_id: 103, purchase_time: '2023-01-10 11:00:00', product_id: 702, amount: 79.99 },
    { order_id: 1007, user_id: 103, purchase_time: '2023-01-20 11:20:00', product_id: 703, amount: 129.00 },
  ],

  // 1.6 中位数表
  median_numbers: [
    { num: 1 },
    { num: 2 },
    { num: 3 },
    { num: 4 },
    { num: 5 },
  ],

  // 2.1 点击日志表
  click_log: [
    { user_id: 1, click_time: 1736337600 },
    { user_id: 2, click_time: 1736337670 },
    { user_id: 1, click_time: 1736337710 },
    { user_id: 1, click_time: 1736337715 },
    { user_id: 1, click_time: 1736337750 },
    { user_id: 2, click_time: 1736337760 },
    { user_id: 3, click_time: 1736337820 },
    { user_id: 3, click_time: 1736337840 },
    { user_id: 3, click_time: 1736337850 },
    { user_id: 3, click_time: 1736337910 },
    { user_id: 4, click_time: 1736337915 },
  ],

  // 2.2 比赛记录表
  matches: [
    { uid: 101, dt: '2023-01-01', res: 'win' },
    { uid: 101, dt: '2023-01-02', res: 'win' },
    { uid: 101, dt: '2023-01-03', res: 'lose' },
    { uid: 101, dt: '2023-01-04', res: 'win' },
    { uid: 102, dt: '2023-01-01', res: 'win' },
    { uid: 102, dt: '2023-01-03', res: 'win' },
  ],

  // 2.3 用户登录表（DAU）
  dau: [
    { user_id: 101, login_date: '2023-01-01' },
    { user_id: 101, login_date: '2023-01-02' },
    { user_id: 101, login_date: '2023-01-04' },
    { user_id: 102, login_date: '2023-01-01' },
    { user_id: 102, login_date: '2023-01-03' },
    { user_id: 102, login_date: '2023-01-04' },
  ],

  // 2.5 连续数字日志
  consecutive_logs: [
    { id: 1, num: 1 },
    { id: 2, num: 1 },
    { id: 3, num: 1 },
    { id: 4, num: 2 },
    { id: 5, num: 1 },
    { id: 6, num: 2 },
    { id: 7, num: 2 },
  ],

  // 2.6 温度记录表
  weather: [
    { id: 1, recordDate: '2015-01-01', temperature: 10 },
    { id: 2, recordDate: '2015-01-02', temperature: 25 },
    { id: 3, recordDate: '2015-01-03', temperature: 20 },
    { id: 4, recordDate: '2015-01-04', temperature: 30 },
  ],

  // 3.1 用户兴趣标签
  user_interests: [
    { user_id: 101, interests: '美食,旅行,摄影' },
    { user_id: 102, interests: '旅行,读书' },
    { user_id: 103, interests: '美食,编程' },
    { user_id: 104, interests: '摄影,编程,音乐' },
  ],

  // 3.2 行转列测试数据
  row2col: [
    { col1: 101, col2: 'c', col3: 10 },
    { col1: 101, col2: 'd', col3: 20 },
    { col1: 101, col2: 'e', col3: 30 },
    { col1: 102, col2: 'c', col3: 15 },
    { col1: 102, col2: 'e', col3: 25 },
    { col1: 103, col2: 'd', col3: 40 },
  ],

  // 3.2 列转行测试数据
  col2row: [
    { a: 1, col_A: 10, col_B: 20 },
    { a: 2, col_A: 30, col_B: 40 },
    { a: 3, col_A: 50, col_B: 60 },
  ],

  // 4.1 考试成绩表
  exam_scores: [
    { sid: 101, cid: 'C1', score: 85 },
    { sid: 101, cid: 'C2', score: 92 },
    { sid: 102, cid: 'C1', score: 75 },
    { sid: 102, cid: 'C2', score: 95 },
  ],

  // 5.1 用户登录详细表
  user_login_detail: [
    { user_id: 101, log_date: '2023-01-01', login_time: '2023-01-01 09:00:00' },
    { user_id: 102, log_date: '2023-01-01', login_time: '2023-01-01 10:00:00' },
    { user_id: 101, log_date: '2023-01-02', login_time: '2023-01-02 09:30:00' },
    { user_id: 103, log_date: '2023-01-02', login_time: '2023-01-02 11:00:00' },
  ],

  // 5.2 登录登出表
  login_status: [
    { uid: 1, login_ts: '2023-01-01 10:00:00', logout_ts: '2023-01-01 11:00:00' },
    { uid: 2, login_ts: '2023-01-01 10:30:00', logout_ts: '2023-01-01 11:30:00' },
    { uid: 3, login_ts: '2023-01-01 10:45:00', logout_ts: '2023-01-01 11:15:00' },
  ],

  // 5.3 直播间日志
  live_room_logs: [
    { user_id: 101, enter_time: '2023-01-01 10:00:00', leave_time: '2023-01-01 10:05:00', room_id: 1 },
    { user_id: 102, enter_time: '2023-01-01 10:02:00', leave_time: '2023-01-01 10:07:00', room_id: 1 },
    { user_id: 103, enter_time: '2023-01-01 10:04:00', leave_time: '2023-01-01 10:06:00', room_id: 1 },
  ],

  // 6.1 玩家活动表
  player_activity: [
    { player_id: 1, device_id: 2, event_date: '2016-03-01', games_played: 5 },
    { player_id: 1, device_id: 2, event_date: '2016-03-02', games_played: 6 },
    { player_id: 2, device_id: 3, event_date: '2017-06-25', games_played: 1 },
    { player_id: 3, device_id: 1, event_date: '2016-03-02', games_played: 0 },
    { player_id: 3, device_id: 4, event_date: '2018-07-03', games_played: 5 },
  ],

  // 6.2 DAU 表
  dau_events: [
    { user_id: 101, login_date: '2023-01-01', event_type: 'login' },
    { user_id: 101, login_date: '2023-01-02', event_type: 'click' },
    { user_id: 102, login_date: '2023-01-01', event_type: 'login' },
    { user_id: 103, login_date: '2023-01-02', event_type: 'login' },
  ],

  // 7.1 好友申请表
  friend_requests: [
    { requester_id: 1, accepter_id: 2, accept_date: '2016-06-03' },
    { requester_id: 1, accepter_id: 3, accept_date: '2016-06-08' },
    { requester_id: 2, accepter_id: 3, accept_date: '2016-06-08' },
    { requester_id: 3, accepter_id: 4, accept_date: '2016-06-09' },
  ],

  // 7.2 关注表
  followers: [
    { from_user: 1, to_user: 2 },
    { from_user: 2, to_user: 1 },
    { from_user: 1, to_user: 3 },
    { from_user: 3, to_user: 1 },
    { from_user: 2, to_user: 3 },
    { from_user: 3, to_user: 2 },
    { from_user: 4, to_user: 5 },
  ],

  // 7.3 好友接受表
  accepted_friends: [
    { requester_id: 1, accepter_id: 2, accept_date: '2023-01-05' },
    { requester_id: 3, accepter_id: 1, accept_date: '2023-01-07' },
    { requester_id: 2, accepter_id: 4, accept_date: '2023-01-10' },
  ],

  // 7.4 用户好友关系
  user_friends: [
    { user_id: 101, friend_id: 102 },
    { user_id: 101, friend_id: 103 },
    { user_id: 102, friend_id: 101 },
    { user_id: 102, friend_id: 104 },
    { user_id: 103, friend_id: 101 },
    { user_id: 104, friend_id: 102 },
  ],

  // 7.4 用户步数
  user_steps: [
    { user_id: 101, steps: 8000, record_date: '2023-10-01' },
    { user_id: 102, steps: 9000, record_date: '2023-10-01' },
    { user_id: 103, steps: 7500, record_date: '2023-10-01' },
    { user_id: 104, steps: 8000, record_date: '2023-10-01' },
  ],

  // 8.1 产品价格变动
  product_prices: [
    { product_id: 1, new_price: 20, change_date: '2019-08-14' },
    { product_id: 2, new_price: 50, change_date: '2019-08-14' },
    { product_id: 1, new_price: 30, change_date: '2019-08-15' },
    { product_id: 1, new_price: 35, change_date: '2019-08-16' },
    { product_id: 2, new_price: 65, change_date: '2019-08-17' },
    { product_id: 3, new_price: 20, change_date: '2019-08-18' },
  ],

  // 8.3 股票价格
  stock_prices: [
    { code: 'AAPL', ts: '2023-01-01 09:30:00', price: 150.00 },
    { code: 'AAPL', ts: '2023-01-01 09:31:00', price: 151.00 },
    { code: 'AAPL', ts: '2023-01-01 09:32:00', price: 150.50 },
    { code: 'AAPL', ts: '2023-01-01 09:33:00', price: 149.00 },
    { code: 'AAPL', ts: '2023-01-01 09:34:00', price: 150.00 },
  ],

  // 8.4 登录日志
  login_logs: [
    { login_id: 1, user_id: 101, ip: '192.168.1.1', login_time: '2023-01-01 09:00:00' },
    { login_id: 2, user_id: 102, ip: '192.168.1.1', login_time: '2023-01-01 10:00:00' },
    { login_id: 3, user_id: 101, ip: '192.168.1.1', login_time: '2023-01-01 11:00:00' },
    { login_id: 4, user_id: 102, ip: '192.168.1.1', login_time: '2023-01-01 12:00:00' },
    { login_id: 5, user_id: 103, ip: '192.168.1.1', login_time: '2023-01-01 13:00:00' },
    { login_id: 6, user_id: 101, ip: '192.168.1.2', login_time: '2023-01-01 14:00:00' },
  ],

  // 8.5 文章浏览
  article_views: [
    { article_id: 1, author_id: 3, viewer_id: 5, view_date: '2019-08-01' },
    { article_id: 1, author_id: 3, viewer_id: 6, view_date: '2019-08-02' },
    { article_id: 2, author_id: 7, viewer_id: 7, view_date: '2019-08-01' },
    { article_id: 2, author_id: 7, viewer_id: 6, view_date: '2019-08-02' },
    { article_id: 4, author_id: 7, viewer_id: 1, view_date: '2019-07-22' },
    { article_id: 3, author_id: 4, viewer_id: 4, view_date: '2019-07-21' },
    { article_id: 3, author_id: 4, viewer_id: 4, view_date: '2019-07-21' },
  ],
};

async function initInterviewData() {
  try {
    await database.connect();
    console.log('开始导入大厂秋招面试 SQL 必刷 30 题数据...');

    // 创建表和插入数据的辅助函数
    const createTable = async (tableName, columns, data) => {
      try {
        // 删除旧表
        await database.query(`DROP TABLE IF EXISTS ${tableName}`);

        // 创建新表
        await database.query(`CREATE TABLE ${tableName} (${columns})`);
        console.log(`创建表 ${tableName} 成功`);

        // 插入数据
        for (const row of data) {
          const keys = Object.keys(row).join(', ');
          const values = Object.values(row).map(v =>
            typeof v === 'string' ? `'${v}'` : v
          ).join(', ');
          await database.query(`INSERT INTO ${tableName} (${keys}) VALUES (${values})`);
        }
        console.log(`插入 ${data.length} 条数据到 ${tableName}`);
      } catch (err) {
        console.error(`处理表 ${tableName} 失败:`, err.message);
      }
    };

    // 1. 分组排序相关表
    await createTable('student_courses',
      'course VARCHAR(50), score INTEGER, y INTEGER',
      interviewQuestionsData.student_courses);

    await createTable('user_values',
      'year INTEGER, user_id INTEGER, value DECIMAL(10,2)',
      interviewQuestionsData.user_values);

    await createTable('student_scores',
      'year INTEGER, subject VARCHAR(50), student VARCHAR(10), score INTEGER',
      interviewQuestionsData.student_scores);

    await createTable('employee_salary',
      'id INTEGER, salary INTEGER',
      interviewQuestionsData.employee_salary);

    await createTable('orders_detail',
      'order_id INTEGER, user_id INTEGER, purchase_time TIMESTAMP, product_id INTEGER, amount DECIMAL(10,2)',
      interviewQuestionsData.orders_detail);

    await createTable('median_numbers',
      'num INTEGER',
      interviewQuestionsData.median_numbers);

    // 2. 连续问题相关表
    await createTable('click_log',
      'user_id INTEGER, click_time INTEGER',
      interviewQuestionsData.click_log);

    await createTable('matches',
      'uid INTEGER, dt DATE, res VARCHAR(10)',
      interviewQuestionsData.matches);

    await createTable('dau',
      'user_id INTEGER, login_date DATE',
      interviewQuestionsData.dau);

    await createTable('consecutive_logs',
      'id INTEGER, num INTEGER',
      interviewQuestionsData.consecutive_logs);

    await createTable('weather',
      'id INTEGER, recordDate DATE, temperature INTEGER',
      interviewQuestionsData.weather);

    // 3. 行列转换相关表
    await createTable('user_interests',
      'user_id INTEGER, interests TEXT',
      interviewQuestionsData.user_interests);

    await createTable('row2col',
      'col1 INTEGER, col2 VARCHAR(10), col3 INTEGER',
      interviewQuestionsData.row2col);

    await createTable('col2row',
      'a INTEGER, col_A INTEGER, col_B INTEGER',
      interviewQuestionsData.col2row);

    // 4. 条件求和相关表
    await createTable('exam_scores',
      'sid INTEGER, cid VARCHAR(10), score INTEGER',
      interviewQuestionsData.exam_scores);

    // 5. 累计区间相关表
    await createTable('user_login_detail',
      'user_id INTEGER, log_date DATE, login_time TIMESTAMP',
      interviewQuestionsData.user_login_detail);

    await createTable('login_status',
      'uid INTEGER, login_ts TIMESTAMP, logout_ts TIMESTAMP',
      interviewQuestionsData.login_status);

    await createTable('live_room_logs',
      'user_id INTEGER, enter_time TIMESTAMP, leave_time TIMESTAMP, room_id INTEGER',
      interviewQuestionsData.live_room_logs);

    // 6. 用户留存相关表
    await createTable('player_activity',
      'player_id INTEGER, device_id INTEGER, event_date DATE, games_played INTEGER',
      interviewQuestionsData.player_activity);

    await createTable('dau_events',
      'user_id INTEGER, login_date DATE, event_type VARCHAR(20)',
      interviewQuestionsData.dau_events);

    // 7. 相互关注相关表
    await createTable('friend_requests',
      'requester_id INTEGER, accepter_id INTEGER, accept_date DATE',
      interviewQuestionsData.friend_requests);

    await createTable('followers',
      'from_user INTEGER, to_user INTEGER',
      interviewQuestionsData.followers);

    await createTable('accepted_friends',
      'requester_id INTEGER, accepter_id INTEGER, accept_date DATE',
      interviewQuestionsData.accepted_friends);

    await createTable('user_friends',
      'user_id INTEGER, friend_id INTEGER',
      interviewQuestionsData.user_friends);

    await createTable('user_steps',
      'user_id INTEGER, steps INTEGER, record_date DATE',
      interviewQuestionsData.user_steps);

    // 8. 精选杂题相关表
    await createTable('product_prices',
      'product_id INTEGER, new_price INTEGER, change_date DATE',
      interviewQuestionsData.product_prices);

    await createTable('stock_prices',
      'code VARCHAR(10), ts TIMESTAMP, price DECIMAL(10,2)',
      interviewQuestionsData.stock_prices);

    await createTable('login_logs',
      'login_id INTEGER, user_id INTEGER, ip VARCHAR(20), login_time TIMESTAMP',
      interviewQuestionsData.login_logs);

    await createTable('article_views',
      'article_id INTEGER, author_id INTEGER, viewer_id INTEGER, view_date DATE',
      interviewQuestionsData.article_views);

    console.log('\n面试题数据初始化完成！');
    console.log('共创建 27 张表，涵盖 8 大类 SQL 面试题型：');
    console.log('1. 分组排序（窗口函数）');
    console.log('2. 连续问题');
    console.log('3. 行列转换');
    console.log('4. 条件求和');
    console.log('5. 累计区间');
    console.log('6. 用户留存');
    console.log('7. 相互关注');
    console.log('8. 精选杂题');

    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

// 导出初始化函数
module.exports = { initInterviewData };

// 如果直接运行此脚本，执行初始化
if (require.main === module) {
  initInterviewData();
}
