import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { eventRoutes } from './routes/events';
import { productRoutes } from './routes/products';
import { postRoutes } from './routes/posts';

dotenv.config();

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : true,
  });

  // CORS
  await app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger OpenAPI 3.0
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'FitterSweat API',
        version: '1.0.0',
        description: 'HYROX 커뮤니티 커머스 플랫폼 REST API',
      },
    },
  });
  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // JWT
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback-secret-for-development-32chars',
  });

  // Health check
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'FitterSweat Backend',
      database: 'connected',
    };
  });

  // Auth Routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' });

  // Event Routes
  await app.register(eventRoutes, { prefix: '/api/v1/events' });

  // Product Routes
  await app.register(productRoutes, { prefix: '/api/v1/products' });

  // Post Routes
  await app.register(postRoutes, { prefix: '/api/v1/posts' });

  return app;
}
