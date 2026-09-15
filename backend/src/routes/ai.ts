import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { geminiService } from '../services/gemini.service';

const prisma = new PrismaClient();

interface RawProductMatch {
  id: bigint;
  name: string;
  description: string | null;
  category_id: string;
  price: any;
  stock_quantity: number;
  image_url: string | null;
  similarity: number;
}

interface RawPostMatch {
  id: bigint;
  title: string;
  content: string;
  user_id: bigint;
  user_name: string;
  similarity: number;
}

export async function aiRoutes(app: FastifyInstance) {
  /**
   * POST /api/v1/ai/recommend
   * Dual-Retriever Cosine Search + PostProductTag +20% Reranking + Gemini Advisor Synthesis
   */
  app.post('/recommend', async (request, reply) => {
    const { query, categoryId } = (request.body as { query?: string; categoryId?: string }) || {};

    if (!query || !query.trim()) {
      return reply.status(400).send({ message: 'Query is required' });
    }

    try {
      // 1. Generate 768-dim query embedding
      const queryVector = await geminiService.embedText(query.trim());
      const vectorStr = `[${queryVector.join(',')}]`;

      // 2. Dual-Retriever: 1) Products Cosine Search
      const rawProducts = await prisma.$queryRawUnsafe<RawProductMatch[]>(
        `SELECT id, name, description, category_id, price, stock_quantity, image_url,
                (1 - (embedding <=> $1::vector))::float as similarity
         FROM products
         WHERE stock_quantity > 0
           AND ($2::text IS NULL OR category_id = $2)
           AND embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector ASC
         LIMIT 6;`,
        vectorStr,
        categoryId || null
      );

      // 2. Dual-Retriever: 2) Community Posts Cosine Search
      const rawPosts = await prisma.$queryRawUnsafe<RawPostMatch[]>(
        `SELECT p.id, p.title, p.content, p.user_id, u.name as user_name,
                (1 - (p.embedding <=> $1::vector))::float as similarity
         FROM posts p
         JOIN users u ON p.user_id = u.id
         WHERE p.embedding IS NOT NULL
         ORDER BY p.embedding <=> $1::vector ASC
         LIMIT 4;`,
        vectorStr
      );

      // 3. Cross-Referencing: Check PostProductTag foreign key links
      const postIds = rawPosts.map((p) => p.id);
      const postTags = postIds.length > 0
        ? await prisma.postProductTag.findMany({
            where: { postId: { in: postIds } },
            select: { postId: true, productId: true },
          })
        : [];

      const taggedProductIds = new Set(postTags.map((pt) => pt.productId.toString()));

      // Apply +20% boost to products tagged in verified race posts
      const rerankedProducts = rawProducts.map((p) => {
        const isTagged = taggedProductIds.has(p.id.toString());
        const score = isTagged ? p.similarity * 1.2 : p.similarity;
        return {
          id: p.id.toString(),
          name: p.name,
          description: p.description,
          categoryId: p.category_id,
          price: Number(p.price),
          stockQuantity: p.stock_quantity,
          imageUrl: p.image_url,
          similarity: Number(p.similarity.toFixed(4)),
          rerankScore: Number(score.toFixed(4)),
          isSocialVerified: isTagged,
        };
      });

      // Sort by reranked score descending, pick top 3
      rerankedProducts.sort((a, b) => b.rerankScore - a.rerankScore);
      const topProducts = rerankedProducts.slice(0, 3);

      // Format top posts
      const topPosts = rawPosts.slice(0, 2).map((post) => ({
        id: post.id.toString(),
        title: post.title,
        content: post.content,
        userId: post.user_id.toString(),
        userName: post.user_name,
        similarity: Number(post.similarity.toFixed(4)),
      }));

      // 4. Gemini Advisor Advice Synthesis
      const advice = await geminiService.generateRecommendationAdvice(
        query.trim(),
        topProducts,
        topPosts
      );

      return reply.send({
        success: true,
        query: query.trim(),
        advice,
        recommendedProducts: topProducts,
        verifiedReviews: topPosts,
      });
    } catch (err: any) {
      app.log.error(err, 'Error generating AI recommendation');
      return reply.status(500).send({
        success: false,
        message: 'Failed to generate recommendation',
        error: err.message,
      });
    }
  });

  /**
   * POST /api/v1/ai/chat
   * Rate-limited multi-turn conversational AI coach with LLM category intent routing,
   * in-category pgvector search, and recursive query suggestion pills.
   */
  app.post(
    '/chat',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
          keyGenerator: (request: any) => {
            const auth = request.headers.authorization;
            if (auth && auth.startsWith('Bearer ')) {
              try {
                const decoded = app.jwt.verify<{ id: string | number }>(auth.slice(7));
                if (decoded?.id) return `user-${decoded.id}`;
              } catch {}
            }
            return request.ip;
          },
        },
      },
    },
    async (request, reply) => {
      const { query, history, currentCategory } = (request.body as {
        query?: string;
        history?: Array<{ role: string; content: string }>;
        currentCategory?: string;
      }) || {};

      if (!query || typeof query !== 'string' || !query.trim()) {
        return reply.status(400).send({ success: false, message: 'Query is required' });
      }

      if (query.length > 500) {
        return reply.status(400).send({ success: false, message: 'Query must not exceed 500 characters' });
      }

      const q = query.trim();
      const safeHistory = Array.isArray(history)
        ? history.slice(-5).filter((h) => h && typeof h.role === 'string' && typeof h.content === 'string')
        : [];

      try {
        // 1. Parallel execution: Category intent classification + 768-dim query embedding
        const [classification, queryVector] = await Promise.all([
          geminiService.classifyQueryIntent(q, safeHistory, currentCategory),
          geminiService.embedText(q),
        ]);

        const vectorStr = `[${queryVector.join(',')}]`;
        const targetCategory = classification.category;

        // 2. In-Category Products Cosine Search
        let rawProducts = await prisma.$queryRawUnsafe<RawProductMatch[]>(
          `SELECT id, name, description, category_id, price, stock_quantity, image_url,
                  (1 - (embedding <=> $1::vector))::float as similarity
           FROM products
           WHERE stock_quantity > 0
             AND ($2::text = 'all' OR category_id = $2)
             AND embedding IS NOT NULL
           ORDER BY embedding <=> $1::vector ASC
           LIMIT 6;`,
          vectorStr,
          targetCategory
        );

        // Fallback to all categories if fewer than 3 items found in isolated category
        if (targetCategory !== 'all' && rawProducts.length < 3) {
          const fallbackProducts = await prisma.$queryRawUnsafe<RawProductMatch[]>(
            `SELECT id, name, description, category_id, price, stock_quantity, image_url,
                    (1 - (embedding <=> $1::vector))::float as similarity
             FROM products
             WHERE stock_quantity > 0
               AND embedding IS NOT NULL
             ORDER BY embedding <=> $1::vector ASC
             LIMIT 6;`,
            vectorStr
          );
          const existingIds = new Set(rawProducts.map((p) => p.id));
          for (const fb of fallbackProducts) {
            if (!existingIds.has(fb.id)) {
              rawProducts.push(fb);
              existingIds.add(fb.id);
            }
            if (rawProducts.length >= 6) break;
          }
        }

        // 3. Community Posts Cosine Search
        const rawPosts = await prisma.$queryRawUnsafe<RawPostMatch[]>(
          `SELECT p.id, p.title, p.content, p.user_id, u.name as user_name,
                  (1 - (p.embedding <=> $1::vector))::float as similarity
           FROM posts p
           JOIN users u ON p.user_id = u.id
           WHERE p.embedding IS NOT NULL
           ORDER BY p.embedding <=> $1::vector ASC
           LIMIT 4;`,
          vectorStr
        );

        // 4. Cross-referencing: PostProductTag foreign key +20% boost
        const postIds = rawPosts.map((p) => p.id);
        const postTags = postIds.length > 0
          ? await prisma.postProductTag.findMany({
              where: { postId: { in: postIds } },
              select: { postId: true, productId: true },
            })
          : [];

        const taggedProductIds = new Set(postTags.map((pt) => pt.productId.toString()));

        const rerankedProducts = rawProducts.map((p) => {
          const isTagged = taggedProductIds.has(p.id.toString());
          const score = isTagged ? p.similarity * 1.2 : p.similarity;
          return {
            id: p.id.toString(),
            name: p.name,
            description: p.description,
            categoryId: p.category_id,
            price: Number(p.price),
            stockQuantity: p.stock_quantity,
            imageUrl: p.image_url,
            similarity: Number(p.similarity.toFixed(4)),
            rerankScore: Number(score.toFixed(4)),
            isSocialVerified: isTagged,
          };
        });

        rerankedProducts.sort((a, b) => b.rerankScore - a.rerankScore);
        const topProducts = rerankedProducts.slice(0, 3);

        const topPosts = rawPosts.slice(0, 2).map((post) => ({
          id: post.id.toString(),
          title: post.title,
          content: post.content,
          userId: post.user_id.toString(),
          userName: post.user_name,
          similarity: Number(post.similarity.toFixed(4)),
        }));

        // 5. Generate conversational advice, follow-up question, and recursive suggestion pills
        const chatRes = await geminiService.generateChatResponse(
          q,
          topProducts,
          topPosts,
          safeHistory
        );

        return reply.send({
          success: true,
          query: q,
          detectedCategory: classification.category,
          categoryReason: classification.reason,
          advice: chatRes.advice,
          followUpQuestion: chatRes.followUpQuestion,
          suggestedQueries: chatRes.suggestedQueries,
          recommendedProducts: topProducts,
          verifiedReviews: topPosts,
        });
      } catch (err: any) {
        app.log.error(err, 'Error generating AI chat response');
        return reply.status(500).send({
          success: false,
          message: 'Failed to generate chat response',
          error: err.message,
        });
      }
    }
  );
}

