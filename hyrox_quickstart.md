# FitterSweat - 30분 빠른 시작 가이드 🚀

**프로젝트명**: FitterSweat (국내 HYROX 커뮤니티 커머스 플랫폼)  
**과제 구분**: 2026학년도 컴퓨터공학과 졸업작품  
**문서 기준**: `HYROX_국내_커뮤니티_커머스_프로젝트_계획서_최종.docx`  
**목표**: 30분 내에 로컬 개발 환경(Next.js 14 + Fastify 4 + PostgreSQL pgvector + OpenAI API) 완벽 구성  

---

## 🛠️ 1단계: 필수 개발 도구 설치 (5분)

### 1.1 Node.js 20 LTS & npm
```bash
# macOS (Homebrew)
brew install node@20

# 버전 확인
node -v   # v20.x 이상 권장
npm -v    # 10.x 이상
```

### 1.2 Docker & Docker Compose
PostgreSQL 및 `pgvector` 확장을 컨테이너로 구동하기 위해 Docker가 필요합니다.
```bash
docker --version
docker compose version
```

---

## 🐳 2단계: Docker Compose 환경 구축 (pgvector 포함) (5분)

프로젝트 루트 디렉토리에 `docker-compose.yml`을 작성하여 `pgvector` 확장이 내장된 PostgreSQL 14 컨테이너를 구동합니다.

```yaml
# docker-compose.yml
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

```bash
# DB 컨테이너 시작
docker compose up -d

# 실행 상태 확인
docker ps | grep fittersweat-postgres
```

---

## ⚙️ 3단계: Backend 초기화 (Fastify + Prisma 10개 모델) (10분)

### 3.1 디렉토리 및 `package.json` 설정
```bash
mkdir -p backend/src/routes backend/src/tasks backend/prisma
cd backend
```

```json
{
  "name": "fittersweat-backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:push": "prisma db push",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "fastify": "^4.24.3",
    "@fastify/cors": "^8.4.0",
    "@fastify/jwt": "^7.0.0",
    "@fastify/rate-limit": "^9.0.1",
    "@fastify/swagger": "^8.12.0",
    "@fastify/swagger-ui": "^1.10.1",
    "@prisma/client": "^5.5.2",
    "prisma": "^5.5.2",
    "openai": "^4.20.0",
    "node-cron": "^3.0.3",
    "axios": "^1.5.1",
    "cheerio": "^1.0.0-rc.12",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.4",
    "pino": "^8.16.1",
    "pino-pretty": "^10.2.3",
    "nodemailer": "^6.9.7",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.8.9",
    "@types/bcryptjs": "^2.4.6",
    "@types/node-cron": "^3.0.10",
    "@types/nodemailer": "^6.4.14",
    "typescript": "^5.2.2",
    "tsx": "^4.0.0"
  }
}
```

```bash
npm install
```

### 3.2 환경 변수 (`backend/.env`)
```bash
cat > .env << 'EOF'
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/fittersweat_dev?schema=public"
JWT_SECRET="fittersweat-dev-jwt-super-secret-key-32bytes-min"
OPENAI_API_KEY="your-openai-api-key-here"
TOSS_SECRET_KEY="test_sk_..."
EOF
```

### 3.3 TypeScript 설정 (`backend/tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

### 3.4 Prisma 스키마 정의 (`backend/prisma/schema.prisma`)
최종 계획서에 명시된 **10개 핵심 테이블과 pgvector 확장**을 정의합니다.

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}

enum Role {
  USER
  ADMIN
}

enum EventStatus {
  upcoming
  past
  cancelled
}

enum OrderStatus {
  pending
  paid
  shipped
  delivered
  cancelled
}

// 1. Users (일반 사용자 / 관리자)
model User {
  id               BigInt            @id @default(autoincrement())
  email            String            @unique @db.VarChar(255)
  passwordHash     String            @map("password_hash") @db.VarChar(255)
  name             String            @db.VarChar(100)
  role             Role              @default(USER)
  createdAt        DateTime          @default(now()) @map("created_at")
  updatedAt        DateTime          @updatedAt @map("updated_at")
  orders           Order[]
  posts            Post[]
  postComments     PostComment[]
  reviews          Review[]
  interestedEvents InterestedEvent[]

  @@map("users")
}

// 2. Events (대회 일정)
model Event {
  id               BigInt            @id @default(autoincrement())
  name             String            @db.VarChar(255)
  cityCode         String            @map("city_code") @db.VarChar(10)
  startDate        DateTime          @map("start_date") @db.Date
  endDate          DateTime          @map("end_date") @db.Date
  eventUrl         String?           @map("event_url") @db.VarChar(500)
  status           EventStatus       @default(upcoming)
  createdAt        DateTime          @default(now()) @map("created_at")
  updatedAt        DateTime          @updatedAt @map("updated_at")
  interestedEvents InterestedEvent[]
  posts            Post[]

  @@unique([cityCode, startDate], name: "uq_city_start_date")
  @@map("events")
}

// 3. InterestedEvents (관심 대회 N:M)
model InterestedEvent {
  userId    BigInt   @map("user_id")
  eventId   BigInt   @map("event_id")
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@id([userId, eventId])
  @@map("interested_events")
}

// 4. Products (직접 매입 상품, pgvector 임베딩)
model Product {
  id            BigInt           @id @default(autoincrement())
  name          String           @db.VarChar(255)
  description   String?          @db.Text
  categoryId    String           @map("category_id") @db.VarChar(50)
  price         Decimal          @db.Decimal(12, 2)
  stockQuantity Int              @default(0) @map("stock_quantity")
  embedding     Unsupported("vector(1536)")?
  createdAt     DateTime         @default(now()) @map("created_at")
  updatedAt     DateTime         @updatedAt @map("updated_at")
  orderItems    OrderItem[]
  reviews       Review[]
  taggedPosts   PostProductTag[]

  @@map("products")
}

// 5. Orders (주문 메타)
model Order {
  id          BigInt      @id @default(autoincrement())
  userId      BigInt      @map("user_id")
  status      OrderStatus @default(pending)
  totalAmount Decimal     @map("total_amount") @db.Decimal(12, 2)
  paymentKey  String?     @map("payment_key") @db.VarChar(255)
  paidAt      DateTime?   @map("paid_at")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  user        User        @relation(fields: [userId], references: [id])
  orderItems  OrderItem[]

  @@map("orders")
}

// 6. OrderItems (주문 상세)
model OrderItem {
  id        BigInt   @id @default(autoincrement())
  orderId   BigInt   @map("order_id")
  productId BigInt   @map("product_id")
  quantity  Int
  unitPrice Decimal  @map("unit_price") @db.Decimal(12, 2)
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])

  @@map("order_items")
}

// 7. Posts (커뮤니티 게시글, pgvector 임베딩)
model Post {
  id           BigInt           @id @default(autoincrement())
  userId       BigInt           @map("user_id")
  eventId      BigInt?          @map("event_id")
  title        String           @db.VarChar(255)
  content      String           @db.Text
  embedding    Unsupported("vector(1536)")?
  createdAt    DateTime         @default(now()) @map("created_at")
  updatedAt    DateTime         @updatedAt @map("updated_at")
  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  event        Event?           @relation(fields: [eventId], references: [id], onDelete: SetNull)
  postComments PostComment[]
  taggedItems  PostProductTag[]

  @@map("posts")
}

// 8. PostComments (게시글 댓글)
model PostComment {
  id        BigInt   @id @default(autoincrement())
  postId    BigInt   @map("post_id")
  userId    BigInt   @map("user_id")
  content   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("post_comments")
}

// 9. Reviews (실구매자 리뷰)
model Review {
  id        BigInt   @id @default(autoincrement())
  productId BigInt   @map("product_id")
  userId    BigInt   @map("user_id")
  rating    Int
  content   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("reviews")
}

// 10. PostProductTags (게시글-상품 N:M 태그)
model PostProductTag {
  postId    BigInt  @map("post_id")
  productId BigInt  @map("product_id")
  post      Post    @relation(fields: [postId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@id([postId, productId])
  @@map("post_product_tags")
}
```

```bash
# DB 푸시 및 Prisma Client 생성
npm run db:push
npm run db:generate
```

### 3.5 기본 Fastify 엔트리포인트 (`backend/src/index.ts`)
```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';

dotenv.config();

const app = Fastify({ logger: true });

async function main() {
  // CORS
  await app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger OpenAPI 3.0 (/docs)
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'FitterSweat API',
        version: '1.0.0',
        description: '국내 HYROX 커뮤니티 커머스 플랫폼 핵심 REST API',
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  // Health Check
  app.get('/health', async () => ({ status: 'ok', service: 'FitterSweat Backend' }));

  // v1 API Route
  app.get('/api/v1/events', async () => {
    return { success: true, events: [] };
  });

  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`✅ FitterSweat Backend running on http://localhost:${port}`);
  console.log(`📄 Swagger UI available at http://localhost:${port}/docs`);
}

main().catch(err => {
  app.log.error(err);
  process.exit(1);
});
```

---

## 🎨 4단계: Frontend 설정 (Next.js 14 App Router) (10분)

### 4.1 Next.js 14 프로젝트 초기화
```bash
cd ..
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd frontend
```

### 4.2 필수 패키지 설치
```bash
npm install @tanstack/react-query@^5.0.5 zustand@^4.4.4 axios@^1.5.1 date-fns@^2.30.0 lucide-react @toss/payment-sdk
```

### 4.3 환경 변수 설정 (`frontend/.env.local`)
```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
EOF
```

### 4.4 표준 API 클라이언트 (`frontend/lib/api.ts`)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const eventApi = {
  getEvents: () => api.get('/api/v1/events').then(res => res.data),
  getEventDetail: (id: string) => api.get(`/api/v1/events/${id}`).then(res => res.data),
  toggleInterest: (id: string) => api.post(`/api/v1/events/${id}/interested`).then(res => res.data),
};

export const productApi = {
  getProducts: () => api.get('/api/v1/products').then(res => res.data),
  getProductDetail: (id: string) => api.get(`/api/v1/products/${id}`).then(res => res.data),
};

export default api;
```

---

## 🔍 5단계: 통합 실행 및 검증 (Checklist)

### 5.1 서버 구동
1. **터미널 1 (Backend)**:
   ```bash
   cd backend && npm run dev
   # ➔ http://localhost:3001 확인
   ```
2. **터미널 2 (Frontend)**:
   ```bash
   cd frontend && npm run dev
   # ➔ http://localhost:3000 확인
   ```

### 5.2 상태 검증 체크리스트
- [ ] `curl http://localhost:3001/health` ➔ `{"status":"ok"}` 응답
- [ ] 브라우저에서 `http://localhost:3001/docs` 접속 시 Swagger UI 정상 로드
- [ ] 브라우저에서 `http://localhost:3000` 접속 시 Next.js 14 웰컴 화면 로드
- [ ] `docker exec -it fittersweat-postgres psql -U postgres -d fittersweat_dev -c "\dx"` 실행 시 **`vector` 확장이 목록에 표시**됨

---

**기준 원본 문서**: `HYROX_국내_커뮤니티_커머스_프로젝트_계획서_최종.docx`  
**정합성 상태**: 최종 계획서 기준 100% 동기화 완료
