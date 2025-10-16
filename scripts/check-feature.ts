import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const featureId = 'cmgtouesh000ag9numw6g9ozx';

  console.log('Checking feature:', featureId);

  const feature = await prisma.feature.findUnique({
    where: { id: featureId },
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

  if (!feature) {
    console.log('Feature not found!');
    return;
  }

  console.log('\nFeature data:');
  console.log(JSON.stringify(feature, null, 2));

  console.log('\nAttempting status update to COMPLETED...');

  try {
    const updated = await prisma.feature.update({
      where: { id: featureId },
      data: { status: 'COMPLETED' },
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

    console.log('Update successful!');
    console.log(JSON.stringify(updated, null, 2));
  } catch (error) {
    console.error('Update failed:', error);
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
