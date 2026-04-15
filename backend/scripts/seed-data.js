/**
 * 导入样本数据
 */
const database = require('../src/services/database');

const sampleData = {
  departments: [
    { name: '技术部', location: '北京' },
    { name: '销售部', location: '上海' },
    { name: '市场部', location: '广州' },
    { name: '人事部', location: '深圳' },
    { name: '财务部', location: '北京' }
  ],
  employees: [
    { name: '张三', department_id: 1, salary: 25000, hire_date: '2020-01-15' },
    { name: '李四', department_id: 1, salary: 28000, hire_date: '2019-06-20' },
    { name: '王五', department_id: 2, salary: 15000, hire_date: '2021-03-10' },
    { name: '赵六', department_id: 2, salary: 18000, hire_date: '2020-09-01' },
    { name: '钱七', department_id: 3, salary: 16000, hire_date: '2022-01-05' },
    { name: '孙八', department_id: 4, salary: 12000, hire_date: '2021-07-12' },
    { name: '周九', department_id: 5, salary: 14000, hire_date: '2020-11-20' },
    { name: '吴十', department_id: 1, salary: 30000, hire_date: '2018-04-15' }
  ],
  products: [
    { name: 'MacBook Pro', category: '电子产品', price: 14999, stock: 50 },
    { name: 'iPhone 15', category: '电子产品', price: 6999, stock: 200 },
    { name: 'AirPods', category: '配件', price: 1299, stock: 500 },
    { name: '机械键盘', category: '配件', price: 599, stock: 100 },
    { name: '4K 显示器', category: '电子产品', price: 2999, stock: 80 },
    { name: '办公椅', category: '家具', price: 899, stock: 30 },
    { name: '升降桌', category: '家具', price: 2499, stock: 20 }
  ],
  users: [
    { username: 'user1', email: 'user1@example.com' },
    { username: 'user2', email: 'user2@example.com' },
    { username: 'user3', email: 'user3@example.com' },
    { username: 'admin', email: 'admin@example.com' }
  ],
  orders: [
    { user_id: 1, product_id: 1, quantity: 1, total_amount: 14999 },
    { user_id: 1, product_id: 3, quantity: 2, total_amount: 2598 },
    { user_id: 2, product_id: 2, quantity: 1, total_amount: 6999 },
    { user_id: 3, product_id: 4, quantity: 3, total_amount: 1797 },
    { user_id: 4, product_id: 5, quantity: 2, total_amount: 5998 }
  ]
};

async function seed() {
  try {
    await database.connect();

    // 清空并插入部门数据
    for (const dept of sampleData.departments) {
      await database.query(
        `INSERT INTO departments (name, location) VALUES ('${dept.name}', '${dept.location}')`
      );
    }
    console.log(`插入 ${sampleData.departments.length} 条部门数据`);

    // 插入员工数据
    for (const emp of sampleData.employees) {
      await database.query(
        `INSERT INTO employees (name, department_id, salary, hire_date) VALUES ('${emp.name}', ${emp.department_id}, ${emp.salary}, '${emp.hire_date}')`
      );
    }
    console.log(`插入 ${sampleData.employees.length} 条员工数据`);

    // 插入产品数据
    for (const prod of sampleData.products) {
      await database.query(
        `INSERT INTO products (name, category, price, stock) VALUES ('${prod.name}', '${prod.category}', ${prod.price}, ${prod.stock})`
      );
    }
    console.log(`插入 ${sampleData.products.length} 条产品数据`);

    // 插入用户数据
    for (const user of sampleData.users) {
      await database.query(
        `INSERT INTO users (username, email) VALUES ('${user.username}', '${user.email}')`
      );
    }
    console.log(`插入 ${sampleData.users.length} 条用户数据`);

    // 插入订单数据
    for (const order of sampleData.orders) {
      await database.query(
        `INSERT INTO orders (user_id, product_id, quantity, total_amount) VALUES (${order.user_id}, ${order.product_id}, ${order.quantity}, ${order.total_amount})`
      );
    }
    console.log(`插入 ${sampleData.orders.length} 条订单数据`);

    // 导入面试题数据
    console.log('\n开始导入面试题数据...');
    const { initInterviewData } = require('./interview-questions-data');
    await initInterviewData();

    console.log('样本数据导入完成！');
    process.exit(0);
  } catch (error) {
    console.error('导入失败:', error);
    process.exit(1);
  }
}

seed();