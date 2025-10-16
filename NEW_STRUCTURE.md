# 新版页面结构说明

## 页面结构

已完成全新的左右分栏布局，结构如下：

```
┌─────────────────────────────────────────────┐
│  Sidebar  │  Header (面包屑导航)            │
│  (左侧栏)  ├─────────────────────────────────┤
│           │                                 │
│  Logo     │                                 │
│  项目列表  │      Main Content Area         │
│           │      (主内容区域)                │
│           │                                 │
│           │                                 │
└───────────┴─────────────────────────────────┘
```

## 组件层级

### 1. 主布局 (MainLayout)
- 位置：`src/components/MainLayout.tsx`
- 功能：整合 Sidebar 和 Header，提供统一布局

### 2. 侧边栏 (Sidebar)
- 位置：`src/components/Sidebar.tsx`
- 功能：
  - 显示应用 Logo
  - 项目列表展示
  - 创建新项目
  - 项目选择和切换

### 3. 顶部导航栏 (Header)
- 位置：`src/components/Header.tsx`
- 功能：
  - 面包屑导航
  - 动态操作按钮区域

### 4. 功能列表 (FeaturesTable)
- 位置：`src/components/FeaturesTable.tsx`
- 功能：
  - 展示项目下的所有功能
  - 创建新功能（包含 CRUD）
  - AI 生成 Gherkin
  - Monaco 编辑器编辑 Gherkin
  - 查看测试用例入口

### 5. 测试用例列表 (TestCasesTable)
- 位置：`src/components/TestCasesTable.tsx`
- 功能：
  - 展示功能下的所有测试用例
  - 表格形式展示（用例ID、场景、步骤、期望结果等）
  - 状态更新（下拉选择）
  - 执行人编辑（内联编辑）
  - 统计信息展示

## 使用流程

### 流程 1: 创建项目
1. 点击左侧边栏 "新建项目"
2. 输入项目名称
3. 项目自动添加到列表

### 流程 2: 创建功能和测试用例
1. 从左侧选择一个项目
2. 点击右侧 "新建功能" 按钮
3. 填写功能名称和需求描述
4. 点击 "生成 Gherkin 测试用例"（AI 自动生成）
5. 在 Monaco 编辑器中编辑 Gherkin（可选）
6. 点击 "保存并生成测试用例"
7. 系统自动解析 Gherkin 并生成测试用例

### 流程 3: 查看和管理测试用例
1. 在功能列表中点击 "查看用例"
2. 进入测试用例列表页面
3. 可以更新用例状态（通过下拉选择）
4. 可以设置执行人（内联编辑）
5. 查看统计信息

### 流程 4: 导航
- 使用顶部面包屑导航了解当前位置
- 点击 "返回功能列表" 返回上一级
- 左侧边栏随时切换项目

## 数据流转

```
项目 (Project)
  └── 功能 (Feature)
        ├── 语义输入 (semanticInput)
        ├── Gherkin 内容 (gherkinContent)
        └── 测试用例 (TestCases)
              ├── 用例 ID (caseId)
              ├── 场景 (scenario)
              ├── 步骤 (steps)
              ├── 期望结果 (expectedResult)
              └── 状态 (status)
```

## 状态管理

测试用例支持以下状态流转：
1. 未执行 (NOT_EXECUTED) - 灰色
2. 执行中 (IN_PROGRESS) - 蓝色
3. 通过 (PASSED) - 绿色
4. 失败 (FAILED) - 红色
5. 缺陷已反馈 (DEFECT_REPORTED) - 黄色
6. 完成 (COMPLETED) - 绿色

## 技术特性

- ✅ 响应式布局
- ✅ 实时数据更新
- ✅ 内联编辑
- ✅ AI 集成（Gherkin 生成）
- ✅ Monaco 编辑器（语法高亮）
- ✅ Hero UI 组件库
- ✅ 完整的 CRUD 操作

## 访问地址

本地开发: http://localhost:3000

页面已启动并运行，请刷新浏览器查看新的布局结构！
