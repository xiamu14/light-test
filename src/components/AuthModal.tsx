"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Button,
  Divider,
} from "@heroui/react";
import { signIn, signUp } from "@/lib/auth-client";
import { toast } from "sonner";
import { Github } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AuthModal({ isOpen, onOpenChange }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async () => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        // 注册功能暂时关闭
        toast.error("注册功能暂未开放，请使用测试账号登录");
        setIsLoading(false);
        return;
      }

      // 登录
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "登录失败");
      } else {
        toast.success("登录成功");
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubAuth = async () => {
    try {
      await signIn.social({
        provider: "github",
        callbackURL: "/",
      });
    } catch (error: any) {
      toast.error(error.message || "GitHub 登录失败");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={false}
      hideCloseButton
      size="sm"
      backdrop="blur"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="font-bold text-xl">
            {isSignUp ? "注册账号" : "登录"}
          </h2>
          <p className="text-gray-500 text-sm font-normal">
            {isSignUp ? "创建您的账号以继续" : "登录以继续使用"}
          </p>
        </ModalHeader>
        <ModalBody className="pb-6">
          <div className="space-y-4">
            {/* GitHub 登录 */}
            <Button
              variant="bordered"
              onPress={handleGithubAuth}
              startContent={<Github size={18} />}
              className="w-full"
              size="sm"
            >
              使用 GitHub 登录
            </Button>

            <div className="flex items-center gap-2">
              <Divider className="flex-1" />
              <span className="text-gray-400 text-xs">或</span>
              <Divider className="flex-1" />
            </div>

            {/* 邮箱登录 */}
            {isSignUp && (
              <Input
                label="姓名"
                placeholder="请输入姓名"
                value={name}
                onValueChange={setName}
                size="sm"
              />
            )}
            <Input
              type="email"
              label="邮箱"
              placeholder="请输入邮箱"
              value={email}
              onValueChange={setEmail}
              size="sm"
            />
            <Input
              type="password"
              label="密码"
              placeholder="请输入密码"
              value={password}
              onValueChange={setPassword}
              size="sm"
            />

            <Button
              color="primary"
              onPress={handleEmailAuth}
              isLoading={isLoading}
              className="w-full"
              size="sm"
            >
              {isSignUp ? "注册" : "登录"}
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
