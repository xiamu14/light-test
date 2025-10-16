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
- Scenario: 场景描述
- Scenario Outline: 场景大纲（用于数据驱动测试）
- Given: 前置条件
- When: 操作步骤
- Then: 期望结果
- And: 连接词
- Examples: 示例数据表格

请将用户输入的需求转换为标准的 Gherkin 格式，确保：
1. 使用中文描述
2. 场景清晰完整
3. 如果有多种环境或参数，使用 Scenario Outline 和 Examples
4. 步骤要具体可执行`,
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
