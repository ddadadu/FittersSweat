import { PrismaClient } from '@prisma/client';
import { geminiService, ComprehensiveIntent, ChatAdvisorResponse } from './gemini.service';

export class EventAdvisorService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  async destroy() {
    await this.prisma.$disconnect();
  }

  /**
   * Queries events matching user filters and synthesizes an encouraging guidance message with markdown links.
   */
  async handleEventQuery(
    query: string,
    filters?: ComprehensiveIntent['eventFilters']
  ): Promise<ChatAdvisorResponse> {
    const status = filters?.status === 'past' ? 'past' : 'upcoming';
    const whereClause: any = { status };

    if (filters?.country) {
      whereClause.country = { contains: filters.country };
    }

    const events = await this.prisma.event.findMany({
      where: whereClause,
      orderBy: { startDate: 'asc' },
      take: 4,
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    if (events.length === 0) {
      return {
        intentType: 'event_schedule',
        advice: `현재 검색 조건에 해당하는 예정된 대회가 없습니다. 전체 글로벌 일정을 확인하시려면 **[전체 대회 일정 보러가기](/events)**를 확인해주세요.`,
        followUpQuestion: '다른 국가나 대륙의 대회 일정도 확인해 드릴까요?',
        suggestedQueries: [
          '전체 대회 일정 확인하기',
          '대회 준비 필수 기어 추천받기',
          '레이서 완주 후기 보러가기',
        ],
      };
    }

    // Format events with D-Day and markdown links
    const now = Date.now();
    const eventSummaries = events.map((ev, idx) => {
      const start = new Date(ev.startDate);
      const dateStr = `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, '0')}.${String(start.getDate()).padStart(2, '0')}`;
      const diffDays = Math.ceil((start.getTime() - now) / (1000 * 60 * 60 * 24));
      const dDayText = diffDays > 0 ? `D-${diffDays}` : diffDays === 0 ? 'D-Day' : '종료';
      return `${idx + 1}. **[${ev.name}](/events)** (${dDayText}, ${dateStr} / ${ev.city})`;
    });

    const fallbackAdvice = `현재 확인되는 주요 대회 일정입니다:\n\n${eventSummaries.join('\n')}\n\n목표하시는 대회를 클릭하시면 상세 일정과 장소 정보를 확인하실 수 있습니다. 출전을 원하시는 대회의 코스나 준비 장비에 대해 언제든 물어보세요!`;

    // Attempt Gemini synthesis for conversational polish
    try {
      if ((geminiService as any).isMock || !(geminiService as any).genAI) {
        return {
          intentType: 'event_schedule',
          advice: fallbackAdvice,
          followUpQuestion: '목표하시는 대회나 필요한 전용 레이스 기어가 있으신가요?',
          suggestedQueries: [
            `${events[0].name} 준비 기어 추천`,
            '전체 대회 일정 보러가기',
            '슬레드 푸시 접지화 추천해줘',
          ],
        };
      }

      const model = (geminiService as any).genAI.getGenerativeModel({
        model: 'gemini-3.5-flash-lite',
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 500 },
      });

      const prompt = `당신은 HYROX 전문 수석 기어 피터입니다. 사용자 질문과 조회된 공식 대회 목록을 기반으로 친절하고 명확한 대회 안내를 작성하세요.
반드시 각 대회마다 마크다운 링크 [대회명](/events) 형태를 유지해야 합니다.

[사용자 질문]: "${query}"
[조회된 대회]:
${eventSummaries.join('\n')}

JSON 출력 규격:
{
  "advice": "500자 이내 마크다운 대회 안내 텍스트 ([대회명](/events) 링크 필수 포함)",
  "followUpQuestion": "출전 준비 또는 장비 필요성을 묻는 1문장의 후속 질문",
  "suggestedQueries": ["추천 칩 1", "추천 칩 2", "추천 칩 3"]
}`;

      const res = await model.generateContent(prompt);
      const parsed = JSON.parse(res.response.text().trim());
      if (parsed.advice && parsed.followUpQuestion && Array.isArray(parsed.suggestedQueries)) {
        return {
          intentType: 'event_schedule',
          advice: parsed.advice.slice(0, 500),
          followUpQuestion: parsed.followUpQuestion,
          suggestedQueries: parsed.suggestedQueries.slice(0, 4),
        };
      }
      return {
        intentType: 'event_schedule',
        advice: fallbackAdvice,
        followUpQuestion: '목표하시는 대회가 있으신가요? 코스에 맞는 장비를 추천해 드릴 수 있습니다.',
        suggestedQueries: [
          `${events[0].name} 준비 기어 추천`,
          '전체 대회 일정 보러가기',
          '레이스 필수 장비 풀세트 보기',
        ],
      };
    } catch {
      return {
        intentType: 'event_schedule',
        advice: fallbackAdvice,
        followUpQuestion: '목표하시는 대회가 있으신가요? 코스에 맞는 장비를 추천해 드릴 수 있습니다.',
        suggestedQueries: [
          `${events[0].name} 준비 기어 추천`,
          '전체 대회 일정 보러가기',
          '레이스 필수 장비 풀세트 보기',
        ],
      };
    }
  }
}

export const eventAdvisorService = new EventAdvisorService();
