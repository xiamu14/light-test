"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { FeaturesTable } from "@/components/FeaturesTable";
import { TestCasesTable } from "@/components/TestCasesTable";
import { AuthModal } from "@/components/AuthModal";
import { WelcomeModal } from "@/components/WelcomeModal";
import { useSession } from "@/lib/auth-client";
import { Spinner } from "@heroui/react";

export default function HomePage() {
  const [currentProjectId, setCurrentProjectId] = useState<string>("");
  const [currentFeatureId, setCurrentFeatureId] = useState<string>("");
  const [currentView, setCurrentView] = useState<"features" | "testcases">(
    "features"
  );

  const { data: session, isPending } = useSession();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 检查登录状态
  useEffect(() => {
    if (!isPending && !session) {
      setShowWelcomeModal(true);
    }
  }, [session, isPending]);

  // 处理登录按钮点击
  const handleLogin = () => {
    setShowWelcomeModal(false);
    setShowAuthModal(true);
  };

  // 加载中状态
  if (isPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleProjectSelect = (projectId: string) => {
    setCurrentProjectId(projectId);
    setCurrentFeatureId("");
    setCurrentView("features");
  };

  const handleFeatureSelect = (featureId: string) => {
    setCurrentFeatureId(featureId);
    setCurrentView("testcases");
  };

  const handleBackToFeatures = () => {
    setCurrentFeatureId("");
    setCurrentView("features");
  };

  // 构建面包屑导航
  const getBreadcrumbs = () => {
    const breadcrumbs: {
      label: string;
      onClick?: () => void;
      href?: string;
    }[] = [
      {
        label: "首页",
        onClick: () => {
          setCurrentProjectId("");
          setCurrentFeatureId("");
          setCurrentView("features");
        },
      },
    ];

    if (currentProjectId) {
      breadcrumbs.push({
        label: "项目",
        onClick:
          currentView === "testcases"
            ? () => {
                setCurrentFeatureId("");
                setCurrentView("features");
              }
            : undefined,
      });
    }

    if (currentView === "features") {
      breadcrumbs.push({ label: "需求列表" });
    }

    if (currentView === "testcases") {
      breadcrumbs.push(
        {
          label: "需求列表",
          onClick: handleBackToFeatures,
        },
        {
          label: "测试用例",
        }
      );
    }

    return breadcrumbs;
  };

  // 渲染内容
  const renderContent = () => {
    if (!currentProjectId) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <h2 className="mb-2 font-semibold text-gray-700 text-2xl">
              欢迎使用轻测
            </h2>
            <p className="text-gray-500">请从创建项目开始</p>
          </div>
        </div>
      );
    }

    if (currentView === "features") {
      return (
        <FeaturesTable
          projectId={currentProjectId}
          onFeatureSelect={handleFeatureSelect}
        />
      );
    }

    if (currentView === "testcases" && currentFeatureId) {
      return (
        <TestCasesTable
          featureId={currentFeatureId}
          onBack={handleBackToFeatures}
        />
      );
    }

    return null;
  };

  return (
    <>
      <MainLayout
        breadcrumbs={getBreadcrumbs()}
        currentProjectId={currentProjectId}
        onProjectSelect={handleProjectSelect}
      >
        {renderContent()}
      </MainLayout>

      {/* 欢迎弹窗 - 未登录时显示产品介绍 */}
      <WelcomeModal isOpen={showWelcomeModal} onLogin={handleLogin} />

      {/* 登录弹窗 - 点击登录后显示 */}
      <AuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
