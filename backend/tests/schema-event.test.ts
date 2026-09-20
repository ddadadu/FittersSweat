import { PrismaClient } from '@prisma/client';

describe('Event Schema Extension Test', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should support continent, country, city, division, and imageUrl fields in Event model', async () => {
    const testCityCode = 'TST';
    const testStartDate = new Date('2099-01-01');

    const created = await (prisma.event as any).upsert({
      where: {
        uq_city_start_date: {
          cityCode: testCityCode,
          startDate: testStartDate,
        },
      },
      update: {},
      create: {
        name: 'HYROX Test Event',
        cityCode: testCityCode,
        continent: '아시아-태평양 (Asia-Pacific)',
        country: '대한민국 (South Korea)',
        city: '테스트시 (Test City)',
        division: 'Adults',
        imageUrl: 'https://example.com/test.jpg',
        startDate: testStartDate,
        endDate: new Date('2099-01-02'),
        eventUrl: 'https://hyrox.com',
      },
    });

    expect(created.continent).toBe('아시아-태평양 (Asia-Pacific)');
    expect(created.country).toBe('대한민국 (South Korea)');
    expect(created.city).toBe('테스트시 (Test City)');
    expect(created.division).toBe('Adults');
    expect(created.imageUrl).toBe('https://example.com/test.jpg');

    // Clean up
    await prisma.event.delete({
      where: { id: created.id },
    });
  }, 15000);
});
