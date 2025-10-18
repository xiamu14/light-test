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
  Button,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Tabs,
  Tab,
  Input,
} from "@heroui/react";
import {
  Trash2,
  ChevronLeft,
  FileText,
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { EditorProvider } from "@/components/ui/rich-editor";
import { Editor } from "@/components/ui/rich-editor/editor";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  serializeToHtml,
  type ContainerNode,
  type EditorState,
} from "@/components/ui/rich-editor";

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
  defectFeedback?: string;
  createdAt: string;
  groupId?: string;
}

interface TestCasesTableProps {
  featureId: string;
  onBack?: () => void;
}

const statusOptions = [
  {
    value: "NOT_EXECUTED",
    label: "未执行",
    color: "default" as const,
    icon: Circle,
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-600 dark:text-gray-400",
    borderColor: "border-gray-300 dark:border-gray-600",
  },
  {
    value: "IN_PROGRESS",
    label: "执行中",
    color: "primary" as const,
    icon: Clock,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-300 dark:border-blue-600",
  },
  {
    value: "PASSED",
    label: "通过",
    color: "success" as const,
    icon: CheckCircle2,
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-300 dark:border-green-600",
  },
  {
    value: "FAILED",
    label: "失败",
    color: "danger" as const,
    icon: XCircle,
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-300 dark:border-red-600",
  },
];

export function TestCasesTable({ featureId, onBack }: TestCasesTableProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [filteredTestCases, setFilteredTestCases] = useState<TestCase[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("NOT_EXECUTED");

  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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
  const {
    isOpen: isFeedbackOpen,
    onOpen: onFeedbackOpen,
    onClose: onFeedbackClose,
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

  // 缺陷反馈
  const [feedbackTestCase, setFeedbackTestCase] = useState<TestCase | null>(
    null
  );
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackEditorState, setFeedbackEditorState] =
    useState<EditorState | null>(null);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  // 辅助函数：将 HTML 转换为简单的 ContainerNode
  const htmlToContainer = (html: string): ContainerNode => {
    if (!html || html.trim() === "") {
      return {
        id: "root",
        type: "container",
        children: [
          {
            id: "p-1",
            type: "p",
            content: "",
          },
        ],
      };
    }

    // 简单的文本解析器（将 HTML 转换为纯文本段落）
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || "";

    return {
      id: "root",
      type: "container",
      children: [
        {
          id: "p-1",
          type: "p",
          content: text,
        },
      ],
    };
  };

  // 删除
  const [testCaseToDelete, setTestCaseToDelete] = useState<TestCase | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadTestCases();
  }, [featureId, page, pageSize]);

  // 筛选和排序功能
  useEffect(() => {
    let filtered: TestCase[];
    if (statusFilter === "ALL") {
      filtered = [...testCases];
    } else {
      filtered = testCases.filter((tc) => tc.status === statusFilter);
    }

    // 排序：先按 groupId 分组，然后在同一 groupId 内按环境排序
    const sorted = filtered.sort((a, b) => {
      // 1. 优先按 groupId 排序（有 groupId 的排在一起）
      const aGroupId = a.groupId || "";
      const bGroupId = b.groupId || "";

      if (aGroupId !== bGroupId) {
        // 没有 groupId 的排在最后
        if (!aGroupId) return 1;
        if (!bGroupId) return -1;
        return aGroupId.localeCompare(bGroupId);
      }

      // 2. 在同一 groupId 内，按环境排序
      const aEnv = a.environment || "";
      const bEnv = b.environment || "";

      if (aEnv !== bEnv) {
        return aEnv.localeCompare(bEnv);
      }

      // 3. 环境相同时，按创建时间排序
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    setFilteredTestCases(sorted);
  }, [testCases, statusFilter]);

  const loadTestCases = async () => {
    try {
      setTableLoading(true);
      const res = await fetch(
        `/api/test-cases?featureId=${featureId}&page=${page}&pageSize=${pageSize}`
      );
      if (res.ok) {
        const response = await res.json();
        setTestCases(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      console.error("加载测试用例失败:", error);
    } finally {
      setTableLoading(false);
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

  // 计算单元格合并信息 - 按字段分别计算
  const getCellMergeInfo = (testCases: TestCase[]) => {
    const mergeInfo: {
      [key: string]: {
        caseId: { rowSpan: number; isFirstRow: boolean };
        scenario: { rowSpan: number; isFirstRow: boolean };
        precondition: { rowSpan: number; isFirstRow: boolean };
        steps: { rowSpan: number; isFirstRow: boolean };
        environment: { rowSpan: number; isFirstRow: boolean };
      };
    } = {};

    // 为每个字段计算合并信息
    // scenario, precondition, steps 只需要同 groupId 即可合并
    // environment 需要同 groupId 且内容相同才合并
    const calculateMergeForField = (
      fieldName: keyof Pick<
        TestCase,
        "caseId" | "scenario" | "precondition" | "steps" | "environment"
      >,
      requireContentMatch: boolean = false
    ) => {
      let currentGroupId: string | undefined = undefined;
      let currentValue: string | undefined = undefined;
      let groupStartIndex = 0;
      let groupSize = 1;

      testCases.forEach((tc, index) => {
        const fieldValue = tc[fieldName] || "";

        // 判断是否应该继续合并
        const shouldMerge =
          tc.groupId &&
          tc.groupId === currentGroupId &&
          (!requireContentMatch || fieldValue === currentValue);

        if (shouldMerge) {
          // 同一组且符合合并条件
          groupSize++;
        } else {
          // 新的组或不符合合并条件，保存上一组的信息
          if (currentGroupId && groupSize > 1) {
            for (let i = groupStartIndex; i < index; i++) {
              if (!mergeInfo[testCases[i].id]) {
                mergeInfo[testCases[i].id] = {
                  caseId: { rowSpan: 1, isFirstRow: true },
                  scenario: { rowSpan: 1, isFirstRow: true },
                  precondition: { rowSpan: 1, isFirstRow: true },
                  steps: { rowSpan: 1, isFirstRow: true },
                  environment: { rowSpan: 1, isFirstRow: true },
                };
              }
              mergeInfo[testCases[i].id][fieldName] = {
                rowSpan: groupSize,
                isFirstRow: i === groupStartIndex,
              };
            }
          }

          // 开始新组
          currentGroupId = tc.groupId;
          currentValue = fieldValue;
          groupStartIndex = index;
          groupSize = 1;
        }
      });

      // 处理最后一组
      if (
        currentGroupId &&
        groupSize > 1 &&
        groupStartIndex < testCases.length
      ) {
        for (let i = groupStartIndex; i < testCases.length; i++) {
          if (!mergeInfo[testCases[i].id]) {
            mergeInfo[testCases[i].id] = {
              caseId: { rowSpan: 1, isFirstRow: true },
              scenario: { rowSpan: 1, isFirstRow: true },
              precondition: { rowSpan: 1, isFirstRow: true },
              steps: { rowSpan: 1, isFirstRow: true },
              environment: { rowSpan: 1, isFirstRow: true },
            };
          }
          mergeInfo[testCases[i].id][fieldName] = {
            rowSpan: groupSize,
            isFirstRow: i === groupStartIndex,
          };
        }
      }
    };

    // 为每个可能合并的字段计算合并信息
    // caseId: 不合并，每个测试用例都有唯一的 ID
    // scenario, precondition, steps: 同 groupId 即可合并
    calculateMergeForField("scenario", false);
    calculateMergeForField("precondition", false);
    calculateMergeForField("steps", false);
    // environment: 需要同 groupId 且内容相同才合并
    calculateMergeForField("environment", true);

    // 为没有合并信息的测试用例设置默认值
    testCases.forEach((tc) => {
      if (!mergeInfo[tc.id]) {
        mergeInfo[tc.id] = {
          caseId: { rowSpan: 1, isFirstRow: true },
          scenario: { rowSpan: 1, isFirstRow: true },
          precondition: { rowSpan: 1, isFirstRow: true },
          steps: { rowSpan: 1, isFirstRow: true },
          environment: { rowSpan: 1, isFirstRow: true },
        };
      }
    });

    return mergeInfo;
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
          await loadTestCases(); // 重新加载列表
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
          await loadTestCases(); // 重新加载列表
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
        await loadTestCases(); // 重新加载列表
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

  const handleOpenFeedback = (testCase: TestCase) => {
    setFeedbackTestCase(testCase);
    const htmlContent = testCase.defectFeedback || "";
    setFeedbackContent(htmlContent);
    // 初始化编辑器状态为 null，让 EditorProvider 自己创建
    setFeedbackEditorState(null);
    onFeedbackOpen();
  };

  const handleSaveFeedback = async () => {
    if (!feedbackTestCase || !feedbackEditorState) return;

    setIsSavingFeedback(true);
    try {
      const container =
        feedbackEditorState.history[feedbackEditorState.historyIndex];
      const htmlContent = serializeToHtml(container, { includeWrapper: false });

      const res = await fetch("/api/test-cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: feedbackTestCase.id,
          defectFeedback: htmlContent,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTestCases(
          testCases.map((tc) => (tc.id === updated.id ? updated : tc))
        );
        onFeedbackClose();
        toast.success("缺陷反馈保存成功");
      } else {
        toast.error("保存失败");
      }
    } catch (error) {
      console.error("保存缺陷反馈失败:", error);
      toast.error("保存失败");
    } finally {
      setIsSavingFeedback(false);
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

  const { stats, passRate } = getStatistics();
  const mergeInfo = getCellMergeInfo(filteredTestCases);

  return (
    <div className="flex flex-col p-6 pt-[12px] h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex justify-center items-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded w-8 h-8 transition-colors cursor-pointer"
              title="返回需求列表"
            >
              <ChevronLeft
                size={20}
                className="text-gray-600 dark:text-gray-400"
              />
            </button>
          )}
          <h2 className="font-semibold text-xl">测试用例</h2>
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
            {/* <Tab key="ALL" title="全部" /> */}
            <Tab key="NOT_EXECUTED" title="未执行" />
            <Tab key="IN_PROGRESS" title="执行中" />
            <Tab key="PASSED" title="通过" />
            <Tab key="FAILED" title="失败" />
          </Tabs>
        </div>
        <div className="flex gap-2">
          <Button color="primary" onPress={handleOpenCreate} size="sm">
            + 新建测试
          </Button>
          <Button color="primary" variant="flat" onPress={onOpen} size="sm">
            统计
          </Button>
        </div>
      </div>

      {/* 内容区域 - 占据剩余空间 */}
      <div className="relative flex-1 min-h-0">
        {filteredTestCases.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 py-12 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {statusFilter === "ALL"
                ? "暂无测试用例"
                : statusFilter === "NOT_EXECUTED"
                ? "暂无未执行的测试用例"
                : statusFilter === "IN_PROGRESS"
                ? "暂无执行中的测试用例"
                : statusFilter === "PASSED"
                ? "暂无通过的测试用例"
                : "暂无失败的测试用例"}
            </p>
          </div>
        ) : (
          <div className="h-full overflow-x-auto">
            {tableLoading && (
              <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/50 dark:bg-gray-900/50">
                <Spinner size="lg" />
              </div>
            )}
            <Table aria-label="测试用例">
              <TableHeader>
                <TableColumn>用例ID</TableColumn>
                <TableColumn>场景</TableColumn>
                <TableColumn>前置条件</TableColumn>
                <TableColumn>操作步骤</TableColumn>
                <TableColumn>期望结果</TableColumn>
                <TableColumn>条件/环境</TableColumn>
                <TableColumn>状态</TableColumn>
                <TableColumn>缺陷反馈</TableColumn>
                <TableColumn>操作</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredTestCases.map((testCase) => {
                  const merge = mergeInfo[testCase.id] || {
                    caseId: { rowSpan: 1, isFirstRow: true },
                    scenario: { rowSpan: 1, isFirstRow: true },
                    precondition: { rowSpan: 1, isFirstRow: true },
                    steps: { rowSpan: 1, isFirstRow: true },
                    environment: { rowSpan: 1, isFirstRow: true },
                  };
                  const currentOption = statusOptions.find(
                    (opt) => opt.value === testCase.status
                  );
                  const Icon = currentOption?.icon || Circle;

                  return (
                    <TableRow key={testCase.id}>
                      {/* 用例ID - 按内容合并 */}
                      <TableCell
                        className={`font-mono text-xs align-middle ${
                          !merge.caseId.isFirstRow ? "hidden" : ""
                        }`}
                        rowSpan={
                          merge.caseId.isFirstRow ? merge.caseId.rowSpan : 1
                        }
                      >
                        {testCase.caseId}
                      </TableCell>

                      {/* 场景 - 按内容合并 */}
                      <TableCell
                        className={`max-w-xs align-middle ${
                          !merge.scenario.isFirstRow ? "hidden" : ""
                        }`}
                        rowSpan={
                          merge.scenario.isFirstRow ? merge.scenario.rowSpan : 1
                        }
                      >
                        <TruncatedText
                          text={testCase.scenario}
                          className="font-medium"
                        />
                      </TableCell>

                      {/* 前置条件 - 按内容合并 */}
                      <TableCell
                        className={`max-w-xs align-middle ${
                          !merge.precondition.isFirstRow ? "hidden" : ""
                        }`}
                        rowSpan={
                          merge.precondition.isFirstRow
                            ? merge.precondition.rowSpan
                            : 1
                        }
                      >
                        <TruncatedText
                          text={testCase.precondition || ""}
                          className="text-gray-600 dark:text-gray-400 text-sm"
                        />
                      </TableCell>

                      {/* 操作步骤 - 按内容合并 */}
                      <TableCell
                        className={`max-w-xs align-middle ${
                          !merge.steps.isFirstRow ? "hidden" : ""
                        }`}
                        rowSpan={
                          merge.steps.isFirstRow ? merge.steps.rowSpan : 1
                        }
                      >
                        <TruncatedText
                          text={testCase.steps}
                          className="text-sm"
                        />
                      </TableCell>

                      {/* 期望结果 - 每行不同，不合并 */}
                      <TableCell className="max-w-md align-middle">
                        <TruncatedText
                          text={testCase.expectedResult}
                          className="text-sm"
                        />
                      </TableCell>

                      {/* 环境 - 按内容合并 */}
                      <TableCell
                        className={`align-middle ${
                          !merge.environment.isFirstRow ? "hidden" : ""
                        }`}
                        rowSpan={
                          merge.environment.isFirstRow
                            ? merge.environment.rowSpan
                            : 1
                        }
                      >
                        <TruncatedText
                          text={testCase.environment || ""}
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <button
                              disabled={updatingId === testCase.id}
                              className="disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all hover:shadow-md whitespace-nowrap ${currentOption?.bgColor} ${currentOption?.borderColor}`}
                              >
                                <Icon
                                  size={16}
                                  className={currentOption?.textColor}
                                />
                                <span
                                  className={`font-medium text-sm ${currentOption?.textColor}`}
                                >
                                  {currentOption?.label}
                                </span>
                              </div>
                            </button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="选择测试状态"
                            onAction={(key) =>
                              handleStatusChange(
                                testCase.id,
                                key as TestCaseStatus
                              )
                            }
                            disabledKeys={
                              updatingId === testCase.id ? ["all"] : []
                            }
                          >
                            {statusOptions.map((option) => {
                              const Icon = option.icon;
                              return (
                                <DropdownItem
                                  key={option.value}
                                  startContent={
                                    <Icon
                                      size={16}
                                      className={option.textColor}
                                    />
                                  }
                                  className={
                                    testCase.status === option.value
                                      ? option.bgColor
                                      : ""
                                  }
                                >
                                  <span className={option.textColor}>
                                    {option.label}
                                  </span>
                                </DropdownItem>
                              );
                            })}
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          color={
                            testCase.defectFeedback ? "warning" : "default"
                          }
                          variant={
                            testCase.status === "FAILED" ? "solid" : "flat"
                          }
                          onPress={() => handleOpenFeedback(testCase)}
                          startContent={<FileText size={14} />}
                          isDisabled={
                            testCase.status !== "FAILED" &&
                            !testCase.defectFeedback
                          }
                        >
                          {testCase.defectFeedback
                            ? "查看"
                            : testCase.status === "FAILED"
                            ? "编辑"
                            : "-"}
                        </Button>
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
                            variant="flat"
                            onPress={() => handleDelete(testCase)}
                            startContent={<Trash2 size={16} />}
                            className="hover:cursor-pointer"
                          ></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
            <Button color="primary" onPress={onClose} size="sm">
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
                label="条件"
                placeholder="测试条件（可选）"
                value={formData.environment}
                onValueChange={(value) =>
                  setFormData({ ...formData, environment: value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onEditClose} size="sm">
              取消
            </Button>
            <Button color="primary" onPress={handleSave} isLoading={isSaving} size="sm">
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

      {/* 缺陷反馈模态框 */}
      <Modal
        isOpen={isFeedbackOpen}
        onClose={onFeedbackClose}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <FileText size={20} />
            <span>缺陷反馈 - {feedbackTestCase?.caseId}</span>
            {feedbackTestCase?.status === "FAILED" ? (
              <Chip size="sm" color="danger">
                可编辑
              </Chip>
            ) : (
              <Chip size="sm" color="default">
                只读
              </Chip>
            )}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="hidden bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <strong>提示：</strong>
                  {feedbackTestCase?.status === "FAILED"
                    ? " 当测试用例状态为'失败'时，可以编辑缺陷反馈内容。支持富文本编辑。"
                    : " 只有状态为'失败'的测试用例可以编辑缺陷反馈，其他状态只能查看。"}
                </p>
              </div>
              <div className="min-h-[400px] overflow-hidden">
                <EditorProvider
                  initialContainer={htmlToContainer(feedbackContent)}
                  onChange={(state) => setFeedbackEditorState(state)}
                >
                  <Editor readOnly={feedbackTestCase?.status !== "FAILED"} />
                </EditorProvider>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onFeedbackClose} size="sm">
              {feedbackTestCase?.status === "FAILED" ? "取消" : "关闭"}
            </Button>
            {feedbackTestCase?.status === "FAILED" && (
              <Button
                color="primary"
                onPress={handleSaveFeedback}
                isLoading={isSavingFeedback}
               size="sm">
                保存
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
