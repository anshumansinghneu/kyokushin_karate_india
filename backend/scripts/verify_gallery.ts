import prisma from '../src/prisma';

async function main() {
  const items = await prisma.gallery.findMany({ select: { imageUrl: true } });
  const good = items.filter(i => i.imageUrl.startsWith('/gallery/'));
  const bad = items.filter(i => !i.imageUrl.startsWith('/gallery/'));
  console.log('Correct format:', good.length);
  console.log('Wrong format:', bad.length);
  if (bad.length > 0) {
    console.log('Bad samples:', bad.slice(0, 3).map(i => i.imageUrl));
  }
}

main().finally(() => prisma.$disconnect());
