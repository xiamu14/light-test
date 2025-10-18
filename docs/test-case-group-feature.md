# 测试用例组功能实现说明

## 功能概述

当 Gherkin 场景包含多个 `Then` 语句（多个期望）时，系统会自动将它们拆分为多个独立的测试用例，每个期望对应一个测试用例。这些测试用例通过 `groupId` 字段关联，但 UI 上不显示组的概念，保持界面简洁。

## 实现方案

### 1. 数据库设计（最小修改）

**Prisma Schema 变更：**
```prisma
model TestCase {
  // ... 其他字段
  groupId  String?  // 测试用例组ID（同一场景多个期望时使用）
  // ... 其他字段
}
```

**优势：**
- ✅ 只添加一个可选字段 `groupId`
- ✅ 保持向后兼容（现有测试用例 groupId 为 null）
- ✅ 无需创建额外的 TestCaseGroup 表
- ✅ 数据库修改最小化

### 2. Gherkin 解析逻辑

**核心逻辑：**
```typescript
// 如果场景有多个 Then
if (thens.length > 1) {
  const groupId = generateGroupId(); // 生成唯一组ID
  thens.forEach((then, index) => {
    testCases.push({
      scenario: `${currentScenario} - 期望${index + 1}`,
      precondition: givens.join('\n'),
      steps: whens.join('\n'),
      expectedResult: then,  // 每个 Then 单独作为期望结果
      groupId,  // 相同的组ID
    });
  });
} else {
  // 单个期望，不设置 groupId
  testCases.push({
    scenario: currentScenario,
    precondition: givens.join('\n'),
    steps: whens.join('\n'),
    expectedResult: thens.join('\n'),
    // groupId: undefined
  });
}
```

### 3. 示例

**输入 Gherkin：**
```gherkin
Scenario: 用户通过微信登录
  Given 用户在首页
  When 用户点击"微信登录"按钮
  Then 用户被重定向到微信授权页面
  And 系统获取用户信息
  And 用户信息被存储
  And 首页内容被刷新
```

**生成的测试用例：**

| 用例ID | 场景 | 前置条件 | 操作步骤 | 期望结果 | 组ID |
|--------|------|----------|----------|----------|------|
| TC-xxx-001 | 用户通过微信登录 - 期望1 | 用户在首页 | 用户点击"微信登录"按钮 | 用户被重定向到微信授权页面 | group_xxx |
| TC-xxx-002 | 用户通过微信登录 - 期望2 | 用户在首页 | 用户点击"微信登录"按钮 | 系统获取用户信息 | group_xxx |
| TC-xxx-003 | 用户通过微信登录 - 期望3 | 用户在首页 | 用户点击"微信登录"按钮 | 用户信息被存储 | group_xxx |
| TC-xxx-004 | 用户通过微信登录 - 期望4 | 用户在首页 | 用户点击"微信登录"按钮 | 首页内容被刷新 | group_xxx |

### 4. UI 体验设计

**设计原则：**
- ✅ UI 不显示组的概念（无需额外 UI 组件）
- ✅ 每个测试用例独立显示
- ✅ 每个测试用例可以独立修改状态
- ✅ 用户体验与普通测试用例一致
- ✅ 通过命名（"期望1"、"期望2"）暗示它们来自同一场景

**优势：**
- 界面保持简洁
- 减少用户认知负担
- 测试执行更灵活（可以单独测试每个期望）
- 统计更准确（每个期望独立统计通过率）

### 5. 修改文件清单

1. **prisma/schema.prisma**
   - 添加 `groupId` 字段到 TestCase 模型

2. **src/lib/gherkin-parser.ts**
   - 修改解析逻辑，支持多个 Then 拆分
   - 添加 `groupId` 生成逻辑
   - 添加场景名称后缀（"期望1"、"期望2"）

3. **src/app/api/features/route.ts**
   - 在创建测试用例时传入 `groupId`
   - 三处修改：POST、PATCH（完全覆盖）、PATCH（差异更新）

### 6. 向后兼容性

- ✅ 现有测试用例：`groupId` 为 `null`，功能不受影响
- ✅ 现有 UI：无需修改，自动兼容
- ✅ 数据库迁移：自动添加 `groupId` 列，默认为 `null`

### 7. 未来扩展可能性

如果将来需要在 UI 中显示组信息，可以：
- 根据 `groupId` 查询同组测试用例
- 添加展开/折叠功能显示同组用例
- 添加批量操作同组用例的功能
- 但目前不需要，保持简洁

## 总结

这个实现方案通过最小化修改（只添加一个可选字段），实现了强大的功能：
- 自动拆分多期望场景
- 保持测试用例独立性
- UI 保持简洁不显示组
- 完全向后兼容
- 为未来扩展留下空间

**核心优势：** 最小修改 + 最佳体验 + 最大灵活性
