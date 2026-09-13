import fs from 'fs';
import path from 'path';

interface Product {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  brandLogoUrl: string;
  detailImageUrl: string;
}

const productsPath = path.join(__dirname, '../prisma/data/products.json');
const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

// 1. Basic Tokenizer
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sㄱ-ㅎ가-힣]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

// 2. Category Diversity Analysis
console.log('===============================================================');
console.log('🔬 [1] 전체 코퍼스 및 카테고리별 텍스트 다양성 분석 (NLP Metrics)');
console.log('===============================================================');

const catMap: Record<string, Product[]> = {};
for (const p of products) {
  if (!catMap[p.categoryId]) catMap[p.categoryId] = [];
  catMap[p.categoryId].push(p);
}

for (const [cat, items] of Object.entries(catMap)) {
  const allTokens: string[] = [];
  const baseDescs = new Set<string>();
  const baseNames = new Set<string>();

  for (const item of items) {
    const tokens = tokenize(item.name + ' ' + item.description);
    allTokens.push(...tokens);

    // Cleaned core description
    const cleanedDesc = item.description.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
    baseDescs.add(cleanedDesc);

    // Base name
    const baseName = item.name.split('-')[0].replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
    baseNames.add(baseName);
  }

  const vocab = new Set(allTokens);
  const ttr = ((vocab.size / allTokens.length) * 100).toFixed(2); // Type-Token Ratio
  const redundancyRate = (((items.length - baseDescs.size) / items.length) * 100).toFixed(1);

  // Pairwise Jaccard similarity (>0.75 is near duplicate)
  let nearDuplicatePairs = 0;
  let totalPairs = 0;
  for (let i = 0; i < items.length; i++) {
    const tokensA = new Set(tokenize(items[i].description));
    for (let j = i + 1; j < items.length; j++) {
      const tokensB = new Set(tokenize(items[j].description));
      const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
      const union = new Set([...tokensA, ...tokensB]);
      const jaccard = intersection.size / union.size;
      totalPairs++;
      if (jaccard >= 0.70) {
        nearDuplicatePairs++;
      }
    }
  }

  console.log(`\n📂 카테고리: [${cat.toUpperCase()}] (총 ${items.length}개 상품)`);
  console.log(`  - 실제 고유 모델(Base Models): ${baseNames.size}종 (전체의 ${baseNames.size}%)`);
  console.log(`  - 고유 핵심 설명(Unique Core Descriptions): ${baseDescs.size}개`);
  console.log(`  - 총 토큰 수: ${allTokens.length}개 / 어휘 집합(Vocabulary): ${vocab.size}개`);
  console.log(`  - 어휘 다양도(TTR - Type-Token Ratio): ${ttr}% (낮을수록 동일 단어 반복)`);
  console.log(`  - 의미적 중복률(Semantic Redundancy Rate): ${redundancyRate}%`);
  console.log(`  - 유사도 70% 이상 쌍(Near-Duplicate Pairs): ${nearDuplicatePairs}쌍 / 전체 ${totalPairs}쌍 중 (${((nearDuplicatePairs / totalPairs) * 100).toFixed(1)}%)`);
}

// 3. TF-IDF Cosine Similarity Search Simulation
console.log('\n===============================================================');
console.log('🎯 [2] 실제 사용자 검색 쿼리 RAG 유사도 검색 시뮬레이션 (Top-5 결과)');
console.log('===============================================================');

// Build TF-IDF
const docTokens = products.map(p => tokenize(p.name + ' ' + p.description));
const df: Record<string, number> = {};
docTokens.forEach(tokens => {
  const seen = new Set(tokens);
  seen.forEach(t => {
    df[t] = (df[t] || 0) + 1;
  });
});

const N = products.length;
const idf: Record<string, number> = {};
for (const [term, freq] of Object.entries(df)) {
  idf[term] = Math.log((N + 1) / (freq + 1)) + 1;
}

function getTfidfVec(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const vec: Record<string, number> = {};
  for (const [t, count] of Object.entries(tf)) {
    vec[t] = (count / tokens.length) * (idf[t] || 1);
  }
  return vec;
}

function cosineSim(vecA: Record<string, number>, vecB: Record<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [k, v] of Object.entries(vecA)) {
    normA += v * v;
    if (vecB[k]) dot += v * vecB[k];
  }
  for (const v of Object.values(vecB)) {
    normB += v * v;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const docVectors = docTokens.map(t => getTfidfVec(t));

const testQueries = [
  {
    title: '쿼리 1: 레이스 슈즈 검색',
    query: '슬레드 밀기 접지력 좋고 발목 잘 잡아주는 카본화 추천해줘',
  },
  {
    title: '쿼리 2: 뉴트리션 검색',
    query: '경기 후반부 다리에 쥐 안 나게 도와주는 전해질이랑 에너지젤',
  },
  {
    title: '쿼리 3: 장비 및 기어 검색',
    query: '샌드백 런지 무릎 보호대랑 슬레드 풀 로프 당기는 장갑',
  },
  {
    title: '쿼리 4: 공식 스테이션 장비 견적 검색',
    query: '체육관에 둘 HYROX 공식 파워 슬레드랑 15m 썰매 로프 세트',
  },
];

testQueries.forEach((tq, qIdx) => {
  const qVec = getTfidfVec(tokenize(tq.query));
  const scored = products.map((p, idx) => ({
    product: p,
    score: cosineSim(qVec, docVectors[idx]),
  }));

  scored.sort((a, b) => b.score - a.score);
  const top5 = scored.slice(0, 5);

  console.log(`\n🔎 [${tq.title}]`);
  console.log(`   질문: "${tq.query}"`);
  console.log('   --- 검색 결과 Top-5 ---');

  const baseNamesInTop5: string[] = [];
  top5.forEach((res, rank) => {
    const baseName = res.product.name.split('-')[0].replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
    baseNamesInTop5.push(baseName);
    console.log(`   ${rank + 1}위 (유사도: ${res.score.toFixed(4)}) [${res.product.categoryId}] ${res.product.name}`);
  });

  const uniqueBaseInTop5 = new Set(baseNamesInTop5);
  const duplicateCount = 5 - uniqueBaseInTop5.size;
  const duplicateRate = ((duplicateCount / 5) * 100).toFixed(0);

  console.log(`   👉 Top-5 내 동일 제품 중복 점유율: ${duplicateRate}% (${duplicateCount}개 품목이 상위 상품의 색상/에디션 복사본)`);
  if (duplicateCount >= 2) {
    console.log(`   ⚠️ 경고: 동일 베이스 모델("${[...uniqueBaseInTop5][0]}")이 상위 순위를 독점하여 다양성(Diversity)이 붕괴됨.`);
  }
});
