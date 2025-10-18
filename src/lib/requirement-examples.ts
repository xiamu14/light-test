export interface RequirementExample {
  id: string;
  title: string;
  description: string;
  gherkin: string;
}

export const requirementExamples: RequirementExample[] = [
  {
    id: "login",
    title: "用户登录功能",
    description: `作为用户，我希望能够使用用户名和密码登录系统，以便访问个人账户。

功能要求：
1. 用户可以输入用户名和密码
2. 支持记住密码功能
3. 登录失败时显示错误提示
4. 登录成功后跳转到首页`,
    gherkin: `Feature: 用户登录
  作为一个注册用户
  我希望能够登录系统
  以便访问我的个人账户

Background:
  Given 用户在登录页面
  And 登录表单已加载完成

Scenario Outline: 用户使用正确的凭证登录
  When 用户输入用户名 "<username>"
  And 用户输入密码 "<password>"
  And 用户点击登录按钮
  Then 系统应该验证用户凭证
  And 用户应该被重定向到首页
  And 用户应该看到欢迎消息

Examples:
  | username | password |
  | admin    | admin123 |
  | user1    | pass123  |

Scenario: 用户使用错误的密码登录
  When 用户输入用户名 "admin"
  And 用户输入错误的密码 "wrongpass"
  And 用户点击登录按钮
  Then 系统应该显示错误消息 "用户名或密码错误"
  And 用户应该停留在登录页面
  But 用户不应该被锁定账户`,
  },
  {
    id: "payment",
    title: "在线支付流程",
    description: `作为用户，我希望能够在不同平台上完成充值支付，确保支付流程安全可靠。

功能要求：
1. 支持多种支付方式（微信、支付宝）
2. 支持iOS和Android平台
3. 充值成功后实时更新余额
4. 支付失败时给出明确提示`,
    gherkin: `Feature: 在线支付充值
  作为一个已登录用户
  我希望能够在不同平台上充值
  以便使用平台的付费功能

Scenario Outline: 用户在不同平台完成充值
  Given 用户已登录系统
  And 用户在 "<platform>" 平台
  And 当前账户余额为 100 元
  When 用户点击充值按钮
  And 选择充值金额 "<amount>" 元
  And 选择支付方式 "<paymentMethod>"
  And 完成支付
  Then 系统应该显示支付成功提示
  And 账户余额应该增加 "<amount>" 元
  And 用户应该收到充值成功通知

Examples:
  | platform | amount | paymentMethod |
  | iOS      | 50     | 微信支付      |
  | iOS      | 100    | 支付宝        |
  | Android  | 50     | 微信支付      |
  | Android  | 100    | 支付宝        |`,
  },
  {
    id: "shopping-cart",
    title: "购物车管理",
    description: `作为用户，我希望能够管理购物车中的商品，包括添加、删除、修改数量等操作。

功能要求：
1. 添加商品到购物车
2. 修改商品数量
3. 删除购物车商品
4. 实时计算总价
5. 支持批量操作`,
    gherkin: `Feature: 购物车管理
  作为一个在线购物用户
  我希望能够管理购物车中的商品
  以便方便地进行购买决策

Scenario: 添加商品到购物车
  Given 用户已登录
  And 用户浏览商品列表
  When 用户选择商品 "iPhone 15"
  And 点击 "加入购物车" 按钮
  Then 购物车中应该显示该商品
  And 购物车图标应该显示数量 "1"

Scenario Outline: 修改购物车商品数量
  Given 用户已登录
  And 购物车中有商品 "iPhone 15" 数量为 1
  When 用户将数量修改为 "<quantity>"
  Then 购物车中该商品数量应该为 "<quantity>"
  And 总价应该更新为商品单价乘以 "<quantity>"

Examples:
  | quantity |
  | 2        |
  | 5        |
  | 10       |

Scenario: 从购物车删除商品
  Given 用户已登录
  And 购物车中有 3 个商品
  When 用户删除其中一个商品
  Then 购物车中应该剩余 2 个商品
  And 总价应该重新计算`,
  },
  {
    id: "user-registration",
    title: "用户注册",
    description: `作为新用户，我希望能够注册账号，以便使用系统功能。

功能要求：
1. 用户名唯一性验证
2. 密码强度验证
3. 邮箱格式验证
4. 手机号验证
5. 注册成功后自动登录`,
    gherkin: `Feature: 用户注册
  作为一个新用户
  我希望能够注册账号
  以便使用系统的各项功能

Scenario: 成功注册新账号
  Given 用户在注册页面
  When 用户输入用户名 "newuser123"
  And 用户输入邮箱 "newuser@example.com"
  And 用户输入手机号 "13800138000"
  And 用户输入密码 "SecurePass123!"
  And 用户确认密码 "SecurePass123!"
  And 用户点击注册按钮
  Then 系统应该创建新用户账号
  And 用户应该收到欢迎邮件
  And 用户应该自动登录
  And 用户应该被重定向到首页

Scenario Outline: 密码强度验证
  Given 用户在注册页面
  When 用户输入密码 "<password>"
  Then 系统应该显示密码强度为 "<strength>"

Examples:
  | password      | strength |
  | 123456        | 弱       |
  | Abc123        | 中       |
  | Abc123!@#     | 强       |

Scenario: 用户名已存在
  Given 用户在注册页面
  And 系统中已存在用户名 "existinguser"
  When 用户输入用户名 "existinguser"
  And 用户填写其他必填信息
  And 用户点击注册按钮
  Then 系统应该显示错误消息 "用户名已被使用"
  And 注册应该失败`,
  },
  {
    id: "file-upload",
    title: "文件上传功能",
    description: `作为用户，我希望能够上传文件到系统，支持多种文件格式和大小限制。

功能要求：
1. 支持多种文件格式
2. 文件大小限制
3. 上传进度显示
4. 支持批量上传
5. 上传失败时的错误提示`,
    gherkin: `Feature: 文件上传
  作为一个系统用户
  我希望能够上传文件
  以便保存和分享我的文档

Scenario Outline: 上传不同格式的文件
  Given 用户已登录
  And 用户在文件上传页面
  When 用户选择 "<fileType>" 格式的文件
  And 文件大小为 "<fileSize>" MB
  And 用户点击上传按钮
  Then 系统应该接受该文件
  And 显示上传进度条
  And 上传完成后显示成功消息
  And 文件应该出现在文件列表中

Examples:
  | fileType | fileSize |
  | PDF      | 2        |
  | DOCX     | 5        |
  | XLSX     | 3        |
  | PNG      | 1        |

Scenario: 上传超大文件被拒绝
  Given 用户已登录
  And 用户在文件上传页面
  And 系统文件大小限制为 10 MB
  When 用户选择大小为 15 MB 的文件
  And 用户点击上传按钮
  Then 系统应该显示错误消息 "文件大小超过限制"
  And 文件不应该被上传

Scenario: 批量上传多个文件
  Given 用户已登录
  And 用户在文件上传页面
  When 用户选择 5 个文件
  And 总大小不超过 20 MB
  And 用户点击批量上传按钮
  Then 系统应该依次上传所有文件
  And 显示整体上传进度
  And 所有文件上传完成后显示成功消息`,
  },
  {
    id: "search",
    title: "搜索功能",
    description: `作为用户，我希望能够搜索系统中的内容，快速找到所需信息。

功能要求：
1. 支持关键词搜索
2. 支持筛选条件
3. 搜索结果高亮显示
4. 支持搜索历史
5. 支持模糊搜索`,
    gherkin: `Feature: 搜索功能
  作为一个系统用户
  我希望能够搜索内容
  以便快速找到我需要的信息

Scenario Outline: 使用关键词搜索
  Given 用户在搜索页面
  When 用户输入关键词 "<keyword>"
  And 用户点击搜索按钮
  Then 系统应该返回包含 "<keyword>" 的结果
  And 搜索结果中关键词应该高亮显示
  And 搜索历史应该记录该关键词

Examples:
  | keyword |
  | 测试    |
  | 需求    |
  | 文档    |

Scenario: 使用筛选条件搜索
  Given 用户在搜索页面
  And 用户输入关键词 "测试"
  When 用户选择类型筛选 "测试用例"
  And 用户选择状态筛选 "已完成"
  And 用户点击搜索按钮
  Then 系统应该返回符合所有条件的结果
  And 结果应该只包含 "测试用例" 类型
  And 结果状态应该都是 "已完成"

Scenario: 搜索无结果
  Given 用户在搜索页面
  When 用户输入关键词 "不存在的内容xyz123"
  And 用户点击搜索按钮
  Then 系统应该显示 "未找到相关结果"
  And 系统应该建议用户修改关键词或筛选条件`,
  },
  {
    id: "input-validation",
    title: "表单输入边界测试",
    description: `作为QA，我需要测试表单输入的各种边界情况，确保系统能够正确处理异常输入。

边界测试场景：
1. 空输入和空白字符
2. 超长文本输入
3. 特殊字符和SQL注入
4. 数字边界值（最大值、最小值、零、负数）
5. 日期边界（过去、未来、无效日期）`,
    gherkin: `Feature: 表单输入边界测试
  作为QA工程师
  我需要验证系统对边界输入的处理
  以确保系统的健壮性和安全性

Scenario Outline: 用户名输入边界测试
  Given 用户在注册页面
  When 用户输入用户名 "<username>"
  And 用户点击提交按钮
  Then 系统应该显示 "<result>"

Examples:
  | username                          | result           |
  |                                   | 用户名不能为空   |
  | a                                 | 用户名至少2个字符 |
  | ab                                | 注册成功         |
  | abcdefghij1234567890abcdefghij12  | 注册成功         |
  | abcdefghij1234567890abcdefghij123 | 用户名最多32个字符|
  |    spaces                          | 用户名不能为空   |
  | user<script>alert(1)</script>     | 包含非法字符     |
  | user'; DROP TABLE users; --       | 包含非法字符     |

Scenario Outline: 数字输入边界测试
  Given 用户在充值页面
  When 用户输入充值金额 "<amount>"
  And 用户点击充值按钮
  Then 系统应该显示 "<result>"

Examples:
  | amount          | result             |
  | 0               | 金额必须大于0      |
  | -10             | 金额必须大于0      |
  | 0.01            | 充值成功           |
  | 1               | 充值成功           |
  | 9999.99         | 充值成功           |
  | 10000           | 单次充值不能超过10000元 |
  | abc             | 请输入有效数字     |
  |                 | 金额不能为空       |

Scenario Outline: 日期输入边界测试
  Given 用户在预约页面
  When 用户选择日期 "<date>"
  And 用户点击预约按钮
  Then 系统应该显示 "<result>"

Examples:
  | date       | result               |
  | 2020-01-01 | 不能选择过去的日期   |
  | 2099-12-31 | 预约日期不能超过1年  |
  | 2025-02-30 | 无效的日期           |
  | 今天       | 预约成功             |
  | 明天       | 预约成功             |`,
  },
  {
    id: "concurrency-test",
    title: "并发和竞态条件测试",
    description: `作为QA，我需要测试系统在高并发场景下的表现，确保数据一致性和系统稳定性。

测试场景：
1. 多用户同时操作相同资源
2. 库存超卖问题
3. 重复提交
4. 并发支付
5. 乐观锁/悲观锁验证`,
    gherkin: `Feature: 并发和竞态条件测试
  作为QA工程师
  我需要测试并发场景
  以确保系统数据一致性

Scenario Outline: 秒杀商品库存测试
  Given 商品 "限量手机" 库存为 10 件
  And 有 "<users>" 个用户同时购买
  And 每个用户购买 1 件
  When 所有用户同时点击购买按钮
  Then 系统应该只允许 10 个用户购买成功
  And 剩余 "<failed>" 个用户看到 "库存不足" 提示
  And 最终库存应该为 0

Examples:
  | users | failed |
  | 10    | 0      |
  | 15    | 5      |
  | 100   | 90     |

Scenario: 防止重复支付
  Given 用户订单金额为 100 元
  And 用户账户余额为 100 元
  When 用户快速连续点击支付按钮 5 次
  Then 系统应该只扣款一次
  And 账户余额应该为 0 元
  And 订单状态应该为 "已支付"
  And 不应该产生重复订单

Scenario: 多设备同时登录测试
  Given 用户 "testuser" 在设备A已登录
  When 用户在设备B使用相同账号登录
  Then 系统应该提示 "账号在其他设备登录"
  And 设备A应该被强制下线
  And 设备B应该登录成功

Scenario: 并发修改个人信息
  Given 用户 "testuser" 当前昵称为 "OldName"
  When 用户在设备A修改昵称为 "NameA"
  And 同时在设备B修改昵称为 "NameB"
  And 两个请求几乎同时到达服务器
  Then 系统应该只接受一个修改请求
  And 最终昵称应该是 "NameA" 或 "NameB" 之一
  And 不应该出现数据损坏`,
  },
  {
    id: "network-error",
    title: "网络异常和超时测试",
    description: `作为QA，我需要测试系统在各种网络异常情况下的表现。

测试场景：
1. 网络请求超时
2. 网络连接断开
3. 弱网环境
4. 请求重试机制
5. 离线模式`,
    gherkin: `Feature: 网络异常和超时测试
  作为QA工程师
  我需要验证系统在网络异常时的处理
  以确保良好的用户体验

Scenario Outline: API请求超时测试
  Given 用户在商品列表页面
  When 用户点击刷新按钮
  And API响应时间为 "<responseTime>" 秒
  Then 系统应该显示 "<result>"

Examples:
  | responseTime | result                 |
  | 1            | 正常显示数据           |
  | 5            | 正常显示数据           |
  | 10           | 显示 "加载中" 提示     |
  | 30           | 显示 "请求超时" 错误   |
  | 60           | 显示 "请求超时" 错误   |

Scenario: 上传文件时网络中断
  Given 用户正在上传 100MB 的文件
  And 已上传 50MB
  When 网络连接突然中断
  Then 系统应该暂停上传
  And 显示 "网络连接已断开" 提示
  When 网络恢复连接
  Then 系统应该提示 "是否继续上传"
  And 用户确认后应该从 50MB 处继续上传

Scenario Outline: 弱网环境测试
  Given 网络带宽为 "<bandwidth>"
  When 用户访问首页
  Then 页面应该在 "<loadTime>" 秒内加载完成
  And 用户应该能看到基本内容

Examples:
  | bandwidth | loadTime |
  | 4G        | 2        |
  | 3G        | 5        |
  | 2G        | 10       |

Scenario: 支付时网络异常
  Given 用户订单金额为 100 元
  When 用户点击支付按钮
  And 支付请求发送后网络中断
  And 无法收到服务器响应
  Then 系统应该显示 "支付结果未知，请勿重复支付"
  And 系统应该轮询查询支付状态
  And 最终显示正确的支付结果`,
  },
  {
    id: "permission-test",
    title: "权限和安全边界测试",
    description: `作为QA，我需要测试系统的权限控制和安全边界。

测试场景：
1. 未登录访问受保护资源
2. 越权访问他人数据
3. 角色权限验证
4. Token过期处理
5. 敏感信息保护`,
    gherkin: `Feature: 权限和安全边界测试
  作为QA工程师
  我需要验证系统的权限控制
  以确保数据安全

Scenario Outline: 未登录用户访问测试
  Given 用户未登录
  When 用户访问 "<page>" 页面
  Then 系统应该 "<action>"

Examples:
  | page       | action                   |
  | 首页       | 允许访问                 |
  | 登录页     | 允许访问                 |
  | 个人中心   | 重定向到登录页           |
  | 订单列表   | 重定向到登录页           |
  | 管理后台   | 重定向到登录页           |

Scenario: 越权访问他人订单
  Given 用户A已登录，订单ID为 "12345"
  And 用户B的订单ID为 "67890"
  When 用户A尝试访问订单 "67890"
  Then 系统应该返回 403 错误
  And 显示 "无权访问该订单"
  And 不应该泄露订单详情

Scenario Outline: 角色权限验证
  Given 用户角色为 "<role>"
  When 用户尝试执行 "<action>"
  Then 系统应该 "<result>"

Examples:
  | role       | action         | result     |
  | 普通用户   | 查看商品       | 允许       |
  | 普通用户   | 删除商品       | 拒绝       |
  | 普通用户   | 访问管理后台   | 拒绝       |
  | 管理员     | 查看商品       | 允许       |
  | 管理员     | 删除商品       | 允许       |
  | 管理员     | 访问管理后台   | 允许       |
  | 游客       | 查看商品       | 允许       |
  | 游客       | 加入购物车     | 拒绝       |

Scenario: Token过期处理
  Given 用户已登录，Token有效期为 30 分钟
  And 用户已经 35 分钟没有操作
  When 用户尝试查看订单列表
  Then 系统应该返回 401 错误
  And 清除本地Token
  And 重定向到登录页
  And 提示 "登录已过期，请重新登录"

Scenario: 敏感信息脱敏
  Given 用户查看订单详情
  When 订单中包含手机号 "13800138000"
  And 包含银行卡号 "6222021234567890123"
  Then 手机号应该显示为 "138****8000"
  And 银行卡号应该显示为 "6222 **** **** 0123"
  And 原始信息不应该在前端代码中暴露`,
  },
  {
    id: "data-consistency",
    title: "数据一致性测试",
    description: `作为QA，我需要测试系统在各种场景下的数据一致性。

测试场景：
1. 事务回滚验证
2. 分布式事务一致性
3. 缓存与数据库一致性
4. 主从数据库同步
5. 数据迁移验证`,
    gherkin: `Feature: 数据一致性测试
  作为QA工程师
  我需要验证系统数据一致性
  以确保数据完整性

Scenario: 支付失败事务回滚
  Given 用户账户余额为 100 元
  And 商品价格为 80 元
  When 用户点击购买按钮
  And 余额扣减成功
  And 但订单创建失败
  Then 系统应该回滚余额扣减
  And 账户余额应该恢复为 100 元
  And 不应该产生订单记录

Scenario: 库存扣减与订单创建一致性
  Given 商品 "手机" 库存为 5 件
  When 用户购买 2 件
  And 订单创建成功
  Then 库存应该扣减为 3 件
  And 订单状态应该为 "待支付"
  When 用户取消订单
  Then 库存应该恢复为 5 件
  And 订单状态应该为 "已取消"

Scenario Outline: 缓存与数据库一致性
  Given 商品 "手机" 信息已缓存
  And 缓存中价格为 5000 元
  When 管理员修改价格为 "<newPrice>" 元
  Then 数据库中价格应该为 "<newPrice>" 元
  And 缓存应该被清除或更新
  And 用户查看商品时应该看到 "<newPrice>" 元

Examples:
  | newPrice |
  | 4800     |
  | 5200     |
  | 4999     |

Scenario: 积分与余额同步更新
  Given 用户账户余额为 1000 元
  And 用户积分为 500 分
  When 用户购买商品消费 200 元
  Then 账户余额应该减少到 800 元
  And 积分应该增加到 700 分
  And 交易记录应该包含余额和积分变动
  And 所有变动应该在同一事务中完成`,
  },
  {
    id: "api-testing",
    title: "API接口测试（Background示例）",
    description: `作为QA，我需要测试系统的API接口，确保各个接口返回正确的数据和状态码。

这个示例演示了如何使用Background来减少重复的前置条件。`,
    gherkin: `Feature: API接口测试
  作为API测试工程师
  我需要验证各个API接口
  以确保接口功能正常

Background:
  Given API服务已启动
  And 测试环境数据库已初始化
  And 请求头包含有效的认证Token

Scenario Outline: 用户信息查询API
  When 发送GET请求到 "/api/users/<userId>"
  Then 响应状态码应该是 "<statusCode>"
  And 响应时间应该小于 500 毫秒
  But 不应该返回敏感信息如密码

Examples:
  | userId | statusCode |
  | 1      | 200        |
  | 999    | 404        |
  | abc    | 400        |

Scenario: 创建用户API
  When 发送POST请求到 "/api/users"
  And 请求体包含有效的用户数据
  Then 响应状态码应该是 201
  And 响应应该包含新创建的用户ID
  And 数据库应该包含新用户记录
  But 密码应该已加密存储

Scenario: 批量删除用户API
  Given 系统中存在测试用户 "test1,test2,test3"
  When 发送DELETE请求到 "/api/users/batch"
  And 请求体包含用户ID列表
  Then 响应状态码应该是 200
  And 所有指定用户应该被删除
  But 不应该影响其他用户数据`,
  },
];
