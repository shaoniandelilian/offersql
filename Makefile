.PHONY: help install dev build start stop clean db-seed db-reset

# 默认显示帮助
help:
	@echo "SQL 练习平台 - 可用命令"
	@echo ""
	@echo "  make install     - 安装前后端依赖"
	@echo "  make dev         - 启动开发环境"
	@echo "  make build       - 构建生产环境"
	@echo "  make start       - Docker 启动所有服务"
	@echo "  make stop        - 停止所有服务"
	@echo "  make db-seed     - 导入样本数据"
	@echo "  make db-reset    - 重置数据库"
	@echo "  make clean       - 清理构建文件"
	@echo "  make test        - 运行测试"
	@echo ""

# 安装依赖
install:
	@echo "安装后端依赖..."
	cd backend && npm install
	@echo "安装前端依赖..."
	cd frontend && npm install

# 开发模式（需要在两个终端分别运行）
dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm start

dev:
	@echo "请分别在两个终端运行:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"

# Docker 命令
start:
	docker-compose up -d
	@echo "服务已启动:"
	@echo "  前端: http://localhost:3000"
	@echo "  后端: http://localhost:3001"

stop:
	docker-compose down

logs:
	docker-compose logs -f

# 构建
build:
	cd frontend && npm run build
	cd backend && npm run build

# 数据库操作
db-seed:
	cd backend && npm run db:seed

db-reset:
	rm -f data/sql-practice.db
	cd backend && npm run db:init

# 清理
clean:
	rm -rf frontend/build
	rm -rf backend/dist
	rm -rf node_modules
	rm -rf frontend/node_modules
	rm -rf backend/node_modules

# 测试
test:
	cd backend && npm test
	cd frontend && npm test

# 代码检查
lint:
	cd backend && npm run lint
	cd frontend && npm run lint

# 使用 PostgreSQL 启动
start-postgres:
	docker-compose --profile postgres up -d
