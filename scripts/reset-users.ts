import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

async function resetUsers() {
  console.log("🔄 重置用户账号...");

  const testEmails = ["test@lighttest.com", "ayuku@lighttest.com"];

  for (const email of testEmails) {
    try {
      // 查找用户
      const user = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true, sessions: true },
      });

      if (user) {
        // 删除关联的 sessions
        if (user.sessions.length > 0) {
          await prisma.session.deleteMany({
            where: { userId: user.id },
          });
          console.log(`  ✓ 删除 ${user.sessions.length} 个 session`);
        }

        // 删除关联的 accounts
        if (user.accounts.length > 0) {
          await prisma.account.deleteMany({
            where: { userId: user.id },
          });
          console.log(`  ✓ 删除 ${user.accounts.length} 个 account`);
        }

        // 删除用户
        await prisma.user.delete({
          where: { id: user.id },
        });

        console.log(`✅ 删除用户: ${email}`);
      } else {
        console.log(`⏭️  用户 ${email} 不存在`);
      }
    } catch (error) {
      console.error(`❌ 删除用户 ${email} 失败:`, error);
    }
  }

  await prisma.$disconnect();
  console.log("✨ 用户重置完成！现在请运行: bun run db:seed");
}

resetUsers();
