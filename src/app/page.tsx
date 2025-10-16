"use client";

import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { FeaturesTable } from "@/components/FeaturesTable";
import { TestCasesTable } from "@/components/TestCasesTable";

export default function HomePage() {
  const [currentProjectId, setCurrentProjectId] = useState<string>("");
  const [currentFeatureId, setCurrentFeatureId] = useState<string>("");
  const [currentView, setCurrentView] = useState<"features" | "testcases">(
    "features"
  );

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
            <p className="text-gray-500">请从左侧选择或创建一个项目开始</p>
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
    <MainLayout
      breadcrumbs={getBreadcrumbs()}
      currentProjectId={currentProjectId}
      onProjectSelect={handleProjectSelect}
    >
      {renderContent()}
    </MainLayout>
  );
}
