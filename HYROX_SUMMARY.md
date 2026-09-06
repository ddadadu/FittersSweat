# FitterSweat 프로젝트 종합 분석 요약

**프로젝트명**: FitterSweat (국내 HYROX 커뮤니티 & 커머스 플랫폼)  
**과제 구분**: 2026학년도 컴퓨터공학과 졸업작품  
**개발 형태**: 풀스택 1인 개발자  
**개발 기간**: **4주 완성 (총 160시간)**  
**핵심 목표**: 대회 일정 허브 + 커뮤니티 + 직매입 이커머스 + **풀 RAG AI 검색 엔진** 통합 플랫폼 구축  

---

## 📊 핵심 의사결정

### 1. 비즈니스 모델: 직접 매입(사입) 판매 구조
```
- 초기 모델: 복잡한 다자간 오픈마켓/입점형 모델을 배제하고 '직접 매입형'으로 단순화
- 사용자 역할: 일반 사용자(User)와 관리자(Admin) 2단계 구조 (판매자 엔티티/센터 제거)
- 효과: 개발 복잡도 40% 이상 절감, 초기 품질/재고/배송 일관성 확보
```

### 2. 대회 정보 수집: 자동 웹 스크래핑
```
- 대상: HYROX South Korea 공식 '레이스 찾기' 정적 HTML 페이지
- 스택: Node.js 백엔드 내장 Cheerio 1.0 + axios 1.5 + node-cron
- 주기: 매일 자정(00:00) 1회 자동 실행
- 변경 감지: 신규/수정/삭제 이벤트 감지 시 관리자 이메일 발송 (Nodemailer)
- 안전성: 사실 데이터(대회명, 일정, 장소)만 추출하여 DB Upsert, 원본 링크 제공
```

### 3. 커뮤니티 리뷰 기반 AI 검색 엔진 (RAG 파이프라인)
```
- 원리: 사용자의 자연어 질문 ➔ RAG가 커뮤니티 후기 + 상품 데이터를 검색 ➔ LLM 자연어 추천 생성
- 벡터 DB: PostgreSQL 14+에 pgvector 확장 설치 (IVFFLAT 코사인 유사도 검색)
- 임베딩 모델: OpenAI text-embedding-3-small (1536차원)
- LLM 추천 생성: OpenAI GPT-4o-mini API (stream: true)
- 응답 방식: Fastify SSE(Server-Sent Events) 스트리밍으로 대기 시간 최소화
```

### 4. 확정 기술 스택
```
- Frontend: Next.js 14 (App Router) + React 18 + Tailwind CSS + shadcn/ui + TanStack Query v5 + Zustand
- Backend:  Fastify 4 + TypeScript 5 + Prisma 5 + OpenAI SDK (^4.0) + node-cron + Cheerio + Nodemailer
- Database: PostgreSQL 14+ + pgvector 확장 (10개 핵심 테이블)
- Payment:  Toss Payments (SDK 위젯 + Sandbox 결제 승인 트랜잭션)
- 배포:     Vercel (Frontend) + Railway (Backend + PostgreSQL pgvector)
```

---

## 🎯 4주 압축 개발 일정 (총 160시간, 주당 40시간)

| 주차 | 주요 추진 내용 | 주요 산출물 | 마일스톤 |
|:---:|:---|:---|:---:|
| **1주차** | **환경 구성 + 핵심 백엔드**<br>• Docker Compose (PostgreSQL + pgvector)<br>• Prisma 스키마 (10개 테이블, embedding 컬럼)<br>• JWT 인증 API (bcrypt, access/refresh)<br>• HYROX 스크래핑 모듈 + cron 스케줄링 | • GitHub Repo + 로컬 환경<br>• DB 스키마 (pgvector 포함)<br>• 인증 API (가입/로그인/토큰)<br>• 스크래핑 모듈 & 단위 테스트 | ✅ 인증 정상 동작<br>✅ pgvector 설치 확인<br>✅ 대회 일정 수집 확인 |
| **2주차** | **커머스 + 커뮤니티 백엔드**<br>• 상품 목록/상세/검색 API<br>• 커뮤니티 게시글/댓글/상품 태그 API<br>• 주문 생성 + Toss Payments 결제 승인 API<br>• 재고 감소 트랜잭션 & Swagger 문서화 | • 상품/커뮤니티 API<br>• 주문/결제 API<br>• Toss Sandbox 연동<br>• Swagger UI (`/docs`) | ✅ 핵심 백엔드 API 완성<br>✅ Toss Sandbox 결제 통과 |
| **3주차** | **Frontend 전체 UI 구현**<br>• Next.js 14 + Tailwind + shadcn/ui 레이아웃<br>• 대회 목록/상세 + 관심 대회 등록<br>• 상품 쇼핑 + 장바구니 + Toss 결제 위젯<br>• 커뮤니티 게시판 + 마이페이지 | • 전체 화면 반응형 UI<br>• TanStack Query 캐싱 연동<br>• Zustand 전역 상태 관리<br>• 결제 E2E 플로우 완성 | ✅ 전체 UI 동작 확인<br>✅ 결제 E2E 플로우 완료 |
| **4주차** | **풀 RAG AI 검색 + 배포 + 발표**<br>• OpenAI Embeddings 배치 벡터화 파이프라인<br>• `/api/v1/ai/search` (pgvector 유사도 + GPT-4o-mini SSE)<br>• 프론트엔드 실시간 AI 스트리밍 검색 UI<br>• Vercel + Railway 프로덕션 배포 및 최종 발표 자료 | • 풀 RAG AI 검색 엔진<br>• AI 스트리밍 검색 UI<br>• 프로덕션 라이브 배포<br>• 최종 보고서 및 발표 자료 | ✅ AI 검색 스트리밍 동작<br>✅ 프로덕션 배포 완료<br>✅ 발표 준비 완료 |

---

## 🏗️ 데이터베이스 설계 (10개 핵심 테이블)

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   Users ◄─────────────────────────────────────────────► Orders         │
│     │                                                     │            │
│     │                                                 OrderItems       │
│     │                                                     │            │
│     │                                                 Products*        │
│     │                                                     │            │
│     ├───────► InterestedEvents ◄────────── Events         │            │
│     │                                         │           │            │
│     ├───────► Posts* ◄────────────────────────┘           │            │
│     │           │                                         │            │
│     │      PostComments                                   │            │
│     │                                                     │            │
│     └───────► Reviews ◄───────────────────────────────────┤            │
│                  │                                        │            │
│              PostProductTags ◄────────────────────────────┘            │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
* Products 및 Posts 테이블에 pgvector의 embedding(vector) 컬럼 적용
```

### 10개 테이블 목록
1. **Users**: 회원 정보 (일반사용자/관리자 구분)
2. **Events**: HYROX 대회 일정 정보 (스크래핑 자동 수집)
3. **InterestedEvents**: 회원-대회 관심 등록 N:M 매핑
4. **Products**: 직접 매입 상품 정보 (`embedding vector(1536)` 컬럼 포함)
5. **Orders**: 주문 메타 정보 (Toss 결제 키 검증 및 상태 관리)
6. **OrderItems**: 주문 상세 품목 및 구매 시점 단가 스냅샷
7. **Posts**: 커뮤니티 후기/질문 게시글 (`embedding vector(1536)` 컬럼 포함)
8. **PostComments**: 커뮤니티 게시글 댓글
9. **Reviews**: 상품 실구매자 리뷰 및 평점
10. **PostProductTags**: 게시글-상품 N:M 태그 연결

---

## 🔌 핵심 REST API 엔드포인트 (16개)

```
[Events - 대회 일정]
GET    /api/v1/events                  # 대회 목록 조회 (필터/페이징)
GET    /api/v1/events/:id              # 대회 상세 조회
POST   /api/v1/events/:id/interested   # 관심 대회 등록/취소 (토글)

[Products - 상품]
GET    /api/v1/products                # 상품 목록 조회 (카테고리/검색)
GET    /api/v1/products/:id            # 상품 상세 조회 (리뷰/태그 포함)
POST   /api/v1/products/:id/reviews    # 상품 리뷰 작성 (실구매자)

[Orders - 주문 및 결제]
POST   /api/v1/orders                  # 주문서 생성 (재고 선검증)
POST   /api/v1/orders/:id/payment      # 결제 승인 (Toss Payments 연동)
GET    /api/v1/orders                  # 내 주문 내역 조회

[Community - 커뮤니티]
GET    /api/v1/posts                   # 게시글 목록 조회 (대회별 필터)
POST   /api/v1/posts                   # 게시글 작성 (상품 태그 연결)
POST   /api/v1/posts/:id/comments      # 댓글 작성

[AI Search - 인공지능 검색]
POST   /api/v1/ai/search               # 자연어 쿼리 ➔ RAG ➔ SSE 스트리밍 추천 응답
POST   /api/v1/ai/embed                # 신규 상품/게시글 임베딩 생성 (내부/관리자)

[Auth - 인증]
POST   /api/v1/auth/signup             # 회원가입 (bcrypt 해싱)
POST   /api/v1/auth/login              # 로그인 (JWT Access/Refresh 발급)
POST   /api/v1/auth/refresh            # Access Token 갱신
```

---

## ⚡ RAG 파이프라인 처리 흐름

```
1. 오프라인 임베딩
   - 상품 등록 및 게시글 작성 시 OpenAI text-embedding-3-small로 1536차원 벡터 생성
   - PostgreSQL pgvector 컬럼에 저장 및 IVFFLAT 인덱싱

2. 사용자 자연어 질의 ("초보자인데 첫 대회 어떤 신발과 보충제가 필요한가요?")
   - 사용자의 검색 쿼리를 동일 임베딩 모델로 벡터 변환

3. pgvector 의미 기반 유사도 검색
   - 코사인 유사도 기준 가장 연관성 높은 상위 K개 커뮤니티 후기 및 추천 상품 검색

4. LLM 프롬프트 결합 및 생성
   - 검색된 후기와 상품 스펙을 컨텍스트로 결합하여 GPT-4o-mini에 전달

5. SSE 스트리밍 응답
   - Fastify SSE를 통해 실시간 토큰 단위로 프론트엔드에 스트리밍 전송
   - 프론트엔드는 실시간 텍스트 추천과 함께 관련 상품 카드를 렌더링
```

---

## 📎 프로젝트 문서 체계

| 문서 | 파일명 | 주요 내용 |
|:---|:---|:---|
| **종합 요약** | `HYROX_SUMMARY.md` (본 문서) | 프로젝트 핵심 의사결정, 4주 일정, 아키텍처 개요 |
| **기술 상세 분석** | `hyrox_technical_analysis.md` | RAG 파이프라인, pgvector 스키마, 스크래핑/결제 상세 설계 |
| **풀스택 개발 전략** | `hyrox_fullstack_strategy.md` | 1인 풀스택 4주 세부 작업 일정, RAG 구현 팁, 생산성 가이드 |
| **빠른 시작 가이드** | `hyrox_quickstart.md` | 30분 Docker(pgvector) 환경 구축, 10개 Prisma 스키마, 초기화 코드 |

---

**기준 원본 문서**: `HYROX_국내_커뮤니티_커머스_프로젝트_계획서_최종.docx`  
**버전 상태**: 최종 계획서 100% 동기화 완료
