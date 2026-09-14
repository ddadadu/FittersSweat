import { PrismaClient } from '@prisma/client';
import { geminiService } from '../src/services/gemini.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 [Embed Pipeline] Starting batch embedding for Products & Posts...');

  // Ensure database column is vector(768)
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE products ALTER COLUMN embedding TYPE vector(768);');
    await prisma.$executeRawUnsafe('ALTER TABLE posts ALTER COLUMN embedding TYPE vector(768);');
    console.log('📐 [Embed Pipeline] Verified/Altered vector columns to vector(768).');
  } catch (err) {
    console.warn('⚠️ Column alteration warning:', err);
  }

  // 1. Embed Products
  const products = await prisma.product.findMany({
    select: { id: true, name: true, categoryId: true, description: true },
    orderBy: { id: 'asc' },
  });

  console.log(`📦 Found ${products.length} products to embed.`);
  let prodCount = 0;
  for (const p of products) {
    const text = `[${p.categoryId}] ${p.name} - ${p.description || ''}`;
    const embedding = await geminiService.embedText(text);
    const vectorStr = `[${embedding.join(',')}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE products SET embedding = $1::vector WHERE id = $2`,
      vectorStr,
      p.id
    );
    prodCount++;
    if (prodCount % 50 === 0 || prodCount === products.length) {
      console.log(`  - Embedded ${prodCount}/${products.length} products`);
    }
  }

  // 2. Embed Community Posts
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, content: true },
    orderBy: { id: 'asc' },
  });

  console.log(`📝 Found ${posts.length} posts to embed.`);
  let postCount = 0;
  for (const post of posts) {
    const text = `${post.title} - ${post.content}`;
    const embedding = await geminiService.embedText(text);
    const vectorStr = `[${embedding.join(',')}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE posts SET embedding = $1::vector WHERE id = $2`,
      vectorStr,
      post.id
    );
    postCount++;
    if (postCount % 50 === 0 || postCount === posts.length) {
      console.log(`  - Embedded ${postCount}/${posts.length} posts`);
    }
  }

  console.log('✅ [Embed Pipeline] All products and posts successfully embedded with 768-dim vectors!');
}

main()
  .catch((e) => {
    console.error('❌ Error during embedding pipeline:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
