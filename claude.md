# 轻测 - LightTest

“轻测”是极简扁平化、纯语义驱动的测试管理平台。核心功能流程如下:

> 语义化需求 → AI 生成 Gherkin → 可编辑 → 测试用例管理 → 状态流转 → 缺陷/反馈 → 报告/验收

需求/功能点
↓
1️⃣ AI 语义生成 Gherkin
↓
2️⃣ 前端可编辑 Gherkin (.feature)
↓
3️⃣ Gherkin 解析生成测试用例表格
↓
4️⃣ 测试执行状态管理（手动执行/标记）
↓
5️⃣ 缺陷收集 & 反馈（可编辑、关联用例）
↓
6️⃣ 报告/仪表盘 → 验收完成

## 核心模块设计

1️⃣ 语义输入模块
• 输入自然语言需求或测试意图
• AI 生成初步 Gherkin
• 示例：

```gherkin
Feature: 支付流程验证
Scenario Outline: 用户在不同环境充值
  Given 用户已登录
  And 账户余额大于 0
  When 点击充值按钮
  Then 系统应弹出支付窗口
  And 支付成功后账户余额应刷新

Examples:
  | 环境 |
  | iOS  |
  | Android |
```

2️⃣ Gherkin 编辑器
• 使用 Monaco Editor（VSCode 核心）
• 高亮、语法提示、模板插入
• AI 可优化语句或补全

3️⃣ 测试用例表格生成 (Hero ui table 组件展示)
• Gherkin → 内部数据表：
| 用例 ID | 场景 | 前置条件 | 操作步骤 | 期望结果 | 环境 | 状态 | 执行人 |
|––––|——|———–|———–|———–|——|——|——|
• 表格可直接编辑、状态可标记

4️⃣ 状态流转（手动标记）
• 状态：未执行 → 执行中 → 通过 / 失败 → 缺陷已反馈 → 完成
• 流转可在表格或面板操作，无审批流程

5️⃣ 缺陷管理（简化版，[富文本编辑器 mina-rich-editor](https://mina-rich-editor.vercel.app/docs)）
• 测试失败用例可直接生成缺陷
• AI 自动生成缺陷描述（可编辑）
• 可直接关联到用例 ID

6️⃣ 报告 / 仪表盘
• 用例数量、执行状态、失败率
• 生成自然语言摘要报告

⚙️ 三、技术选型（轻量化）

模块
技术栈
功能说明
前端
React(nextjs) + Tailwind + Hero UI + Monaco Editor
语义输入、Gherkin 编辑、用例表格、状态标记
AI 层
Node.js + OpenAI / 本地 LLM
语义 → Gherkin、缺陷描述生成
后端
PostgreSQL + Prisma ORM
用例存储、状态流转、缺陷管理
数据库
PostgreSQL (本地 docker 启动)
存储项目、模块、用例、状态、缺陷
