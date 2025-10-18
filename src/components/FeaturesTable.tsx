"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Textarea,
  Spinner,
  Tabs,
  Tab,
  Select,
  SelectItem,
  Pagination,
} from "@heroui/react";
import { Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { GherkinEditor } from "@/components/GherkinEditor";
import { TruncatedText } from "@/components/ui/truncated-text";
import { RequirementExamplesModal } from "@/components/RequirementExamplesModal";
import type { RequirementExample } from "@/lib/requirement-examples";

type FeatureStatus = "IN_PROGRESS" | "COMPLETED";

interface Feature {
  id: string;
  name: string;
  semanticInput: string;
  gherkinContent: string;
  status: FeatureStatus;
  createdAt: string;
  passedCount?: number;
  _count?: {
    testCases: number;
  };
}

interface FeaturesTableProps {
  projectId: string;
  onFeatureSelect?: (featureId: string) => void;
}

export function FeaturesTable({
  projectId,
  onFeatureSelect,
}: FeaturesTableProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [filteredFeatures, setFilteredFeatures] = useState<Feature[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("IN_PROGRESS");

  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isExamplesOpen,
    onOpen: onExamplesOpen,
    onClose: onExamplesClose,
  } = useDisclosure();

  // 创建/编辑表单
  const [formData, setFormData] = useState({
    name: "",
    semanticInput: "",
    gherkinContent: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 查看/编辑 Gherkin
  const [currentFeature, setCurrentFeature] = useState<Feature | null>(null);
  const [editedGherkin, setEditedGherkin] = useState("");
  const [editedSemanticInput, setEditedSemanticInput] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isGeneratingInView, setIsGeneratingInView] = useState(false);

  // 删除
  const [featureToDelete, setFeatureToDelete] = useState<Feature | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadFeatures();
    }
  }, [projectId, page, pageSize]);

  // 筛选功能
  useEffect(() => {
    if (statusFilter === "ALL") {
      setFilteredFeatures(features);
    } else {
      setFilteredFeatures(features.filter((f) => f.status === statusFilter));
    }
  }, [features, statusFilter]);

  const loadFeatures = async () => {
    try {
      setTableLoading(true);
      const res = await fetch(
        `/api/features?projectId=${projectId}&page=${page}&pageSize=${pageSize}`
      );
      if (res.ok) {
        const response = await res.json();
        setFeatures(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      console.error("加载需求列表失败:", error);
    } finally {
      setTableLoading(false);
    }
  };

  const handleGenerateGherkin = async () => {
    if (!formData.semanticInput.trim()) {
      toast.error("请输入需求描述");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-gherkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semanticInput: formData.semanticInput }),
      });

      if (res.ok) {
        const data = await res.json();
        setFormData({ ...formData, gherkinContent: data.gherkinContent });
        toast.success("Gherkin 生成成功");
      } else {
        toast.error("生成失败，请检查 OpenAI API 配置");
      }
    } catch (error) {
      console.error("生成 Gherkin 失败:", error);
      toast.error("生成失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.semanticInput.trim()) {
      toast.error("请填写需求名称和需求描述");
      return;
    }

    setIsSaving(true);
    try {
      // 1. 生成 Gherkin
      const gherkinRes = await fetch("/api/ai/generate-gherkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semanticInput: formData.semanticInput }),
      });

      if (!gherkinRes.ok) {
        toast.error("生成 Gherkin 失败，请检查 OpenAI API 配置");
        return;
      }

      const gherkinData = await gherkinRes.json();

      // 2. 创建需求并生成测试用例
      const res = await fetch("/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          semanticInput: formData.semanticInput,
          gherkinContent: gherkinData.gherkinContent,
          projectId,
        }),
      });

      if (res.ok) {
        await loadFeatures(); // 重新加载列表
        onClose();
        setFormData({ name: "", semanticInput: "", gherkinContent: "" });
        toast.success("保存成功！测试用例已自动生成");
      } else {
        toast.error("保存失败");
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({ name: "", semanticInput: "", gherkinContent: "" });
    onOpen();
  };

  const handleViewGherkin = (feature: Feature) => {
    setCurrentFeature(feature);
    setEditedGherkin(feature.gherkinContent);
    setEditedSemanticInput(feature.semanticInput);
    onViewOpen();
  };

  const handleGenerateGherkinInView = async () => {
    if (!editedSemanticInput.trim()) {
      toast.error("请输入需求描述");
      return;
    }

    setIsGeneratingInView(true);
    try {
      const res = await fetch("/api/ai/generate-gherkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semanticInput: editedSemanticInput }),
      });

      if (res.ok) {
        const data = await res.json();
        setEditedGherkin(data.gherkinContent);
        toast.success("Gherkin 生成成功");
      } else {
        toast.error("生成失败，请检查 OpenAI API 配置");
      }
    } catch (error) {
      console.error("生成 Gherkin 失败:", error);
      toast.error("生成失败");
    } finally {
      setIsGeneratingInView(false);
    }
  };

  const handleRegenerateTestCases = async () => {
    if (!currentFeature || !editedGherkin.trim()) {
      toast.error("Gherkin 内容不能为空");
      return;
    }

    setIsRegenerating(true);
    try {
      const res = await fetch("/api/features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentFeature.id,
          gherkinContent: editedGherkin,
          replaceAll: false, // 总是使用差异更新
        }),
      });

      if (res.ok) {
        const updatedFeature = await res.json();
        setFeatures(
          features.map((f) => (f.id === currentFeature.id ? updatedFeature : f))
        );
        onViewClose();
        toast.success("测试用例已更新");
        loadFeatures();
      } else {
        toast.error("更新失败");
      }
    } catch (error) {
      console.error("更新失败:", error);
      toast.error("更新失败");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDelete = async (feature: Feature) => {
    setFeatureToDelete(feature);
    onDeleteOpen();
  };

  const handleStatusChange = async (
    featureId: string,
    newStatus: FeatureStatus
  ) => {
    // 如果要设置为"已完成"，需要验证所有测试用例都通过
    if (newStatus === "COMPLETED") {
      const feature = features.find((f) => f.id === featureId);
      if (!feature) return;

      const totalTestCases = feature._count?.testCases || 0;
      const passedCount = feature.passedCount || 0;

      // 检查是否有测试用例
      if (totalTestCases === 0) {
        toast.error("该需求没有测试用例，无法标记为已完成");
        return;
      }

      // 检查是否所有测试用例都通过
      if (passedCount < totalTestCases) {
        toast.error(
          `还有 ${
            totalTestCases - passedCount
          } 个测试用例未通过，无法标记为已完成`
        );
        return;
      }
    }

    try {
      const res = await fetch("/api/features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: featureId, status: newStatus }),
      });

      if (res.ok) {
        const updatedFeature = await res.json();
        setFeatures(
          features.map((f) => (f.id === featureId ? updatedFeature : f))
        );
        toast.success("状态更新成功");
      } else {
        const errorData = await res.json();
        console.error("状态更新失败:", errorData);
        toast.error("状态更新失败");
      }
    } catch (error) {
      console.error("更新状态失败:", error);
      toast.error("更新状态失败");
    }
  };

  const confirmDelete = async () => {
    if (!featureToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/features", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: featureToDelete.id }),
      });

      if (res.ok) {
        await loadFeatures(); // 重新加载列表
        onDeleteClose();
        setFeatureToDelete(null);
        toast.success("删除成功");
      } else {
        toast.error("删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  // 从示例创建需求（不生成测试用例）
  const handleCopyExample = async (example: RequirementExample) => {
    try {
      // 只创建需求，不生成测试用例
      const res = await fetch("/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: example.title,
          semanticInput: example.description,
          gherkinContent: example.gherkin,
          projectId,
          skipTestCases: true, // 跳过测试用例生成
        }),
      });

      if (res.ok) {
        await loadFeatures(); // 重新加载列表
        toast.success("需求已创建！");
      } else {
        toast.error("创建失败");
      }
    } catch (error) {
      console.error("创建需求失败:", error);
      toast.error("创建失败");
    }
  };

  return (
    <div className="flex flex-col p-6 pt-[12px] h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-xl">需求列表</h2>
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            共 {total} 条
          </span>
          {/* 状态筛选标签 */}
          <Tabs
            selectedKey={statusFilter}
            onSelectionChange={(key) => setStatusFilter(key as string)}
            color="default"
            size="sm"
          >
            <Tab key="IN_PROGRESS" title="进行中" />
            <Tab key="COMPLETED" title="已完成" />
            {/* <Tab key="ALL" title="全部" /> */}
          </Tabs>
        </div>
        <div className="flex gap-2">
          <Button color="primary" onPress={handleOpenCreate} size="sm">
            + 新建需求
          </Button>
          <Button
            color="default"
            variant="flat"
            onPress={onExamplesOpen}
            size="sm"
          >
            需求示例
          </Button>
        </div>
      </div>

      {/* 内容区域 - 占据剩余空间 */}
      <div className="relative flex-1 min-h-0">
        {filteredFeatures.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 py-12 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {statusFilter === "IN_PROGRESS"
                ? "暂无进行中的需求"
                : statusFilter === "COMPLETED"
                ? "暂无已完成的需求"
                : "暂无需求"}
            </p>
            {total === 0 ? (
              <Button
                color="primary"
                className="mt-4"
                onPress={handleOpenCreate}
               size="sm">
                新建需求
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="h-full overflow-x-auto">
            {tableLoading && (
              <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/50 dark:bg-gray-900/50">
                <Spinner size="lg" />
              </div>
            )}
            <Table aria-label="需求列表">
              <TableHeader>
                <TableColumn>需求名称</TableColumn>
                <TableColumn>需求描述</TableColumn>
                <TableColumn>测试用例</TableColumn>
                <TableColumn>状态</TableColumn>
                <TableColumn>创建时间</TableColumn>
                <TableColumn>操作</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredFeatures.map((feature) => (
                  <TableRow key={feature.id}>
                    <TableCell className="max-w-xs font-medium">
                      <TruncatedText text={feature.name} />
                    </TableCell>
                    <TableCell className="max-w-md">
                      <TruncatedText text={feature.semanticInput} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {feature.passedCount || 0}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {" "}
                          /{" "}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {feature._count?.testCases || 0}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        size="sm"
                        selectedKeys={[feature.status]}
                        onChange={(e) =>
                          handleStatusChange(
                            feature.id,
                            e.target.value as FeatureStatus
                          )
                        }
                        className="min-w-[120px]"
                      >
                        <SelectItem key="IN_PROGRESS">进行中</SelectItem>
                        <SelectItem key="COMPLETED">已完成</SelectItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(feature.createdAt).toLocaleDateString("zh-CN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="primary"
                          onPress={() => onFeatureSelect?.(feature.id)}
                        >
                          测试用例
                        </Button>
                        <Button
                          size="sm"
                          color="default"
                          variant="flat"
                          onPress={() => handleViewGherkin(feature)}
                        >
                          编辑 Gherkin
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() => handleDelete(feature)}
                          startContent={<Trash2 size={16} />}
                          className="hover:cursor-pointer"
                        ></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 分页组件 - 固定在底部 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            showControls
            color="primary"
          />
        </div>
      )}

      {/* 创建需求模态框 */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>创建新需求</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="需求名称"
                placeholder="例如：用户登录功能"
                value={formData.name}
                onValueChange={(value) =>
                  setFormData({ ...formData, name: value })
                }
                isRequired
              />

              <Textarea
                label="需求描述"
                placeholder="输入自然语言需求描述，AI 将自动生成 Gherkin 并解析为测试用例..."
                minRows={8}
                value={formData.semanticInput}
                onValueChange={(value) =>
                  setFormData({ ...formData, semanticInput: value })
                }
                isRequired
              />

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <strong>提示：</strong>
                  点击"生成测试用例"后，AI 将自动生成 Gherkin 并解析为测试用例。
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose} size="sm">
              取消
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={isSaving}
              isDisabled={
                !formData.name.trim() || !formData.semanticInput.trim()
              }
              size="sm"
            >
              {isSaving ? "生成中..." : "生成测试用例"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 查看/编辑 Gherkin 模态框 */}
      <Modal
        isOpen={isViewOpen}
        onClose={onViewClose}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>查看 Gherkin - {currentFeature?.name}</ModalHeader>
          <ModalBody className="scrollbar-hide">
            <div className="space-y-4">
              <Textarea
                label="需求描述"
                placeholder="输入自然语言需求描述..."
                minRows={3}
                value={editedSemanticInput}
                onValueChange={setEditedSemanticInput}
              />

              <Button
                color="primary"
                onPress={handleGenerateGherkinInView}
                isLoading={isGeneratingInView}
                isDisabled={!editedSemanticInput.trim()}
               size="sm">
                生成 Gherkin
              </Button>

              <div>
                <label className="block mb-2 font-medium text-sm">
                  Gherkin 内容(可编辑)
                </label>
                <GherkinEditor
                  value={editedGherkin}
                  onChange={(value) => setEditedGherkin(value)}
                  height="400px"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <strong>提示：</strong>
                  编辑 Gherkin
                  后点击"更新测试用例"，将会保留现有测试用例，只添加新的测试用例（差异更新）。
                  用户手动添加的测试用例不会被删除。
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onViewClose} size="sm">
              取消
            </Button>
            <Button
              color="primary"
              onPress={handleRegenerateTestCases}
              isLoading={isRegenerating}
             size="sm">
              更新测试用例
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认模态框 */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} backdrop="blur">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <span>删除需求</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-700 dark:text-gray-300">
              确定要删除需求 <strong>"{featureToDelete?.name}"</strong> 吗？
            </p>
            <div className="bg-red-50 dark:bg-red-950/30 p-3 border border-red-200 dark:border-red-900/50 rounded-lg">
              <p className="text-red-800 dark:text-red-300 text-sm">
                ⚠️ 警告：删除后关联的所有测试用例也会被删除，此操作不可恢复。
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={onDeleteClose}
              isDisabled={isDeleting}
             size="sm">
              取消
            </Button>
            <Button
              color="danger"
              onPress={confirmDelete}
              isLoading={isDeleting}
              startContent={!isDeleting ? <Trash2 size={16} /> : null}
            >
              确认删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 需求示例模态框 */}
      <RequirementExamplesModal
        isOpen={isExamplesOpen}
        onClose={onExamplesClose}
        onCopyExample={handleCopyExample}
      />
    </div>
  );
}
