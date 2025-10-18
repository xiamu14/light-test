"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Tabs,
  Tab,
  Card,
  CardBody,
} from "@heroui/react";
import { Copy, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { GherkinEditor } from "@/components/GherkinEditor";
import {
  requirementExamples,
  type RequirementExample,
} from "@/lib/requirement-examples";

interface RequirementExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyExample: (example: RequirementExample) => void;
}

export function RequirementExamplesModal({
  isOpen,
  onClose,
  onCopyExample,
}: RequirementExamplesModalProps) {
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(
    null
  );

  // 当弹窗打开时，默认选中第一个示例
  useEffect(() => {
    if (isOpen && requirementExamples.length > 0) {
      setSelectedExampleId(requirementExamples[0].id);
    }
  }, [isOpen]);

  const selectedExample = requirementExamples.find(
    (ex) => ex.id === selectedExampleId
  );

  const handleCopy = (example: RequirementExample) => {
    onCopyExample(example);
    toast.success("已复制示例");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <span>需求示例</span>
          </div>
        </ModalHeader>
        <ModalBody className="overflow-hidden">
          <div className="flex gap-4 h-[600px]">
            {/* 左侧：示例列表 */}
            <div className="h-full overflow-y-auto scrollbar-hide">
              <Tabs
                aria-label="需求示例列表"
                isVertical
                selectedKey={selectedExampleId || undefined}
                variant="light"
                onSelectionChange={(key) => setSelectedExampleId(key as string)}
                classNames={{
                  base: "flex-shrink-0",
                  tabList: "w-[160px]",
                  tab: "h-auto py-2",
                  tabContent: "whitespace-normal text-left w-full",
                }}
              >
                {requirementExamples.map((example) => (
                  <Tab key={example.id} title={example.title} />
                ))}
              </Tabs>
            </div>

            {/* 右侧：示例详情 */}
            <div className="flex flex-col flex-1 px-2 h-full">
              {selectedExample ? (
                <>
                  {/* 标题和复制按钮 */}
                  <div className="flex justify-between items-center py-2">
                    <h3 className="font-semibold text-lg">
                      {selectedExample.title}
                    </h3>
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      onPress={() => handleCopy(selectedExample)}
                    >
                      复制示例
                    </Button>
                  </div>
                  <div className="flex-1 pt-[10px] overflow-y-auto scrollbar-hide">
                    {/* 需求描述 */}
                    <Card className="mb-4">
                      <CardBody>
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedExample.description}
                        </p>
                      </CardBody>
                    </Card>

                    {/* Gherkin 内容 */}
                    <div className="flex flex-col flex-1 min-h-0">
                      <h4 className="mb-2 font-medium text-sm">Gherkin</h4>
                      <div className="flex-1">
                        <GherkinEditor
                          value={selectedExample.gherkin}
                          height="100%"
                          readOnly={true}
                        />
                      </div>
                    </div>
                    <div className="bg-transparent w-full h-[20px]"></div>
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <div className="text-default-400 text-center">
                    <BookOpen size={48} className="opacity-50 mx-auto mb-4" />
                    <p>请选择示例查看</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} size="sm">
            关闭
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
