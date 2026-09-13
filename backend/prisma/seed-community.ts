import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting community & reviews database seeding...');

  // 1. Load community-seed-data.json
  const dataPath = path.join(__dirname, 'data', 'community-seed-data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Seed data file not found at: ${dataPath}`);
  }
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const postsData = JSON.parse(rawData);
  console.log(`📦 Loaded ${postsData.length} posts from seed data.`);

  // 2. Clean existing community posts and comments (preserve products, users, events)
  console.log('🧹 Cleaning existing community posts and tags...');
  await prisma.postProductTag.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.post.deleteMany();

  // 3. Ensure distinct author users exist
  const passwordHash = await bcrypt.hash('password123', 10);
  const authorMap = new Map<string, bigint>();

  // Collect all author names from posts and comments
  const allUserNames = new Set<string>();
  postsData.forEach((p: any) => {
    allUserNames.add(p.authorName);
    p.comments?.forEach((c: any) => allUserNames.add(c.authorName));
  });

  console.log(`👥 Upserting ${allUserNames.size} community racer users...`);
  let userIndex = 1;
  for (const name of allUserNames) {
    const email = `racer_${userIndex++}@fittersweat.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: {
        email,
        passwordHash,
        name,
        role: Role.USER,
      },
    });
    authorMap.set(name, user.id);
  }

  // 4. Fetch valid event IDs and product IDs
  const events = await prisma.event.findMany({ select: { id: true } });
  const eventIds = events.map((e) => e.id);
  const products = await prisma.product.findMany({ select: { id: true } });
  const productSet = new Set(products.map((p) => p.id));
  console.log(`🔍 Verified ${productSet.size} products and ${eventIds.length} events in database.`);

  // 5. Insert 150 Posts and Tags
  console.log('📝 Seeding 150 community posts and foreign key product tags...');
  let totalTags = 0;
  let totalComments = 0;

  for (let i = 0; i < postsData.length; i++) {
    const item = postsData[i];
    const userId = authorMap.get(item.authorName) || authorMap.values().next().value;
    const eventId = item.eventId && eventIds.includes(BigInt(item.eventId)) ? BigInt(item.eventId) : (eventIds.length > 0 ? eventIds[i % eventIds.length] : null);

    // Create Post
    const post = await prisma.post.create({
      data: {
        userId,
        eventId,
        title: item.title,
        content: item.content,
        createdAt: new Date(Date.now() - (postsData.length - i) * 3600 * 1000 * 4), // Staggered timestamps over last 25 days
      },
    });

    // Create Tags
    if (Array.isArray(item.taggedProductIds)) {
      for (const pId of item.taggedProductIds) {
        const prodBigInt = BigInt(pId);
        if (productSet.has(prodBigInt)) {
          await prisma.postProductTag.create({
            data: {
              postId: post.id,
              productId: prodBigInt,
            },
          });
          totalTags++;
        }
      }
    }

    // Create Comments
    if (Array.isArray(item.comments)) {
      for (let cIdx = 0; cIdx < item.comments.length; cIdx++) {
        const c = item.comments[cIdx];
        const commentUserId = authorMap.get(c.authorName) || userId;
        await prisma.postComment.create({
          data: {
            postId: post.id,
            userId: commentUserId,
            content: c.content,
            createdAt: new Date(post.createdAt.getTime() + (cIdx + 1) * 1800 * 1000),
          },
        });
        totalComments++;
      }
    }
  }

  // 6. Seed Product Reviews (80 real reviews on tagged products)
  console.log('⭐ Seeding 80 product reviews linked to community products...');
  const sampleProducts = products.slice(0, 80);
  const sampleUserIds = Array.from(authorMap.values());
  let reviewCount = 0;

  for (let i = 0; i < sampleProducts.length; i++) {
    const prod = sampleProducts[i];
    const uId = sampleUserIds[i % sampleUserIds.length];
    const rating = (i % 5 === 0) ? 4 : 5; // Mostly 5-star and 4-star
    const reviewContent = [
      '실제 HYROX 경기장에서 착용하고 슬레드 밀었는데 지면 마찰력이 확실합니다.',
      '발볼이 넓어서 걱정했는데 런닝 8km 내내 발가락 압박 없이 편안했습니다.',
      '서플리먼트 흡수가 빨라서 런닝 4구간에서 쥐가 나지 않고 끝까지 버텼습니다.',
      '무릎 보호대 탄성이 우수하여 샌드백 런지 100m 통과할 때 무릎 충격을 완벽히 막아줌.',
      '스키에르그와 로잉에서 그립 미끄러짐 없이 당길 수 있어서 기록 단축에 큰 도움 됨.'
    ][i % 5];

    await prisma.review.create({
      data: {
        productId: prod.id,
        userId: uId,
        rating,
        content: reviewContent,
        createdAt: new Date(Date.now() - (sampleProducts.length - i) * 3600 * 1000 * 6),
      },
    });
    reviewCount++;
  }

  // 7. Verify Counts
  const postCount = await prisma.post.count();
  const commentCount = await prisma.postComment.count();
  const tagCount = await prisma.postProductTag.count();
  const finalReviewCount = await prisma.review.count();

  console.log('\n================ SEEDING COMPLETE ================');
  console.log(`✅ Posts seeded: ${postCount} (Expected: 150)`);
  console.log(`✅ Comments seeded: ${commentCount} (Expected: ~225)`);
  console.log(`✅ Product Tags seeded: ${tagCount}`);
  console.log(`✅ Reviews seeded: ${finalReviewCount}`);
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
