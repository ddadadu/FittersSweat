import { PrismaClient, Role, EventStatus, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. 기존 데이터 정리 (FK 역순)
  await prisma.postProductTag.deleteMany();
  await prisma.review.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.interestedEvent.deleteMany();
  await prisma.product.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // 2. 유저 생성 (관리자 & 일반 사용자)
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@fittersweat.com',
      passwordHash,
      name: '관리자',
      role: Role.ADMIN,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'runner1@naver.com',
      passwordHash,
      name: '김하이록스',
      role: Role.USER,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'crossfit@gmail.com',
      passwordHash,
      name: '이레이서',
      role: Role.USER,
    },
  });

  console.log(`👤 Users seeded: ${admin.email}, ${user1.email}, ${user2.email}`);

  // 3. HYROX 대회 데이터 생성
  const event1 = await prisma.event.create({
    data: {
      name: 'AirAsia HYROX Seoul 2026',
      cityCode: 'SEL',
      startDate: new Date('2026-11-13'),
      endDate: new Date('2026-11-15'),
      eventUrl: 'https://hyroxsouthkorea.com/ko/event/airasia-하이록스-서울/',
      status: EventStatus.upcoming,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      name: 'HYROX Incheon Songdo 2026',
      cityCode: 'ICN',
      startDate: new Date('2026-05-23'),
      endDate: new Date('2026-05-24'),
      eventUrl: 'https://hyroxsouthkorea.com/ko/event/hyrox-인천-송도/',
      status: EventStatus.upcoming,
    },
  });

  console.log(`🏃 Events seeded: ${event1.name}, ${event2.name}`);

  // 4. 관심 대회 등록
  await prisma.interestedEvent.create({
    data: {
      userId: user1.id,
      eventId: event1.id,
    },
  });

  // 5. 직매입 상품 데이터 생성 (AI RAG 검색의 소스가 될 상품들)
  const product1 = await prisma.product.create({
    data: {
      name: 'PUMA Deviate NITRO 2 HYROX 공식 레이스화',
      description: '카본 복합 플레이트와 나이트로 폼이 적용된 공식 HYROX 파트너 레이싱화. 런 앤 슬레드 푸시에서 뛰어난 접지력과 반발력을 제공합니다.',
      categoryId: 'shoes',
      price: 189000,
      stockQuantity: 50,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'SIS 고탄수화물 에너지젤 (카페인 75mg 포함, 콜라맛)',
      description: 'HYROX 8개 스테이션 사이사이 빠른 흡수로 젖산 축적을 막고 지구력을 유지해주는 고성능 에너지젤.',
      categoryId: 'nutrition',
      price: 3500,
      stockQuantity: 500,
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: '스파이더 고장력 파머스 캐리 트레이닝 그립 장갑',
      description: '케틀벨 캐리와 파머스 워크 시 손바닥 물집을 방지하고 악력을 보조하는 하이록스 맞춤형 가죽 그립.',
      categoryId: 'gear',
      price: 45000,
      stockQuantity: 30,
    },
  });

  const product4 = await prisma.product.create({
    data: {
      name: 'CEP 올라운드 종아리 컴프레션 슬리브 (카프가드)',
      description: '1km 러닝 8회 반복 시 종아리 쥐와 근육 떨림을 방지해주는 단계적 압박 슬리브.',
      categoryId: 'apparel',
      price: 52000,
      stockQuantity: 40,
    },
  });

  const product5 = await prisma.product.create({
    data: {
      name: '포카리스웨트 이온 파우더 전해질 보충팩 (10포)',
      description: '버피 브로드점프와 로잉머신 후 급격한 땀 손실 시 전해질 균형을 맞춰주는 분말 보충제.',
      categoryId: 'nutrition',
      price: 12000,
      stockQuantity: 100,
    },
  });

  console.log(`🛍️ Products seeded: 5 items`);

  // 6. 커뮤니티 게시글 및 후기 (AI RAG 검색의 컨텍스트 소스)
  const post1 = await prisma.post.create({
    data: {
      userId: user1.id,
      eventId: event1.id,
      title: '첫 하이록스 서울 오픈 완주 후기 (신발 및 영양 꿀팁)',
      content: '처음 출전이라 걱정이 많았는데 푸마 나이트로 신발 접지력 덕분에 슬레드 푸시 150kg 밀 때 전혀 밀리지 않았습니다. 그리고 4번째 스테이션 버피 끝나고 SIS 에너지젤 하나 빨아먹은 게 후반부 완주에 결정적이었네요. 초보자분들 꼭 에너지젤 챙기세요!',
    },
  });

  const post2 = await prisma.post.create({
    data: {
      userId: user2.id,
      eventId: event1.id,
      title: '파머스 캐리 악력 털리는 분들 장갑 그립 추천합니다',
      content: '24kg 양손에 들고 걸을 때 전완근 다 털렸는데, 가죽 그립 장갑 끼고 연습하니까 훨씬 안정적이었습니다. 손바닥 굳은살 찢어지는 것도 방지됩니다.',
    },
  });

  // 7. 게시글 댓글
  await prisma.postComment.create({
    data: {
      postId: post1.id,
      userId: user2.id,
      content: '저도 다음 인천 대회 나가는데 신발 추천 감사합니다! 바로 장바구니 담았습니다.',
    },
  });

  // 8. 게시글 - 상품 태그 연결
  await prisma.postProductTag.create({
    data: {
      postId: post1.id,
      productId: product1.id,
    },
  });

  await prisma.postProductTag.create({
    data: {
      postId: post1.id,
      productId: product2.id,
    },
  });

  await prisma.postProductTag.create({
    data: {
      postId: post2.id,
      productId: product3.id,
    },
  });

  // 9. 실구매자 상품 리뷰
  await prisma.review.create({
    data: {
      productId: product1.id,
      userId: user1.id,
      rating: 5,
      content: '하이록스 공식 신발답게 트랙에서도 잘 달리고 슬레드 밀 때 접지력이 최고입니다.',
    },
  });

  console.log('✅ Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
