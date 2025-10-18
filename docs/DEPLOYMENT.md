# 部署到 Vercel 指南

## 前置准备

### 1. 准备生产环境数据库

推荐使用以下服务之一作为生产环境的 PostgreSQL 数据库：
- [Neon](https://neon.tech/) - 免费额度充足，推荐
- [Supabase](https://supabase.com/) - 免费额度充足
- [Railway](https://railway.app/) - 有免费额度
- [Vercel Postgres](https://vercel.com/storage/postgres) - Vercel 官方提供

### 2. 获取生产数据库连接字符串

以 Neon 为例：
1. 注册并登录 [Neon Console](https://console.neon.tech/)
2. 创建新项目
3. 复制 PostgreSQL 连接字符串（类似：`postgresql://user:pass@host.neon.tech/dbname?sslmode=require`）

## 部署步骤

### 1. 推送代码到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/light-test.git
git push -u origin main
```

### 2. 在 Vercel 创建项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. 配置环境变量

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```env
# 数据库连接（使用生产环境数据库）
DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require"

# OpenAI API Key
OPENAI_API_KEY="your-openai-api-key"

# Better Auth Secret（必需！用于加密 session）
BETTER_AUTH_SECRET="生成的32字节随机字符串"

# Better Auth URL（必需！设置为你的 Vercel 域名）
BETTER_AUTH_URL="https://your-app.vercel.app"

# Node 环境
NODE_ENV="production"
```

**生成 BETTER_AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. 运行数据库迁移

部署完成后，在本地运行迁移到生产数据库：

**重要：** 确保 `secret.txt` 文件存在于项目根目录，脚本会从该文件读取账号信息。

```bash
# 设置生产数据库 URL
export DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require"

# 运行迁移
bunx prisma migrate deploy

# 同步用户账号（会从 secret.txt 读取）
bun run db:seed
```

**或者使用 Vercel CLI：**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 拉取环境变量
vercel env pull .env.production.local

# 运行迁移（在项目根目录）
bunx prisma migrate deploy

# 同步用户（确保 secret.txt 存在）
bun run db:seed
```

**注意：** 如果在 CI/CD 环境中运行，需要确保 `secret.txt` 文件可访问。可以考虑：
1. 将 `secret.txt` 内容添加到 GitHub Secrets
2. 在 CI 流程中动态创建 `secret.txt` 文件
3. 或者使用环境变量传递账号信息

### 5. 验证部署

1. 访问你的 Vercel 应用 URL
2. 使用测试账号登录：
   - 邮箱: `test@lighttest.com`
   - 密码: `test123456`

## 自动化部署（推荐）

### 方法 1: 使用 Vercel Build Command

⚠️ **不推荐**: 由于 Vercel 构建环境无法访问本地 `secret.txt` 文件，此方法仅适用于测试环境。

### 方法 2: 本地手动同步（推荐）

部署后在本地连接生产数据库运行同步：

```bash
# 连接到生产数据库
export DATABASE_URL="your-production-db-url"

# 确保 secret.txt 存在
cat secret.txt

# 运行同步
bun run db:seed
```

### 方法 3: 使用 GitHub Actions（推荐用于自动化）

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      # 从 GitHub Secrets 创建 secret.txt
      - name: Create secret.txt
        run: |
          echo "${{ secrets.SECRET_TXT_CONTENT }}" > secret.txt

      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: bunx prisma migrate deploy

      - name: Seed users
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: bun run db:seed

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

在 GitHub 仓库设置中添加 Secret：
- `SECRET_TXT_CONTENT`: `secret.txt` 文件的完整内容
- `DATABASE_URL`: 生产数据库连接字符串

## 常见问题

### 1. 数据库迁移失败

如果生产数据库是全新的，确保先运行 `prisma migrate deploy` 而不是 `prisma migrate dev`。

### 2. 用户账号未创建

手动运行 seed 脚本：

```bash
# 本地连接到生产数据库
export DATABASE_URL="your-production-db-url"
bun run db:seed
```

### 3. Better Auth 会话问题

确保在 Vercel 环境变量中设置了正确的 `BETTER_AUTH_URL`：

```env
BETTER_AUTH_URL="https://your-app.vercel.app"
```

### 4. 修改生产环境用户

如果需要修改已存在的用户（如重置密码），可以直接在生产数据库中操作：

```bash
# 使用 Prisma Studio
export DATABASE_URL="your-production-db-url"
bunx prisma studio
```

## 安全建议

1. **不要将 `secret.txt` 提交到 Git** - 已在 `.gitignore` 中配置
2. **生产环境使用强密码** - 建议部署后修改测试账号密码
3. **限制数据库访问** - 配置数据库防火墙规则
4. **使用环境变量** - 所有敏感信息都应通过环境变量配置
5. **定期备份数据库** - Neon/Supabase 等服务都提供自动备份

## 监控和维护

1. **查看 Vercel 部署日志**: [Vercel Dashboard → Deployments](https://vercel.com/dashboard)
2. **查看应用日志**: [Vercel Dashboard → Logs](https://vercel.com/dashboard)
3. **监控数据库**: 使用数据库服务商提供的监控面板
4. **设置告警**: 在 Vercel 中配置部署失败通知

## 本地脚本说明

- `bun run db:seed` - 从 `secret.txt` 读取并同步用户账号（幂等操作，可重复运行）
- `scripts/seed-users.ts` - 用户同步脚本（从 secret.txt 读取配置）
- `secret.txt` - 账号信息文件（不提交到 Git）
  - 格式：
    ```
    ## 测试账号
    邮箱: test@lighttest.com
    密码: test123456

    ## 个人使用账号
    邮箱: ayuku@lighttest.com
    密码: your-password
    ```
- `scripts/create-test-user.ts` - 仅创建测试账号（已废弃，使用 db:seed 代替）
- `scripts/create-ayuku-user.ts` - 仅创建 ayuku 账号（已废弃，使用 db:seed 代替）

## 注意事项

1. **本地开发**: `secret.txt` 必须存在于项目根目录
2. **生产环境同步**: 在本地运行 `bun run db:seed`，连接到生产数据库
3. **CI/CD**: 使用 GitHub Secrets 存储 `secret.txt` 内容
4. **安全性**: `secret.txt` 已在 `.gitignore` 中，不会提交到代码库
