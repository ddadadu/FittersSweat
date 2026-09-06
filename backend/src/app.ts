import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';

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

  // Health check
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'FitterSweat Backend',
      database: 'connected',
    };
  });

  return app;
}
