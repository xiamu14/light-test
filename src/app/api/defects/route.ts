import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DefectPriority, DefectStatus } from '@/generated/prisma';

// GET - 获取缺陷
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testCaseId = searchParams.get('testCaseId');

    const where = testCaseId ? { testCaseId } : {};

    const defects = await prisma.defect.findMany({
      where,
      include: {
        testCase: {
          include: {
            feature: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(defects);
  } catch (error) {
    console.error('获取缺陷失败:', error);
    return NextResponse.json({ error: '获取缺陷失败' }, { status: 500 });
  }
}

// POST - 创建新缺陷
export async function POST(request: NextRequest) {
  try {
    const { title, description, priority, testCaseId } = await request.json();

    if (!title || !testCaseId) {
      return NextResponse.json(
        { error: '标题和测试用例ID不能为空' },
        { status: 400 }
      );
    }

    const defect = await prisma.defect.create({
      data: {
        title,
        description: description || '',
        priority: (priority as DefectPriority) || 'MEDIUM',
        testCaseId,
      },
      include: {
        testCase: true,
      },
    });

    // 更新测试用例状态为 DEFECT_REPORTED
    await prisma.testCase.update({
      where: { id: testCaseId },
      data: { status: 'DEFECT_REPORTED' },
    });

    return NextResponse.json(defect, { status: 201 });
  } catch (error) {
    console.error('创建缺陷失败:', error);
    return NextResponse.json({ error: '创建缺陷失败' }, { status: 500 });
  }
}

// PATCH - 更新缺陷状态
export async function PATCH(request: NextRequest) {
  try {
    const { id, status, priority, description } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '缺陷ID不能为空' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status as DefectStatus;
    if (priority) updateData.priority = priority as DefectPriority;
    if (description !== undefined) updateData.description = description;

    const defect = await prisma.defect.update({
      where: { id },
      data: updateData,
      include: {
        testCase: true,
      },
    });

    return NextResponse.json(defect);
  } catch (error) {
    console.error('更新缺陷失败:', error);
    return NextResponse.json({ error: '更新缺陷失败' }, { status: 500 });
  }
}
