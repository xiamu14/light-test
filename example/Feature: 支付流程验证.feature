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