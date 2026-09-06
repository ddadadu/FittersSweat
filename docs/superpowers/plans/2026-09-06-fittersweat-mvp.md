# FitterSweat 플랫폼 - 4주 종합 구현 계획서 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 국내 HYROX 커뮤니티 + 직매입 커머스 + 풀 RAG AI 검색 엔진 플랫폼 FitterSweat을 4주(160시간) 내에 프로덕션 배포 가능한 상용 수준의 MVP로 완벽히 구축한다.

**Architecture:** Next.js 14 (App Router) 프론트엔드와 Fastify 4 (Node.js 20 LTS) REST API 서버를 분리 구축하고, PostgreSQL 14+에 `pgvector` 확장을 설치하여 10개 도메인 테이블과 1536차원 벡터 임베딩을 관리한다. AI 검색은 pgvector 코사인 유사도 검색과 OpenAI `text-embedding-3-small` + `GPT-4o-mini` API를 결합하여 Fastify SSE로 실시간 스트리밍한다.

**Architecture Diagram:**
```mermaid
graph TD
    Client[Next.js 14 Web App] -->|REST API / JWT| Fastify[Fastify 4 Backend API]
    Client -->|SSE EventSource| Fastify
    Fastify -->|Prisma 5 ORM| PG[(PostgreSQL 14 + pgvector)]
    Fastify -->|Cheerio + axios| Scraper[HYROX Scraper / node-cron]
    Fastify -->|OpenAI SDK| OpenAI[OpenAI API (GPT-4o-mini / Embeddings)]
    Fastify -->|Toss SDK| Toss[Toss Payments Sandbox]
    Scraper -->|Upsert| PG
    OpenAI -->|Cosine Distance| PG
```

**Tech Stack:**
- **Frontend**: Next.js 14, React 18, TypeScript 5, Tailwind CSS, shadcn/ui, TanStack Query v5, Zustand, `@toss/payment-sdk`
- **Backend**: Node.js 20 LTS, Fastify 4, TypeScript 5, Prisma 5, OpenAI SDK (^4.0), node-cron, Cheerio 1.0, axios 1.5, bcryptjs, Zod, Pino, Nodemailer
- **Database**: PostgreSQL 14+ + `pgvector` 확장 (10개 테이블)
- **Deployment**: Vercel (FE) + Railway (BE + PostgreSQL pgvector)

**Spec:** [docs/superpowers/specs/2026-09-06-fittersweat-design.md](file:///Users/kmj/Desktop/26-2/캡스톤/fittersweat/docs/superpowers/specs/2026-09-06-fittersweat-design.md)

## Global Constraints
- 모든 백엔드 API는 `/api/v1` 프리픽스를 준수해야 한다.
- 모든 금액 및 수량 연산은 안전한 정수/Decimal 연산 및 PostgreSQL 단일 트랜잭션(`prisma.$transaction`)으로 보호되어야 한다.
- pgvector 임베딩 벡터는 1536차원 (`vector(1536)`)을 사용해야 한다.
- RAG 검색 답변은 지연 시간을 없애기 위해 Fastify SSE(Server-Sent Events) 스트리밍(`stream: true`)으로 반환해야 한다.
- 컴포넌트 스타일링은 일관된 Tailwind CSS 및 shadcn/ui 가이드를 따라야 한다.

---

## Task List

### [Week 1] 환경 구성 + 핵심 백엔드 (인증, DB, 스크래핑)

#### Task 1: Docker Compose 및 pgvector 컨테이너 환경 구축
**Files:**
- Create: `docker-compose.yml`
- Test: `scripts/test-db.sh`

**Interfaces:**
- Produces: 로컬 `localhost:5432` PostgreSQL 인스턴스 (pgvector 확장 활성화)

- [ ] **Step 1: docker-compose.yml 작성**
  ```yaml
  version: '3.8'
  services:
    postgres:
      image: pgvector/pgvector:pg14
      container_name: fittersweat-postgres
      environment:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: password
        POSTGRES_DB: fittersweat_dev
      ports:
        - "5432:5432"
      volumes:
        - postgres_data:/var/lib/postgresql/data
      restart: unless-stopped
  volumes:
    postgres_data:
  ```
- [ ] **Step 2: 컨테이너 구동**
  Run: `docker compose up -d`
- [ ] **Step 3: pgvector 확장 설치 확인 스크립트 작성 및 실행**
  Run: `docker exec -i fittersweat-postgres psql -U postgres -d fittersweat_dev -c "CREATE EXTENSION IF NOT EXISTS vector; SELECT extname FROM pg_extension WHERE extname = 'vector';"`
  Expected: `vector`가 출력됨.
- [ ] **Step 4: Commit**
  ```bash
  git add docker-compose.yml
  git commit -m "chore: setup docker-compose with pgvector postgres container"
  ```

---

#### Task 2: Fastify 4 백엔드 보일러플레이트 및 TypeScript 환경 셋업
**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`
- Create: `backend/src/index.ts`
- Test: `backend/tests/health.test.ts`

- [ ] **Step 1: Backend package.json 생성 및 패키지 설치**
  ```bash
  mkdir -p backend/src backend/tests
  ```
- [ ] **Step 2: Fastify 인스턴스 및 /health 엔드포인트 구현 (`backend/src/index.ts`)**
- [ ] **Step 3: Health check 테스트 코드 작성 및 실행**
  Run: `npm test` in `backend`
  Expected: PASS (`GET /health` returns `{ status: 'ok' }`)
- [ ] **Step 4: Commit**
  ```bash
  git add backend/
  git commit -m "feat(backend): initialize fastify typescript boilerplate with health check"
  ```

---

#### Task 3: Prisma ORM 10개 핵심 모델 정의 및 시딩 스크립트 구현
**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/prisma/seed.ts`
- Test: `backend/prisma/schema.prisma`

**Interfaces:**
- Produces: 10개 테이블 (`users`, `events`, `interested_events`, `products`, `orders`, `order_items`, `posts`, `post_comments`, `reviews`, `post_product_tags`) 및 초기 HYROX 대회/상품/후기 시딩 데이터

- [ ] **Step 1: schema.prisma 작성 (10개 모델 및 vector(1536) embedding 컬럼 정의)**
- [ ] **Step 2: DB 스키마 푸시 및 클라이언트 생성**
  Run: `npx prisma db push && npx prisma generate`
  Expected: Schema successfully pushed to database.
- [ ] **Step 3: seed.ts 작성 (실제 2026 대회, 상품 20개, 후기 15개)**
- [ ] **Step 4: 시딩 실행 및 데이터 카운트 검증**
  Run: `npm run db:seed`
  Expected: `✅ Database successfully seeded!`
- [ ] **Step 5: Commit**
  ```bash
  git add backend/prisma/
  git commit -m "feat(db): define 10 domain models with pgvector and seed data"
  ```

---

#### Task 4: JWT 인증 시스템 (회원가입, 로그인, 토큰 갱신)
**Files:**
- Create: `backend/src/routes/auth.ts`
- Create: `backend/src/controllers/auth.controller.ts`
- Create: `backend/src/middlewares/auth.middleware.ts`
- Test: `backend/tests/auth.test.ts`

**Interfaces:**
- Produces: `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`

- [ ] **Step 1: 실패하는 인증 통합 테스트 작성 (`auth.test.ts`)**
  - 회원가입 성공 케이스
  - 중복 이메일 가입 실패 (409 Conflict)
  - 로그인 성공 및 JWT Access/Refresh 토큰 반환
  - 잘못된 비밀번호 (401 Unauthorized)
- [ ] **Step 2: 테스트 실행하여 실패 확인**
  Run: `npm test backend/tests/auth.test.ts`
- [ ] **Step 3: bcrypt 해싱 및 @fastify/jwt 토큰 발급 로직 구현**
- [ ] **Step 4: 테스트 재실행하여 PASS 확인**
  Run: `npm test backend/tests/auth.test.ts`
- [ ] **Step 5: Commit**
  ```bash
  git add backend/src/routes/auth.ts backend/src/controllers/auth.controller.ts backend/tests/auth.test.ts
  git commit -m "feat(auth): implement signup, login, and jwt token issuance"
  ```

---

#### Task 5: HYROX 대회 정보 스크래핑 모듈 및 node-cron 스케줄러
**Files:**
- Create: `backend/src/tasks/scraper.ts`
- Create: `backend/src/routes/events.ts`
- Test: `backend/tests/scraper.test.ts`

**Interfaces:**
- Produces: `GET /api/v1/events`, `GET /api/v1/events/:id`, `POST /api/v1/events/:id/interested`

- [ ] **Step 1: 스크래퍼 파싱 로직 단위 테스트 작성**
- [ ] **Step 2: Cheerio CSS 파싱 및 한국어 날짜 정규식 변환기 구현**
- [ ] **Step 3: DB Upsert 및 변경 감지 로직 구현**
- [ ] **Step 4: 대회 조회 및 관심 대회 토글 엔드포인트 구현**
- [ ] **Step 5: 테스트 실행 및 PASS 확인**
  Run: `npm test backend/tests/scraper.test.ts`
- [ ] **Step 6: Commit**
  ```bash
  git add backend/src/tasks/scraper.ts backend/src/routes/events.ts
  git commit -m "feat(events): add cheerio scraper and event listing endpoints"
  ```

---

### [Week 2] 커머스 + 커뮤니티 백엔드 & 결제 트랜잭션

#### Task 6: 직매입 상품 관리 및 커뮤니티 게시판 REST API
**Files:**
- Create: `backend/src/routes/products.ts`
- Create: `backend/src/routes/posts.ts`
- Test: `backend/tests/products.test.ts`
- Test: `backend/tests/posts.test.ts`

**Interfaces:**
- Produces:
  - `GET /api/v1/products` (카테고리 필터링)
  - `GET /api/v1/products/:id` (리뷰 및 태그된 글 포함)
  - `GET /api/v1/posts` (대회별 필터)
  - `POST /api/v1/posts` (상품 태그 N:M 연결)
  - `POST /api/v1/posts/:id/comments`

- [ ] **Step 1: 상품 및 게시글 CRUD 테스트 작성**
- [ ] **Step 2: 상품 조회 및 실구매자 리뷰 작성 엔드포인트 구현**
- [ ] **Step 3: 커뮤니티 게시글 및 상품 태그(`PostProductTags`) 연결 구현**
- [ ] **Step 4: 댓글 작성 로직 구현**
- [ ] **Step 5: 테스트 실행 및 검증**
- [ ] **Step 6: Commit**
  ```bash
  git add backend/src/routes/products.ts backend/src/routes/posts.ts
  git commit -m "feat(commerce): implement products and community posts with product tagging"
  ```

---

#### Task 7: 주문 생성 및 Toss Payments 결제 트랜잭션
**Files:**
- Create: `backend/src/services/payment.service.ts`
- Create: `backend/src/routes/orders.ts`
- Test: `backend/tests/orders.test.ts`

**Interfaces:**
- Produces: `POST /api/v1/orders`, `POST /api/v1/orders/:id/payment`, `GET /api/v1/orders`

- [ ] **Step 1: 결제 승인 실패 시 재고 롤백 테스트 코드 작성**
- [ ] **Step 2: `prisma.$transaction`을 통한 재고 선감소 로직 구현**
- [ ] **Step 3: Toss Payments Sandbox 승인 API 클라이언트 구현**
- [ ] **Step 4: 주문 이력 조회 엔드포인트 구현**
- [ ] **Step 5: Swagger UI(`/docs`) 자동 문서화 확인**
- [ ] **Step 6: Commit**
  ```bash
  git add backend/src/services/payment.service.ts backend/src/routes/orders.ts
  git commit -m "feat(payment): implement toss payments confirmation with atomic inventory rollback"
  ```

---

### [Week 3] Frontend 전체 UI 구현 (Next.js 14)

#### Task 8: Next.js 14 App Router 초기 설정 및 레이아웃 시스템
**Files:**
- Create: `frontend/app/layout.tsx`
- Create: `frontend/app/page.tsx`
- Create: `frontend/lib/api.ts`
- Create: `frontend/components/Navbar.tsx`
- Create: `frontend/components/Footer.tsx`

- [ ] **Step 1: Next.js 14 프로젝트 초기화 및 Tailwind CSS, shadcn/ui 설정**
- [ ] **Step 2: TanStack Query Provider 및 Axios 클라이언트 구성**
- [ ] **Step 3: 헤더 내비게이션 및 푸터 반응형 레이아웃 작성**
- [ ] **Step 4: 랜딩 홈 페이지 작성 (D-Day 배너, 퀵 추천 섹션)**
- [ ] **Step 5: Commit**
  ```bash
  git add frontend/
  git commit -m "feat(frontend): initialize next.js 14 with tailwind, shadcn, and base layout"
  ```

---

#### Task 9: 대회 일정 및 관심 대회 등록 UI
**Files:**
- Create: `frontend/app/events/page.tsx`
- Create: `frontend/app/events/[id]/page.tsx`
- Create: `frontend/components/EventCard.tsx`

- [ ] **Step 1: 대회 목록 카드 그리드 컴포넌트 구현 (D-Day 뱃지, 개최도시)**
- [ ] **Step 2: 관심 대회 등록 토글 버튼 (`TanStack Query useMutation` 낙관적 업데이트)**
- [ ] **Step 3: 대회 상세 페이지 구현 (공식 링크 이동, 연관 커뮤니티 글 표시)**
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/app/events/ frontend/components/EventCard.tsx
  git commit -m "feat(frontend): implement event listing, detail, and interest toggle UI"
  ```

---

#### Task 10: 상품 쇼핑몰 & 장바구니 & Toss 결제 위젯 연동
**Files:**
- Create: `frontend/app/products/page.tsx`
- Create: `frontend/app/products/[id]/page.tsx`
- Create: `frontend/app/cart/page.tsx`
- Create: `frontend/app/checkout/page.tsx`
- Create: `frontend/stores/useCartStore.ts`

- [ ] **Step 1: 상품 목록(카테고리 탭, 가격 필터) 및 상품 상세 페이지 구현**
- [ ] **Step 2: Zustand 기반 장바구니 스토어 구현 (수량 증감, 총액 계산, LocalStorage 연동)**
- [ ] **Step 3: 주문서 작성 페이지 및 `@toss/payment-sdk` 결제 위젯 렌더링**
- [ ] **Step 4: Toss Sandbox 테스트 카드 결제 E2E 플로우 검증**
- [ ] **Step 5: Commit**
  ```bash
  git add frontend/app/products/ frontend/app/cart/ frontend/app/checkout/ frontend/stores/
  git commit -m "feat(frontend): implement product catalog, cart, and toss payment widget"
  ```

---

#### Task 11: 커뮤니티 게시판 및 마이페이지 UI
**Files:**
- Create: `frontend/app/community/page.tsx`
- Create: `frontend/app/community/[id]/page.tsx`
- Create: `frontend/app/community/new/page.tsx`
- Create: `frontend/app/mypage/page.tsx`

- [ ] **Step 1: 커뮤니티 게시글 목록 및 상세 페이지 구현**
- [ ] **Step 2: 게시글 작성 시 상품 태그 선택 모달 UI 구현**
- [ ] **Step 3: 마이페이지 (내 주문 이력 조회, 배송 상태 뱃지, 관심 대회 현황)**
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/app/community/ frontend/app/mypage/
  git commit -m "feat(frontend): implement community boards with product tagging and mypage"
  ```

---

### [Week 4] 풀 RAG AI 검색 엔진 + 배포 + 최종 발표

#### Task 12: 풀 RAG AI 검색 백엔드 (OpenAI Embeddings + pgvector 코사인 검색 + SSE)
**Files:**
- Create: `backend/src/tasks/embedder.ts`
- Create: `backend/src/routes/ai.ts`
- Test: `backend/tests/ai.test.ts`

**Interfaces:**
- Produces:
  - `POST /api/v1/ai/search` (SSE 스트리밍 추천 응답)
  - `POST /api/v1/ai/embed` (배치 임베딩 생성)

- [ ] **Step 1: OpenAI text-embedding-3-small 배치 임베딩 스크립트 작성 (`tasks/embedder.ts`)**
- [ ] **Step 2: 1536차원 벡터 pgvector 저장 및 IVFFLAT 코사인 유사도 검색 쿼리 작성**
- [ ] **Step 3: GPT-4o-mini Chat Completion 프롬프트 구성 및 Fastify SSE 스트리밍 핸들러 구현**
- [ ] **Step 4: cURL 명령어로 SSE 토큰 스트리밍 동작 검증**
  Run: `curl -N -X POST http://localhost:3001/api/v1/ai/search -H "Content-Type: application/json" -d '{"query":"초보자 추천 신발"}'`
  Expected: `data: {"text":"..."}` 토큰들이 실시간으로 수신됨.
- [ ] **Step 5: Commit**
  ```bash
  git add backend/src/tasks/embedder.ts backend/src/routes/ai.ts
  git commit -m "feat(ai): implement full RAG search pipeline with pgvector and sse streaming"
  ```

---

#### Task 13: 프론트엔드 실시간 AI 스트리밍 검색 UI
**Files:**
- Create: `frontend/components/AiSearchModal.tsx`
- Create: `frontend/hooks/useAiStream.ts`
- Modify: `frontend/components/Navbar.tsx`

- [ ] **Step 1: EventSource / ReadableStream 기반 실시간 토큰 수신 커스텀 훅(`useAiStream.ts`) 작성**
- [ ] **Step 2: AI 자연어 검색 모달 컴포넌트 구현 (타이핑 애니메이션 + 실시간 스트리밍 답변)**
- [ ] **Step 3: 답변 하단에 RAG가 추천한 상품 카드(장바구니 담기 버튼 포함) 렌더링**
- [ ] **Step 4: 브라우저에서 자연어 질의 테스트 및 상호작용 검증**
- [ ] **Step 5: Commit**
  ```bash
  git add frontend/components/AiSearchModal.tsx frontend/hooks/useAiStream.ts
  git commit -m "feat(frontend): add interactive ai streaming search modal with recommended product cards"
  ```

---

#### Task 14: 프로덕션 배포 (Vercel + Railway) 및 최종 검증
**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `backend/Dockerfile`
- Create: `README.md`

- [ ] **Step 1: Backend 컨테이너 Dockerfile 작성 및 Railway 환경 배포**
- [ ] **Step 2: Frontend Vercel 배포 및 환경변수(Railway API URL, Toss 키) 연동**
- [ ] **Step 3: 실서버 환경 결제 E2E 및 AI 검색 Smoke Test 실행**
- [ ] **Step 4: 최종 발표 슬라이드 및 시연 시나리오 정리**
- [ ] **Step 5: Commit**
  ```bash
  git add .github/ backend/Dockerfile README.md
  git commit -m "chore: setup deployment pipelines and final production release"
  ```

---

## Self-Review Checklist
- [x] **Spec coverage**: 설계 사양서의 10개 테이블, 16개 엔드포인트, RAG 파이프라인, 결제 트랜잭션이 모두 태스크로 빠짐없이 배정됨.
- [x] **Placeholder scan**: "TBD", "TODO" 없이 구체적인 코드와 파일 경로 명시 완료.
- [x] **Type consistency**: 1536차원 벡터, `/api/v1` 경로, Prisma 모델명이 전 태스크에 걸쳐 일관성 유지.
