import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  Database,
  Table2,
  ChevronRight,
  Key,
  Eye,
  Loader2,
  RefreshCw,
  Info,
  FileText,
  Hash,
  Calendar,
  DollarSign,
  User,
  Mail,
  MapPin,
  Tag,
  Thermometer,
  TrendingUp,
  Users,
  Activity,
  Award
} from 'lucide-react';
import { schemaAPI } from '../utils/api';
import { usePageState } from '../hooks/usePageState';
import toast from 'react-hot-toast';

// 注册 AG Grid 模块
ModuleRegistry.registerModules([ClientSideRowModelModule]);

// 表详细说明数据
const tableDescriptions = {
  // ========== 示例数据表 ==========
  users: {
    description: '用户基础信息表',
    recordMeaning: '一条记录代表一个注册用户的基本信息',
    businessScenario: '存储系统注册用户的基本信息',
    columns: {
      id: { description: '用户唯一标识', example: '1, 2, 3...' },
      username: { description: '用户名', example: 'user1, admin...' },
      email: { description: '电子邮箱地址', example: 'user1@example.com' },
      created_at: { description: '账号创建时间', example: '2026-03-04 12:00:00' }
    }
  },
  departments: {
    description: '公司部门信息表',
    recordMeaning: '一条记录代表公司的一个组织部门',
    businessScenario: '存储公司组织架构中的部门信息',
    columns: {
      id: { description: '部门唯一标识', example: '1, 2...' },
      name: { description: '部门名称', example: '技术部, 销售部' },
      location: { description: '部门所在地', example: '北京, 上海' }
    }
  },
  employees: {
    description: '员工信息表',
    recordMeaning: '一条记录代表一位员工的个人信息和薪资情况',
    businessScenario: '存储公司员工的基本信息和薪资数据',
    columns: {
      id: { description: '员工唯一标识', example: '1, 2...' },
      name: { description: '员工姓名', example: '张三, 李四' },
      department_id: { description: '所属部门ID(外键)', example: '1(技术部), 2(销售部)' },
      salary: { description: '月薪', example: '25000, 30000' },
      hire_date: { description: '入职日期', example: '2020-01-15' }
    }
  },
  products: {
    description: '产品信息表',
    recordMeaning: '一条记录代表一个商品的详细信息',
    businessScenario: '存储销售商品的详细信息',
    columns: {
      id: { description: '产品唯一标识', example: '1, 2...' },
      name: { description: '产品名称', example: 'MacBook Pro, iPhone 15' },
      category: { description: '产品类别', example: '电子产品, 配件, 家具' },
      price: { description: '产品单价', example: '14999, 6999' },
      stock: { description: '库存数量', example: '50, 200' }
    }
  },
  orders: {
    description: '订单表',
    recordMeaning: '一条记录代表一次购买行为的订单信息',
    businessScenario: '存储用户购买商品的订单信息',
    columns: {
      id: { description: '订单唯一标识', example: '1, 2...' },
      user_id: { description: '下单用户ID(外键)', example: '1, 2...' },
      product_id: { description: '购买产品ID(外键)', example: '1(MacBook), 3(AirPods)' },
      quantity: { description: '购买数量', example: '1, 2, 3' },
      total_amount: { description: '订单总金额', example: '14999, 2598' },
      order_date: { description: '下单时间', example: '2026-03-04 12:30:00' }
    }
  },

  // ========== 面试题表 - 分组排序 ==========
  student_courses: {
    description: '学生课程成绩表',
    recordMeaning: '一条记录代表某个学生在某一年某一门课程的成绩',
    businessScenario: '存储学生在不同年份各门课程的成绩，用于排名和分组计算',
    columns: {
      course: { description: '课程名称', example: '语文, 数学' },
      score: { description: '课程成绩', example: '60, 70, 80, 90' },
      y: { description: '年份', example: '2018, 2019' }
    }
  },
  user_values: {
    description: '用户价值表',
    recordMeaning: '一条记录代表某个用户在某一年度的价值评分',
    businessScenario: '存储用户每年的价值评分，用于年度价值排名',
    columns: {
      year: { description: '统计年份', example: '2021, 2022' },
      user_id: { description: '用户ID', example: '101, 102...' },
      value: { description: '用户价值评分', example: '150.00, 80.00' }
    }
  },
  student_scores: {
    description: '学生成绩表',
    recordMeaning: '一条记录代表某个学生在某一年某一门学科的成绩',
    businessScenario: '存储学生每年的各学科成绩，支持年度成绩对比',
    columns: {
      year: { description: '年份', example: '2018, 2019, 2020' },
      subject: { description: '学科名称', example: '语文, 数学, 英语' },
      student: { description: '学生标识', example: 'A, B' },
      score: { description: '学科成绩', example: '84, 59, 30' }
    }
  },
  employee_salary: {
    description: '员工薪水表',
    recordMeaning: '一条记录代表一个员工的薪资金额',
    businessScenario: '存储员工的基本薪水信息，用于计算第N高薪水',
    columns: {
      id: { description: '员工ID', example: '1, 2, 3' },
      salary: { description: '薪资金额', example: '100, 200, 300' }
    }
  },
  orders_detail: {
    description: '订单详情表',
    recordMeaning: '一条记录代表一笔订单的详细信息',
    businessScenario: '存储用户购买订单的详细信息，包含时间戳用于首次/末次分析',
    columns: {
      order_id: { description: '订单ID', example: '1001, 1002...' },
      user_id: { description: '用户ID', example: '101, 102...' },
      purchase_time: { description: '购买时间', example: '2023-01-01 10:00:00' },
      product_id: { description: '产品ID', example: '501, 502...' },
      amount: { description: '订单金额', example: '99.99, 149.50' }
    }
  },
  median_numbers: {
    description: '中位数计算表',
    recordMeaning: '一条记录代表一个待计算的数字',
    businessScenario: '存储一组数字用于计算中位数',
    columns: {
      num: { description: '数字值', example: '1, 2, 3, 4, 5' }
    }
  },

  // ========== 面试题表 - 连续问题 ==========
  click_log: {
    description: '用户点击日志表',
    recordMeaning: '一条记录代表一次用户点击行为',
    businessScenario: '按时间顺序记录用户点击行为，用于分析连续点击模式',
    columns: {
      user_id: { description: '用户ID', example: '1, 2, 3...' },
      click_time: { description: '点击时间戳(Unix时间戳)', example: '1736337600' }
    }
  },
  matches: {
    description: '比赛记录表',
    recordMeaning: '一条记录代表某个用户在某一天的一场比赛结果',
    businessScenario: '记录用户每天的比赛结果，用于统计连胜次数',
    columns: {
      uid: { description: '用户ID', example: '101, 102...' },
      dt: { description: '比赛日期', example: '2023-01-01' },
      res: { description: '比赛结果', example: 'win, lose' }
    }
  },
  dau: {
    description: '日活跃用户表(DAU)',
    recordMeaning: '一条记录代表一个用户在某一天的登录行为',
    businessScenario: '记录用户每日登录情况，用于分析连续登录天数',
    columns: {
      user_id: { description: '用户ID', example: '101, 102...' },
      login_date: { description: '登录日期', example: '2023-01-01' }
    }
  },
  consecutive_logs: {
    description: '连续数字日志表',
    recordMeaning: '一条记录代表按顺序记录的一个数字',
    businessScenario: '按ID顺序记录数字，用于找出连续出现三次的数字',
    columns: {
      id: { description: '记录序号', example: '1, 2, 3...' },
      num: { description: '数字值', example: '1, 2...' }
    }
  },
  weather: {
    description: '天气记录表',
    recordMeaning: '一条记录代表某一天的天气温度数据',
    businessScenario: '记录每日温度，用于对比相邻日期的温度变化',
    columns: {
      id: { description: '记录ID', example: '1, 2, 3...' },
      recordDate: { description: '记录日期', example: '2015-01-01' },
      temperature: { description: '当日温度', example: '10, 25, 20' }
    }
  },

  // ========== 面试题表 - 行列转换 ==========
  user_interests: {
    description: '用户兴趣标签表',
    recordMeaning: '一条记录代表一个用户的兴趣标签集合（逗号分隔）',
    businessScenario: '存储用户的多项兴趣标签（逗号分隔），用于标签拆分统计',
    columns: {
      user_id: { description: '用户ID', example: '101, 102...' },
      interests: { description: '兴趣标签（逗号分隔）', example: '美食,旅行,摄影' }
    }
  },
  row2col: {
    description: '行转列测试表',
    recordMeaning: '一条记录代表某个实体的一个属性值（长表格式）',
    businessScenario: '长表格式数据，用于演示行转列操作',
    columns: {
      col1: { description: '主键/分组列', example: '101, 102, 103' },
      col2: { description: '属性名', example: 'c, d, e' },
      col3: { description: '属性值', example: '10, 20, 30' }
    }
  },
  col2row: {
    description: '列转行测试表',
    recordMeaning: '一条记录代表一个实体的多个属性值（宽表格式）',
    businessScenario: '宽表格式数据，用于演示列转行操作',
    columns: {
      a: { description: '主键', example: '1, 2, 3' },
      col_A: { description: 'A列值', example: '10, 30, 50' },
      col_B: { description: 'B列值', example: '20, 40, 60' }
    }
  },

  // ========== 面试题表 - 条件求和 ==========
  exam_scores: {
    description: '考试成绩表',
    recordMeaning: '一条记录代表某个学生某一门课程的考试成绩',
    businessScenario: '存储学生各科成绩，用于判断是否所有科目都高于平均分',
    columns: {
      sid: { description: '学生ID', example: '101, 102...' },
      cid: { description: '课程ID', example: 'C1, C2...' },
      score: { description: '考试成绩', example: '85, 92, 75' }
    }
  },

  // ========== 面试题表 - 累计区间 ==========
  user_login_detail: {
    description: '用户登录详细表',
    recordMeaning: '一条记录代表一次用户登录行为',
    businessScenario: '详细记录用户每次登录，用于计算每日活跃用户',
    columns: {
      user_id: { description: '用户ID', example: '101, 102...' },
      log_date: { description: '登录日期', example: '2023-01-01' },
      login_time: { description: '登录时间戳', example: '2023-01-01 09:00:00' }
    }
  },
  login_status: {
    description: '登录登出表',
    recordMeaning: '一条记录代表一个用户的登录会话（从登录到登出）',
    businessScenario: '记录用户登录和登出时间，用于计算最大同时在线人数',
    columns: {
      uid: { description: '用户ID', example: '1, 2, 3' },
      login_ts: { description: '登录时间', example: '2023-01-01 10:00:00' },
      logout_ts: { description: '登出时间', example: '2023-01-01 11:00:00' }
    }
  },
  live_room_logs: {
    description: '直播间日志表',
    recordMeaning: '一条记录代表一个用户进出某个直播间的行为',
    businessScenario: '记录用户进入和离开直播间的时间，用于统计同时在线人数',
    columns: {
      user_id: { description: '用户ID', example: '101, 102...' },
      enter_time: { description: '进入时间', example: '2023-01-01 10:00:00' },
      leave_time: { description: '离开时间', example: '2023-01-01 10:05:00' },
      room_id: { description: '直播间ID', example: '1, 2...' }
    }
  },

  // ========== 面试题表 - 用户留存 ==========
  player_activity: {
    description: '玩家活动表',
    recordMeaning: '一条记录代表一个玩家在某一天的游戏活动统计',
    businessScenario: '记录玩家每日游戏活动，用于计算次日留存率',
    columns: {
      player_id: { description: '玩家ID', example: '1, 2, 3' },
      device_id: { description: '设备ID', example: '2, 3...' },
      event_date: { description: '活动日期', example: '2016-03-01' },
      games_played: { description: '当日游戏场次', example: '5, 6' }
    }
  },
  dau_events: {
    description: 'DAU事件表',
    recordMeaning: '一条记录代表一个用户触发的一次事件',
    businessScenario: '记录用户登录相关事件',
    columns: {
      user_id: { description: '用户ID', example: '101, 102...' },
      login_date: { description: '日期', example: '2023-01-01' },
      event_type: { description: '事件类型', example: 'login, click' }
    }
  },

  // ========== 面试题表 - 相互关注 ==========
  friend_requests: {
    description: '好友申请表',
    recordMeaning: '一条记录代表一次好友申请关系',
    businessScenario: '记录用户之间的好友申请关系',
    columns: {
      requester_id: { description: '申请方ID', example: '1, 2...' },
      accepter_id: { description: '接受方ID', example: '2, 3...' },
      accept_date: { description: '接受日期', example: '2016-06-03' }
    }
  },
  followers: {
    description: '关注表',
    recordMeaning: '一条记录代表一个用户对另一个用户的关注行为',
    businessScenario: '记录用户之间的关注关系，用于找出互相关注的用户',
    columns: {
      from_user: { description: '关注者ID', example: '1, 2...' },
      to_user: { description: '被关注者ID', example: '2, 3...' }
    }
  },
  accepted_friends: {
    description: '已接受好友表',
    recordMeaning: '一条记录代表一对已建立的好友关系',
    businessScenario: '记录已建立的好友关系',
    columns: {
      requester_id: { description: '申请方ID', example: '1, 3...' },
      accepter_id: { description: '接受方ID', example: '2, 1...' },
      accept_date: { description: '接受日期', example: '2023-01-05' }
    }
  },
  user_friends: {
    description: '用户好友关系表',
    recordMeaning: '一条记录代表一个用户与他的一个好友的关系（单向存储）',
    businessScenario: '记录用户之间的好友关系（双向存储）',
    columns: {
      user_id: { description: '用户ID', example: '101, 102...' },
      friend_id: { description: '好友ID', example: '102, 101...' }
    }
  },
  user_steps: {
    description: '用户步数表',
    recordMeaning: '一条记录代表一个用户在某一天的步数统计',
    businessScenario: '记录用户每日步数',
    columns: {
      user_id: { description: '用户ID', example: '101, 102...' },
      steps: { description: '当日步数', example: '8000, 9000' },
      record_date: { description: '记录日期', example: '2023-10-01' }
    }
  },

  // ========== 面试题表 - 精选杂题 ==========
  product_prices: {
    description: '产品价格变动表',
    recordMeaning: '一条记录代表某个产品在某一天的价格变动',
    businessScenario: '记录产品价格的历史变动，用于查询指定日期的产品价格',
    columns: {
      product_id: { description: '产品ID', example: '1, 2, 3' },
      new_price: { description: '新价格', example: '20, 50, 30' },
      change_date: { description: '变动日期', example: '2019-08-14' }
    }
  },
  stock_prices: {
    description: '股票价格表',
    recordMeaning: '一条记录代表某个股票在某个时间点的价格',
    businessScenario: '按时间顺序记录股票价格，用于识别波峰波谷',
    columns: {
      code: { description: '股票代码', example: 'AAPL' },
      ts: { description: '时间戳', example: '2023-01-01 09:30:00' },
      price: { description: '股票价格', example: '150.00, 151.00' }
    }
  },
  login_logs: {
    description: '登录日志表',
    recordMeaning: '一条记录代表一次用户登录行为及其IP地址',
    businessScenario: '记录用户登录的IP地址，用于分析共用IP的用户',
    columns: {
      login_id: { description: '登录记录ID', example: '1, 2, 3...' },
      user_id: { description: '用户ID', example: '101, 102...' },
      ip: { description: '登录IP地址', example: '192.168.1.1' },
      login_time: { description: '登录时间', example: '2023-01-01 09:00:00' }
    }
  },
  article_views: {
    description: '文章浏览表',
    recordMeaning: '一条记录代表一次文章浏览行为',
    businessScenario: '记录文章浏览信息，用于找出浏览过自己文章的作者',
    columns: {
      article_id: { description: '文章ID', example: '1, 2, 3...' },
      author_id: { description: '作者ID', example: '3, 7, 4' },
      viewer_id: { description: '浏览者ID', example: '5, 6, 7' },
      view_date: { description: '浏览日期', example: '2019-08-01' }
    }
  }
};

// 获取字段图标
const getColumnIcon = (colName, colType) => {
  const name = colName.toLowerCase();
  const type = (colType || '').toLowerCase();

  if (name.includes('id')) return <Hash size={14} className="text-blue-500" />;
  if (name.includes('name') || type.includes('varchar')) return <User size={14} className="text-green-500" />;
  if (name.includes('email')) return <Mail size={14} className="text-purple-500" />;
  if (name.includes('date') || name.includes('time')) return <Calendar size={14} className="text-orange-500" />;
  if (name.includes('price') || name.includes('salary') || name.includes('amount') || name.includes('value')) return <DollarSign size={14} className="text-green-600" />;
  if (name.includes('location')) return <MapPin size={14} className="text-red-500" />;
  if (name.includes('score') || name.includes('steps')) return <TrendingUp size={14} className="text-blue-600" />;
  if (name.includes('temp')) return <Thermometer size={14} className="text-red-400" />;
  if (name.includes('user') || name.includes('player')) return <Users size={14} className="text-indigo-500" />;
  if (name.includes('res') || name.includes('result')) return <Activity size={14} className="text-yellow-500" />;
  if (name.includes('tag') || name.includes('category') || name.includes('subject')) return <Tag size={14} className="text-pink-500" />;
  if (name.includes('award') || name.includes('rank')) return <Award size={14} className="text-yellow-600" />;

  return <FileText size={14} className="text-gray-400" />;
};

// 获取表分类
const getTableCategory = (tableName) => {
  const categories = {
    '示例数据': ['users', 'departments', 'employees', 'products', 'orders'],
    '分组排序': ['student_courses', 'user_values', 'student_scores', 'employee_salary', 'orders_detail', 'median_numbers'],
    '连续问题': ['click_log', 'matches', 'dau', 'consecutive_logs', 'weather'],
    '行列转换': ['user_interests', 'row2col', 'col2row'],
    '条件求和': ['exam_scores'],
    '累计区间': ['user_login_detail', 'login_status', 'live_room_logs'],
    '用户留存': ['player_activity', 'dau_events'],
    '相互关注': ['friend_requests', 'followers', 'accepted_friends', 'user_friends', 'user_steps'],
    '精选杂题': ['product_prices', 'stock_prices', 'login_logs', 'article_views']
  };

  for (const [cat, tables] of Object.entries(categories)) {
    if (tables.includes(tableName)) return cat;
  }
  return '其他';
};

const SchemaViewer = () => {
  // 使用状态保持 hook
  const [pageState, updatePageState] = usePageState('schemaViewer', {
    selectedTableName: null,
  });

  const [schema, setSchema] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 加载 Schema
  useEffect(() => {
    loadSchema();
  }, []);

  // Schema 加载完成后，恢复之前选中的表
  useEffect(() => {
    if (schema.length > 0 && pageState.selectedTableName && !selectedTable) {
      const savedTable = schema.find(t => t.name === pageState.selectedTableName);
      if (savedTable) {
        handleTableClick(savedTable);
      }
    }
  }, [schema, pageState.selectedTableName]);

  const loadSchema = async () => {
    setLoading(true);
    try {
      const response = await schemaAPI.getSchema();
      if (response.success) {
        setSchema(response.data);
      }
    } catch (error) {
      console.error('加载 Schema 失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载表详情
  const handleTableClick = async (table) => {
    setSelectedTable(table);
    updatePageState({ selectedTableName: table.name });
    setPreviewLoading(true);
    setTableData(null);

    try {
      const response = await schemaAPI.getTableInfo(table.name);
      if (response.success) {
        setTableData(response.data);
      }
    } catch (error) {
      toast.error('加载表详情失败');
    } finally {
      setPreviewLoading(false);
    }
  };

  // 表格列定义
  const getPreviewColumnDefs = () => {
    if (!tableData || !tableData.sampleData || tableData.sampleData.length === 0) {
      return [];
    }
    return Object.keys(tableData.sampleData[0]).map((key) => ({
      field: key,
      headerName: key,
      sortable: true,
      filter: true,
      resizable: true,
    }));
  };

  return (
    <div className="h-full flex">
      {/* 左侧：表列表 */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Database className="mr-2" size={20} />
              数据库结构
            </h2>
            <button
              onClick={loadSchema}
              disabled={loading}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            共 {schema.length} 个表
          </p>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="animate-spin text-blue-600" size={24} />
            </div>
          ) : (
            <div className="space-y-1">
              {schema.map((table) => {
                const category = getTableCategory(table.name);
                const hasDescription = tableDescriptions[table.name];
                return (
                  <button
                    key={table.name}
                    onClick={() => handleTableClick(table)}
                    className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                      selectedTable?.name === table.name
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    } border`}
                  >
                    <Table2 size={18} className={`mr-3 ${selectedTable?.name === table.name ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{table.name}</div>
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <span>{table.columns.length} 个字段</span>
                        {category !== '其他' && (
                          <>
                            <span className="mx-1">·</span>
                            <span className="text-blue-500 font-medium">{category}</span>
                          </>
                        )}
                      </div>
                      {hasDescription && (
                        <div className="text-xs text-gray-400 truncate mt-0.5">
                          {tableDescriptions[table.name].description}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-gray-400 ml-2" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：表详情 */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        {!selectedTable ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Database size={64} className="mb-4 opacity-30" />
            <p className="text-lg">选择左侧表查看详情</p>
          </div>
        ) : previewLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : tableData ? (
          <div className="p-6 space-y-6">
            {/* 表信息概览卡片 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 bg-white rounded-lg shadow-sm mr-4">
                    <Table2 size={28} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {tableData.name}
                    </h2>
                    {tableDescriptions[tableData.name] && (
                      <p className="text-sm text-blue-600 font-medium mt-1">
                        {tableDescriptions[tableData.name].description}
                      </p>
                    )}
                  </div>
                </div>
                <span className="px-4 py-2 bg-white text-blue-700 rounded-full text-sm font-semibold shadow-sm border border-blue-100">
                  {tableData.totalRows} 行数据
                </span>
              </div>

              {/* 表元信息 */}
              {tableDescriptions[tableData.name] && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-100">
                  <div className="flex items-start">
                    <Info size={18} className="text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">记录含义</div>
                      <div className="text-sm text-gray-700 mt-1">
                        {tableDescriptions[tableData.name].recordMeaning}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Database size={18} className="text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">业务场景</div>
                      <div className="text-sm text-gray-700 mt-1">
                        {tableDescriptions[tableData.name].businessScenario}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 字段列表 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FileText size={20} className="mr-2 text-gray-500" />
                  字段结构
                </h3>
                <span className="text-sm text-gray-500">
                  共 {tableData.columns.length} 个字段
                </span>
              </div>

              <div className="space-y-3">
                {tableData.columns.map((col) => {
                  const colDesc = tableDescriptions[tableData.name]?.columns?.[col.name];
                  return (
                    <div
                      key={col.name}
                      className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-white rounded-md shadow-sm mr-3">
                        {col.primaryKey ? (
                          <Key size={16} className="text-yellow-500" />
                        ) : (
                          getColumnIcon(col.name, col.type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-semibold text-gray-800">
                            {col.name}
                          </span>
                          {col.primaryKey && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                              主键
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            col.nullable
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {col.type}
                            {col.nullable ? ' | 可空' : ' | 非空'}
                          </span>
                        </div>
                        {colDesc && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">含义：</span>{colDesc.description}
                            {colDesc.example && (
                              <span className="ml-2 text-gray-400">
                                示例：{colDesc.example}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 样本数据 */}
            {tableData.sampleData && tableData.sampleData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <Eye size={18} className="mr-2" />
                    样本数据（前 5 行）
                  </h3>
                </div>
                <div className="p-4">
                  <div className="ag-theme-alpine" style={{ height: 250 }}>
                    <AgGridReact
                      rowData={tableData.sampleData}
                      columnDefs={getPreviewColumnDefs()}
                      defaultColDef={{
                        sortable: true,
                        resizable: true,
                      }}
                      pagination={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 快捷查询 */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-gray-800 mb-3">快捷查询</h3>
              <div className="space-y-2">
                <code className="block p-3 bg-gray-50 rounded-lg text-sm font-mono text-gray-700">
                  SELECT * FROM {tableData.name} LIMIT 100;
                </code>
                <code className="block p-3 bg-gray-50 rounded-lg text-sm font-mono text-gray-700">
                  SELECT COUNT(*) FROM {tableData.name};
                </code>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SchemaViewer;
