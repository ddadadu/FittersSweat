import { buildApp } from './app';

async function start() {
  const app = await buildApp();
  const port = parseInt(process.env.PORT || '3001', 10);

  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`✅ FitterSweat Backend running on http://localhost:${port}`);
    console.log(`📄 Swagger UI available at http://localhost:${port}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
