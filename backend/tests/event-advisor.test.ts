import dotenv from 'dotenv';
dotenv.config();
import { EventAdvisorService } from '../src/services/event-advisor.service';

describe('EventAdvisorService', () => {
  jest.setTimeout(25000);
  let service: EventAdvisorService;

  beforeAll(() => {
    service = new EventAdvisorService();
  });

  afterAll(async () => {
    await service.destroy();
  });

  it('queries upcoming Korean events and returns formatted advice with markdown links', async () => {
    const query = '현재 종료되지 않은 대한민국 대회 일정 알려줘';
    const result = await service.handleEventQuery(query, {
      country: '대한민국',
      status: 'upcoming',
    });

    expect(result).toHaveProperty('advice');
    expect(typeof result.advice).toBe('string');
    expect(result.advice.length).toBeGreaterThan(10);
    // Must contain markdown link pointing to /events
    expect(result.advice).toContain('/events');
    // Must contain Korean events like Seoul or Incheon
    expect(result.advice).toMatch(/서울|인천|HYROX/);

    expect(result).toHaveProperty('followUpQuestion');
    expect(Array.isArray(result.suggestedQueries)).toBe(true);
    expect(result.suggestedQueries.length).toBeGreaterThanOrEqual(2);
  });

  it('handles query with no filter by returning next upcoming global events', async () => {
    const query = '앞으로 예정된 하이록스 대회 일정 알려줘';
    const result = await service.handleEventQuery(query, {
      status: 'upcoming',
    });

    expect(result.advice).toContain('/events');
    expect(result.suggestedQueries.length).toBeGreaterThanOrEqual(2);
  });
});
