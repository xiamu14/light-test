# 轻测 - LightTest

极简扁平化、纯语义驱动的测试管理平台

## 功能特性

✨ **核心功能流程**

```
语义化需求 → AI 生成 Gherkin → 可编辑 → 测试用例管理 → 状态流转 → 缺陷/反馈 → 报告/验收
```

### 主要模块

1. **语义输入模块** - 输入自然语言需求，AI 自动生成 Gherkin 测试用例
2. **Gherkin 编辑器** - Monaco Editor 支持语法高亮和编辑
3. **测试用例管理** - 自动解析 Gherkin 生成结构化测试用例表格
4. **状态流转** - 测试用例状态管理（未执行 → 执行中 → 通过/失败 → 完成）
5. **缺陷管理** - 测试失败用例可直接生成缺陷记录
6. **报告仪表盘** - 测试执行统计和可视化报告

## 技术栈

- **前端**: Next.js 15 + React 19 + Tailwind CSS + Hero UI
- **编辑器**: Monaco Editor（VSCode 核心）
- **AI**: OpenAI GPT-4o-mini
- **后端**: Next.js API Routes + Prisma ORM
- **数据库**: PostgreSQL (Docker)

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 配置环境变量

编辑 `.env` 文件：

```env
# 数据库连接（已配置 Docker PostgreSQL）
DATABASE_URL="postgresql://lighttest:lighttest123@localhost:5433/lighttest?schema=public"

# OpenAI API Key（需要配置，用于 AI 生成 Gherkin 测试用例）
OPENAI_API_KEY="your-openai-api-key-here"

# Better Auth Secret（必需，用于加密 session）
# 使用 openssl rand -base64 32 生成
BETTER_AUTH_SECRET="your-32-byte-random-string"

# Better Auth URL（生产环境必需，本地开发可选）
# 本地开发使用默认值 http://localhost:3000
BETTER_AUTH_URL="http://localhost:3000"
```

**生成 BETTER_AUTH_SECRET：**
```bash
openssl rand -base64 32
```

### 3. 启动 PostgreSQL 数据库

```bash
docker-compose up -d
```

### 4. 运行数据库迁移

```bash
bunx prisma migrate dev
```

### 5. 启动开发服务器

```bash
bun run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 6. 创建测试账号

运行用户同步脚本：

```bash
bun run db:seed
```

**测试账号：**
- 邮箱：`test@lighttest.com`
- 密码：`test123456`

> 注：如需添加更多账号，可在项目根目录创建 `secret.txt` 文件并按格式配置。

## 使用指南

### 需求示例演示

平台已内置示例需求，帮助快速了解功能：

1. **查看示例**：在需求列表页面，点击任意需求的"查看示例"按钮
2. **复制示例**：点击"复制该需求模板"即可将示例复制到当前项目
3. **快速上手**：示例包含完整的 Gherkin 测试用例和解析后的测试用例表格

**内置示例需求：**
- 用户登录功能验证
- 支付流程测试
- 商品搜索功能
- 订单管理系统

### 步骤 1: 语义输入

1. 在"1. 语义输入"页面输入项目名称
2. 输入自然语言需求描述，例如：

```
测试用户登录功能，包括以下场景：
- 正常登录（用户名密码正确）
- 错误密码登录
- 账号不存在
- 账号被锁定
- 在 iOS 和 Android 平台测试
```

3. 点击"生成 Gherkin 测试用例"

### 步骤 2: Gherkin 编辑

AI 会自动生成标准的 Gherkin 格式测试用例：

```gherkin
Feature: 用户登录功能验证

Scenario Outline: 用户在不同平台登录
  Given 用户打开登录页面
  When 输入用户名 "<username>" 和密码 "<password>"
  And 点击登录按钮
  Then 应该显示 "<result>"

Examples:
  | 平台    | username | password | result      |
  | iOS     | valid    | correct  | 登录成功    |
  | Android | valid    | wrong    | 密码错误    |
  | iOS     | invalid  | any      | 账号不存在  |
```

可以在编辑器中修改内容，然后点击"保存并生成测试用例"。

### 步骤 3: 查看测试用例

系统会自动解析 Gherkin 内容，生成结构化的测试用例表格，包括：
- 用例 ID
- 场景描述
- 前置条件
- 操作步骤
- 期望结果
- 测试环境
- 执行状态

## API 文档

### AI 相关

- `POST /api/ai/generate-gherkin` - 生成 Gherkin 测试用例

```json
{
  "semanticInput": "测试用户登录功能..."
}
```

### 项目管理

- `GET /api/projects` - 获取所有项目
- `POST /api/projects` - 创建项目

### 功能特性

- `GET /api/features?projectId=xxx` - 获取功能列表
- `POST /api/features` - 创建功能（自动生成测试用例）

### 测试用例

- `GET /api/test-cases?featureId=xxx` - 获取测试用例
- `PATCH /api/test-cases` - 更新测试用例状态

```json
{
  "id": "case_id",
  "status": "PASSED",
  "executor": "测试人员"
}
```

### 缺陷管理

- `GET /api/defects?testCaseId=xxx` - 获取缺陷列表
- `POST /api/defects` - 创建缺陷
- `PATCH /api/defects` - 更新缺陷状态

## 数据库 Schema

主要数据表：
- `Project` - 项目
- `Module` - 模块
- `Feature` - 功能/需求（包含 Gherkin 内容）
- `TestCase` - 测试用例
- `Defect` - 缺陷

详见 `prisma/schema.prisma`

## 开发命令

```bash
# 开发模式
bun run dev

# 构建生产版本
bun run build

# 启动生产服务器
bun run start

# 代码格式化
bun run format

# 代码检查
bun run lint

# 同步用户账号（本地或生产环境）
bun run db:seed

# Prisma 相关
bunx prisma studio          # 打开数据库管理界面
bunx prisma migrate dev     # 创建新的数据库迁移
bunx prisma migrate deploy  # 部署迁移到生产环境
bunx prisma generate        # 生成 Prisma Client
```

## 部署到 Vercel

详细的部署指南请查看 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

简要步骤：
1. 准备生产环境 PostgreSQL 数据库（推荐 Neon）
2. 在 Vercel 配置环境变量
3. 部署项目
4. 运行数据库迁移和用户同步

```bash
# 连接到生产数据库并同步
export DATABASE_URL="your-production-db-url"
bunx prisma migrate deploy
bun run db:seed
```

## 项目状态

✅ 已完成：
- Docker PostgreSQL 配置
- Prisma Schema 设计
- AI Gherkin 生成 API
- 完整的 CRUD API
- Gherkin 解析器
- 前端主页面和核心流程
- Monaco Editor 集成

🎯 演示版本功能：
- 语义输入 → AI 生成 Gherkin
- Gherkin 编辑器
- 自动生成测试用例
- API 完整可用

📝 可扩展功能：
- 完整的测试用例表格视图
- 状态流转可视化
- 缺陷管理界面
- 报告和仪表盘
- 富文本编辑器集成
- 用户认证和权限管理

## License

MIT
