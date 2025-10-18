"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Trash2, LogOut } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSession, signOut } from "@/lib/auth-client";

interface Project {
  id: string;
  name: string;
  description?: string;
  _count?: {
    features: number;
    modules: number;
  };
}

interface SidebarProps {
  currentProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
}

export function Sidebar({ currentProjectId, onProjectSelect }: SidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        // 自动选择第一个项目
        if (data.length > 0 && !currentProjectId && onProjectSelect) {
          onProjectSelect(data[0].id);
        }
      }
    } catch (error) {
      console.error("加载项目失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName }),
      });

      if (res.ok) {
        const newProject = await res.json();
        await loadProjects(); // 重新加载列表
        setNewProjectName("");
        setShowCreateForm(false);
        if (onProjectSelect) {
          onProjectSelect(newProject.id);
        }
        toast.success("创建成功");
      } else {
        toast.error("创建失败");
      }
    } catch (error) {
      console.error("创建项目失败:", error);
    }
  };

  const handleDeleteProject = async (
    projectId: string,
    projectName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // 防止触发项目选择
    setProjectToDelete({ id: projectId, name: projectName });
    onOpen();
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectToDelete.id }),
      });

      if (res.ok) {
        // 如果删除的是当前选中的项目，选择下一个项目
        if (currentProjectId === projectToDelete.id && onProjectSelect) {
          const remainingProjects = projects.filter(
            (p) => p.id !== projectToDelete.id
          );
          if (remainingProjects.length > 0) {
            onProjectSelect(remainingProjects[0].id);
          } else {
            onProjectSelect("");
          }
        }
        await loadProjects(); // 重新加载列表
        onClose();
        setProjectToDelete(null);
        toast.success("删除成功");
      } else {
        toast.error("删除失败");
      }
    } catch (error) {
      console.error("删除项目失败:", error);
      toast.error("删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("已退出登录");
    } catch (error) {
      console.error("退出登录失败:", error);
      toast.error("退出登录失败");
    }
  };

  return (
    <div className="flex flex-col bg-gray-900 w-64 h-screen text-white">
      {/* Logo */}
      <div className="p-4">
        <h1 className="font-bold text-xl">轻测 LightTest</h1>
        <p className="mt-1 text-gray-400 text-xs">测试管理平台</p>
      </div>

      {/* 创建项目按钮 */}
      <div className="px-4 pb-4">
        {showCreateForm ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="项目名称"
              className="bg-gray-800 px-3 py-2 border border-gray-700 focus:border-blue-500 rounded focus:outline-none w-full text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateProject();
                if (e.key === "Escape") setShowCreateForm(false);
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateProject}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm hover:cursor-pointer"
              >
                创建
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm hover:cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded w-full font-medium text-sm hover:cursor-pointer"
          >
            + 新建项目
          </button>
        )}
      </div>

      {/* 项目列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <h3 className="px-2 py-1 font-semibold text-gray-400 text-xs uppercase">
            项目列表
          </h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="sm" color="default" />
            </div>
          ) : projects.length === 0 ? (
            <div className="px-2 py-8 text-gray-500 text-sm text-center">
              暂无项目
            </div>
          ) : (
            <div className="mt-2 px-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`group relative rounded text-sm transition-colors ${
                    currentProjectId === project.id
                      ? "bg-blue-600"
                      : "hover:bg-gray-800"
                  }`}
                >
                  <button
                    onClick={() => onProjectSelect?.(project.id)}
                    className={`w-full text-left px-3 py-2 hover:cursor-pointer ${
                      currentProjectId === project.id
                        ? "text-white"
                        : "text-gray-300"
                    }`}
                  >
                    <div className="font-medium">{project.name}</div>
                    {project._count && (
                      <div className="mt-1 text-gray-300 text-xs">
                        {project._count.features} 个需求
                      </div>
                    )}
                  </button>
                  <button
                    onClick={(e) =>
                      handleDeleteProject(project.id, project.name, e)
                    }
                    className="top-1/2 right-2 absolute hover:bg-red-900/20 opacity-0 group-hover:opacity-100 px-3 py-1 rounded text-red-400 hover:text-red-300 transition-opacity -translate-y-1/2 hover:cursor-pointer"
                    title="删除项目"
                  >
                    <Trash2 size={14} color="#fff" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 用户信息区域 */}
      {session?.user && (
        <div className="p-4 border-gray-800">
          <Dropdown placement="top">
            <DropdownTrigger>
              <div className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-lg transition-colors cursor-pointer">
                <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm truncate">
                    {session.user.name || "用户"}
                  </div>
                  <div className="text-gray-400 text-xs truncate">
                    {session.user.email}
                  </div>
                </div>
              </div>
            </DropdownTrigger>
            <DropdownMenu aria-label="用户操作">
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<LogOut size={16} />}
                onPress={handleSignOut}
              >
                退出登录
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      )}

      {/* 删除确认模态框 */}
      <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <span>删除项目</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-700 dark:text-gray-300">
              确定要删除项目 <strong>"{projectToDelete?.name}"</strong> 吗？
            </p>
            <div className="bg-red-50 dark:bg-red-950/30 p-3 border border-red-200 dark:border-red-900/50 rounded-lg">
              <p className="text-red-800 dark:text-red-300 text-sm">
                ⚠️
                警告：删除后关联的所有需求和测试用例也会被删除，此操作不可恢复。
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={onClose}
              isDisabled={isDeleting}
              size="sm"
            >
              取消
            </Button>
            <Button
              color="danger"
              onPress={confirmDelete}
              isLoading={isDeleting}
              startContent={!isDeleting ? <Trash2 size={16} /> : null}
              size="sm"
            >
              确认删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
