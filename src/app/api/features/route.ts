import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseGherkinToTestCases, type ParsedTestCase } from '@/lib/gherkin-parser';
import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// 清理 Gherkin 内容中的 markdown 代码块标记
function cleanGherkinContent(content: string): string {
  // 移除开头和结尾的 markdown 代码块标记
  let cleaned = content.trim();

  // 移除开头的 ```gherkin 或 ```
  cleaned = cleaned.replace(/^```(?:gherkin)?\s*\n/, '');

  // 移除结尾的 ```
  cleaned = cleaned.replace(/\n```\s*$/, '');

  return cleaned.trim();
}

// GET - 获取所有功能特性(支持分页)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Number.parseInt(searchParams.get('pageSize') || '10', 10);

    // 构建查询条件：只查询当前用户的项目
    const where: any = {
      project: {
        userId: session.user.id,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    // 获取总数
    const total = await prisma.feature.count({ where });

    // 分页查询
    const features = await prisma.feature.findMany({
      where,
      include: {
        module: true,
        testCases: {
          select: {
            status: true,
          },
        },
        _count: {
          select: { testCases: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 计算每个 feature 的通过数
    const featuresWithStats = features.map((feature) => {
      const passedCount = feature.testCases.filter(
        (tc) => tc.status === 'PASSED'
      ).length;
      return {
        ...feature,
        passedCount,
      };
    });

    return NextResponse.json({
      data: featuresWithStats,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('获取功能特性失败:', error);
    return NextResponse.json({ error: '获取功能特性失败' }, { status: 500 });
  }
}

// POST - 创建新功能特性（可选自动生成测试用例）
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { name, semanticInput, gherkinContent, projectId, moduleId, skipTestCases } =
      await request.json();

    if (!name || !semanticInput || !gherkinContent || !projectId) {
      return NextResponse.json(
        { error: '必填字段不能为空' },
        { status: 400 }
      );
    }

    // 验证项目所有权
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: '无权限访问此项目' }, { status: 403 });
    }

    // 清理 Gherkin 内容
    const cleanedGherkinContent = cleanGherkinContent(gherkinContent);

    // 创建功能特性
    const feature = await prisma.feature.create({
      data: {
        name,
        semanticInput,
        gherkinContent: cleanedGherkinContent,
        projectId,
        moduleId: moduleId || null,
      },
    });

    // 只有在 skipTestCases 不为 true 时才创建测试用例
    if (!skipTestCases) {
      // 解析 Gherkin 并创建测试用例
      const parsedTestCases = parseGherkinToTestCases(cleanedGherkinContent);

      const testCasesData = parsedTestCases.map((tc) => ({
        caseId: nanoid(8), // 生成8位的短ID
        scenario: tc.scenario,
        precondition: tc.precondition || null,
        steps: tc.steps,
        expectedResult: tc.expectedResult,
        environment: tc.environment || null,
        groupId: tc.groupId || null,
        featureId: feature.id,
      }));

      await prisma.testCase.createMany({
        data: testCasesData,
      });
    }

    // 返回包含测试用例的完整特性（与 GET 格式一致）
    const fullFeature = await prisma.feature.findUnique({
      where: { id: feature.id },
      include: {
        testCases: {
          select: {
            status: true,
          },
        },
        module: true,
        _count: {
          select: { testCases: true },
        },
      },
    });

    if (!fullFeature) {
      return NextResponse.json({ error: '创建失败' }, { status: 500 });
    }

    // 计算通过数
    const passedCount = fullFeature.testCases.filter(
      (tc) => tc.status === 'PASSED'
    ).length;

    return NextResponse.json(
      {
        ...fullFeature,
        passedCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('创建功能特性失败:', error);
    return NextResponse.json({ error: '创建功能特性失败' }, { status: 500 });
  }
}

// PATCH - 更新功能特性的 Gherkin 并重新生成测试用例，或更新状态
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id, gherkinContent, replaceAll, status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: '功能特性ID不能为空' },
        { status: 400 }
      );
    }

    // 验证功能特性所有权
    const feature = await prisma.feature.findUnique({
      where: { id },
      include: { project: { select: { userId: true } } },
    });

    if (!feature) {
      return NextResponse.json({ error: '功能特性不存在' }, { status: 404 });
    }

    if (feature.project.userId !== session.user.id) {
      return NextResponse.json({ error: '无权限访问此功能特性' }, { status: 403 });
    }

    // 如果只是更新状态
    if (status !== undefined && !gherkinContent) {
      const updatedFeature = await prisma.feature.update({
        where: { id },
        data: { status },
        include: {
          testCases: {
            select: {
              status: true,
            },
          },
          module: true,
          _count: {
            select: { testCases: true },
          },
        },
      });

      // 计算通过数
      const passedCount = updatedFeature.testCases.filter(
        (tc) => tc.status === 'PASSED'
      ).length;

      return NextResponse.json({
        ...updatedFeature,
        passedCount,
      });
    }

    if (!gherkinContent) {
      return NextResponse.json(
        { error: 'Gherkin内容不能为空' },
        { status: 400 }
      );
    }

    // 清理 Gherkin 内容
    const cleanedGherkinContent = cleanGherkinContent(gherkinContent);

    // 获取现有特性的测试用例
    const featureWithTestCases = await prisma.feature.findUnique({
      where: { id },
      include: { testCases: true },
    });

    if (!featureWithTestCases) {
      return NextResponse.json({ error: '功能特性不存在' }, { status: 404 });
    }

    // 更新 Gherkin 内容
    await prisma.feature.update({
      where: { id },
      data: { gherkinContent: cleanedGherkinContent },
    });

    // 解析新的 Gherkin
    const parsedTestCases = parseGherkinToTestCases(cleanedGherkinContent);

    if (replaceAll) {
      // 完全覆盖：删除所有现有测试用例
      await prisma.testCase.deleteMany({
        where: { featureId: id },
      });

      // 创建新的测试用例
      const testCasesData = parsedTestCases.map((tc) => ({
        caseId: nanoid(8), // 生成8位的短ID
        scenario: tc.scenario,
        precondition: tc.precondition || null,
        steps: tc.steps,
        expectedResult: tc.expectedResult,
        environment: tc.environment || null,
        groupId: tc.groupId || null,
        featureId: id,
      }));

      await prisma.testCase.createMany({
        data: testCasesData,
      });
    } else {
      // 差异更新：添加新场景 + 更新已存在场景的内容

      // 1. 构建现有测试用例的映射（按 scenario + environment 分组）
      const existingTestCasesMap = new Map<string, typeof featureWithTestCases.testCases[0]>();
      featureWithTestCases.testCases.forEach((tc) => {
        const key = `${tc.scenario}|||${tc.environment || ''}`;
        existingTestCasesMap.set(key, tc);
      });

      // 2. 构建解析后的测试用例映射
      const parsedTestCasesMap = new Map<string, ParsedTestCase>();
      parsedTestCases.forEach((tc) => {
        const key = `${tc.scenario}|||${tc.environment || ''}`;
        parsedTestCasesMap.set(key, tc);
      });

      // 3. 处理测试用例
      const testCasesToCreate: any[] = [];
      const testCasesToUpdate: Array<{ id: string; data: any }> = [];

      // 遍历解析后的测试用例
      for (const [key, parsedTC] of parsedTestCasesMap.entries()) {
        const existingTC = existingTestCasesMap.get(key);

        if (existingTC) {
          // 场景已存在：检查内容是否有变化
          const hasContentChange =
            existingTC.precondition !== (parsedTC.precondition || null) ||
            existingTC.steps !== parsedTC.steps ||
            existingTC.expectedResult !== parsedTC.expectedResult;

          if (hasContentChange) {
            // 内容有变化，更新测试用例（保留状态、执行人、缺陷反馈）
            testCasesToUpdate.push({
              id: existingTC.id,
              data: {
                scenario: parsedTC.scenario,
                precondition: parsedTC.precondition || null,
                steps: parsedTC.steps,
                expectedResult: parsedTC.expectedResult,
                environment: parsedTC.environment || null,
                groupId: parsedTC.groupId || null,
                // 保留 status, executor, defectFeedback
              },
            });
          }
        } else {
          // 新场景：创建测试用例
          testCasesToCreate.push({
            caseId: nanoid(8),
            scenario: parsedTC.scenario,
            precondition: parsedTC.precondition || null,
            steps: parsedTC.steps,
            expectedResult: parsedTC.expectedResult,
            environment: parsedTC.environment || null,
            groupId: parsedTC.groupId || null,
            featureId: id,
          });
        }
      }

      // 4. 执行批量创建和更新
      if (testCasesToCreate.length > 0) {
        await prisma.testCase.createMany({
          data: testCasesToCreate,
        });
      }

      if (testCasesToUpdate.length > 0) {
        // 逐个更新（Prisma 不支持批量更新）
        await Promise.all(
          testCasesToUpdate.map((update) =>
            prisma.testCase.update({
              where: { id: update.id },
              data: update.data,
            })
          )
        );
      }
    }

    // 返回更新后的特性（与 GET 格式一致）
    const updatedFeature = await prisma.feature.findUnique({
      where: { id },
      include: {
        testCases: {
          select: {
            status: true,
          },
        },
        module: true,
        _count: {
          select: { testCases: true },
        },
      },
    });

    if (!updatedFeature) {
      return NextResponse.json({ error: '更新失败' }, { status: 500 });
    }

    // 计算通过数
    const passedCount = updatedFeature.testCases.filter(
      (tc) => tc.status === 'PASSED'
    ).length;

    return NextResponse.json({
      ...updatedFeature,
      passedCount,
    });
  } catch (error) {
    console.error('更新功能特性失败:', error);
    return NextResponse.json({ error: '更新功能特性失败' }, { status: 500 });
  }
}

// DELETE - 删除功能特性（级联删除测试用例）
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: '功能特性ID不能为空' },
        { status: 400 }
      );
    }

    // 验证功能特性所有权
    const feature = await prisma.feature.findUnique({
      where: { id },
      include: { project: { select: { userId: true } } },
    });

    if (!feature) {
      return NextResponse.json({ error: '功能特性不存在' }, { status: 404 });
    }

    if (feature.project.userId !== session.user.id) {
      return NextResponse.json({ error: '无权限删除此功能特性' }, { status: 403 });
    }

    // Prisma schema 中设置了 onDelete: Cascade，会自动删除关联的测试用例
    await prisma.feature.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除功能特性失败:', error);
    return NextResponse.json({ error: '删除功能特性失败' }, { status: 500 });
  }
}
