import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseGherkinToTestCases } from '@/lib/gherkin-parser';

// GET - 获取所有功能特性
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const where = projectId ? { projectId } : {};

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

    return NextResponse.json(featuresWithStats);
  } catch (error) {
    console.error('获取功能特性失败:', error);
    return NextResponse.json({ error: '获取功能特性失败' }, { status: 500 });
  }
}

// POST - 创建新功能特性（并自动生成测试用例）
export async function POST(request: NextRequest) {
  try {
    const { name, semanticInput, gherkinContent, projectId, moduleId } =
      await request.json();

    if (!name || !semanticInput || !gherkinContent || !projectId) {
      return NextResponse.json(
        { error: '必填字段不能为空' },
        { status: 400 }
      );
    }

    // 创建功能特性
    const feature = await prisma.feature.create({
      data: {
        name,
        semanticInput,
        gherkinContent,
        projectId,
        moduleId: moduleId || null,
      },
    });

    // 解析 Gherkin 并创建测试用例
    const parsedTestCases = parseGherkinToTestCases(gherkinContent);

    const testCasesData = parsedTestCases.map((tc, index) => ({
      caseId: `TC-${feature.id.slice(-8)}-${String(index + 1).padStart(3, '0')}`,
      scenario: tc.scenario,
      precondition: tc.precondition || null,
      steps: tc.steps,
      expectedResult: tc.expectedResult,
      environment: tc.environment || null,
      featureId: feature.id,
    }));

    await prisma.testCase.createMany({
      data: testCasesData,
    });

    // 返回包含测试用例的完整特性
    const fullFeature = await prisma.feature.findUnique({
      where: { id: feature.id },
      include: {
        testCases: true,
        module: true,
      },
    });

    return NextResponse.json(fullFeature, { status: 201 });
  } catch (error) {
    console.error('创建功能特性失败:', error);
    return NextResponse.json({ error: '创建功能特性失败' }, { status: 500 });
  }
}

// PATCH - 更新功能特性的 Gherkin 并重新生成测试用例，或更新状态
export async function PATCH(request: NextRequest) {
  try {
    const { id, gherkinContent, replaceAll, status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: '功能特性ID不能为空' },
        { status: 400 }
      );
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

    // 获取现有特性
    const feature = await prisma.feature.findUnique({
      where: { id },
      include: { testCases: true },
    });

    if (!feature) {
      return NextResponse.json({ error: '功能特性不存在' }, { status: 404 });
    }

    // 更新 Gherkin 内容
    await prisma.feature.update({
      where: { id },
      data: { gherkinContent },
    });

    // 解析新的 Gherkin
    const parsedTestCases = parseGherkinToTestCases(gherkinContent);

    if (replaceAll) {
      // 完全覆盖：删除所有现有测试用例
      await prisma.testCase.deleteMany({
        where: { featureId: id },
      });

      // 创建新的测试用例
      const testCasesData = parsedTestCases.map((tc, index) => ({
        caseId: `TC-${id.slice(-8)}-${String(index + 1).padStart(3, '0')}`,
        scenario: tc.scenario,
        precondition: tc.precondition || null,
        steps: tc.steps,
        expectedResult: tc.expectedResult,
        environment: tc.environment || null,
        featureId: id,
      }));

      await prisma.testCase.createMany({
        data: testCasesData,
      });
    } else {
      // 差异更新：只添加新的测试用例
      const existingScenarios = new Set(
        feature.testCases.map((tc) => tc.scenario)
      );

      const newTestCases = parsedTestCases.filter(
        (tc) => !existingScenarios.has(tc.scenario)
      );

      if (newTestCases.length > 0) {
        const currentCount = feature.testCases.length;
        const testCasesData = newTestCases.map((tc, index) => ({
          caseId: `TC-${id.slice(-8)}-${String(currentCount + index + 1).padStart(3, '0')}`,
          scenario: tc.scenario,
          precondition: tc.precondition || null,
          steps: tc.steps,
          expectedResult: tc.expectedResult,
          environment: tc.environment || null,
          featureId: id,
        }));

        await prisma.testCase.createMany({
          data: testCasesData,
        });
      }
    }

    // 返回更新后的特性
    const updatedFeature = await prisma.feature.findUnique({
      where: { id },
      include: {
        testCases: true,
        module: true,
        _count: {
          select: { testCases: true },
        },
      },
    });

    return NextResponse.json(updatedFeature);
  } catch (error) {
    console.error('更新功能特性失败:', error);
    return NextResponse.json({ error: '更新功能特性失败' }, { status: 500 });
  }
}

// DELETE - 删除功能特性（级联删除测试用例）
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: '功能特性ID不能为空' },
        { status: 400 }
      );
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
