# 2026 캡스톤 디자인 1주차(Week 1) 개발 결과 보고서

- **과제명**: FitterSweat (국내 최초 HYROX 커뮤니티 커머스 & AI 맞춤 추천 플랫폼)
- **과정 구분**: 컴퓨터공학과 캡스톤 디자인 졸업작품 (1인 풀스택 개발)
- **개발 기간**: 1주차 (2026.09.01 ~ 2026.09.06)
- **원격 저장소**: [https://github.com/ddadadu/FittersSweat.git](https://github.com/ddadadu/FittersSweat.git)
- **1주차 전용 브랜치**: `week-1` ([https://github.com/ddadadu/FittersSweat/tree/week-1](https://github.com/ddadadu/FittersSweat/tree/week-1))

---

## 1. 1주차 개발 목표 및 달성도 요약

1주차의 핵심 목표는 **"프로젝트 인프라 완비, 도메인 데이터베이스 모델링, 백엔드 코어 런타임 구성, 사용자 인증/보안 체계 확립, HYROX 대회 데이터 파이프라인 완성"**입니다. 5개 태스크 전 부문을 100% 성공적으로 완수하였습니다.

| 태스크 번호 | 세부 과제명 | 개발 산출물 | 상태 |
| :---: | :--- | :--- | :---: |
| **Task 1** | 인프라 및 DB 컨테이너 구축 | `docker-compose.yml`, `scripts/test-db.sh` | **완료 (100%)** |
| **Task 2** | Fastify 백엔드 코어 & API 문서화 | `src/app.ts`, `src/index.ts`, `health.test.ts` | **완료 (100%)** |
| **Task 3** | Prisma 10개 도메인 모델링 & 시딩 | `prisma/schema.prisma`, `prisma/seed.ts` | **완료 (100%)** |
| **Task 4** | JWT 인증 및 bcrypt 단방향 암호화 | `src/routes/auth.ts`, `tests/auth.test.ts` | **완료 (100%)** |
| **Task 5** | HYROX 대회 크롤러 & 조회 API | `src/tasks/scraper.ts`, `src/routes/events.ts`, `tests/events.test.ts` | **완료 (100%)** |

---

## 2. 1주차 시스템 아키텍처 및 기술 스택

```text
[ Client (Browser / Swagger UI) ]
                │
                ▼ (HTTP/JSON REST API, Port 3001)
┌────────────────────────────────────────────────────────┐
│  Fastify 4.24 + TypeScript 5.2 백엔드 런타임           │
│  ├─ OpenAPI 3.0 (@fastify/swagger, @fastify/swagger-ui)│
│  ├─ 인증/보안 (@fastify/jwt, bcryptjs, Zod 유효성 검증)│
│  ├─ 크롤링 엔진 (Cheerio 1.0, 정규식 날짜 파서)       │
│  └─ ORM 계층 (Prisma 5.5.2 Client)                     │
└────────────────────────────────────────────────────────┘
                │ (Connection Pooling, Port 5432)
                ▼
┌────────────────────────────────────────────────────────┐
│  Docker 가상화 격리 컨테이너 [fittersweat-postgres]     │
│  ├─ RDBMS 엔진: PostgreSQL 14                          │
│  ├─ AI 벡터 확장: pgvector 0.8.6 (1536차원 지원)       │
│  └─ 영구 보존 볼륨: postgres_data                      │
└────────────────────────────────────────────────────────┘
```

- **Runtime & Language**: Node.js 20 LTS, TypeScript 5.2
- **Backend Framework**: Fastify 4.24 (Express 대비 최대 2배 처리량, 오버헤드 최소화)
- **Database & AI Vector**: PostgreSQL 14 + pgvector 0.8.6
- **ORM & Data Modeling**: Prisma ORM 5.5.2
- **Testing Framework**: Jest 29 + ts-jest (Fastify 내장 `app.inject()` 메모리 테스팅)

---

## 3. 태스크별 상세 개발 내역

### 📌 [Task 1] 인프라 및 DB 컨테이너 구축 (Docker + pgvector)

- **배경 및 목표**:
  - 향후 4주차에 진행될 OpenAI 1536차원 임베딩 기반 AI 맞춤 추천 검색(RAG)을 안정적으로 처리하기 위해, 벡터 연산 기능이 탑재된 데이터베이스 환경이 로컬에 독립적으로 구축되어야 함.
- **주요 구현 내용**:
  - `docker-compose.yml`: 공식 `pgvector/pgvector:pg14` 컨테이너 이미지를 활용하여 PostgreSQL 14 및 pgvector 0.8.6 실행 환경 구성.
  - 데이터 영속성 보장: 컨테이너가 중단되거나 재부팅되어도 시딩된 데이터가 보존되도록 `postgres_data` 도커 볼륨 마운트.
  - 자동화 검증 스크립트(`scripts/test-db.sh`): psql 커맨드로 PostgreSQL 연결성 및 `vector` 확장 모듈 활성화 여부를 즉시 판별하는 쉘 스크립트 작성.
- **검증 결과**:
  ```text
  🔍 Testing PostgreSQL & pgvector extension...
   extname | extversion 
  ---------+------------
   vector  | 0.8.6
  (1 row)
  ✅ pgvector is active and ready!
  ```

---

### 📌 [Task 2] Fastify 백엔드 코어 구조 & OpenAPI 문서화

- **배경 및 목표**:
  - 단일 스레드 이벤트 루프의 처리 효율을 극대화하기 위해 초고속 웹 프레임워크인 Fastify 4를 도입하고, 프론트엔드 연동 및 시연을 위한 OpenAPI 3.0 대화형 문서(Swagger UI) 자동화 체계 수립.
- **주요 구현 내용**:
  - `backend/src/app.ts`: Fastify 인스턴스 팩토리 함수(`buildApp`) 정의 및 모듈식 라우트 등록 아키텍처 수립.
  - CORS 연동: 프론트엔드(Next.js, 포트 3000) 연동을 위한 `@fastify/cors` 화이트리스트 설정.
  - Swagger UI(`/docs`): `@fastify/swagger` 및 `@fastify/swagger-ui`를 연동하여 별도 Postman 없이 브라우저에서 모든 REST API를 대화형으로 테스트할 수 있는 개발자 콘솔 구성.
  - 헬스체크 엔드포인트(`GET /health`): 서버 생존 상태 및 DB 연결 여부를 1초 만에 파악할 수 있는 진단 API 구현.
- **검증 결과**:
  - `tests/health.test.ts` 통과 (응답 상태코드 200, `{ status: 'ok', database: 'connected' }` 확인).

---

### 📌 [Task 3] Prisma ORM 10개 핵심 도메인 모델 정의 및 초기 데이터 시딩

- **배경 및 목표**:
  - HYROX 대회 정보, 직매입 이커머스, 커뮤니티 게시판, 리뷰, AI 벡터 임베딩을 유기적으로 연결하는 데이터베이스 정규화 모델링 수행.
- **주요 구현 내용**:
  - `backend/prisma/schema.prisma` 작성 (총 10개 테이블 설계):
    1. `users`: 회원 정보, 역할(Role: USER/ADMIN), 암호화 해시 보관
    2. `events`: HYROX 공식 대회 일정 (도시코드, 시작일, 종료일, 공식URL)
    3. `interested_events`: 사용자-대회 간 관심 등록 (N:M 복합키)
    4. `products`: 직매입 공식 장비 (카테고리, 가격, 재고수량, `vector(1536)` 임베딩 컬럼)
    5. `orders`: 주문 내역 (총 결제액, 주문 상태: pending/paid/cancelled, 토스 결제키)
    6. `order_items`: 주문 상세 품목 (상품ID, 수량, 구매단가)
    7. `posts`: 커뮤니티 게시글 (대회 태그, `vector(1536)` 임베딩 컬럼)
    8. `post_comments`: 게시글 댓글
    9. `reviews`: 실구매자 상품 평점 및 후기
    10. `post_product_tags`: 게시글 내 언급된 직매입 상품 N:M 연결
  - 초기 시딩 스크립트(`backend/prisma/seed.ts`):
    - 실제 2026 국내 HYROX 대회 2건 (서울 11월, 인천 송도 5월)
    - PUMA Deviate NITRO 레이싱화, SIS 에너지젤 등 직매입 장비 5건
    - 관리자 및 실사용자 계정, 초기 리뷰 데이터 자동 생성.
- **검증 결과**:
  - `npx prisma db push`: 10개 테이블 및 인덱스 생성 성공.
  - `npx prisma db:seed`: 시딩 데이터 정합성 검증 완료.

---

### 📌 [Task 4] JWT 인증 시스템 및 bcrypt 단방향 암호화 보안

- **배경 및 목표**:
  - 전자상거래 및 커뮤니티 플랫폼의 개인정보 보호 법령을 준수하고 안전한 회원 인증 환경을 구축하기 위해 업계 표준 암호화 방식 적용.
- **주요 구현 내용**:
  - 단방향 해싱(One-Way Hash): `bcryptjs` 10 라운드 솔트(Salt)를 적용하여 비밀번호 평문 저장을 원천 차단하고, DB 유출 시에도 복호화가 불가능하도록 보안 조치.
  - 이중 토큰 체계: 짧은 유효기간의 Access Token(1시간)과 안전한 세션 유지를 위한 Refresh Token(7일) 발급 로직 구현.
  - Zod 런타임 스키마 검증: 이메일 형식 오류, 6자리 미만 비밀번호 입력 시 400 Bad Request 조기 차단.
  - 제공 엔드포인트:
    - `POST /api/v1/auth/signup`: 회원가입 (중복 이메일 가입 방지 409 Conflict 처리)
    - `POST /api/v1/auth/login`: 로그인 및 Access/Refresh JWT 토큰 세트 반환
    - `POST /api/v1/auth/refresh`: 만료된 Access Token 재발급
- **검증 결과 (TDD 5종 통과)**:
  - 회원가입 성공 및 DB 저장 검증
  - 중복 이메일 가입 거부(409) 검증
  - 올바른 계정 로그인 및 토큰 발급 검증
  - 잘못된 비밀번호 로그인 실패(401) 검증
  - Refresh Token 기반 갱신 검증

---

### 📌 [Task 5] HYROX 대회 공식 크롤링 모듈 및 일정 조회 API

- **배경 및 목표**:
  - HYROX South Korea 공식 웹페이지에 공지되는 연간 레이스 일정을 자동으로 수집하고, 한국어 날짜 표기를 시스템 표준 데이터로 정제하여 사용자에게 제공.
- **주요 구현 내용**:
  - `backend/src/tasks/scraper.ts`:
    - Cheerio 1.0 라이브러리를 통한 비동기 HTML DOM 파싱.
    - 정규식 기반 한국어 날짜 변환기(`parseKoreanDate`): `13. 11월. 2026`과 같은 비정형 문자열을 추출하여 ISO 8601 JavaScript `Date` 객체로 정밀 변환.
    - 데이터베이스 Upsert: `[cityCode, startDate]` 복합 유니크 제약조건을 기반으로 기존 대회의 일정 변경 감지 및 신규 대회 자동 등록.
  - 제공 엔드포인트 (`backend/src/routes/events.ts`):
    - `GET /api/v1/events`: 개최일 기준 오름차순(D-Day 순) 대회 목록 조회
    - `GET /api/v1/events/:id`: 대회 상세 정보 및 연관 커뮤니티 게시글 5건 조회
    - `POST /api/v1/events/:id/interested`: 로그인 사용자의 관심 대회 찜/취소 토글
- **검증 결과 (TDD 4종 통과)**:
  - 한국어 날짜 정규식 파서 단위 테스트 통과
  - 대회 목록 조회(200 OK) 및 JSON 스키마 검증 통과
  - 대회 단건 상세 조회(200 OK) 검증 통과
  - 비로그인 관심 대회 등록 차단(401 Unauthorized) 및 로그인 유저 토글 동작 검증 통과

---

## 4. 1주차 종합 테스트 및 정합성 검증 결과

TDD(Test-Driven Development) 원칙에 입각하여 작성된 1주차 핵심 테스트 스위트의 실행 결과입니다.

```bash
$ npm test tests/health.test.ts tests/auth.test.ts tests/events.test.ts

PASS tests/health.test.ts
  Health Check Endpoint (/health)
    ✓ GET /health - should return 200 ok and database status (14 ms)

PASS tests/auth.test.ts
  Auth API (/api/v1/auth)
    ✓ POST /signup - should register a new user with hashed password (56 ms)
    ✓ POST /signup - should return 409 conflict for duplicate email (12 ms)
    ✓ POST /login - should return JWT access & refresh tokens on valid credentials (28 ms)
    ✓ POST /login - should return 401 on invalid password (18 ms)
    ✓ POST /refresh - should refresh access token using valid refresh token (15 ms)

PASS tests/events.test.ts
  Events API & Scraper (/api/v1/events)
    Date Parser Unit Test
      ✓ should parse Korean date format "13. 11월. 2026" (1 ms)
      ✓ should return null for invalid date string (1 ms)
    REST Endpoints
      ✓ GET /api/v1/events - should return list of seeded events (16 ms)
      ✓ GET /api/v1/events/:id - should return single event details (11 ms)
      ✓ POST /api/v1/events/:id/interested - should require auth header (5 ms)
      ✓ POST /api/v1/events/:id/interested - should toggle interested event with auth (18 ms)

Test Suites: 3 passed, 3 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        1.671 s
Ran all test suites.
```

---

## 5. Git 형상 관리 및 커밋 히스토리

1주차 결과물은 원격 GitHub 저장소의 전용 브랜치인 **`week-1`**에 완벽하게 보존 및 푸시되었습니다.

- **원격 브랜치**: `origin/week-1`
- **주요 커밋 내역**:
  - `7e7f092` - `feat(infra): add docker-compose with postgresql and pgvector`
  - `bfdf2ca` - `feat(backend): setup fastify typescript boilerplate with swagger and healthcheck`
  - `5564528` - `feat(db): define 10 domain models in prisma with pgvector and seed data`
  - `cfd43c0` - `feat(auth): complete Task 4 - signup, login, refresh token endpoints with tests`
  - `2cfe127` - `feat(events): complete Task 5 - HYROX scraper and event listing/interested endpoints with tests`
  - `82726d0` - `docs(swagger): add openapi request body schemas for auth endpoints`

---

## 6. 결론 및 2주차 개발 착수 계획

1주차에 설정한 모든 기반 인프라, 데이터베이스, 백엔드 API, 보안 및 크롤러가 결함 없이 100% 정상 작동함을 검증하였습니다.

- **2주차 개발 목표**:
  1. **직매입 상품 관리 API**: 신발, 뉴트리션, 기어 카테고리별 필터링 및 상세 조회
  2. **Toss Payments 결제 트랜잭션**: 재고 선차감, 결제 승인 확인, 실패 시 원자적 재고 롤백 보장
  3. **커뮤니티 게시판**: 게시글 작성 시 직매입 장비 태그(N:M) 연결 및 댓글 시스템 구현
