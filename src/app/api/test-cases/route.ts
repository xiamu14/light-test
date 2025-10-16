import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TestCaseStatus } from '@/generated/prisma';

// GET - 获取测试用例
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get('featureId');

    const where = featureId ? { featureId } : {};

    const testCases = await prisma.testCase.findMany({
      where,
      include: {
        feature: true,
        _count: {
          select: { defects: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(testCases);
  } catch (error) {
    console.error('获取测试用例失败:', error);
    return NextResponse.json({ error: '获取测试用例失败' }, { status: 500 });
  }
}

// PATCH - 更新测试用例
export async function PATCH(request: NextRequest) {
  try {
    const { id, status, executor, scenario, precondition, steps, expectedResult, environment } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '用例ID不能为空' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status as TestCaseStatus;
    if (executor !== undefined) updateData.executor = executor;
    if (scenario !== undefined) updateData.scenario = scenario;
    if (precondition !== undefined) updateData.precondition = precondition;
    if (steps !== undefined) updateData.steps = steps;
    if (expectedResult !== undefined) updateData.expectedResult = expectedResult;
    if (environment !== undefined) updateData.environment = environment;

    const testCase = await prisma.testCase.update({
      where: { id },
      data: updateData,
      include: {
        feature: true,
        defects: true,
      },
    });

    return NextResponse.json(testCase);
  } catch (error) {
    console.error('更新测试用例失败:', error);
    return NextResponse.json({ error: '更新测试用例失败' }, { status: 500 });
  }
}

// POST - 创建测试用例
export async function POST(request: NextRequest) {
  try {
    const { scenario, precondition, steps, expectedResult, environment, featureId } = await request.json();

    if (!scenario || !steps || !expectedResult || !featureId) {
      return NextResponse.json({ error: '必填字段不能为空' }, { status: 400 });
    }

    // 获取特性ID和现有用例数
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      include: { testCases: true },
    });

    if (!feature) {
      return NextResponse.json({ error: '功能特性不存在' }, { status: 404 });
    }

    // 生成用例ID
    const caseId = `TC-${featureId.slice(-8)}-${String(feature.testCases.length + 1).padStart(3, '0')}`;

    const testCase = await prisma.testCase.create({
      data: {
        caseId,
        scenario,
        precondition: precondition || null,
        steps,
        expectedResult,
        environment: environment || null,
        status: 'IN_PROGRESS', // 默认状态为进行中
        featureId,
      },
      include: {
        feature: true,
        defects: true,
      },
    });

    return NextResponse.json(testCase, { status: 201 });
  } catch (error) {
    console.error('创建测试用例失败:', error);
    return NextResponse.json({ error: '创建测试用例失败' }, { status: 500 });
  }
}

// DELETE - 删除测试用例
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '用例ID不能为空' }, { status: 400 });
    }

    await prisma.testCase.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除测试用例失败:', error);
    return NextResponse.json({ error: '删除测试用例失败' }, { status: 500 });
  }
}
