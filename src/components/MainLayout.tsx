'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header, BreadcrumbItem } from './Header';

interface MainLayoutProps {
  children: ReactNode;
  breadcrumbs: BreadcrumbItem[];
  headerActions?: ReactNode;
  currentProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
}

export function MainLayout({
  children,
  breadcrumbs,
  headerActions,
  currentProjectId,
  onProjectSelect,
}: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* 左侧边栏 */}
      <Sidebar
        currentProjectId={currentProjectId}
        onProjectSelect={onProjectSelect}
      />

      {/* 右侧主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <Header breadcrumbs={breadcrumbs} actions={headerActions} />

        {/* 主内容区域 */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
