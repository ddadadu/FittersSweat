# Google Gemini 실시간 의미 벡터(Semantic Vector) 임베딩 재추출 및 RAG 파이프라인 고도화 계획서 (10% 키워드 가산점 적용)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 발급된 Google Gemini API Key를 백엔드 및 실운영 환경에 등록하고, 임베딩 모델(`gemini-embedding-001`, 768차원 MRL) 및 언어 모델(`gemini-3.6-flash`)로 서비스 모듈을 업데이트한 후, 400개 직매입 상품과 152개 커뮤니티 게시글 전체의 의미 벡터를 재추출·적재하며, 검색 파이프라인에 **키워드 직접 일치 +10% 가산점(Lexical Boost)**을 적용하여 "발볼 넓은 러너 적합 신발 추천" 질의 시 5번 게시글(와이드 핏 실착기)과 연관 장비가 1순위로 정확히 추천되도록 구축한다.

**Architecture:**
기존 ASCII 문자열 해시 기반의 가짜 난수 벡터(`generateMockEmbedding`)를 완전히 대체하고, Google의 최신 `gemini-embedding-001` 모델에 `outputDimensionality: 768` 옵션을 적용하여 기존 PostgreSQL `vector(768)` 스키마 변경 없이 완벽한 호환성을 유지한다. 질의 분류 및 어드바이저 생성은 구글 신규 프로젝트에서 유일하게 지원되는 정식 모델인 `gemini-3.6-flash`로 연동하며, 일괄 임베딩 스크립트(`embed-catalog.ts`)를 통해 400개 상품과 152개 게시글을 1회 배치 적재한다. RAG 검색 파이프라인([`backend/src/routes/ai.ts`](file:///Users/kmj/Desktop/26-2/캡스톤/fittersweat/backend/src/routes/ai.ts))은 코사인 유사도 검색(`LIMIT 8`) 후, 질의어의 핵심 키워드(예: "발볼", "와이드", "신발" 등 2자 이상의 명사/형용사)가 게시글 제목이나 본문에 직접 일치하는 경우 **+10% 가산점(`similarity * 1.10`)**을 부여하여 재정렬함으로써, 순수 벡터 공간의 수치 왜곡이나 키워드 희석으로 인한 오매칭을 원천 차단한다.

**Architecture Diagram:**

```mermaid
flowchart TD
    subgraph UserInteraction ["사용자 질의 (Frontend)"]
        UserQuery["질의: '발볼 넓은 러너 적합 신발 추천'"]
    end

    subgraph GeminiAI ["Google Gemini API (API Key 연동)"]
        EmbedAPI["gemini-embedding-001<br>(outputDimensionality: 768)"]
        FlashLLM["gemini-3.6-flash<br>(Advisor Response Synthesis)"]
    end

    subgraph BackendRAG ["Fastify Backend (/api/v1/ai)"]
        EmbedService["gemini.service.ts<br>(실제 Gemini API 호출)"]
        DualRetriever["ai.ts Dual Retriever<br>(Products <=> Vector & Posts <=> Vector LIMIT 8)"]
        LexicalBoost["핵심 키워드 직접 일치 시<br>+10% 가산점 (similarity * 1.10)"]
        CrossRank["PostProductTag +20% Reranker"]
    end

    subgraph Database ["PostgreSQL pgvector (Railway)"]
        ProductsTable[("products (400개)<br>embedding vector(768)")]
        PostsTable[("posts (152개)<br>embedding vector(768)<br>[Post 5: 발볼 10.5cm 와이드핏]")]
    end

    UserQuery -->|HTTP POST /api/v1/ai/chat| DualRetriever
    DualRetriever -->|질의 벡터화| EmbedAPI
    EmbedAPI -->|768차원 시맨틱 벡터| DualRetriever
    DualRetriever -->|코사인 유사도 검색| ProductsTable
    DualRetriever -->|코사인 유사도 검색 (상위 8개)| PostsTable
    PostsTable -->|'발볼', '신발' 직접 일치 검사| LexicalBoost
    LexicalBoost -->|5번 게시글 0.7766 * 1.10 = 0.8543 (압도적 1위)| CrossRank
    CrossRank -->|5번 게시글 태그 장비 +20% 부스트| FlashLLM
    FlashLLM -->|5번 후기 인용 맞춤 조언 및 PUMA 추천| UserInteraction
```

**Tech Stack:**
- **AI Models**: Google Gemini `gemini-embedding-001` (768-dim MRL), `gemini-3.6-flash`
- **Backend**: Fastify 4, Prisma ORM 5.5, `@google/generative-ai` 0.21+, pgvector (vector 768)
- **Database**: PostgreSQL 18 (Railway Hosted)
- **Deployment**: Railway Backend, Vercel Frontend

---

## Global Constraints

- `docs/erdcloud_schema.sql`은 절대 수정하거나 커밋하지 않는다 (`.gitignore` 유지).
- 기존 PostgreSQL의 `vector(768)` 컬럼 타입을 변경하지 않는다 (`outputDimensionality: 768` 유지).
- `ponytail` 원칙 준수: 불필요한 서드파티 라이브러리 추가 금지, 기존 Fastify 및 Prisma 구조 유지.
- API Key(`<YOUR_GEMINI_API_KEY>`)는 Git에 하드코딩 커밋하지 않고 환경변수(`.env`, Railway variables)로만 주입한다.
- 키워드 직접 일치 가산점은 정확히 **+10%(`* 1.10`)**로 고정 적용한다.

---

## 🚀 Task-by-Task Implementation Plan

### Task 1: Gemini Service 최신 모델 업데이트 및 API Key 환경변수 등록

**Files:**
- Modify: `backend/.env`
- Modify: `backend/src/services/gemini.service.ts:40-260`
- Test: `backend/tests/gemini.service.test.ts`

**Interfaces:**
- Consumes: `process.env.GEMINI_API_KEY`
- Produces: `geminiService.embedText(text)` (returns 768-dim vector), `geminiService.generateRecommendationAdvice(...)`, `geminiService.classifyQueryIntent(...)`

- [ ] **Step 1: Write the failing unit test**
  `backend/tests/gemini.service.test.ts`에서 실제 768차원 임베딩 반환 및 의미적 유사도(Post 5 > Post 67) 검증 테스트 작성.
- [ ] **Step 2: Update `backend/.env` with provided key**
  `GEMINI_API_KEY="<YOUR_GEMINI_API_KEY>"` 등록.
- [ ] **Step 3: Update `gemini.service.ts`**
  - 임베딩 모델을 `models/gemini-embedding-001` 및 `{ outputDimensionality: 768 }`로 설정.
  - 생성 모델을 `gemini-3.6-flash`로 설정.
- [ ] **Step 4: Run unit test**
  Run: `npx jest tests/gemini.service.test.ts`
  Expected: PASS with 768-dim vector returned.
- [ ] **Step 5: Commit**
  `git commit -m "feat(ai): update gemini service to use gemini-embedding-001 (768-dim) and gemini-3.6-flash"`

---

### Task 2: 카탈로그(400개) 및 커뮤니티(152개) 전체 고차원 시맨틱 임베딩 재추출 및 DB 적재

**Files:**
- Modify: `backend/scripts/embed-catalog.ts`

- [ ] **Step 1: Rate-limit safe batch processing in `embed-catalog.ts`**
  Gemini API의 Quota를 초과하지 않도록 청크 단위(10개) 처리 및 가벼운 딜레이(100ms) 추가.
- [ ] **Step 2: Run batch embedding on Railway DB**
  Run: `npx tsx scripts/embed-catalog.ts`
  Expected: 400개 상품 및 152개 게시글 전수 768차원 실제 시맨틱 임베딩 완료.
- [ ] **Step 3: Direct DB Cosine Similarity Verification**
  "발볼 넓은 러너 적합 신발 추천" 쿼리로 Post 5가 실제 1순위(0.7766)로 도출되는지 검증 쿼리 실행.
- [ ] **Step 4: Commit**
  `git commit -m "script(ai): batch re-embed products and posts with gemini-embedding-001"`

---

### Task 3: RAG 검색 파이프라인에 +10% 키워드 일치 가산점(Lexical Boost) 적용 및 통합 검증

**Files:**
- Modify: `backend/src/routes/ai.ts:58-75, 225-245`
- Test: `backend/tests/ai.test.ts`

- [ ] **Step 1: Implement +10% Lexical Boost in `ai.ts`**
  - 커뮤니티 게시글 검색 `LIMIT 4` ➔ `LIMIT 8`로 후보군 확대.
  - 질의어 키워드(2글자 이상 단어들) 추출 후, 게시글 `title` 또는 `content`에 포함된 경우 `similarity = similarity * 1.10` 적용.
  - 가산점 반영 점수로 내림차순 정렬 후 최종 Top 2 선택.
- [ ] **Step 2: Run AI route integration tests**
  Run: `npx jest tests/ai.test.ts`
  Expected: All tests pass.
- [ ] **Step 3: Test `/api/v1/ai/recommend` with "발볼 넓은 러너 적합 신발 추천"**
  Post 5가 +10% 가산점을 받아(0.7766 * 1.10 = 0.8543) 완벽한 1위로 선정되고, 태그된 PUMA 와이드 신발이 +20% 가산점을 받아 1위로 추천되는지 검증.
- [ ] **Step 4: Commit**
  `git commit -m "feat(ai): apply +10% lexical keyword boost to community post RAG reranker"`

---

### Task 4: Railway 실운영 환경변수 등록, 프로덕션 배포 및 라이브 검증

**Files:**
- Entire repository

- [ ] **Step 1: Set `GEMINI_API_KEY` on Railway Production**
  Run: `npx @railway/cli variables --set GEMINI_API_KEY="<YOUR_GEMINI_API_KEY>" --service backend`
- [ ] **Step 2: Deploy updated backend to Railway**
  Run: `npx @railway/cli up ./backend --path-as-root --service backend -y`
- [ ] **Step 3: Git push to remote week-3 and main**
  Run: `git push origin week-3 && git checkout main && git merge week-3 && git push origin main && git checkout week-3`
- [ ] **Step 4: Live E2E Verification**
  브라우저(Puppeteer)를 통해 `https://fittersweat.vercel.app`에 접속 후 AI 챗봇 드로어에서 "발볼 넓은 러너 적합 신발 추천" 질의 전송 ➔ 5번 게시물("발볼 10.5cm 러너 실착기") 및 PUMA 와이드 신발이 정상 노출되는지 최종 캡처 검증.

---

## 4. Verification Plan

### Automated Tests
- `npm --prefix backend test tests/gemini.service.test.ts`
- `npm --prefix backend test tests/ai.test.ts`

### Manual Verification
- 라이브 프론트엔드 AI 챗봇 드로어에서 "발볼 넓은 러너 적합 신발 추천" 질의 후:
  1) 추천 상품 1위에 Post 5에 태깅된 와이드 접지화 표시 확인
  2) 추천 게시글에 5번 게시글([Post 5](https://fittersweat.vercel.app/community/5)) 노출 확인
  3) AI 조언에 발볼/2E 토박스 관련 맞춤 조언 생성 확인
