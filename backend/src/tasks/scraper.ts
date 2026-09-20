import axios from 'axios';
import * as cheerio from 'cheerio';
import cron from 'node-cron';
import { PrismaClient, EventStatus } from '@prisma/client';
import { resolveCityInfo } from '../constants/cities';

const prisma = new PrismaClient();

export function parseKoreanDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const cleaned = dateStr.replace(/^[–\-~]\s*/, '').trim();
  const match = cleaned.match(/(\d+)\.\s+(\d+)월\.\s+(\d+)/);
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
  city: string;
  country: string;
  continent: string;
  division: string;
  imageUrl: string | null;
  startDate: Date;
  endDate: Date;
  eventUrl: string;
}

export async function scrapeHyroxEvents(): Promise<ScrapedEvent[]> {
  const url = 'https://hyroxsouthkorea.com/ko/레이스-찾기/';

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const events: ScrapedEvent[] = [];

    $('.w-grid-item.type-event').each((_, el) => {
      const $el = $(el);
      const classes = ($el.attr('class') || '').split(/\s+/);
      const continentClass = classes.find((c) => c.startsWith('continent-')) || '';
      const isYoungstars = classes.includes('type-youngstars');
      const division = isYoungstars ? 'Youngstars' : 'Adults';

      const name = $el.find('.post_title a').text().trim();
      const link = $el.find('.post_title a').attr('href') || '';
      const cityCode = $el.find('.event_city_letter_code').text().trim().toUpperCase();
      const date1Text = $el.find('.event_date_1').text().trim();
      const date3Text = $el.find('.event_date_3').text().trim();
      const img = $el.find('img').attr('src') || null;

      const startDate = parseKoreanDate(date1Text);
      const endDate = date3Text ? parseKoreanDate(date3Text) : startDate;

      if (name && cityCode && startDate && endDate) {
        const resolved = resolveCityInfo(cityCode, continentClass);

        events.push({
          name,
          cityCode,
          city: resolved.city,
          country: resolved.country,
          continent: resolved.continent,
          division,
          imageUrl: img,
          startDate,
          endDate,
          eventUrl: link.startsWith('http') ? link : `https://hyroxsouthkorea.com${link}`,
        });
      }
    });

    console.log(`📡 Scraped ${events.length} HYROX global events. Upserting to DB...`);

    // DB Upsert in chunks of 10 for fast batching
    const CHUNK_SIZE = 10;
    for (let i = 0; i < events.length; i += CHUNK_SIZE) {
      const chunk = events.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map((item) =>
          prisma.event.upsert({
            where: {
              uq_city_start_date: {
                cityCode: item.cityCode,
                startDate: item.startDate,
              },
            },
            update: {
              name: item.name,
              continent: item.continent,
              country: item.country,
              city: item.city,
              division: item.division,
              imageUrl: item.imageUrl,
              endDate: item.endDate,
              eventUrl: item.eventUrl,
              status: EventStatus.upcoming,
            },
            create: {
              name: item.name,
              cityCode: item.cityCode,
              continent: item.continent,
              country: item.country,
              city: item.city,
              division: item.division,
              imageUrl: item.imageUrl,
              startDate: item.startDate,
              endDate: item.endDate,
              eventUrl: item.eventUrl,
              status: EventStatus.upcoming,
            },
          })
        )
      );
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

