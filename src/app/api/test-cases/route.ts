import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TestCaseStatus } from '@/generated/prisma';
import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// GET - 获取测试用例(支持分页)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get('featureId');
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Number.parseInt(searchParams.get('pageSize') || '10', 10);

    // 构建查询条件：只查询当前用户的测试用例
    const where: any = {
      feature: {
        project: {
          userId: session.user.id,
        },
      },
    };

    if (featureId) {
      where.featureId = featureId;
    }

    // 获取总数
    const total = await prisma.testCase.count({ where });

    // 分页查询
    const testCases = await prisma.testCase.findMany({
      where,
      include: {
        feature: true,
        _count: {
          select: { defects: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      data: testCases,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('获取测试用例失败:', error);
    return NextResponse.json({ error: '获取测试用例失败' }, { status: 500 });
  }
}

// PATCH - 更新测试用例
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id, status, executor, scenario, precondition, steps, expectedResult, environment, defectFeedback } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '用例ID不能为空' }, { status: 400 });
    }

    // 首先获取当前测试用例，检查是否有 groupId 和所有权
    const currentTestCase = await prisma.testCase.findUnique({
      where: { id },
      select: {
        groupId: true,
        feature: {
          select: {
            project: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!currentTestCase) {
      return NextResponse.json({ error: '测试用例不存在' }, { status: 404 });
    }

    if (currentTestCase.feature.project.userId !== session.user.id) {
      return NextResponse.json({ error: '无权限访问此测试用例' }, { status: 403 });
    }

    // 判断是否需要同步更新组内其他测试用例
    const hasGroupId = !!currentTestCase.groupId;
    const isUpdatingSharedFields = scenario !== undefined || precondition !== undefined || steps !== undefined;

    // 如果有 groupId 且正在更新共享字段，则同步更新组内所有测试用例
    if (hasGroupId && isUpdatingSharedFields) {
      // 构建共享字段的更新数据
      const sharedUpdateData: any = {};
      if (scenario !== undefined) sharedUpdateData.scenario = scenario;
      if (precondition !== undefined) sharedUpdateData.precondition = precondition;
      if (steps !== undefined) sharedUpdateData.steps = steps;

      // 批量更新所有相同 groupId 的测试用例的共享字段
      await prisma.testCase.updateMany({
        where: { groupId: currentTestCase.groupId },
        data: sharedUpdateData,
      });
    }

    // 构建当前测试用例的完整更新数据（包括非共享字段）
    const updateData: any = {};
    if (status) updateData.status = status as TestCaseStatus;
    if (executor !== undefined) updateData.executor = executor;
    if (scenario !== undefined) updateData.scenario = scenario;
    if (precondition !== undefined) updateData.precondition = precondition;
    if (steps !== undefined) updateData.steps = steps;
    if (expectedResult !== undefined) updateData.expectedResult = expectedResult;
    if (environment !== undefined) updateData.environment = environment;
    if (defectFeedback !== undefined) updateData.defectFeedback = defectFeedback;

    // 更新当前测试用例（获取完整信息用于返回）
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { scenario, precondition, steps, expectedResult, environment, featureId } = await request.json();

    if (!scenario || !steps || !expectedResult || !featureId) {
      return NextResponse.json({ error: '必填字段不能为空' }, { status: 400 });
    }

    // 验证 feature 所有权
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      include: { project: { select: { userId: true } } },
    });

    if (!feature) {
      return NextResponse.json({ error: '功能特性不存在' }, { status: 404 });
    }

    if (feature.project.userId !== session.user.id) {
      return NextResponse.json({ error: '无权限访问此功能特性' }, { status: 403 });
    }

    // 生成用例ID
    const caseId = nanoid(8); // 生成8位的短ID

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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '用例ID不能为空' }, { status: 400 });
    }

    // 验证测试用例所有权
    const testCase = await prisma.testCase.findUnique({
      where: { id },
      include: {
        feature: {
          include: {
            project: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!testCase) {
      return NextResponse.json({ error: '测试用例不存在' }, { status: 404 });
    }

    if (testCase.feature.project.userId !== session.user.id) {
      return NextResponse.json({ error: '无权限删除此测试用例' }, { status: 403 });
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
