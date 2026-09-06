import axios from 'axios';
import * as cheerio from 'cheerio';
import cron from 'node-cron';
import { PrismaClient, EventStatus } from '@prisma/client';

const prisma = new PrismaClient();

export function parseKoreanDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d+)\.\s+(\d+)월\.\s+(\d+)/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}

export interface ScrapedEvent {
  name: string;
  cityCode: string;
  startDate: Date;
  endDate: Date;
  eventUrl: string;
}

export async function scrapeHyroxEvents(): Promise<ScrapedEvent[]> {
  const url = 'https://hyroxsouthkorea.com/ko/레이스-찾기/';

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FitterSweat-Bot/1.0)',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const events: ScrapedEvent[] = [];

    $('.event-card, [class*="event-item"]').each((_, el) => {
      const name = $(el).find('h2, h3, [class*="title"]').text().trim();
      const cityCode = $(el).find('[class*="city"], [class*="code"]').text().trim() || 'SEL';
      const dateText = $(el).find('[class*="date"]').text().trim();
      const link = $(el).find('a').attr('href') || '';

      const [startStr, endStr] = dateText.split(/[~–-]/).map((s) => s.trim());
      const startDate = parseKoreanDate(startStr);
      const endDate = endStr ? parseKoreanDate(endStr) : startDate;

      if (name && startDate && endDate) {
        events.push({
          name,
          cityCode: cityCode.toUpperCase(),
          startDate,
          endDate,
          eventUrl: link.startsWith('http') ? link : `https://hyroxsouthkorea.com${link}`,
        });
      }
    });

    // DB Upsert
    for (const item of events) {
      await prisma.event.upsert({
        where: {
          uq_city_start_date: {
            cityCode: item.cityCode,
            startDate: item.startDate,
          },
        },
        update: {
          name: item.name,
          endDate: item.endDate,
          eventUrl: item.eventUrl,
          status: EventStatus.upcoming,
        },
        create: {
          name: item.name,
          cityCode: item.cityCode,
          startDate: item.startDate,
          endDate: item.endDate,
          eventUrl: item.eventUrl,
          status: EventStatus.upcoming,
        },
      });
    }

    return events;
  } catch (error) {
    console.warn('⚠️ HYROX scraping notice (using seeded events if offline):', (error as any)?.message);
    return [];
  }
}

export function startEventScraper() {
  // 매일 자정에 자동 실행
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Running daily HYROX event scraper...');
    const result = await scrapeHyroxEvents();
    console.log(`✅ Scraper finished: processed ${result.length} events`);
  });
}
