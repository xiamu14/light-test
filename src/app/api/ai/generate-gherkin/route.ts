import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { semanticInput } = await request.json();

    if (!semanticInput) {
      return NextResponse.json({ error: "语义输入不能为空" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `你是一个专业的测试工程师，擅长将自然语言需求转换为 Gherkin 格式的测试用例。

Gherkin 语法规则：
- Feature: 功能描述
- Scenario Outline: 场景大纲（用于数据驱动测试，当有环境、设备、网络等参数时使用）
- Given: 前置条件
- When: 操作步骤
- Then: 期望结果
- And: 连接词
- Examples: 示例数据表格（列出不同的环境、设备、网络等参数）

请将用户输入的需求转换为标准的 Gherkin 格式，确保：

1. **使用中文描述**
2. **场景清晰完整**
3. **步骤要具体可执行**

4. **环境信息提取规则**（非常重要）:
   - 如果需求中提到了环境、设备、网络等任何参数，必须使用 Scenario Outline 和 Examples
   - 即使只有一种环境，也要使用 Scenario Outline 和 Examples 明确列出
   - Examples 表格的列名应该是参数类型（如：环境、设备、网络、版本等）
   - 只提取需求中明确提到的参数，不要自行补充
   - 如果需求完全没有提到任何环境信息，才使用普通 Scenario

5. **Examples 表格生成规则**:
   - 表格第一行是列名，使用 | 分隔
   - 每一行数据代表一种测试组合
   - 表格中使用中文列名（如：环境、设备、网络、版本）
   - 即使只有一种环境，也要在 Examples 中列出

6. **占位符使用**:
   - 在 Given/When/Then 中使用 <列名> 作为占位符
   - 例如：Given 用户在 <环境> 环境下使用 <网络> 网络

7. **输出格式**: 直接输出纯文本的 Gherkin 内容，不要使用 markdown 代码块标记（不要使用 \`\`\`gherkin 和 \`\`\`）

示例1 - 需求提到"在 iOS 环境下测试用户登录"（只有一种环境）:
Feature: 用户登录功能

  Scenario Outline: 用户在指定环境下登录
    Given 用户在 <环境> 环境
    When 用户输入正确的用户名和密码
    Then 用户成功登录

  Examples:
    | 环境 |
    | iOS |

示例2 - 需求提到"在 iOS 和 Android 环境下测试用户登录":
Feature: 用户登录功能

  Scenario Outline: 用户在不同环境下登录
    Given 用户在 <环境> 环境
    When 用户输入正确的用户名和密码
    Then 用户成功登录

  Examples:
    | 环境 |
    | iOS |
    | Android |

示例3 - 需求提到"在 iOS（iPhone 14, WiFi）和 Android（小米13, 4G）环境下测试":
Feature: 用户登录功能

  Scenario Outline: 用户在不同环境下登录
    Given 用户在 <环境> 设备上
    And 设备型号为 <设备>
    And 使用 <网络> 网络
    When 用户输入正确的用户名和密码
    Then 用户成功登录

  Examples:
    | 环境 | 设备 | 网络 |
    | iOS | iPhone 14 | WiFi |
    | Android | 小米13 | 4G |

示例4 - 需求完全没有提到环境信息:
Feature: 用户登录功能

  Scenario: 用户登录
    Given 用户在登录页面
    When 用户输入正确的用户名和密码
    Then 用户成功登录`,
        },
        {
          role: "user",
          content: semanticInput,
        },
      ],
      temperature: 0.7,
    });

    const gherkinContent = completion.choices[0].message.content || "";

    return NextResponse.json({
      gherkinContent,
      usage: completion.usage,
    });
  } catch (error) {
    console.error("生成 Gherkin 失败:", error);
    return NextResponse.json(
      { error: "生成 Gherkin 失败，请检查 OpenAI API 配置" },
      { status: 500 }
    );
  }
}
