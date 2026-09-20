import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { geminiService } from '../src/services/gemini.service';

const prisma = new PrismaClient();

const CHUNK_SIZE = 10;
const DELAY_MS = 200;

async function main() {
  console.log('🚀 [Embed Pipeline] Starting batch embedding for Products & Posts...');

  // Ensure database column is vector(768)
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE products ALTER COLUMN embedding TYPE vector(768);');
  } catch (err: any) {
    console.warn('⚠️ Products column alteration notice (gracefully continuing):', err?.message || err);
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE posts ALTER COLUMN embedding TYPE vector(768);');
  } catch (err: any) {
    console.warn('⚠️ Posts column alteration notice (gracefully continuing):', err?.message || err);
  }
  console.log('📐 [Embed Pipeline] Verified/Altered vector columns to vector(768).');

  // 1. Embed Products
  const products = await prisma.product.findMany({
    select: { id: true, name: true, categoryId: true, description: true },
    orderBy: { id: 'asc' },
  });

  console.log(`📦 Found ${products.length} products to embed.`);
  let prodCount = 0;
  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const texts = chunk.map((p) => `[${p.categoryId}] ${p.name} - ${p.description || ''}`);
    const embeddings = await geminiService.embedTexts(texts);
    await Promise.all(
      chunk.map(async (p, idx) => {
        const vectorStr = `[${embeddings[idx].join(',')}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE products SET embedding = $1::vector WHERE id = $2`,
          vectorStr,
          p.id
        );
      })
    );
    prodCount += chunk.length;
    if (prodCount % 50 === 0 || prodCount === products.length) {
      console.log(`[Products] ${prodCount}/${products.length} embedded...`);
    }
    if (i + CHUNK_SIZE < products.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  // 2. Embed Community Posts
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, content: true },
    orderBy: { id: 'asc' },
  });

  console.log(`📝 Found ${posts.length} posts to embed.`);
  let postCount = 0;
  for (let i = 0; i < posts.length; i += CHUNK_SIZE) {
    const chunk = posts.slice(i, i + CHUNK_SIZE);
    const texts = chunk.map((post) => `${post.title} - ${post.content}`);
    const embeddings = await geminiService.embedTexts(texts);
    await Promise.all(
      chunk.map(async (post, idx) => {
        const vectorStr = `[${embeddings[idx].join(',')}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE posts SET embedding = $1::vector WHERE id = $2`,
          vectorStr,
          post.id
        );
      })
    );
    postCount += chunk.length;
    if (postCount % 50 === 0 || postCount === posts.length) {
      console.log(`[Posts] ${postCount}/${posts.length} embedded...`);
    }
    if (i + CHUNK_SIZE < posts.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log('✅ [Embed Pipeline] All products and posts successfully embedded with 768-dim vectors!');

  // 3. Direct DB Cosine Similarity Verification
  console.log('\n🔍 [Embed Pipeline] Verifying Cosine Similarity for query: "발볼 넓은 러너 적합 신발 추천"...');
  const queryEmbedding = await geminiService.embedText('발볼 넓은 러너 적합 신발 추천');
  const vectorStr = `[${queryEmbedding.join(',')}]`;
  const topPosts: any = await prisma.$queryRawUnsafe(
    `SELECT id, title, 1 - (embedding <=> $1::vector) as similarity FROM posts ORDER BY similarity DESC LIMIT 5;`,
    vectorStr
  );
  console.log('Top 5 similar posts:');
  for (const post of topPosts) {
    console.log(`  - [ID: ${post.id}] (similarity: ${Number(post.similarity).toFixed(4)}) ${post.title}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during embedding pipeline:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
