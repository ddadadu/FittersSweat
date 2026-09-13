# [Design Spec] Cloudinary + Next.js 기반 이미지 LCP 최적화 및 상품 데이터 파이프라인 설계

- **문서 번호**: SPEC-2026-09-07-IMG
- **작성일**: 2026-09-07
- **적용 마일스톤**: 2주차 (Week 2 커머스 백엔드 및 상품 연동)
- **목적**: 직매입 상품의 고화질 이미지 로딩 지연(LCP)을 최소화하고, 브랜드 신뢰도 및 상세페이지 시각적 완성도를 극대화하기 위한 아키텍처 및 데이터 구축 계획 정의

---

## 1. 문제 정의 및 목표

### 1.1 배경 및 문제점
- 이커머스에서 상품 목록 및 상세 화면의 이미지 로딩 속도는 **LCP(Largest Contentful Paint)** 지표와 직결되며, 3초 이상 지연 시 50% 이상의 사용자가 이탈함.
- 사진 크기별(썸네일 350px, 상세 800px 등)로 서버에 여러 장의 이미지를 따로 수동 관리하는 것은 1인 풀스택 개발 환경에서 과도한 공수와 기술 부채를 유발함.

### 1.2 목표
1. **Cloudinary 스토리지 + Next.js 14 (`next/image`) 하이브리드 파이프라인 구축**
   - Cloudinary에는 고화질 원본 1장만 업로드하여 영구 보관.
   - Next.js의 내장 이미지 최적화 엔진(`next/image`)을 통해 화면 규격에 맞는 WebP 초압축 및 반응형 썸네일을 0ms 부하로 자동 서빙.
2. **`Product` 테이블 스키마 정밀 확장 (3개 컬럼)**
   - 상품 대표 사진(`imageUrl`), 공식 브랜드 로고(`brandLogoUrl`), 상세페이지 전용 스펙/설명 인포그래픽(`detailImageUrl`) 분리.
3. **체계적인 JSON 기반 상품 더미데이터 셋 및 자동 시딩 구축**
   - 20~30개 실제 HYROX 대회 공식/검증 장비를 JSON 형태로 구조화하여 4주차 AI RAG 임베딩까지 연계.

---

## 2. Cloudinary + Next.js 이미지 최적화 아키텍처

```text
┌────────────────────────────────────────────────────────┐
│  [1] 원본 보관소: Cloudinary Managed Storage            │
│  - 고화질 원본 사진 딱 1장 업로드                      │
│  - 예: https://res.cloudinary.com/.../puma_shoe.jpg    │
└────────────────────────────────────────────────────────┘
                           │
                           ▼ (DB URL 문자열 참조)
┌────────────────────────────────────────────────────────┐
│  [2] 데이터베이스: PostgreSQL (Prisma ORM)             │
│  - Product 테이블의 imageUrl 단 1개 컬럼에 URL 저장    │
└────────────────────────────────────────────────────────┘
                           │
                           ▼ (Next.js Image Optimization API)
┌────────────────────────────────────────────────────────┐
│  [3] 프론트엔드 최적화 서빙: Next.js 14 (Vercel CDN)   │
│  ├─ 상품 목록: <Image width={350} height={350} />      │
│  │   👉 Next.js가 350px 경량 WebP 썸네일(30KB) 자동 변환│
│  └─ 상품 상세: <Image width={800} height={800} />      │
│      👉 Next.js가 800px 선명한 WebP 이미지(120KB) 자동 변환│
└────────────────────────────────────────────────────────┘
```

---

## 3. `Product` 테이블 스키마 변경 내역

### 3.1 추가 컬럼 3종 정의

| 컬럼명 (Prisma / SQL) | 데이터 타입 | 필수 여부 | 역할 및 활용 화면 |
| :--- | :---: | :---: | :--- |
| **`imageUrl`**<br>(`image_url`) | `VARCHAR(500)` | **필수 (NOT NULL)** | **상품 대표 사진**<br>- 상품 목록 카드 썸네일<br>- 장바구니 및 주문 내역 대표 이미지<br>- 상세페이지 상단 메인 비주얼 |
| **`brandLogoUrl`**<br>(`brand_logo_url`) | `VARCHAR(500)` | 선택 (NULL 허용) | **공식 브랜드 로고**<br>- PUMA, SIS, 2XU 등 브랜드 신뢰도 뱃지 표기<br>- 상품 카드 좌상단 / 상세페이지 브랜드 소개 영역 |
| **`detailImageUrl`**<br>(`detail_image_url`) | `VARCHAR(500)` | 선택 (NULL 허용) | **상세설명 전용 인포그래픽**<br>- 상세페이지 하단 제품 스펙표, 사이즈 가이드, 성분표 통이미지 |

### 3.2 Prisma 스키마 반영안 (`schema.prisma`)

```prisma
model Product {
  id             BigInt           @id @default(autoincrement())
  name           String           @db.VarChar(255)
  description    String?          @db.Text
  categoryId     String           @map("category_id") @db.VarChar(50)
  price          Decimal          @db.Decimal(12, 2)
  stockQuantity  Int              @default(0) @map("stock_quantity")
  
  // ─── 🎨 이미지 LCP 최적화 컬럼 3종 ───
  imageUrl       String           @map("image_url") @db.VarChar(500)
  brandLogoUrl   String?          @map("brand_logo_url") @db.VarChar(500)
  detailImageUrl String?          @map("detail_image_url") @db.VarChar(500)

  embedding      Unsupported("vector(1536)")?
  createdAt      DateTime         @default(now()) @map("created_at")
  updatedAt      DateTime         @updatedAt @map("updated_at")
  orderItems     OrderItem[]
  reviews        Review[]
  taggedPosts    PostProductTag[]

  @@map("products")
}
```

---

## 4. 상품 더미데이터 구축 계획 (JSON 매핑 방식)

### 4.1 구축 방향: JSON 분리 및 Prisma 시딩 자동화
- 하드코딩을 방지하기 위해 `backend/prisma/data/products.json` 파일로 마스터 데이터셋을 분리 구축.
- `prisma/seed.ts`가 실행될 때 이 JSON 파일을 읽어 데이터베이스에 일괄 주입(Batch Upsert)하도록 파이프라인 구성.

### 4.2 JSON 데이터셋 구조 예시 (`products.json`)

```json
[
  {
    "name": "PUMA Deviate NITRO 2 HYROX 공식 레이스화",
    "description": "카본 복합 플레이트(PWRPLATE)와 나이트로 엘리트 폼이 적용된 공식 HYROX 파트너 레이싱화. 1km 런과 슬레드 푸시/풀에서 뛰어난 접지력과 반발력을 제공합니다.",
    "categoryId": "shoes",
    "price": 189000,
    "stockQuantity": 50,
    "imageUrl": "https://res.cloudinary.com/fittersweat/image/upload/v1/products/puma_deviate_nitro2.webp",
    "brandLogoUrl": "https://res.cloudinary.com/fittersweat/image/upload/v1/brands/puma_logo.png",
    "detailImageUrl": "https://res.cloudinary.com/fittersweat/image/upload/v1/products/puma_deviate_nitro2_detail.webp"
  },
  {
    "name": "SIS 고탄수화물 에너지젤 (카페인 75mg, 콜라맛 60ml)",
    "description": "HYROX 8개 스테이션 사이사이 빠른 흡수로 젖산 축적을 막고 지구력을 유지해주는 세계 최초 등장성 고성능 에너지젤.",
    "categoryId": "nutrition",
    "price": 38000,
    "stockQuantity": 120,
    "imageUrl": "https://res.cloudinary.com/fittersweat/image/upload/v1/products/sis_energy_gel.webp",
    "brandLogoUrl": "https://res.cloudinary.com/fittersweat/image/upload/v1/brands/sis_logo.png",
    "detailImageUrl": "https://res.cloudinary.com/fittersweat/image/upload/v1/products/sis_energy_gel_detail.webp"
  },
  {
    "name": "하버 HYROX 슬레드 푸시/풀 전문가용 가죽 그립 글러브",
    "description": "슬레드 풀 로프와 파머스 캐리 케틀벨 파지 시 물집을 방지하고 악력을 보조하는 실리콘 하이퍼그립 레이서 장갑.",
    "categoryId": "gear",
    "price": 45000,
    "stockQuantity": 80,
    "imageUrl": "https://res.cloudinary.com/fittersweat/image/upload/v1/products/harbinger_gloves.webp",
    "brandLogoUrl": "https://res.cloudinary.com/fittersweat/image/upload/v1/brands/harbinger_logo.png",
    "detailImageUrl": "https://res.cloudinary.com/fittersweat/image/upload/v1/products/harbinger_gloves_detail.webp"
  }
]
```

### 4.3 카테고리별 더미데이터 구성 계획 (4개 카테고리 × 100개 = 총 400종)

실제 존재하는 공식 브랜드/상품을 최우선 배치하고, 수량이 부족한 경우 실제 HYROX 경기 규격(중량, 디비전, 규격)에 맞춘 현실적인 가상 브랜드(HyperOx, IronPulse, SledMaster, ApexGrip, OctaPower 등)를 조합하여 **카테고리당 100개씩 총 400개 대규모 데이터셋**을 구축합니다.

1. **공식 레이싱화 (`shoes`, 100종)**:
   - PUMA Deviate Nitro 2, PUMA Velocity Nitro, Saucony Endorphin Pro, Hoka Mach 6, Nike Alphafly 등 실제 레이서 선호 브랜드 및 가상 레이스화
   - 카본 플레이트 내장형, 접지력 강화 비브람 아웃솔형, 로드/터프 겸용 경량화 등 세부 스펙 매핑
2. **에너지 & 뉴트리션 (`nutrition`, 100종)**:
   - SIS(Science in Sport), Maurten, Thorne 등 실제 뉴트리션 및 가상 보충제
   - 고탄수화물 등장성 에너지젤(카페인/논카페인), 구연산 전해질 타블렛, BCAA, 크레아틴, 베타알라닌, 프로틴 쉐이크 등
3. **보호대 & 의류/기어 (`gear`, 100종)**:
   - Harbinger, 2XU, Rehband, Rogue 등 실제 기어 및 가상 장비
   - 7mm 네오프렌 무릎 슬리브, 로프 풀/바벨 전용 실리콘 그립 장갑, 컴프레션 종아리 타이츠, 땀 흡수 밴드, 파머스 스트랩 등
4. **[신규 추가] 8대 공식 스테이션 & 경기장 부속 장비 (`equipment`, 100종)**:
   - **8대 공식 스테이션 핵심 장비**:
     - 스키에르고 (SkiErg): Concept2 사의 상체 중심 유산소 에르고미터 및 전용 플로어 스탠드
     - 파워 슬레드 (Power Sled): Centr x HYROX 공식 중량 썰매 (밀기 및 로프 당기기 겸용)
     - 슬레드 풀 로프 (Sled Pull Rope): 썰매 당기기 스테이션 전용 두껍고 매끄러운 15m 고내구성 트레이닝 로프
     - 로잉머신 (RowErg): Concept2 사의 전신 유산소 PM5 모니터 탑재 로잉머신
     - 옥토 케틀벨 (Octo Kettlebell): Centr 사의 각형 디자인 HYROX 규격 케틀벨 2개 세트 (파머스 캐리용 16kg, 24kg, 32kg)
     - 샌드백 (Sandbag): Centr 사의 어깨 착용형 고강도 기능성 샌드백 (런지용 10kg, 20kg, 30kg)
     - 월볼 (Wall Ball): Centr 사의 고무/가죽 소재 충격 흡수 메디신볼 (4kg, 6kg, 9kg)
   - **경기장 구성 및 부속 훈련 장비**:
     - 월볼 타겟 스탠드 (Wall Ball Rig Target): 규정 높이(여성 2.7m / 남성 3.0m) 표적이 설치된 전용 랙 구조물
     - 인조잔디 트랙 매트 (Turf Mat): 썰매 밀기/당기기 구간 및 런지 라인에 깔리는 HYROX 공인 규격 전용 인조잔디 롤
     - 우레탄 범퍼 플레이트 (Bumper Plates): 썰매 디비전별 무게(여성 102kg/152kg, 남성 152kg/202kg) 조절용 5/10/15/20/25kg 중량 원판
     - 탄산마그네슘 액상 초크, 레이스 카운트다운 인터벌 타이머 등

### 4.4 4주차 AI 벡터(RAG) 파이프라인 연계 및 대규모 데이터의 이점
- 총 400개의 정교한 장비 데이터가 구축됨에 따라, 4주차 OpenAI `text-embedding-3-small` 임베딩 및 pgvector 코사인 검색의 정확도와 실용성이 비약적으로 상승함.
- 예: "슬레드 푸시 훈련을 위해 센터에 둘 썰매와 원판 추천해줘" ➔ `equipment` 카테고리의 파워 슬레드 + 범퍼 플레이트 세트를 코사인 유사도로 정확히 탐색.

---

## 5. 2주차(Week 2) 마일스톤 반영 계획

본 설계는 차주(2주차) 개발 일정에 다음과 같이 반영됩니다:

- **[Week 2] Task 6-1: Product 스키마 확장 및 DB 마이그레이션**
  - `schema.prisma`에 `imageUrl`, `brandLogoUrl`, `detailImageUrl` 3개 컬럼 추가
  - `npx prisma db push` 적용
- **[Week 2] Task 6-2: 400종 JSON 마스터 데이터셋 구축 스크립트 작성 및 시딩**
  - `backend/prisma/data/products.json` 생성 (4개 카테고리 × 100종 = 총 400개 품목)
  - `seed.ts` 연동 및 `npm run db:seed` 검증
- **[Week 2] Task 6-3: REST API 엔드포인트 응답 스키마 반영**
  - `GET /api/v1/products` (카테고리: `shoes`, `nutrition`, `gear`, `equipment` 필터 및 페이징 지원)
  - `GET /api/v1/products/:id` 상세 조회에 3개 이미지 필드 포함
- **[Week 3] Task 10: 프론트엔드 Next.js `<Image />` 렌더링 최적화**
  - `next.config.mjs`에 `res.cloudinary.com` 도메인 패턴 추가
  - 상품 카드(`ProductCard`) 및 상세페이지에 반응형 `<Image />` 적용
