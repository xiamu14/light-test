/**
 * 使用 Better Auth API 直接创建用户
 * 这样可以确保密码哈希格式与 Better Auth 完全一致
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

// 从 secret.txt 读取用户信息
function loadUsersFromSecret(): Array<{
  email: string;
  name: string;
  password: string;
}> {
  const secretPath = join(process.cwd(), "secret.txt");

  if (!existsSync(secretPath)) {
    console.warn("⚠️  secret.txt 文件不存在，使用默认测试账号");
    return [
      {
        email: "test@lighttest.com",
        name: "测试用户",
        password: "test123456",
      },
    ];
  }

  try {
    const content = readFileSync(secretPath, "utf-8");
    const users: Array<{ email: string; name: string; password: string }> = [];

    // 解析 secret.txt 文件
    const sections = content.split(/##\s+/);

    for (const section of sections) {
      if (!section.trim()) continue;

      const lines = section.trim().split("\n");
      let email = "";
      let password = "";
      let name = "";

      // 从标题推断名称
      if (lines[0].includes("测试账号")) {
        name = "测试用户";
      } else if (lines[0].includes("个人使用账号")) {
        name = "Ayuku";
      }

      // 提取邮箱和密码
      for (const line of lines) {
        const emailMatch = line.match(/邮箱[：:]\s*(.+)/);
        const passwordMatch = line.match(/密码[：:]\s*(.+)/);

        if (emailMatch) {
          email = emailMatch[1].trim();
        }
        if (passwordMatch) {
          password = passwordMatch[1].trim();
        }
      }

      if (email && password) {
        users.push({ email, name, password });
      }
    }

    return users;
  } catch (error) {
    console.error("❌ 读取 secret.txt 失败:", error);
    return [];
  }
}

async function seedUsers() {
  console.log("🌱 开始同步用户账号...");

  const users = loadUsersFromSecret();

  if (users.length === 0) {
    console.error("❌ 未找到任何用户信息");
    process.exit(1);
  }

  console.log(`📋 从 secret.txt 读取到 ${users.length} 个用户账号`);

  // 从环境变量获取目标 URL，默认为本地
  const baseURL = process.env.TARGET_URL || "http://localhost:3000";
  console.log(`🎯 目标环境: ${baseURL}`);

  for (const userData of users) {
    try {
      // 使用 Better Auth 的注册 API
      const response = await fetch(`${baseURL}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.name,
        }),
      });

      if (response.ok) {
        console.log(`✅ 成功创建用户: ${userData.email}`);
      } else {
        const error = await response.text();
        if (error.includes("already exists") || error.includes("duplicate")) {
          console.log(`⏭️  用户 ${userData.email} 已存在，跳过`);
        } else {
          console.error(`❌ 创建用户 ${userData.email} 失败:`, error);
        }
      }
    } catch (error) {
      console.error(`❌ 创建用户 ${userData.email} 失败:`, error);
    }
  }

  console.log("✨ 用户账号同步完成！");
}

seedUsers();
