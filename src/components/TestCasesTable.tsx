"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  SelectItem,
  Input,
  Button,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
} from "@heroui/react";
import { Trash2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

type TestCaseStatus = "NOT_EXECUTED" | "IN_PROGRESS" | "PASSED" | "FAILED";

interface TestCase {
  id: string;
  caseId: string;
  scenario: string;
  precondition?: string;
  steps: string;
  expectedResult: string;
  environment?: string;
  status: TestCaseStatus;
  executor?: string;
  createdAt: string;
}

interface TestCasesTableProps {
  featureId: string;
  onBack?: () => void;
}

const statusOptions = [
  { value: "NOT_EXECUTED", label: "未执行", color: "default" as const },
  { value: "IN_PROGRESS", label: "执行中", color: "primary" as const },
  { value: "PASSED", label: "通过", color: "success" as const },
  { value: "FAILED", label: "失败", color: "danger" as const },
];

export function TestCasesTable({ featureId, onBack }: TestCasesTableProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  // 编辑/新建表单
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [formData, setFormData] = useState({
    scenario: "",
    precondition: "",
    steps: "",
    expectedResult: "",
    environment: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // 删除
  const [testCaseToDelete, setTestCaseToDelete] = useState<TestCase | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadTestCases();
  }, [featureId]);

  const loadTestCases = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/test-cases?featureId=${featureId}`);
      if (res.ok) {
        const data = await res.json();
        setTestCases(data);
      }
    } catch (error) {
      console.error("加载测试用例失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    testCaseId: string,
    newStatus: TestCaseStatus
  ) => {
    setUpdatingId(testCaseId);
    try {
      const res = await fetch("/api/test-cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: testCaseId, status: newStatus }),
      });

      if (res.ok) {
        const updatedCase = await res.json();
        setTestCases(
          testCases.map((tc) => (tc.id === testCaseId ? updatedCase : tc))
        );
      }
    } catch (error) {
      console.error("更新状态失败:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExecutorChange = async (testCaseId: string, executor: string) => {
    try {
      const res = await fetch("/api/test-cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: testCaseId, executor }),
      });

      if (res.ok) {
        const updatedCase = await res.json();
        setTestCases(
          testCases.map((tc) => (tc.id === testCaseId ? updatedCase : tc))
        );
      }
    } catch (error) {
      console.error("更新执行人失败:", error);
    }
  };

  const getStatusChip = (status: TestCaseStatus) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return (
      <Chip size="sm" color={option?.color || "default"}>
        {option?.label || status}
      </Chip>
    );
  };

  const handleOpenCreate = () => {
    setEditingTestCase(null);
    setFormData({
      scenario: "",
      precondition: "",
      steps: "",
      expectedResult: "",
      environment: "",
    });
    onEditOpen();
  };

  const handleOpenEdit = (testCase: TestCase) => {
    setEditingTestCase(testCase);
    setFormData({
      scenario: testCase.scenario,
      precondition: testCase.precondition || "",
      steps: testCase.steps,
      expectedResult: testCase.expectedResult,
      environment: testCase.environment || "",
    });
    onEditOpen();
  };

  const handleSave = async () => {
    if (
      !formData.scenario.trim() ||
      !formData.steps.trim() ||
      !formData.expectedResult.trim()
    ) {
      toast.error("场景、操作步骤、期望结果为必填项");
      return;
    }

    setIsSaving(true);
    try {
      if (editingTestCase) {
        // 编辑
        const res = await fetch("/api/test-cases", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingTestCase.id,
            ...formData,
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          setTestCases(
            testCases.map((tc) => (tc.id === updated.id ? updated : tc))
          );
          onEditClose();
          toast.success("保存成功");
        } else {
          toast.error("保存失败");
        }
      } else {
        // 新建
        const res = await fetch("/api/test-cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            featureId,
          }),
        });

        if (res.ok) {
          const newTestCase = await res.json();
          setTestCases([newTestCase, ...testCases]);
          onEditClose();
          toast.success("创建成功");
        } else {
          toast.error("创建失败");
        }
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (testCase: TestCase) => {
    setTestCaseToDelete(testCase);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!testCaseToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/test-cases", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: testCaseToDelete.id }),
      });

      if (res.ok) {
        setTestCases(testCases.filter((tc) => tc.id !== testCaseToDelete.id));
        onDeleteClose();
        setTestCaseToDelete(null);
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

  // 计算统计数据
  const getStatistics = () => {
    const stats = statusOptions.map((option) => ({
      label: option.label,
      color: option.color,
      count: testCases.filter((tc) => tc.status === option.value).length,
      percentage:
        testCases.length > 0
          ? (
              (testCases.filter((tc) => tc.status === option.value).length /
                testCases.length) *
              100
            ).toFixed(1)
          : "0.0",
    }));

    const totalPassed = testCases.filter((tc) => tc.status === "PASSED").length;
    const passRate =
      testCases.length > 0
        ? ((totalPassed / testCases.length) * 100).toFixed(1)
        : "0.0";

    return { stats, passRate };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (testCases.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 py-12 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
        <p className="text-gray-500 dark:text-gray-400">暂无测试用例</p>
      </div>
    );
  }

  const { stats, passRate } = getStatistics();

  return (
    <div className="p-6 pt-[12px]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="返回需求列表"
            >
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <h2 className="font-semibold text-xl">测试用例 ({testCases.length})</h2>
        </div>
        <div className="flex gap-2">
          <Button color="primary" variant="flat" onPress={onOpen}>
            查看统计
          </Button>
          <Button color="primary" onPress={handleOpenCreate}>
            + 新建测试用例
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table aria-label="测试用例" className="shadow-none">
          <TableHeader>
            <TableColumn>用例ID</TableColumn>
            <TableColumn>场景</TableColumn>
            <TableColumn>前置条件</TableColumn>
            <TableColumn>操作步骤</TableColumn>
            <TableColumn>期望结果</TableColumn>
            <TableColumn>环境</TableColumn>
            <TableColumn>状态</TableColumn>
            <TableColumn>操作</TableColumn>
          </TableHeader>
          <TableBody>
            {testCases.map((testCase) => (
              <TableRow key={testCase.id}>
                <TableCell className="font-mono text-xs">
                  {testCase.caseId}
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="font-medium">{testCase.scenario}</div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">
                    {testCase.precondition || "-"}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="text-sm whitespace-pre-wrap">
                    {testCase.steps}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="text-sm whitespace-pre-wrap">
                    {testCase.expectedResult}
                  </div>
                </TableCell>
                <TableCell>{testCase.environment || "-"}</TableCell>
                <TableCell>
                  <Select
                    size="sm"
                    selectedKeys={[testCase.status]}
                    onChange={(e) =>
                      handleStatusChange(
                        testCase.id,
                        e.target.value as TestCaseStatus
                      )
                    }
                    isDisabled={updatingId === testCase.id}
                    className="min-w-[120px]"
                  >
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value}>{option.label}</SelectItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      color="default"
                      variant="flat"
                      onPress={() => handleOpenEdit(testCase)}
                    >
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      variant="light"
                      onPress={() => handleDelete(testCase)}
                      startContent={<Trash2 size={16} />}
                      className="hover:cursor-pointer"
                    >
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 统计信息模态框 */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <span>测试用例统计</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* 总体通过率 */}
              <div className="bg-gradient-to-r from-blue-50 dark:from-blue-900/20 to-blue-100 dark:to-blue-800/20 p-6 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-center">
                  <div className="mb-2 text-gray-600 dark:text-gray-400 text-sm">
                    总体通过率
                  </div>
                  <div className="font-bold text-blue-600 dark:text-blue-400 text-5xl">
                    {passRate}%
                  </div>
                  <div className="mt-2 text-gray-500 dark:text-gray-400 text-xs">
                    共 {testCases.length} 个测试用例
                  </div>
                </div>
              </div>

              {/* 详细统计 */}
              <div>
                <h4 className="mb-4 font-semibold text-lg">状态分布</h4>
                <div className="gap-4 grid grid-cols-2 md:grid-cols-3">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          {stat.label}
                        </span>
                        <Chip size="sm" color={stat.color}>
                          {stat.percentage}%
                        </Chip>
                      </div>
                      <div className="font-bold text-3xl">{stat.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onClose}>
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 新建/编辑测试用例模态框 */}
      <Modal
        isOpen={isEditOpen}
        onClose={onEditClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {editingTestCase ? "编辑测试用例" : "新建测试用例"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="场景"
                placeholder="测试场景描述"
                value={formData.scenario}
                onValueChange={(value) =>
                  setFormData({ ...formData, scenario: value })
                }
                isRequired
              />

              <Textarea
                label="前置条件"
                placeholder="测试前置条件（可选）"
                minRows={2}
                value={formData.precondition}
                onValueChange={(value) =>
                  setFormData({ ...formData, precondition: value })
                }
              />

              <Textarea
                label="操作步骤"
                placeholder="详细的操作步骤"
                minRows={4}
                value={formData.steps}
                onValueChange={(value) =>
                  setFormData({ ...formData, steps: value })
                }
                isRequired
              />

              <Textarea
                label="期望结果"
                placeholder="预期的测试结果"
                minRows={3}
                value={formData.expectedResult}
                onValueChange={(value) =>
                  setFormData({ ...formData, expectedResult: value })
                }
                isRequired
              />

              <Input
                label="环境"
                placeholder="测试环境（可选）"
                value={formData.environment}
                onValueChange={(value) =>
                  setFormData({ ...formData, environment: value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onEditClose}>
              取消
            </Button>
            <Button color="primary" onPress={handleSave} isLoading={isSaving}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认模态框 */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} backdrop="blur">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <span>删除测试用例</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-700 dark:text-gray-300">
              确定要删除测试用例 <strong>"{testCaseToDelete?.scenario}"</strong>{" "}
              吗？
            </p>
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
              用例ID: {testCaseToDelete?.caseId}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={onDeleteClose}
              isDisabled={isDeleting}
            >
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
    </div>
  );
}
