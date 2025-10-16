import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - 获取所有项目
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: { features: true, modules: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('获取项目失败:', error);
    return NextResponse.json({ error: '获取项目失败' }, { status: 500 });
  }
}

// POST - 创建新项目
export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: '项目名称不能为空' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: { name, description },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json({ error: '创建项目失败' }, { status: 500 });
  }
}

// DELETE - 删除项目（级联删除所有关联数据）
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '项目ID不能为空' }, { status: 400 });
    }

    // Prisma schema 中设置了 onDelete: Cascade，会自动删除关联的 features、modules 及其下的测试用例
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除项目失败:', error);
    return NextResponse.json({ error: '删除项目失败' }, { status: 500 });
  }
}
