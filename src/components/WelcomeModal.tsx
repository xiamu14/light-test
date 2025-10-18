"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Chip,
} from "@heroui/react";

interface WelcomeModalProps {
  isOpen: boolean;
  onLogin: () => void;
}

export function WelcomeModal({ isOpen, onLogin }: WelcomeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      isDismissable={false}
      hideCloseButton
      size="2xl"
      backdrop="blur"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="font-bold text-2xl">欢迎使用轻测 LightTest</h2>
          <p className="font-normal text-default-500 text-sm">
            极简扁平化、纯语义驱动的测试管理平台
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* 核心流程 */}
            <Card>
              <CardBody className="gap-3">
                <div className="flex items-center gap-2">
                  <Chip size="sm" variant="flat">
                    1
                  </Chip>
                  <span className="text-sm">语义化需求输入</span>
                </div>
                <div className="flex items-center gap-2">
                  <Chip size="sm" variant="flat">
                    2
                  </Chip>
                  <span className="text-sm">AI 生成 Gherkin 测试脚本</span>
                </div>
                <div className="flex items-center gap-2">
                  <Chip size="sm" variant="flat">
                    3
                  </Chip>
                  <span className="text-sm">可视化编辑与用例管理</span>
                </div>
                <div className="flex items-center gap-2">
                  <Chip size="sm" variant="flat">
                    4
                  </Chip>
                  <span className="text-sm">状态流转与缺陷反馈</span>
                </div>
              </CardBody>
            </Card>

            {/* 核心特性 */}
            <div className="gap-2 grid grid-cols-2">
              <Card shadow="sm">
                <CardBody className="gap-1 p-3">
                  <p className="font-medium text-sm">语义驱动</p>
                  <p className="text-default-500 text-xs">
                    自然语言描述需求，AI 自动生成测试脚本
                  </p>
                </CardBody>
              </Card>
              <Card shadow="sm">
                <CardBody className="gap-1 p-3">
                  <p className="font-medium text-sm">极简设计</p>
                  <p className="text-default-500 text-xs">
                    扁平化流程，专注测试本身
                  </p>
                </CardBody>
              </Card>
              <Card shadow="sm">
                <CardBody className="gap-1 p-3">
                  <p className="font-medium text-sm">Gherkin 标准</p>
                  <p className="text-default-500 text-xs">
                    基于 BDD，高可读性场景描述
                  </p>
                </CardBody>
              </Card>
              <Card shadow="sm">
                <CardBody className="gap-1 p-3">
                  <p className="font-medium text-sm">快速上手</p>
                  <p className="text-default-500 text-xs">
                    零学习成本，创建即用
                  </p>
                </CardBody>
              </Card>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onPress={onLogin}
            size="md"
            className="w-full"
          >
            立即登录，开始使用
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
