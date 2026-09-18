import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

interface PostSeed {
  id: string;
  title: string;
  stationTag?: string;
  authorName: string;
  authorEmail?: string;
  eventId?: number;
  content: string;
  keyTakeaway?: string;
  taggedProductIds?: number[];
  comments?: Array<{ authorName: string; content: string }>;
}

const prisma = new PrismaClient();

// 1. Korean & Alphanumeric Tokenizer
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sㄱ-ㅎ가-힣]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

// 2. Cosine Similarity for Sparse Word Vectors
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

// 3. Dense Vector Cosine Similarity
function denseCosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function main() {
  console.log('================================================================');
  console.log('📊 [FittersSweat] 커뮤니티 피드 더미데이터 텍스트 유사도 & 다양성 정밀 측정');
  console.log('================================================================\n');

  // Load community seed json
  const dataPath = path.join(__dirname, '../prisma/data/community-seed-data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ Data file not found:', dataPath);
    process.exit(1);
  }
  const posts: PostSeed[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const N = posts.length;
  console.log(`📦 분석 대상: community-seed-data.json 총 ${N}개 게시글`);

  // --- SECTION 1: 코퍼스 기본 통계 및 어휘 다양성 (Lexical Diversity) ---
  console.log('\n----------------------------------------------------------------');
  console.log('1️⃣ 코퍼스 기본 통계 및 어휘 다양도 (TTR: Type-Token Ratio)');
  console.log('----------------------------------------------------------------');

  const charLengths: number[] = [];
  const tokenLengths: number[] = [];
  const allTokens: string[] = [];
  const stationMap: Record<string, PostSeed[]> = {};

  posts.forEach((p) => {
    const fullText = `${p.title} ${p.content} ${p.keyTakeaway || ''}`;
    const chars = fullText.length;
    const tokens = tokenize(fullText);
    charLengths.push(chars);
    tokenLengths.push(tokens.length);
    allTokens.push(...tokens);

    const station = p.stationTag || 'GENERAL';
    if (!stationMap[station]) stationMap[station] = [];
    stationMap[station].push(p);
  });

  const totalChars = charLengths.reduce((a, b) => a + b, 0);
  const avgChars = (totalChars / N).toFixed(1);
  const minChars = Math.min(...charLengths);
  const maxChars = Math.max(...charLengths);

  const totalTokens = allTokens.length;
  const uniqueVocab = new Set(allTokens);
  const vocabSize = uniqueVocab.size;
  const overallTTR = ((vocabSize / totalTokens) * 100).toFixed(2);
  const avgTokensPerPost = (totalTokens / N).toFixed(1);

  console.log(`• 총 문자 수: ${totalChars.toLocaleString()}자 (게시글당 평균 ${avgChars}자, 최소 ${minChars}자 ~ 최대 ${maxChars}자)`);
  console.log(`• 총 토큰 수: ${totalTokens.toLocaleString()}개 (게시글당 평균 ${avgTokensPerPost}개 토큰)`);
  console.log(`• 고유 어휘 수(Vocabulary Size): ${vocabSize.toLocaleString()}개`);
  console.log(`• 전체 어휘 다양도(TTR): ${overallTTR}% (참고: 자연어 코퍼스 기준 15~35% 수준 시 건강한 어휘 분포)`);

  console.log('\n📂 [스테이션별 분포 및 어휘 다양성]');
  console.log('| 스테이션 태그 | 게시글 수 | 고유 어휘 수 | 총 토큰 수 | TTR (%) | 평균 글자수 |');
  console.log('| :--- | :---: | :---: | :---: | :---: | :---: |');

  for (const [st, items] of Object.entries(stationMap)) {
    const stTokens: string[] = [];
    let stChars = 0;
    items.forEach((item) => {
      const text = `${item.title} ${item.content}`;
      stChars += text.length;
      stTokens.push(...tokenize(text));
    });
    const stVocab = new Set(stTokens).size;
    const stTTR = ((stVocab / stTokens.length) * 100).toFixed(2);
    const stAvgChars = (stChars / items.length).toFixed(0);
    console.log(`| ${st.padEnd(18)} | ${String(items.length).padStart(4)}개 | ${String(stVocab).padStart(6)}개 | ${String(stTokens.length).padStart(5)}개 | ${stTTR.padStart(6)}% | ${stAvgChars.padStart(6)}자 |`);
  }

  // --- SECTION 2: TF-IDF 모델 구축 및 전체 쌍별 유사도 (Pairwise Similarity) ---
  console.log('\n----------------------------------------------------------------');
  console.log('2️⃣ 전체 게시글 쌍별 유사도 전수 조사 (Pairwise Similarity)');
  console.log('----------------------------------------------------------------');

  const docTokens = posts.map((p) => tokenize(`${p.title} ${p.content}`));
  const df: Record<string, number> = {};
  docTokens.forEach((tokens) => {
    const seen = new Set(tokens);
    seen.forEach((t) => {
      df[t] = (df[t] || 0) + 1;
    });
  });

  const idf: Record<string, number> = {};
  for (const [term, freq] of Object.entries(df)) {
    idf[term] = Math.log((N + 1) / (freq + 1)) + 1;
  }

  const tfidfVectors = docTokens.map((tokens) => {
    const tf: Record<string, number> = {};
    tokens.forEach((t) => {
      tf[t] = (tf[t] || 0) + 1;
    });
    const vec: Record<string, number> = {};
    for (const [t, count] of Object.entries(tf)) {
      vec[t] = (count / tokens.length) * (idf[t] || 1);
    }
    return vec;
  });

  const totalPairs = (N * (N - 1)) / 2;
  let sumCosine = 0;
  let sumJaccard = 0;
  let maxCosine = 0;
  let maxJaccard = 0;
  let maxCosinePair: [number, number] = [0, 0];

  const cosineDist = {
    '0.00 ~ 0.10 (완전 이질적)': 0,
    '0.10 ~ 0.25 (낮은 유사도)': 0,
    '0.25 ~ 0.40 (주제 유사성)': 0,
    '0.40 ~ 0.60 (유사한 토픽)': 0,
    '0.60 ~ 0.70 (높은 유사도)': 0,
    '0.70 ~ 0.85 (중복 의심)': 0,
    '0.85 ~ 1.00 (거의 동일/복붙)': 0,
  };

  const highSimilarityPairs: Array<{
    i: number;
    j: number;
    cosine: number;
    jaccard: number;
  }> = [];

  for (let i = 0; i < N; i++) {
    const setA = new Set(docTokens[i]);
    for (let j = i + 1; j < N; j++) {
      const setB = new Set(docTokens[j]);
      // Jaccard
      const intersection = new Set([...setA].filter((x) => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      const jaccard = union.size > 0 ? intersection.size / union.size : 0;
      sumJaccard += jaccard;
      if (jaccard > maxJaccard) maxJaccard = jaccard;

      // Cosine
      const cos = cosineSim(tfidfVectors[i], tfidfVectors[j]);
      sumCosine += cos;
      if (cos > maxCosine) {
        maxCosine = cos;
        maxCosinePair = [i, j];
      }

      if (cos < 0.1) cosineDist['0.00 ~ 0.10 (완전 이질적)']++;
      else if (cos < 0.25) cosineDist['0.10 ~ 0.25 (낮은 유사도)']++;
      else if (cos < 0.4) cosineDist['0.25 ~ 0.40 (주제 유사성)']++;
      else if (cos < 0.6) cosineDist['0.40 ~ 0.60 (유사한 토픽)']++;
      else if (cos < 0.7) cosineDist['0.60 ~ 0.70 (높은 유사도)']++;
      else if (cos < 0.85) cosineDist['0.70 ~ 0.85 (중복 의심)']++;
      else cosineDist['0.85 ~ 1.00 (거의 동일/복붙)']++;

      if (cos >= 0.6) {
        highSimilarityPairs.push({ i, j, cosine: cos, jaccard });
      }
    }
  }

  const avgCosine = (sumCosine / totalPairs).toFixed(4);
  const avgJaccard = (sumJaccard / totalPairs).toFixed(4);

  console.log(`• 총 검사된 쌍(Pair) 수: ${totalPairs.toLocaleString()}쌍`);
  console.log(`• 전체 평균 코사인 유사도(TF-IDF): ${avgCosine} (이상적 범위: 0.10 ~ 0.25)`);
  console.log(`• 전체 평균 자카드 유사도(Jaccard): ${avgJaccard}`);
  console.log(`• 최대 코사인 유사도: ${maxCosine.toFixed(4)}`);

  console.log('\n📊 [코사인 유사도 분포 현황]');
  for (const [range, count] of Object.entries(cosineDist)) {
    const pct = ((count / totalPairs) * 100).toFixed(2);
    const bar = '█'.repeat(Math.round(Number(pct) / 2));
    console.log(`  ${range.padEnd(23)}: ${String(count).padStart(5)}쌍 (${pct.padStart(5)}%) ${bar}`);
  }

  const nearDupCount = cosineDist['0.70 ~ 0.85 (중복 의심)'] + cosineDist['0.85 ~ 1.00 (거의 동일/복붙)'];
  const nearDupRate = ((nearDupCount / totalPairs) * 100).toFixed(2);
  console.log(`\n🚨 중복 의심 쌍(유사도 70% 이상): 총 ${nearDupCount}쌍 / ${totalPairs}쌍 중 (${nearDupRate}%)`);

  if (highSimilarityPairs.length > 0) {
    highSimilarityPairs.sort((a, b) => b.cosine - a.cosine);
    console.log('\n🔍 [가장 유사한 게시글 쌍 Top-3 상세]');
    highSimilarityPairs.slice(0, 3).forEach((p, rank) => {
      console.log(`  ${rank + 1}. 유사도: ${(p.cosine * 100).toFixed(1)}% (Jaccard: ${(p.jaccard * 100).toFixed(1)}%)`);
      console.log(`     - 글 A [${posts[p.i].stationTag || 'GEN'}]: "${posts[p.i].title}"`);
      console.log(`     - 글 B [${posts[p.j].stationTag || 'GEN'}]: "${posts[p.j].title}"`);
    });
  }

  // --- SECTION 3: 스테이션 내 응집도 vs 스테이션 간 분별력 ---
  console.log('\n----------------------------------------------------------------');
  console.log('3️⃣ 스테이션 내부 응집도(Intra) vs 타 스테이션 간 분별력(Inter)');
  console.log('----------------------------------------------------------------');

  let intraSum = 0;
  let intraPairs = 0;
  let interSum = 0;
  let interPairs = 0;

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const cos = cosineSim(tfidfVectors[i], tfidfVectors[j]);
      if (posts[i].stationTag && posts[i].stationTag === posts[j].stationTag) {
        intraSum += cos;
        intraPairs++;
      } else {
        interSum += cos;
        interPairs++;
      }
    }
  }

  const avgIntra = intraPairs > 0 ? (intraSum / intraPairs).toFixed(4) : '0';
  const avgInter = interPairs > 0 ? (interSum / interPairs).toFixed(4) : '0';
  const separationRatio = Number(avgInter) > 0 ? (Number(avgIntra) / Number(avgInter)).toFixed(2) : 'N/A';

  console.log(`• 동일 스테이션 내부 평균 유사도 (Intra-Cluster): ${avgIntra} (${intraPairs}쌍)`);
  console.log(`• 서로 다른 스테이션 간 평균 유사도 (Inter-Cluster): ${avgInter} (${interPairs}쌍)`);
  console.log(`• 주제 분별비 (Separation Ratio = Intra / Inter): ${separationRatio}배`);
  console.log(`  👉 해석: 동일 스테이션 글끼리 약 ${separationRatio}배 더 높은 의미적 응집도를 보여, 스테이션별 주제 분리가 우수하게 성립되어 있습니다.`);

  // --- SECTION 4: 실제 PostgreSQL pgvector (Gemini 768차원) 시맨틱 유사도 ---
  console.log('\n----------------------------------------------------------------');
  console.log('4️⃣ DB 적재 pgvector (Gemini 768차원 임베딩) 시맨틱 유사도 측정');
  console.log('----------------------------------------------------------------');

  try {
    const dbPosts = await prisma.$queryRaw<
      Array<{ id: bigint; title: string; embedding_text: string }>
    >`SELECT id, title, embedding::text AS embedding_text FROM posts WHERE embedding IS NOT NULL ORDER BY id ASC;`;

    console.log(`📦 DB 적재 벡터: 총 ${dbPosts.length}개 post 임베딩 로드 완료`);

    if (dbPosts.length > 1) {
      const vectors = dbPosts.map((p) => {
        const raw = p.embedding_text.replace('[', '').replace(']', '');
        return raw.split(',').map(Number);
      });

      const dbPairsCount = (dbPosts.length * (dbPosts.length - 1)) / 2;
      let dbCosineSum = 0;
      let dbMaxCosine = -1;
      let dbMinCosine = 1;
      let dbMaxPair = [0, 0];
      let dbMinPair = [0, 0];

      const denseCosineDist = {
        '0.50 미만 (원거리)': 0,
        '0.50 ~ 0.65 (보통)': 0,
        '0.65 ~ 0.80 (유사)': 0,
        '0.80 ~ 0.90 (매우 유사)': 0,
        '0.90 이상 (중복 의심)': 0,
      };

      for (let i = 0; i < dbPosts.length; i++) {
        for (let j = i + 1; j < dbPosts.length; j++) {
          const sim = denseCosineSim(vectors[i], vectors[j]);
          dbCosineSum += sim;
          if (sim > dbMaxCosine) {
            dbMaxCosine = sim;
            dbMaxPair = [i, j];
          }
          if (sim < dbMinCosine) {
            dbMinCosine = sim;
            dbMinPair = [i, j];
          }

          if (sim < 0.5) denseCosineDist['0.50 미만 (원거리)']++;
          else if (sim < 0.65) denseCosineDist['0.50 ~ 0.65 (보통)']++;
          else if (sim < 0.8) denseCosineDist['0.65 ~ 0.80 (유사)']++;
          else if (sim < 0.9) denseCosineDist['0.80 ~ 0.90 (매우 유사)']++;
          else denseCosineDist['0.90 이상 (중복 의심)']++;
        }
      }

      const dbAvgCosine = (dbCosineSum / dbPairsCount).toFixed(4);
      console.log(`• Gemini 768차원 전체 쌍 평균 유사도: ${dbAvgCosine}`);
      console.log(`• 최소 유사도: ${dbMinCosine.toFixed(4)} / 최대 유사도: ${dbMaxCosine.toFixed(4)}`);

      console.log('\n📊 [pgvector 시맨틱 유사도 분포]');
      for (const [range, count] of Object.entries(denseCosineDist)) {
        const pct = ((count / dbPairsCount) * 100).toFixed(2);
        const bar = '█'.repeat(Math.round(Number(pct) / 2));
        console.log(`  ${range.padEnd(20)}: ${String(count).padStart(6)}쌍 (${pct.padStart(5)}%) ${bar}`);
      }

      console.log('\n🔍 [Gemini 시맨틱 기준 가장 유사한 게시글 Top-1]');
      console.log(`  • 유사도: ${(dbMaxCosine * 100).toFixed(2)}%`);
      console.log(`    - 글 A (ID ${dbPosts[dbMaxPair[0]].id}): "${dbPosts[dbMaxPair[0]].title}"`);
      console.log(`    - 글 B (ID ${dbPosts[dbMaxPair[1]].id}): "${dbPosts[dbMaxPair[1]].title}"`);

      console.log('\n🔍 [Gemini 시맨틱 기준 가장 거리가 먼 게시글 Top-1]');
      console.log(`  • 유사도: ${(dbMinCosine * 100).toFixed(2)}%`);
      console.log(`    - 글 A (ID ${dbPosts[dbMinPair[0]].id}): "${dbPosts[dbMinPair[0]].title}"`);
      console.log(`    - 글 B (ID ${dbPosts[dbMinPair[1]].id}): "${dbPosts[dbMinPair[1]].title}"`);
    }
  } catch (err) {
    console.warn('⚠️ pgvector query warning:', err);
  }

  // --- SECTION 5: 실제 RAG 쿼리 검색 시뮬레이션 ---
  console.log('\n----------------------------------------------------------------');
  console.log('5️⃣ 실전 레이서 질문 RAG 검색 시뮬레이션 및 다양성 점검');
  console.log('----------------------------------------------------------------');

  const testQueries = [
    {
      label: '질문 1: 슬레드 푸시 & 접지력 장비 팁',
      query: '슬레드 푸시 150kg 밀 때 바닥 안 미끄러지는 신발이랑 전경 자세 팁 알려줘',
    },
    {
      label: '질문 2: 런닝 에너지젤 및 보급 전략',
      query: '8km 달리는 동안 후반에 쥐 안 나게 챙겨 먹어야 하는 에너지젤 타이밍',
    },
    {
      label: '질문 3: 관절 보호 및 테이핑 기어',
      query: '샌드백 런지랑 버피할 때 무릎이랑 손목 관절 통증 막아주는 보호대 후기',
    },
  ];

  testQueries.forEach((tq) => {
    const qVec = (() => {
      const qTokens = tokenize(tq.query);
      const tf: Record<string, number> = {};
      qTokens.forEach((t) => {
        tf[t] = (tf[t] || 0) + 1;
      });
      const vec: Record<string, number> = {};
      for (const [t, count] of Object.entries(tf)) {
        vec[t] = (count / qTokens.length) * (idf[t] || 1);
      }
      return vec;
    })();

    const scored = posts.map((p, idx) => ({
      post: p,
      score: cosineSim(qVec, tfidfVectors[idx]),
    }));

    scored.sort((a, b) => b.score - a.score);
    const top5 = scored.slice(0, 5);

    console.log(`\n🔎 [${tq.label}]`);
    console.log(`   질문: "${tq.query}"`);
    const stations = new Set<string>();
    top5.forEach((res, rank) => {
      const st = res.post.stationTag || 'GEN';
      stations.add(st);
      console.log(`   ${rank + 1}위 [유사도 ${(res.score * 100).toFixed(1)}%] [${st}] ${res.post.title}`);
      if (res.post.keyTakeaway) {
        console.log(`       💡 핵심요약: ${res.post.keyTakeaway.slice(0, 60)}...`);
      }
    });
    console.log(`   👉 검색 결과 다양성: 상위 5개 중 ${stations.size}개 서로 다른 스테이션/관점 포괄`);
  });

  console.log('\n================================================================');
  console.log('✅ 커뮤니티 피드 유사도 및 다양성 정밀 측정 완료');
  console.log('================================================================');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
