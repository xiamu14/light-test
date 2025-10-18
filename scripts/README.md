# Scripts 目录说明

这个目录包含项目的实用脚本。

## 可用脚本

### `seed-users.ts` - 用户账号同步

**用途**: 从 `secret.txt` 读取账号信息并同步到数据库

**使用方法**:
```bash
# 本地开发环境
bun run db:seed

# 生产环境（需要先设置 DATABASE_URL）
export DATABASE_URL="postgresql://user:pass@host/db"
bun run db:seed
```

**特性**:
- 从项目根目录的 `secret.txt` 读取账号信息
- 幂等操作：检查用户是否已存在，避免重复创建
- 支持多个账号
- 如果 `secret.txt` 不存在，回退到默认测试账号

**secret.txt 格式要求**:
```
## 测试账号
邮箱: test@lighttest.com
密码: test123456

## 个人使用账号
邮箱: ayuku@lighttest.com
密码: your-password
```

## 添加新脚本

当需要添加新的实用脚本时，请：
1. 使用 TypeScript (.ts) 编写
2. 添加清晰的注释说明用途
3. 更新此 README.md 文件
4. 如果需要频繁使用，在 `package.json` 的 `scripts` 中添加快捷命令
