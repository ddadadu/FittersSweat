# FitterSweat 올인원 AI 서비스 비서(All-in-One AI Assistant) 상세 설계 명세서

## 1. 개요 (Overview)
본 명세서는 FitterSweat 챗봇을 단순 장비 추천기에서 탈피하여, 사용자 질의 의도에 따라 **(1) 장비 맞춤 추천 (RAG)**, **(2) 실시간 글로벌/국내 대회 일정 조회 및 1탭 내비게이션 (DB 연동)**, **(3) 수석 기어 피터 페르소나 일상 대화 및 서비스 안내 (General Chat)**를 지능적으로 분기 처리하는 '올인원 AI 서비스 비서'로 고도화하기 위한 기술 및 UI/UX 설계 사양을 정의한다.

---

## 2. 사용자 경험 및 UI/UX 디자인 사양 (`ui-ux-pro-max`)

### 2.1 Dark Athletic 디자인 토큰
* **Background Surface**: `#141414` (Drawer), `#1A1A1A` (Bubble), `#262626` (Badges/Chips)
* **Accent & Interactive**: `#FFD700` (HYROX Gold, hover: `#FFE44D`, ring: `#FFD700/50`)
* **Borders & Dividers**: `#2B2B2B` (Subtle 1px border), `#374151` (Input)
* **Typography**:
  * Body: `text-xs sm:text-sm text-neutral-200 leading-relaxed` (WCAG AA 대비 4.5:1 이상 충족)
  * Coach Badge: `FITTERCOACH` (Barlow Condensed 느낌의 bold italic, `text-[#FFD700]`)
* **Motion & Transition**: `transition-colors duration-200`, `active:scale-[0.98]`

### 2.2 의도별 반응형 레이아웃 분기
| 질의 의도 (Intent) | 상단 영역 | 본문 영역 | 하단 영역 |
| :--- | :--- | :--- | :--- |
| **`gear_recommend`** | `MiniProductCard` 스와이프 캐러셀 (120px) | 피팅 처방 소견 (최대 500자) | 실전 완주 후기 아코디언 배지 + 연관 질문 칩 |
| **`event_schedule`** | **카드 완전 숨김** (`recommendedProducts: []`) | 대회 일정 리스트 (D-Day 배지 + 인라인 인터랙티브 링크) | 관련 대회 후속 질문 칩 (`["서울 대회 장비 추천", ... ]`) |
| **`general_chat`** | **카드/후기 완전 숨김** | 피터 페르소나 자기소개 및 3대 서비스 안내 텍스트 | 서비스 체험 유도 3대 대표 질문 칩 |

### 2.3 인라인 마크다운 링크 파서
* 말풍선 텍스트 내 `[대회명](경로)` 마크다운을 정규식 파싱하여 렌더링.
* **스타일**: `inline-flex items-center gap-1 text-[#FFD700] hover:text-[#FFE44D] font-semibold underline underline-offset-4 cursor-pointer transition-colors duration-200`
* **동작**: 내부 경로(`/events` 등) 클릭 시 클라이언트 라우팅으로 즉시 이동하여 사용자 이탈 없이 원클릭 탐색 보장.

---

## 3. 백엔드 시스템 아키텍처

### 3.1 하이브리드 인텐트 라우터 (Hybrid Intent Router)
* 파일: `backend/src/services/gemini.service.ts`
* **Fast-Path (정규식 사전 검사, 1ms)**:
  * `event_schedule`: `/대회|일정|경기|접수|스케줄|언제 열려|마라톤|개최|레이스 일정/i` 매칭 시
  * `general_chat`: `/^(안녕|반가워|하이|누구|역할|뭐해|도와줘|소개|반갑습니다)/i` 매칭 시
  * `gear_recommend`: `/신발|러닝화|장비|보호대|에너지젤|추천|사이즈|구매/i` 매칭 시
* **LLM Deep-Path (모호한 질의)**:
  * 정규식 불일치 시 `gemini-3.5-flash-lite`에 질의하여 JSON 출력:
    ```json
    {
      "intentType": "gear_recommend" | "event_schedule" | "general_chat",
      "category": "shoes" | "nutrition" | "gear" | "equipment" | "all",
      "eventFilters": { "country": "대한민국", "status": "upcoming" }
    }
    ```

### 3.2 실시간 대회 일정 검색 엔진
* 파일: `backend/src/services/event-advisor.service.ts`
* **Prisma 쿼리 규칙**:
  * `status`: 'upcoming' (기본값) 또는 질의에 따라 'past' / 'all'
  * `country`: 질의에 "대한민국/한국/서울/인천" 포함 시 `{ contains: '대한민국' }`
  * `orderBy`: `{ startDate: 'asc' }`, `take: 4`
* **텍스트 합성 (`gemini-3.5-flash-lite`)**:
  * 각 대회의 명칭, 개최일, 장소, D-Day 계산 정보를 마크다운 리스트로 작성.
  * 대회별 바로가기 링크(`[AirAsia HYROX Seoul 2026](/events)`) 포함.

### 3.3 일상 대화 및 서비스 길잡이 핸들러
* 질의: "안녕 챗봇 피터 넌 어떤 역할을 수행해?"
* 답변 페르소나:
  * FitterSweat 수석 기어 피터로서의 정체성.
  * 3대 핵심 지원 역량:
    1. 8개 스테이션별 최적의 직매입 기어 1:1 맞춤 피팅 처방.
    2. 국내 및 글로벌 HYROX 대회 일정 및 접수 현황 안내.
    3. 실제 완주자들의 검증된 후기 데이터 기반 신뢰성 높은 팁 제공.
* 반환 형식: `recommendedProducts: []`, `reviews: []`.

---

## 4. 인터페이스 정의 (TypeScript)

```typescript
// backend/src/services/gemini.service.ts
export type IntentType = 'gear_recommend' | 'event_schedule' | 'general_chat';

export interface ComprehensiveIntent {
  intentType: IntentType;
  category?: 'nutrition' | 'shoes' | 'gear' | 'equipment' | 'all';
  eventFilters?: {
    country?: string;
    continent?: string;
    status?: 'upcoming' | 'past' | 'all';
  };
  reason: string;
}

export interface ChatAdvisorResponse {
  intentType?: IntentType;
  advice: string;
  followUpQuestion: string;
  suggestedQueries: string[];
}
```

---

## 5. 검증 계획 (Verification Plan)

1. **단위 테스트**:
   * `gemini.service.test.ts`: 하이브리드 인텐트 라우터 3-Way 분기 정확도 검증.
   * `event-advisor.test.ts`: Prisma `events` 테이블 조건별 필터링 및 D-Day 링크 합성 검증.
2. **통합 테스트 (`ai.test.ts`)**:
   * `POST /api/v1/ai/chat` 시나리오 1: 일상 대화 질의 시 `recommendedProducts: []` 및 피터 소개 텍스트 검증.
   * `POST /api/v1/ai/chat` 시나리오 2: 한국 대회 일정 질의 시 서울/인천 대회 링크 마크다운 및 `recommendedProducts: []` 검증.
   * `POST /api/v1/ai/chat` 시나리오 3: 발볼 신발 추천 질의 시 Post 5 (0.8437) 및 신발 카드 정상 반환 검증.
3. **프론트엔드 빌드 및 브라우저 검증**:
   * `npm --prefix frontend build` 통과.
   * 마크다운 링크 클릭 시 `/events` 페이지 정상 이동 및 카드 숨김 레이아웃 확인.
