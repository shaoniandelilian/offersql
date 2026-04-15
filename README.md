# OfferSQL

一个面向 SQL 练习、面试题训练和题目投稿审核的 Web 项目。

当前项目已经从最初的“通用 SQL 查询页”演进为一个更完整的练习平台，包含：

- 登录 / 游客登录 / 注册
- 邮箱验证码找回密码
- SQL 编辑器
- 面试题库与题库权限控制
- 数据库结构查看
- 用户投稿题目
- AI 辅助生成建表 SQL、插数 SQL、参考答案 SQL、思路解析
- 管理员审核投稿、发放积分
- 用户管理与题库权限分配

## 当前技术栈

- 前端：React 18、React Router、Monaco Editor、AG Grid、Tailwind CSS
- 后端：Node.js、Express
- 数据库：MySQL（当前项目已接入本地 MySQL）
- AI：Kimi / Moonshot API
- 邮件：SMTP（当前支持 QQ 邮箱）

## 项目目录

```text
/Users/wuteng/Desktop/offersql/SQL练习
├── README.md
├── .env.example
├── docker-compose.yml
├── Makefile
├── backend
│   ├── package.json
│   ├── scripts
│   │   ├── init-db.js
│   │   └── seed-data.js
│   └── src
│       ├── index.js
│       ├── middleware
│       ├── routes
│       ├── services
│       └── utils
├── frontend
│   ├── package.json
│   └── src
│       ├── App.jsx
│       ├── components
│       ├── data
│       ├── pages
│       ├── setupProxy.js
│       └── utils
├── data
└── database
```

## 当前页面模块

前端主路由在 [App.jsx](</Users/wuteng/Desktop/offersql/SQL练习/frontend/src/App.jsx>)。

当前页面包括：

- `/login`：登录页
- `/forgot-password`：邮箱验证码找回密码
- `/`：SQL 编辑器
- `/schema`：数据库结构
- `/questions`：面试题库
- `/contributions`：贡献题目
- `/admin/users`：用户管理，仅管理员可见
- `/admin/contributions`：投稿审核，仅管理员可见

## 当前账号体系

认证逻辑在 [auth.js](</Users/wuteng/Desktop/offersql/SQL练习/backend/src/routes/auth.js>)。

支持三类身份：

- 游客：只能浏览，不能练习 SQL、不能投稿
- 注册用户：可登录、做免费题库、投稿题目
- 管理员：拥有全部权限，可管理用户和审核投稿

管理员账号默认从 `.env` 读取：

- 用户名：`admin`
- 密码：`admin123`

后端会在首次登录时自动确保这个管理员账号存在。

注册规则：

- 用户名默认就是手机号
- 手机号必须匹配 `^1\\d{10}$`
- 邮箱必须合法
- 手机号和邮箱都不能重复

## 当前题库设计

题库映射逻辑在 [questionCatalog.js](</Users/wuteng/Desktop/offersql/SQL练习/backend/src/services/questionCatalog.js>)，题目数据在 [interviewQuestions.js](</Users/wuteng/Desktop/offersql/SQL练习/frontend/src/data/interviewQuestions.js>)。

当前共有三套题库：

1. `入门题库`
   - 完全免费
   - 15 道基础 CRUD / 聚合 / JOIN 入门题
   - 题目标识为 `B1 ~ B15`

2. `数据分析与产品题库`
   - 需要管理员开通权限
   - 包含原先的入门分析题 + 分析型面试题

3. `数据开发题库`
   - 需要管理员开通权限
   - 包含全部进阶题
   - 覆盖“数据分析与产品题库”的全部内容

管理员可以单独给用户开通：

- `analysis_product`
- `data_engineering`

对应接口在 [adminUsers.js](</Users/wuteng/Desktop/offersql/SQL练习/backend/src/routes/adminUsers.js>)。

## SQL 执行权限

### 面试题库 / 主 SQL 编辑器

当前主练习接口已经切为只读。

允许：

- `SELECT`
- `WITH`
- `EXPLAIN`

不允许：

- `INSERT`
- `UPDATE`
- `DELETE`
- `CREATE`
- `DROP`
- `TRUNCATE`
- 其他非白名单语句

对应逻辑在 [sqlValidator.js](</Users/wuteng/Desktop/offersql/SQL练习/backend/src/utils/sqlValidator.js>) 和 [query.js](</Users/wuteng/Desktop/offersql/SQL练习/backend/src/routes/query.js>)。

### 贡献题目测试库

投稿测试使用独立 MySQL 测试库，不影响业务库。

规则：

- 每条投稿会对应一个独立测试库，默认前缀为 `offersql_test_c_`
- 用户可以手动执行建表、插数和测试 SQL
- 管理员和投稿人都可以操作自己的测试库

对应逻辑在 [contributions.js](</Users/wuteng/Desktop/offersql/SQL练习/backend/src/routes/contributions.js>) 和 [database.js](</Users/wuteng/Desktop/offersql/SQL练习/backend/src/services/database.js>)。

## 投稿与审核流程

### 用户侧

在“贡献题目”页面，用户可以提交：

- 题目描述
- 原始数据
- 期望结果
- 公司标签
- 岗位方向
- 标签

提交后，后端会尝试通过 Kimi 自动生成：

- 题目标题
- 建表 SQL
- 插数 SQL
- 思路解析
- 参考答案 SQL

用户侧现在不会展示“AI 生成依据”。

### 管理员侧

在“投稿审核”页面，管理员可以：

- 查看投稿详情
- 查看 AI 建表 SQL / 插数 SQL / 思路解析 / 参考答案 SQL
- 重新 AI 生成
- 审核通过或驳回
- 审核通过时设置奖励积分

## 找回密码

当前已经实现“邮箱验证码找回密码”。

流程：

1. 用户输入注册邮箱
2. 系统发送 6 位验证码
3. 用户输入验证码和新密码
4. 后端校验验证码哈希、过期时间、尝试次数
5. 更新密码哈希

当前邮件发送支持：

- `mock`
- `smtp`

如果使用 QQ 邮箱，需要在 `.env` 中配置 SMTP 信息。

## 启动方式

### 1. 本地开发启动

后端：

```bash
cd /Users/wuteng/Desktop/offersql/SQL练习/backend
npm install
npm start
```

前端：

```bash
cd /Users/wuteng/Desktop/offersql/SQL练习/frontend
npm install
npm start
```

默认情况下：

- 后端端口：`3001`
- 前端 CRA 默认端口：`3000`

如果 `3000` 被占用，可以改端口启动，例如：

```bash
PORT=3002 BROWSER=none npm start
```

### 2. 初始化数据库

```bash
cd /Users/wuteng/Desktop/offersql/SQL练习/backend
npm run db:init
```

### 3. 导入样本数据

```bash
cd /Users/wuteng/Desktop/offersql/SQL练习/backend
npm run db:seed
```

注意：`seed-data.js` 导入的是基础样本表数据和面试题依赖数据，不会创建前端账号密码；登录用户走 `app_users` 表和注册逻辑。

### 4. Docker

项目仍然保留了 `docker-compose.yml`，但它当前更偏旧版示例配置：

- 默认还是按 `sqlite` 启动后端
- 前端默认绑定 `3000`
- 另带一个可选 `postgres` profile

如果你当前使用的是本地 MySQL，建议优先使用本地开发启动方式，而不是直接依赖这份 Docker 编排。

## 环境变量

参考文件：[.env.example](</Users/wuteng/Desktop/offersql/SQL练习/.env.example>)

核心变量：

### 服务与数据库

- `PORT`：后端端口，默认 `3001`
- `DB_TYPE`：`sqlite | mysql | postgres`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

### 投稿测试库

- `CONTRIB_TEST_DB_HOST`
- `CONTRIB_TEST_DB_PORT`
- `CONTRIB_TEST_DB_USER`
- `CONTRIB_TEST_DB_PASSWORD`
- `CONTRIB_TEST_DB_PREFIX`

### 认证与重置密码

- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `RESET_CODE_SECRET`
- `AUTH_USERNAME`
- `AUTH_PASSWORD`

### 邮件

- `EMAIL_MODE`
- `EMAIL_SMTP_HOST`
- `EMAIL_SMTP_PORT`
- `EMAIL_SMTP_SECURE`
- `EMAIL_SMTP_USER`
- `EMAIL_SMTP_PASS`
- `EMAIL_FROM_NAME`

### AI

- `KIMI_API_KEY`
- `KIMI_MODEL`
- `KIMI_BASE_URL`
- `KIMI_TIMEOUT_MS`

### 地域访问控制

- `TRUST_PROXY`
- `GEO_CN_ONLY_ENABLED`
- `GEO_CN_ONLY_ALLOW_UNKNOWN`
- `GEO_CN_ONLY_PATHS`

## API 概览

当前主要接口分组：

- `/api/auth`：登录、注册、游客登录、找回密码
- `/api/query`：SQL 执行与校验
- `/api/schema`：库表结构查看
- `/api/questions`：题库列表与题目详情
- `/api/submissions`：题目提交记录
- `/api/comments`：评论
- `/api/contributions`：投稿、测试 SQL、查看自己的投稿
- `/api/admin/users`：管理员用户管理
- `/api/admin/contributions`：管理员审核投稿

## 已知和现状说明

1. README 现在以“当前实际项目”为准，不再描述早期的查询历史页面或 SQLite/PG 的旧默认方案。
2. Docker 编排文件仍然保留旧示例风格，没有完全跟当前 MySQL 本地运行方式同步。
3. 前端构建时 `sql-formatter` 会有 source map warnings，一般不影响本地开发和功能使用。
4. SQL 主练习区目前是只读执行，不再支持直接 `INSERT / UPDATE / DELETE`。

## 常用排查

### 1. 登录不上管理员

检查 `.env` 中：

```env
AUTH_USERNAME=admin
AUTH_PASSWORD=admin123
```

并确认后端已重启。

### 2. 前端打不开

检查端口是否被占用：

```bash
lsof -iTCP -sTCP:LISTEN -n -P | rg "3000|3001|3002"
```

如果 `3000` 被占用，可改成：

```bash
cd frontend
PORT=3002 BROWSER=none npm start
```

### 3. 投稿测试库脏了

可以清空测试库中的历史测试表，当前测试库前缀默认为：

```text
offersql_test_c_
```

### 4. 邮箱验证码发不出去

优先检查：

- `EMAIL_MODE`
- `EMAIL_SMTP_USER`
- `EMAIL_SMTP_PASS`
- QQ 邮箱是否开启 SMTP 授权码

## 后续建议

如果你希望 README 更进一步，我建议下一步可以做两件事：

1. 把 `docker-compose.yml` 一并更新到和当前 MySQL 方案完全一致
2. 增补一份“管理员操作手册”，把用户管理、题库权限、投稿审核流程单独写清楚
