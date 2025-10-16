import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const featureId = 'cmgtouesh000ag9numw6g9ozx';
  const newStatus = 'IN_PROGRESS'; // Switch back to IN_PROGRESS to test

  console.log('Testing status update...');
  console.log('Feature ID:', featureId);
  console.log('New Status:', newStatus);

  try {
    const updatedFeature = await prisma.feature.update({
      where: { id: featureId },
      data: { status: newStatus },
      include: {
        testCases: {
          select: {
            status: true,
          },
        },
        module: true,
        _count: {
          select: { testCases: true },
        },
      },
    });

    // Calculate passedCount
    const passedCount = updatedFeature.testCases.filter(
      (tc) => tc.status === 'PASSED'
    ).length;

    console.log('\n✅ Update successful!');
    console.log('Updated feature:');
    console.log({
      id: updatedFeature.id,
      name: updatedFeature.name,
      status: updatedFeature.status,
      passedCount,
      totalTestCases: updatedFeature._count.testCases,
    });
  } catch (error) {
    console.error('\n❌ Update failed:', error);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
