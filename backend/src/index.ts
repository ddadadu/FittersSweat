import { buildApp } from './app';
import { startEventScraper } from './tasks/scraper';

async function start() {
  const app = await buildApp();
  const port = parseInt(process.env.PORT || '3001', 10);

  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`✅ FitterSweat Backend running on http://localhost:${port}`);
    console.log(`📄 Swagger UI available at http://localhost:${port}/docs`);

    // 매일 자정 HYROX 대회 일정 자동 스크래핑 시작
    startEventScraper();
    console.log('🕛 Daily HYROX event scraper registered (runs at 00:00 KST)');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
