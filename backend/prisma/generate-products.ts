import fs from 'fs';
import path from 'path';

export interface ProductData {
  name: string;
  description: string;
  categoryId: 'shoes' | 'nutrition' | 'gear' | 'equipment';
  price: number;
  stockQuantity: number;
  imageUrl: string;
  brandLogoUrl: string;
  detailImageUrl: string;
}

const products: ProductData[] = [];

// Helper to add product
function addProduct(
  categoryId: 'shoes' | 'nutrition' | 'gear' | 'equipment',
  name: string,
  brand: string,
  logoFile: string,
  description: string,
  price: number,
  stockQuantity: number,
  slug: string
) {
  products.push({
    name,
    description,
    categoryId,
    price,
    stockQuantity,
    imageUrl: `https://res.cloudinary.com/fittersweat/image/upload/v1/products/${categoryId}/${slug}.webp`,
    brandLogoUrl: `https://res.cloudinary.com/fittersweat/image/upload/v1/brands/${logoFile}`,
    detailImageUrl: `https://res.cloudinary.com/fittersweat/image/upload/v1/details/${categoryId}/${slug}_detail.webp`,
  });
}

/* =========================================================================
   1. SHOES (100 Unique Items across 10 Distinct Functional Categories)
   ========================================================================= */

// 1-1. 카본 플레이트 엘리트 레이스화 (10종)
addProduct('shoes', 'PUMA Deviate NITRO Elite 3 카본 레이서', 'PUMA', 'puma_logo.png',
  '초경량 모노메쉬 갑피와 풀렝스 PWRPLATE 카본이 결합되어 1km 인터벌 런에서 폭발적인 추진력과 0.1초 기록 단축을 선사하는 HYROX 공식 파트너 레이싱화.',
  249000, 35, 'puma_deviate_nitro_elite_3');
addProduct('shoes', 'Saucony Endorphin Pro 4 카본 슈퍼슈즈', 'Saucony', 'saucony_logo.png',
  'PWRRUN PB 폼과 스푼형 카본 플레이트의 황금 조합으로 착지 충격을 90% 이상 반발 에너지로 전환하는 엘리트 전용 레이스화.',
  289000, 25, 'saucony_endorphin_pro_4');
addProduct('shoes', 'Nike Alphafly 3 에어줌 카본 레이스', 'Nike', 'nike_logo.png',
  '듀얼 에어 줌 유닛과 초경량 줌X 폼이 8개 랩 러닝 내내 다리 피로를 제로화해주는 최상위 카본 마라톤 레이싱화.',
  329000, 20, 'nike_alphafly_3');
addProduct('shoes', 'Hoka Rocket X 2 페바 카본 플레이트화', 'Hoka', 'hoka_logo.png',
  '기하학적 메타-로커 지오메트리와 윙 카본 플레이트로 슬레드 후 다리가 굳었을 때도 자연스러운 회전을 유도하는 슈퍼슈즈.',
  299000, 18, 'hoka_rocket_x_2');
addProduct('shoes', 'Asics Metaspeed Sky Paris 초경량 카본', 'Asics', 'asics_logo.png',
  'FF TURBO PLUS 폼을 장착하여 보폭(Stride)형 레이서의 수직 반발력을 극대화한 180g대 초경량 카본 레이서.',
  299000, 22, 'asics_metaspeed_sky_paris');
addProduct('shoes', 'Altra Vanish Carbon 2 제로드롭 카본화', 'Altra', 'altra_logo.png',
  '발가락이 자유롭게 퍼지는 풋쉐이프 토박스에 카본 하프 플레이트를 내장해 자연스러운 주법과 탄성을 동시에 제공.',
  289000, 30, 'altra_vanish_carbon_2');
addProduct('shoes', 'Brooks Hyperion Elite 4 아리리스 카본', 'Brooks', 'brooks_logo.png',
  'DNA FLASH v2 질소 주입 폼과 아리리스 카본 플레이트로 런닝 후반부 스피드 유지력을 보장하는 레이스 슈즈.',
  299000, 15, 'brooks_hyperion_elite_4');
addProduct('shoes', 'HyperOx Carbon Sprint Ultra 에디션', 'HyperOx', 'hyperox_logo.png',
  'HYROX 경기 규격 시뮬레이션을 통해 개발된 전용 풀렝스 카본화. 슬레드 푸시 시 아웃솔 꺾임 각도에 최적화된 플레이트 설계.',
  229000, 40, 'hyperox_carbon_sprint_ultra');
addProduct('shoes', 'PaceStrike NitroDrive Carbon 하이브리드', 'PaceStrike', 'pacestrike_logo.png',
  '경기장 인조잔디 트랙과 우레탄 런 트랙 양쪽에서 최대의 마찰계수를 발휘하는 듀얼 아웃솔 일체형 카본 레이서.',
  219000, 35, 'pacestrike_nitrodrive_carbon');
addProduct('shoes', 'SwiftOx AeroPlate V1 경량 레이싱화', 'SwiftOx', 'swiftox_logo.png',
  '초경량 165g 무게와 반응성 듀얼 폼으로 8km 누적 피로 구간에서도 케이던스를 경쾌하게 유지해주는 레이싱화.',
  199000, 28, 'swiftox_aeroplate_v1');

// 1-2. 슬레드 푸시/풀 특화 고접지 하이브리드화 (10종)
addProduct('shoes', 'Inov-8 F-Lite G 300 그래핀 슬레드화', 'Inov-8', 'inov8_logo.png',
  '노벨상 수상 소재 그래핀 강화 고무 아웃솔을 탑재하여 152kg/202kg 중량 슬레드 밀기 시 완벽한 바닥 마찰력을 제공.',
  199000, 45, 'inov8_flite_g300');
addProduct('shoes', 'PUMA PUMAGRIP Sled Master Pro', 'PUMA', 'puma_logo.png',
  '인조잔디 카펫에 달라붙는 전용 고무 배합과 강화 토 범퍼를 장착하여 슬레드 푸시 시 미끄러짐을 원천 차단한 하이브리드화.',
  169000, 50, 'puma_pumagrip_sled_master_pro');
addProduct('shoes', 'Saucony Ride 17 Turf Grip 에디션', 'Saucony', 'saucony_logo.png',
  '슬레드 풀 로프 당기기 시 뒤꿈치 제동력을 극대화한 삼각 트레드 패턴과 PWRRUN+ 쿠셔닝이 적용된 하이브리드 트레이너.',
  159000, 40, 'saucony_ride_17_turf_grip');
addProduct('shoes', 'Hoka Zinal 2 Vibram 메가그립 레이서', 'Hoka', 'hoka_logo.png',
  '비브람 메가그립 라이트베이스 5mm 러그가 인조잔디 터프를 단단히 움켜쥐어 슬레드 구간에서 시간 손실을 방지.',
  189000, 35, 'hoka_zinal_2_vibram');
addProduct('shoes', 'Nike Ultrafly Turf/Road 하이브리드', 'Nike', 'nike_logo.png',
  '비브람 트랙션 러그 아웃솔과 줌X 폼이 결합되어 썰매 밀기와 1km 러닝 트랙을 가리지 않고 접지력을 유지하는 올라운더.',
  289000, 25, 'nike_ultrafly_turf_road');
addProduct('shoes', 'Inov-8 MudClaw G 260 터프 클로', 'Inov-8', 'inov8_logo.png',
  '8mm 심층 그래핀 러그로 미끄러운 젖은 터프 카펫에서도 썰매를 밀어붙일 수 있는 초강력 접지 레이스화.',
  209000, 20, 'inov8_mudclaw_g260');
addProduct('shoes', 'HyperOx SledClaw Hybrid 1.0', 'HyperOx', 'hyperox_logo.png',
  '앞코 토 범퍼 강화와 미끄럼 방지 다이아몬드 패턴이 적용되어 슬레드 밀기와 버피 점프에서 흔들림 없는 지지력 제공.',
  179000, 42, 'hyperox_sledclaw_hybrid_1');
addProduct('shoes', 'RaceGrip Apex Traction 터프화', 'RaceGrip', 'racegrip_logo.png',
  '15m 슬레드 풀링 시 체중을 뒤로 실었을 때 힐 카운터가 미끄러지지 않도록 특수 설계된 제동용 아웃솔 탑재.',
  169000, 38, 'racegrip_apex_traction');
addProduct('shoes', 'PaceStrike TurfElite Pro Sled', 'PaceStrike', 'pacestrike_logo.png',
  '인조잔디 전용 마찰 계수 0.85 인증 아웃솔로 슬레드 푸시 에너지를 100% 추진력으로 변환하는 하이록스 특화 슈즈.',
  185000, 30, 'pacestrike_turfelite_pro_sled');
addProduct('shoes', 'NitroPulse PowerThrust Sled Racer', 'NitroPulse', 'nitropulse_logo.png',
  '단단한 토 박스와 전족부 고탄성 지지대로 무거운 슬레드를 밀 때 발가락 꺾임 통증을 완벽히 흡수하는 장비화.',
  179000, 32, 'nitropulse_powerthrust_sled_racer');

// 1-3. 와이드 토박스 / 평발 / 아치 서포트 안정화 (10종)
addProduct('shoes', 'Altra Escalante Racer 2E 와이드핏', 'Altra', 'altra_logo.png',
  '발볼 넓은 러너를 위한 와이드 토박스와 제로드롭 설계로 샌드백 런지와 파머스 캐리 시 지면 접촉 면적을 극대화.',
  169000, 40, 'altra_escalante_racer_2e');
addProduct('shoes', 'Altra Torin 7 플러시 와이드 안정화', 'Altra', 'altra_logo.png',
  'EGO MAX 폼과 넓은 발볼 구조로 장시간 러닝과 런지 동작에서 무지외반증 및 족저근막 통증을 예방하는 편안한 레이스화.',
  179000, 35, 'altra_torin_7_wide');
addProduct('shoes', 'Saucony Tempus Arch-Lock 평발 안정화', 'Saucony', 'saucony_logo.png',
  '슈퍼폼 PWRRUN PB와 아치를 단단히 감싸는 프레임 구조로 평발 러너의 내전(Overpronation) 현상을 완벽 교정.',
  189000, 30, 'saucony_tempus_arch_lock');
addProduct('shoes', 'Hoka Arahi 7 J-Frame 모션컨트롤화', 'Hoka', 'hoka_logo.png',
  'J-Frame 지지 기술이 적용되어 피로가 극에 달하는 6~8 스테이션 구간에서 발목 안쪽 무너짐을 막아주는 서포트 슈즈.',
  169000, 33, 'hoka_arahi_7_j_frame');
addProduct('shoes', 'Asics GT-2000 12 4E 슈퍼와이드', 'Asics', 'asics_logo.png',
  '3D 가이던스 시스템과 4E 광폭 발볼로 한국인 발형에 완벽 밀착하며 런지와 착지 안정성을 극대화한 데일리 레이서.',
  149000, 48, 'asics_gt2000_12_4e');
addProduct('shoes', 'Brooks Adrenaline GTS 23 가이드레일', 'Brooks', 'brooks_logo.png',
  '가이드레일 서포트 시스템이 무릎과 골반의 불필요한 비틀림을 억제하여 샌드백 런지 시 흔들림 없는 중심 유지.',
  169000, 27, 'brooks_adrenaline_gts_23');
addProduct('shoes', 'PUMA ForeverRun NITRO 광폭 서포트', 'PUMA', 'puma_logo.png',
  '러너 가이드 시스템 인솔과 비대칭 힐 카운터로 버피와 런지 착지 시 발목 흔들림을 잡아주는 안정형 하이록스화.',
  179000, 36, 'puma_foreverrun_nitro_wide');
addProduct('shoes', 'HyperOx OrthoFit Wide 아치안정화', 'HyperOx', 'hyperox_logo.png',
  '내장형 카본 아치 섕크와 2E 와이드 플랫폼으로 평발 선수의 피로골절과 아치 저하를 방지하는 특화 슈즈.',
  189000, 29, 'hyperox_orthofit_wide');
addProduct('shoes', 'PaceStrike ArchShield Pro 레이스', 'PaceStrike', 'pacestrike_logo.png',
  '중족부 외측 지지 윙이 체중 이동 시 아치 붕괴를 막아주어 8개 전 스테이션에서 균일한 주행 폼 유지.',
  175000, 31, 'pacestrike_archshield_pro');
addProduct('shoes', 'Inov-8 Bare-XF Wide Fit 내추럴 슈즈', 'Inov-8', 'inov8_logo.png',
  '넓은 발볼 베어풋 플랫폼으로 케틀벨 파머스 캐리 시 발가락 전체로 지면을 단단히 움켜쥘 수 있는 고유수용감각 특화화.',
  159000, 24, 'inov8_bare_xf_wide');

// 1-4. 체중 80kg+ 헤비급 러너용 맥스 쿠셔닝화 (10종)
addProduct('shoes', 'Hoka Bondi 8 HeavyRunner 맥스쿠션', 'Hoka', 'hoka_logo.png',
  '최대 39mm 두께의 초임계 EVA 폼이 80kg 이상 체중을 가진 레이서의 무릎과 허리 관절 충격을 부드럽게 흡수.',
  189000, 42, 'hoka_bondi_8_heavy_runner');
addProduct('shoes', 'Nike Invincible 3 Max 질소폼 러너', 'Nike', 'nike_logo.png',
  '풍부한 줌X 폼과 넓은 밑창 베이스로 무거운 체중의 러너가 슬레드 이후 런 구간에 돌입할 때 극상의 쿠셔닝 제공.',
  219000, 33, 'nike_invincible_3_max');
addProduct('shoes', 'Asics Superblast 2 터보 맥스쿠션', 'Asics', 'asics_logo.png',
  'FF BLAST TURBO 폼의 경이로운 에너지 리턴으로 과체중 러너도 가볍게 통통 튀며 1km 랩타임을 유지.',
  249000, 20, 'asics_superblast_2');
addProduct('shoes', 'PUMA MagMax NITRO HeavyDuty', 'PUMA', 'puma_logo.png',
  '최대 질소 주입 폼 스택과 롤링 로커 구조로 무거운 하중에도 폼 꺼짐 없이 지속적인 반발력을 발휘하는 파워 슈즈.',
  189000, 28, 'puma_magmax_nitro_heavy_duty');
addProduct('shoes', 'Brooks Ghost Max 2 글라이드롤', 'Brooks', 'brooks_logo.png',
  '글라이드롤 로커 형상이 착지 충격을 매끄러운 전진력으로 바꿔주어 체중 부하가 큰 러너의 발목 부담 경감.',
  179000, 35, 'brooks_ghost_max_2');
addProduct('shoes', 'Saucony Triumph 22 PWRRUN PB 맥스', 'Saucony', 'saucony_logo.png',
  '100% 비드 PEBA 폼으로 제작되어 100m 샌드백 런지와 점프 착지 시에도 무릎 연골에 가해지는 충격을 분산.',
  199000, 25, 'saucony_triumph_22');
addProduct('shoes', 'Altra Olympus Via 제로드롭 맥스', 'Altra', 'altra_logo.png',
  '33mm 프리미엄 EGO MAX 폼과 제로드롭 구조로 체중이 많이 나가는 헤비 러너의 척추 압박을 최소화.',
  189000, 22, 'altra_olympus_via');
addProduct('shoes', 'HyperOx TitanCushion 40mm 레이서', 'HyperOx', 'hyperox_logo.png',
  '85kg 이상 디비전 선수를 위한 4중 밀도 댐퍼 폼이 내장되어 슬레드 밀기 후 다리 털림 현상을 획기적으로 개선.',
  195000, 30, 'hyperox_titancushion_40mm');
addProduct('shoes', 'RaceGrip MegaBounce Heavy 트레이너', 'RaceGrip', 'racegrip_logo.png',
  '고강도 듀얼 서포트 플레이트가 내장되어 무거운 체중의 선수가 착지할 때 폼이 한쪽으로 쏠리는 것을 완벽 방지.',
  179000, 27, 'racegrip_megabounce_heavy');
addProduct('shoes', 'PaceStrike HeavyShock Pro 레이스화', 'PaceStrike', 'pacestrike_logo.png',
  '고밀도 PU 엣지와 충격 흡수 젤이 결합되어 버피 점프 착지 시 정강이 통증(신스플린트)을 효과적으로 억제.',
  185000, 26, 'pacestrike_heavyshock_pro');

// 1-5. 초경량 템포 & 인터벌 스피드화 (10종)
addProduct('shoes', 'Saucony Kinvara Pro 템포 트레이너', 'Saucony', 'saucony_logo.png',
  '3/4 카본 플레이트와 초경량 PB 폼으로 1km 러닝 구간마다 목표 페이스를 정확히 끊어주는 인터벌 전용 슈즈.',
  199000, 38, 'saucony_kinvara_pro');
addProduct('shoes', 'Nike Streakfly 5K/10K 스피드 레이서', 'Nike', 'nike_logo.png',
  '160g의 가벼운 페바 플레이트와 로우 프로파일 줌X로 빠른 발놀림과 로잉 후 가속 전환에 최적화.',
  189000, 30, 'nike_streakfly');
addProduct('shoes', 'Hoka Mach 6 무플레이트 스피드화', 'Hoka', 'hoka_logo.png',
  '초임계 발포 폼과 유연한 전족부 설계로 플레이트의 이물감 없이 자연스러운 롤링과 순간 가속력을 보장.',
  179000, 45, 'hoka_mach_6');
addProduct('shoes', 'Asics Magic Speed 3 하프카본', 'Asics', 'asics_logo.png',
  '전족부 카본 플레이트와 단단한 AHAR+ 아웃솔로 훈련과 실전 모두에서 내구성과 반발력을 동시에 제공.',
  189000, 32, 'asics_magic_speed_3');
addProduct('shoes', 'Brooks Hyperion Max 2 질소 주입화', 'Brooks', 'brooks_logo.png',
  'DNA FLASH v2 폼과 빠른 전진 롤링으로 1km 랩타임을 10초 이상 단축시켜주는 경량 하이록스 레이서.',
  209000, 24, 'brooks_hyperion_max_2');
addProduct('shoes', 'PUMA Electrify NITRO 3 하이브리드', 'PUMA', 'puma_logo.png',
  '나이트로 폼과 PROFOAMLITE의 이중 구조로 가성비와 경쾌한 반발력을 겸비한 입문 레이서 추천화.',
  119000, 55, 'puma_electrify_nitro_3');
addProduct('shoes', 'Inov-8 FastLift Hybrid 파워스피드', 'Inov-8', 'inov8_logo.png',
  '안정적인 힐 컵과 가벼운 전족부로 무거운 웨이트 스테이션과 빠른 러닝 인터벌을 완벽히 소화.',
  219000, 20, 'inov8_fastlift_hybrid');
addProduct('shoes', 'HyperOx LightSprint 150g 극경량화', 'HyperOx', 'hyperox_logo.png',
  '깃털 같은 150g 무게로 심박수가 한계에 달했을 때 다리에 실리는 모멘텀 부담을 극적으로 제거.',
  169000, 35, 'hyperox_lightsprint_150g');
addProduct('shoes', 'SwiftOx ZeroDrag 스피드 레이서', 'SwiftOx', 'swiftox_logo.png',
  '초박형 모노 필라멘트 어퍼와 카본 토션 바로 젖은 땀 흡수를 줄이고 공기 저항을 최소화한 스피드화.',
  185000, 28, 'swiftox_zerodrag');
addProduct('shoes', 'RaceGrip FlashTempo 1K 인터벌화', 'RaceGrip', 'racegrip_logo.png',
  '인터벌 런 전용 고탄성 에어 쿠셔닝으로 슬레드와 로잉 사이사이 잃어버린 랩타임을 만회해주는 슈즈.',
  175000, 33, 'racegrip_flashtempo_1k');

// 1-6. 베어풋 & 제로드롭 고유수용감각 강화화 (10종)
addProduct('shoes', 'Inov-8 Bare-XF 210 V3 베어풋 레이서', 'Inov-8', 'inov8_logo.png',
  '밑창 두께 3mm로 지면과의 직접적인 피드백을 제공하여 케틀벨 파머스 캐리와 런지 시 흔들림 없는 밸런스 유지.',
  159000, 30, 'inov8_bare_xf_210_v3');
addProduct('shoes', 'Altra FWD Experience 로우드롭화', 'Altra', 'altra_logo.png',
  '4mm 로우드롭으로 자연스러운 미드풋 착지를 유도하며 슬레드 푸시 시 발가락 굴곡을 자유롭게 지원.',
  179000, 28, 'altra_fwd_experience');
addProduct('shoes', 'Vibram FiveFingers V-Train 2.0', 'Vibram', 'vibram_logo.png',
  '다섯 발가락이 개별 분리되어 슬레드 밀기 시 엄지발가락의 고유 지지력을 100% 활용할 수 있는 극한의 기능성 신발.',
  189000, 15, 'vibram_fivefingers_vtrain_2');
addProduct('shoes', 'Vivobarefoot Primus Lite III 하이록스', 'Vivobarefoot', 'vivobarefoot_logo.png',
  '발의 본래 힘을 강화하여 족저근막을 단련하고 무릎 관절로 전달되는 충격을 둔근과 햄스트링으로 분산.',
  210000, 18, 'vivobarefoot_primus_lite_3');
addProduct('shoes', 'Merrell Vapor Glove 6 트레일 베어풋', 'Merrell', 'merrell_logo.png',
  '비브람 에코스텝 아웃솔이 장착되어 터프와 우레탄을 가리지 않고 맨발 감각의 강력한 접지력을 발휘.',
  139000, 25, 'merrell_vapor_glove_6');
addProduct('shoes', 'Xero Shoes HFS II 제로드롭 레이서', 'XeroShoes', 'xeroshoes_logo.png',
  '가벼운 무게와 유연한 타이어 트레드 패턴 밑창으로 발의 아치 탄성을 자연스럽게 스프링처럼 활용.',
  165000, 20, 'xero_shoes_hfs_2');
addProduct('shoes', 'HyperOx GroundFeel Zero 하이브리드', 'HyperOx', 'hyperox_logo.png',
  '0mm 오프셋 플랫폼에 얇은 질소 완충 필름을 덧대어 베어풋 감각과 관절 보호를 동시에 절충한 모델.',
  155000, 32, 'hyperox_groundfeel_zero');
addProduct('shoes', 'RaceGrip BareSled 내추럴 트레이너', 'RaceGrip', 'racegrip_logo.png',
  '슬레드 밀기 시 발바닥 전체 면적으로 바닥을 밀어낼 수 있도록 고안된 초평평 플랫 솔 베어풋 슈즈.',
  149000, 27, 'racegrip_baresled');
addProduct('shoes', 'Inov-8 B-Lite 190 미니멀리스트', 'Inov-8', 'inov8_logo.png',
  '190g의 초박형 설계로 로잉 머신 풋스트랩에 단단히 고정되며 당김 동작 시 에너지 손실을 제로화.',
  169000, 22, 'inov8_blite_190');
addProduct('shoes', 'SwiftOx PureContact 베어 레이서', 'SwiftOx', 'swiftox_logo.png',
  '발바닥 감각 수용체를 깨워 월볼 스쿼트 깊이와 샌드백 런지 각도를 칼같이 유지할 수 있는 전문 슈즈.',
  159000, 26, 'swiftox_purecontact');

// 1-7. 버피 & 점프 착지 충격 흡수 크로스 트레이너 (10종)
addProduct('shoes', 'Reebok Nano X4 Hyrox 스페셜 에디션', 'Reebok', 'reebok_logo.png',
  'FLEXWEAVE 니트 어퍼와 L.A.R. 섀시 시스템으로 버피 브로드점프 착지 시 좌우 흔들림을 완벽히 락다운.',
  179000, 45, 'reebok_nano_x4_hyrox');
addProduct('shoes', 'Nike Metcon 9 Turbo 크로스 트레이너', 'Nike', 'nike_logo.png',
  '더 커진 하이퍼리프트 플레이트와 로프 랩 고무 사이드월로 로프 풀과 버피 시 뛰어난 내구성과 접지 제공.',
  189000, 40, 'nike_metcon_9_turbo');
addProduct('shoes', 'Under Armour Tribase Reign 6 안정화', 'Under Armour', 'underarmour_logo.png',
  '삼각 트라이베이스 밑창이 바닥을 세 지점에서 단단히 지지하여 월볼 투척 시 흔들림 없는 파워 전달.',
  169000, 35, 'underarmour_tribase_reign_6');
addProduct('shoes', 'NOBULL Ripstop Trainer 하이록스', 'NOBULL', 'nobull_logo.png',
  '방탄 립스탑 패브릭 어퍼로 인조잔디 쓸림과 샌드백 마찰에도 찢어짐 없는 극한의 내구성을 자랑.',
  185000, 25, 'nobull_ripstop_trainer');
addProduct('shoes', 'Inov-8 F-Lite 260 V2 플렉스 트레이너', 'Inov-8', 'inov8_logo.png',
  '전족부 메타-플렉스 홈이 파여 있어 버피 도약 시 발끝을 힘차게 튕겨주어 점프 비거리를 극대화.',
  179000, 30, 'inov8_flite_260_v2');
addProduct('shoes', 'PUMA Fuse 3.0 Station 마스터', 'PUMA', 'puma_logo.png',
  '넓어진 토 박스와 4mm 드롭, 고밀도 폼으로 고중량 파머스 캐리와 전신 버피 운동에 최적화.',
  149000, 38, 'puma_fuse_3');
addProduct('shoes', 'Saucony Freedom Cross 반응형 트레이너', 'Saucony', 'saucony_logo.png',
  'PWRRUN PB 미드솔을 트레이닝화에 최초 적용하여 런닝 탄성과 점프 착지 완충력을 동시에 실현.',
  189000, 27, 'saucony_freedom_cross');
addProduct('shoes', 'HyperOx JumpShock V2 착지완충화', 'HyperOx', 'hyperox_logo.png',
  '버피 브로드점프 80m 연속 착지 시 무릎 관절로 전해지는 반작용 충격을 3중 젤 패드로 흡수.',
  175000, 33, 'hyperox_jumpshock_v2');
addProduct('shoes', 'RaceGrip BurpeeFlex 탄성 점프화', 'RaceGrip', 'racegrip_logo.png',
  '전족부 듀얼 카본 윙이 점프 시 도약 탄성을 보조하여 80m 버피 구간 통과 시간을 30초 단축.',
  185000, 29, 'racegrip_burpeeflex');
addProduct('shoes', 'PaceStrike ImpactGuard Station 트레이너', 'PaceStrike', 'pacestrike_logo.png',
  '강화 고무 사이드 윙이 샌드백 런지 시 신발 외측 쏠림을 방어하여 발목 염좌 위험을 차단.',
  169000, 31, 'pacestrike_impactguard');

// 1-8. 통기성 극대화 핫 레이스 & 실내 쿨링화 (10종)
addProduct('shoes', 'Asics Noosa Tri 15 핫 레이스화', 'Asics', 'asics_logo.png',
  '배수 홀이 뚫린 오픈 메쉬 구조와 빠른 착용이 가능한 텅 디자인으로 실내 경기장의 열기를 신속히 배출.',
  149000, 38, 'asics_noosa_tri_15');
addProduct('shoes', 'Saucony Sinister AirMesh 초통기 레이서', 'Saucony', 'saucony_logo.png',
  '투명할 정도로 얇은 모노메쉬로 땀에 젖어도 무게가 늘어나지 않고 쾌적한 쿨링 상태를 유지.',
  169000, 25, 'saucony_sinister_airmesh');
addProduct('shoes', 'Nike Pegasus Turbo Air-Vent 경량화', 'Nike', 'nike_logo.png',
  '바람이 통하는 플라이니트 통풍 패널과 줌X 폼으로 발바닥 열감으로 인한 물집 발생을 원천 차단.',
  179000, 35, 'nike_pegasus_turbo_air');
addProduct('shoes', 'Hoka Rincon 3 Vent 초경량 통풍화', 'Hoka', 'hoka_logo.png',
  '210g의 가벼운 무게와 레이저 천공 갑피로 열대야 레이스 및 밀폐된 실내 엑스포 경기장에 최적화.',
  159000, 40, 'hoka_rincon_3_vent');
addProduct('shoes', 'PUMA Velocity NITRO 3 CoolAdapt', 'PUMA', 'puma_logo.png',
  '쿨어댑트 원사가 체온 상승 시 수분을 흡수하여 기화열로 발 온도를 2도 이상 낮춰주는 기능성 슈즈.',
  159000, 32, 'puma_velocity_nitro_cooladapt');
addProduct('shoes', 'Brooks Launch 10 Air 통기성 레이서', 'Brooks', 'brooks_logo.png',
  '초경량 워프 니트 메쉬가 발등을 시원하게 감싸주며 로잉머신 땀 배출을 가속하는 훈련화.',
  145000, 28, 'brooks_launch_10_air');
addProduct('shoes', 'HyperOx BreezeRacer 쿨링 에디션', 'HyperOx', 'hyperox_logo.png',
  '미세 에어 플로우 인솔이 걸을 때마다 공기를 펌핑하여 발바닥 땀 참과 냄새를 억제.',
  165000, 30, 'hyperox_breezeracer');
addProduct('shoes', 'SwiftOx IceKnit 경량 쿨 레이스화', 'SwiftOx', 'swiftox_logo.png',
  '냉감 미네랄 입자가 함유된 아이스니트 갑피로 8km 러닝 내내 발의 피로도를 시원하게 유지.',
  175000, 26, 'swiftox_iceknit');
addProduct('shoes', 'RaceGrip HydroVent 배수 스피드화', 'RaceGrip', 'racegrip_logo.png',
  '경기 중 머리에 뿌린 물이 신발 안으로 흘러들어가도 3초 내 배출되는 양방향 배수 채널 탑재.',
  169000, 24, 'racegrip_hydrovent');
addProduct('shoes', 'NitroPulse ColdAir Ultra 레이싱화', 'NitroPulse', 'nitropulse_logo.png',
  '공기 순환 통로가 내장된 미드솔 섀시로 마라톤급 열기 누적을 막아주는 첨단 통풍화.',
  189000, 22, 'nitropulse_coldair');

// 1-9. 인조잔디 내마모성 강화 내구형 훈련화 (10종)
addProduct('shoes', 'Inov-8 TrailFly G 270 Tough 터프화', 'Inov-8', 'inov8_logo.png',
  '그래핀 내마모성 고무 밑창으로 1000km 이상의 거친 인조잔디 슬레드 훈련에도 아웃솔 뜯김이 없는 괴물 내구성.',
  189000, 35, 'inov8_trailfly_g270');
addProduct('shoes', 'Saucony Peregrine Turf 고내구화', 'Saucony', 'saucony_logo.png',
  'PWRTRAC 아웃솔과 락 플레이트가 슬레드 레일 모서리 충격과 카펫 마찰열로부터 발바닥을 보호.',
  169000, 28, 'saucony_peregrine_turf');
addProduct('shoes', 'Nike Pegasus Trail GORE-TEX 터프 레이서', 'Nike', 'nike_logo.png',
  '방수 방풍 갑피와 전천후 아웃솔 러그로 야외 및 실내 경기장 트랙의 극한 환경을 모두 극복.',
  199000, 25, 'nike_pegasus_trail_gtx');
addProduct('shoes', 'Hoka Challenger 7 ATR 내마모 트레이너', 'Hoka', 'hoka_logo.png',
  '로드와 터프 겸용 4mm 러그로 썰매 밀기 훈련 시 밑창 고무 닳음 현상을 극적으로 줄인 다목적 슈즈.',
  179000, 30, 'hoka_challenger_7_atr');
addProduct('shoes', 'Altra Outroad 2 Turf 하이브리드', 'Altra', 'altra_logo.png',
  'MaxTrac 고무 배합으로 아스팔트 러닝과 체육관 인조잔디 트레이닝을 신발 교체 없이 한 번에 소화.',
  169000, 32, 'altra_outroad_2_turf');
addProduct('shoes', 'PUMA Voyage NITRO Rugged 내구성화', 'PUMA', 'puma_logo.png',
  '나이트로 폼 보호 쉘과 PUMAGRIP-ATR 아웃솔로 험난한 슬레드 당기기 견인력을 장시간 보장.',
  169000, 26, 'puma_voyage_nitro');
addProduct('shoes', 'HyperOx TurfShield Durability Pro', 'HyperOx', 'hyperox_logo.png',
  '케블라(Kevlar) 강화 스티치로 발등과 앞코 터짐을 방지하여 매일 슬레드를 미는 코치 및 하드 트레이너 추천.',
  185000, 27, 'hyperox_turfshield');
addProduct('shoes', 'RaceGrip ArmorTread 헤비듀티화', 'RaceGrip', 'racegrip_logo.png',
  '인조잔디 마찰열에 녹지 않는 특수 내열 고무창을 장착하여 고중량 슬레드 훈련에 완벽 적응.',
  175000, 29, 'racegrip_armortread');
addProduct('shoes', 'PaceStrike RuggedTrack 슬레드 트레이너', 'PaceStrike', 'pacestrike_logo.png',
  '강화 TPU 힐 카운터가 슬레드 풀 시 뒤꿈치를 견고히 잡아주어 밑창 접착 분리 현상을 원천 방지.',
  169000, 31, 'pacestrike_ruggedtrack');
addProduct('shoes', 'NitroPulse SteelGrip 내마모 레이서', 'NitroPulse', 'nitropulse_logo.png',
  '초경량 카본 플레이트와 초고경도 러버 아웃솔의 조화로 10회 이상의 공식 대회 출전에도 변함없는 성능.',
  219000, 20, 'nitropulse_steelgrip');

// 1-10. 동계 실내 우레탄 & 저온 트랙 논슬립 레이서 (10종)
addProduct('shoes', 'PUMA Deviate NITRO WinterGrip', 'PUMA', 'puma_logo.png',
  '저온에서도 고무가 딱딱해지지 않고 말랑한 접지력을 유지하는 윈터 러버 배합과 카본 플레이트 결합화.',
  209000, 25, 'puma_deviate_nitro_wintergrip');
addProduct('shoes', 'Saucony Endorphin Speed IceGrip', 'Saucony', 'saucony_logo.png',
  '차가운 우레탄 바닥에서 미끄러짐을 방지하는 마이크로 사이프 패턴과 나일론 플레이트 내장 템포 슈즈.',
  219000, 22, 'saucony_endorphin_speed_icegrip');
addProduct('shoes', 'Nike Zoom Fly 5 ColdTrack 카본', 'Nike', 'nike_logo.png',
  '겨울철 차가운 체육관 바닥에서도 카본 반발력을 유지하며 안정적인 슬레드 밀기를 돕는 서포트화.',
  199000, 30, 'nike_zoom_fly_5_coldtrack');
addProduct('shoes', 'Hoka Clifton 9 All-Weather 런', 'Hoka', 'hoka_logo.png',
  '방풍 갑피와 단단한 미끄럼 방지 패드로 겨울철 하이록스 시즌 레이스에서 체온과 스피드를 동시 수호.',
  179000, 35, 'hoka_clifton_9_all_weather');
addProduct('shoes', 'Asics Gel-Kayano 30 Winterized 안정화', 'Asics', 'asics_logo.png',
  '차가운 실내 트랙에서 발목 관절이 굳지 않도록 부드러운 순수 젤 충격 흡수와 4D 가이던스를 제공.',
  199000, 28, 'asics_gel_kayano_30_winter');
addProduct('shoes', 'Brooks Levitate Stealth 윈터 레이서', 'Brooks', 'brooks_logo.png',
  'DNA AMP v2 고반발 폼으로 추운 온도에서도 탄성을 잃지 않고 강력한 에너지를 발끝으로 리턴.',
  189000, 20, 'brooks_levitate_stealth');
addProduct('shoes', 'HyperOx ColdTraction Pro 우레탄화', 'HyperOx', 'hyperox_logo.png',
  '먼지 많은 실내 체육관 우레탄 트랙에서도 마찰력을 잃지 않는 점착성 소프트 러버 아웃솔 탑재.',
  179000, 30, 'hyperox_coldtraction_pro');
addProduct('shoes', 'RaceGrip ThermalGrip 하이브리드', 'RaceGrip', 'racegrip_logo.png',
  '발가락 감각이 둔해지는 저온 경기장에서 체온을 보존하며 정밀한 지면 반발력을 유지시켜주는 슈즈.',
  169000, 25, 'racegrip_thermalgrip');
addProduct('shoes', 'SwiftOx FrostRacer 스피드화', 'SwiftOx', 'swiftox_logo.png',
  '동계 엑스포 경기장의 미끄러운 바닥을 단단히 파고드는 미세 그루브 아웃솔 탑재 초경량화.',
  179000, 23, 'swiftox_frostracer');
addProduct('shoes', 'PaceStrike WinterSpeed 카본화', 'PaceStrike', 'pacestrike_logo.png',
  '결로 현상으로 바닥이 미끄러운 겨울철 경기장에서도 100% 카본 추진력을 지면으로 전달하는 첨단화.',
  225000, 19, 'pacestrike_winterspeed');


/* =========================================================================
   2. NUTRITION (100 Unique Items across 10 Distinct Functional Categories)
   ========================================================================= */

// 2-1. 등장성 고탄수화물 쾌속 에너지젤 (10종)
addProduct('nutrition', 'SIS GO Isotonic Gel 60ml (콜라맛 카페인 75mg)', 'SIS', 'sis_logo.png',
  '물 없이 즉각 흡수되는 세계 최초 등장성 포뮬러. 8개 스테이션 중반 젖산 축적을 막고 혈당을 유지해주는 공식 에너지젤.',
  38000, 150, 'sis_go_isotonic_cola_75mg');
addProduct('nutrition', 'SIS GO Isotonic Gel 60ml (오렌지맛 논카페인 6팩)', 'SIS', 'sis_logo.png',
  '위장 부담 제로의 순수 말토덱스트린 22g을 함유하여 심박수가 요동치는 런 구간에서도 부드럽게 흡수되는 에너지젤.',
  35000, 140, 'sis_go_isotonic_orange_nocaf');
addProduct('nutrition', 'SIS Beta Fuel Gel 80g (말토:과당 1:0.8 딸기라임)', 'SIS', 'sis_logo.png',
  '시간당 최대 120g의 초고탄수화물 섭취를 가능케 하여 슬레드와 런지 구간 저혈당 쇼크를 철통 방어하는 엘리트 젤.',
  48000, 100, 'sis_beta_fuel_80g_strawberry');
addProduct('nutrition', 'Maurten Gel 100 하이드로겔 40g (12포 박스)', 'Maurten', 'maurten_logo.png',
  '알지네이트 하이드로겔 캡슐화 기술로 위산에 파괴되지 않고 소장에서 직접 흡수되어 복통을 제로화한 혁신 젤.',
  59000, 80, 'maurten_gel_100_box');
addProduct('nutrition', 'Maurten Gel 100 Caf 100 카페인 하이드로겔', 'Maurten', 'maurten_logo.png',
  '100mg의 고순도 카페인과 25g 탄수화물이 결합되어 4번째 스테이션 직전 중추신경 각성과 집중력을 배가시키는 젤.',
  65000, 75, 'maurten_gel_100_caf_100');
addProduct('nutrition', 'Precision Hydration PF 30 에너지젤 (16팩 박스)', 'Precision Hydration', 'precision_hydration_logo.png',
  '인공 감미료 없이 중성적인 부드러운 맛으로 혀에 남지 않고 30g 탄수화물을 즉각 체내로 밀어넣는 고성능 젤.',
  52000, 90, 'precision_hydration_pf30');
addProduct('nutrition', 'GU Roctane Ultra Endurance Gel (솔티드 카라멜)', 'GU Energy', 'gu_logo.png',
  '일반 젤 3배의 분지쇄아미노산(BCAA)과 히스티딘이 배합되어 장시간 고강도 운동 시 중추성 근피로를 차단.',
  62000, 70, 'gu_roctane_salted_caramel');
addProduct('nutrition', 'HydroFuel 45g RapidCarb 파우치 (청포도맛)', 'HydroFuel', 'hydrofuel_logo.png',
  '글루코스와 클러스터 덱스트린 복합으로 섭취 후 5분 만에 혈중 글리코겐 수치를 끌어올리는 경기 전용 젤.',
  42000, 110, 'hydrofuel_45g_rapidcarb');
addProduct('nutrition', 'OxGel Turbo Surge 샤인머스캣 12팩', 'OxGel', 'oxgel_logo.png',
  '비타민 B군 복합체와 타우린 1000mg이 함유되어 버피 브로드점프 구간 심장 부하를 부드럽게 케어하는 에너지젤.',
  45000, 95, 'oxgel_turbo_surge_shine');
addProduct('nutrition', 'EnduranceLab NitroGel 고탄수 파우치 (레몬)', 'EnduranceLab', 'endurancelab_logo.png',
  'L-시트룰린과 말토덱스트린이 결합되어 혈류량을 늘리고 산소 공급을 가속해 다리 뭉침을 해소하는 기능성 젤.',
  44000, 85, 'endurancelab_nitrogel_lemon');

// 2-2. 논카페인 & 위장 친화 저자극 에너지젤 (10종)
addProduct('nutrition', 'SIS GO Isotonic 애플 논카페인 6팩', 'SIS', 'sis_logo.png',
  '위산 역류나 심장 두근거림이 전혀 없는 사과 과즙 베이스의 순수 에너지 공급 등장성 젤.',
  36000, 120, 'sis_go_isotonic_apple_nocaf');
addProduct('nutrition', 'Maurten Gel 100 무카페인 위장 보호팩', 'Maurten', 'maurten_logo.png',
  '단 6가지 천연 성분만으로 위장 트러블(GI 트러블) 발생률 0%를 달성한 민감 체질 선수 전용 하이드로겔.',
  59000, 90, 'maurten_gel_100_nocaf_pack');
addProduct('nutrition', 'Precision Hydration PF 30 중성맛 논카페인', 'Precision Hydration', 'precision_hydration_logo.png',
  '향료와 착색료가 전혀 없어 경기 후반부 입안이 텁텁하거나 구역질이 나지 않는 완전 무자극 탄수화물 젤.',
  52000, 80, 'precision_hydration_pf30_neutral');
addProduct('nutrition', 'GU Roctane 레몬라임 무카페인 24팩', 'GU Energy', 'gu_logo.png',
  '천연 구연산과 아미노산만으로 근육 경련을 완화하고 야간 수면 패턴을 방해하지 않는 클린 에너지젤.',
  62000, 65, 'gu_roctane_lemonlime_nocaf');
addProduct('nutrition', 'Skratch Labs 에너지 츄 (프루트펀치 12팩)', 'Skratch', 'skratch_logo.png',
  '진짜 과일 퓨레로 만든 젤리 형태로 천천히 씹어 삼키며 혈당 스파이크 없이 고른 에너지를 공급.',
  39000, 100, 'skratch_energy_chews_punch');
addProduct('nutrition', 'Tailwind Endurance 바닐라 스무스 파우치', 'Tailwind', 'tailwind_logo.png',
  '자극 없는 천연 바닐라 향과 유기농 덱스트로스로 속 쓰림 없이 부드럽게 위를 통과하는 지구력 팩.',
  45000, 75, 'tailwind_endurance_vanilla');
addProduct('nutrition', 'HydroFuel Sensitive 위편한 젤 (바나나)', 'HydroFuel', 'hydrofuel_logo.png',
  '위 점막을 보호하는 글루타민과 펙틴이 배합되어 스트레스성 위경련을 방지하는 특화 에너지젤.',
  41000, 95, 'hydrofuel_sensitive_banana');
addProduct('nutrition', 'OxGel PureNatural 유기농 사과 젤', 'OxGel', 'oxgel_logo.png',
  '합성 보존료가 0% 첨가된 100% 유기농 탄수화물로 자연스러운 에너지 흡수를 실현.',
  43000, 85, 'oxgel_purenatural_apple');
addProduct('nutrition', 'EnduranceLab GentleCarb 복숭아 10팩', 'EnduranceLab', 'endurancelab_logo.png',
  '저삼투압 설계로 소화기관의 수분을 빼앗지 않아 경기 중 탈수와 복부 팽만감을 완벽 차단.',
  42000, 90, 'endurancelab_gentlecarb_peach');
addProduct('nutrition', 'FastRecovery GlycoSafe 논카페인 젤 (망고)', 'FastRecovery', 'fastrecovery_logo.png',
  '글리코겐 고갈 직전 인슐린 급등 없이 세포 안으로 당을 안정적으로 밀어넣어 주는 안전 젤.',
  40000, 80, 'fastrecovery_glycosafe_mango');

// 2-3. 고카페인 각성 레이스 피니시 부스터 (10종)
addProduct('nutrition', 'SIS Caffeine Shot 150mg 콜라 12병', 'SIS', 'sis_logo.png',
  '경기 15분 전 또는 6번째 스테이션 직전 마시면 뇌 피로 신호를 차단하고 파워 출력을 10% 상승시키는 액상 샷.',
  36000, 110, 'sis_caffeine_shot_150mg');
addProduct('nutrition', 'GU Roctane 에너지젤 콜드브루 (카페인 142mg)', 'GU Energy', 'gu_logo.png',
  '천연 커피 추출물 142mg 카페인으로 런지와 월볼 투척 시 극도의 각성 상태와 집중력을 부여.',
  65000, 70, 'gu_roctane_coldbrew_142mg');
addProduct('nutrition', 'Maurten Gel 100 Caf 100 에스프레소 더블', 'Maurten', 'maurten_logo.png',
  '하이드로겔 매트릭스 속에 카페인 입자를 가두어 쓴맛 없이 혈중 카페인 농도를 즉시 피크로 견인.',
  68000, 60, 'maurten_gel_100_caf_espresso');
addProduct('nutrition', 'SIS Beta Fuel Nootropics 200mg 부스터', 'SIS', 'sis_logo.png',
  '200mg 고농도 카페인과 인지 기능 향상제 시티콜린(Citicoline)이 결합되어 극한 탈진 속에서도 랩타임 계산력 유지.',
  54000, 80, 'sis_beta_fuel_nootropics_200mg');
addProduct('nutrition', 'Precision Hydration PF 90 대용량 플라스크', 'Precision Hydration', 'precision_hydration_logo.png',
  '90g 대용량 탄수화물과 천연 카페인이 담겨 있어 소프트 플라스크로 전반/후반 두 번 나누어 짜먹는 원스톱 팩.',
  32000, 95, 'precision_hydration_pf90_flask');
addProduct('nutrition', 'HydroFuel Final Lap 200mg 카페인 앰플', 'HydroFuel', 'hydrofuel_logo.png',
  '마지막 8번째 월볼 100개 직전 섭취하여 삼각근과 대퇴근의 타는 듯한 작열통을 잊게 만드는 하드코어 샷.',
  34000, 105, 'hydrofuel_finallap_200mg');
addProduct('nutrition', 'OxGel SledPower 익스트림 카페인 샷', 'OxGel', 'oxgel_logo.png',
  '슬레드 푸시 50m 돌입 전 중추신경계를 번개처럼 자극하여 전신 근육 동원율을 끌어올리는 부스터.',
  38000, 85, 'oxgel_sledpower_extreme');
addProduct('nutrition', 'EnduranceLab HyperFocus 뉴로젤 150mg', 'EnduranceLab', 'endurancelab_logo.png',
  '테아닌과 카페인이 2:1로 배합되어 심장 떨림 없이 맑고 차가운 초집중 상태를 유지시켜주는 스마트 젤.',
  46000, 90, 'endurancelab_hyperfocus_neuro');
addProduct('nutrition', 'FastRecovery NeuroEnergy 각성 앰플', 'FastRecovery', 'fastrecovery_logo.png',
  '타우린 2000mg, 과라나 추출물, 비타민 B12가 고농축 배합되어 로잉 머신 1000m 페이스 저하를 방어.',
  35000, 100, 'fastrecovery_neuroenergy');
addProduct('nutrition', 'ElectrolytePro Caffeine Boost 염분샷', 'ElectrolytePro', 'electrolytepro_logo.png',
  '100mg 카페인에 나트륨 500mg을 동시 투입하여 혈압 저하와 탈진을 단 1병으로 동시에 케어.',
  33000, 115, 'electrolytepro_caffeine_boost');

// 2-4. 고강도 땀 배출러(Heavy Sweaters)용 초고농도 전해질 (10종)
addProduct('nutrition', 'Precision Hydration PH 1500 파우더 (8포 박스)', 'Precision Hydration', 'precision_hydration_logo.png',
  '리터당 1500mg의 초고농도 나트륨 배합. 땀에 소금 결정이 맺히는 헤비 스웨터의 저나트륨혈증과 근육 경련을 완벽 차단.',
  26000, 130, 'precision_hydration_ph1500_powder');
addProduct('nutrition', 'Precision Hydration PH 1000 발포정 (40정)', 'Precision Hydration', 'precision_hydration_logo.png',
  '물 500ml에 1정 녹여 표준 하이록스 레이스 땀 배출량에 정확히 동기화된 전해질 균형을 제공.',
  34000, 120, 'precision_hydration_ph1000_tabs');
addProduct('nutrition', 'SIS GO Hydro 발포정 (레몬맛 20정)', 'SIS', 'sis_logo.png',
  '칼륨, 칼슘, 마그네슘, 나트륨이 황금비로 배합되어 심박수 급상승 시 발생하는 종아리 쥐를 사전에 예방.',
  18000, 200, 'sis_go_hydro_lemon_20tabs');
addProduct('nutrition', 'Skratch Labs 하이소듐 전해질 믹스 440g', 'Skratch', 'skratch_logo.png',
  '진짜 과일 과즙과 천연 바다 소금으로 만들어 목넘김이 깔끔하고 인공 향료 거부감이 없는 프리미엄 음료.',
  36000, 90, 'skratch_high_sodium_mix');
addProduct('nutrition', 'SaltStick Fastchews 전해질 츄 (수박 60정)', 'SaltStick', 'saltstick_logo.png',
  '물 없이 입에서 사탕처럼 녹여 먹는 츄어블 전해질로 레이스 중 물 마실 틈이 없을 때 30초 만에 흡수.',
  28000, 150, 'saltstick_fastchews_watermelon');
addProduct('nutrition', 'Thorne Catalyte 고칼륨 전해질 믹스 30회', 'Thorne', 'thorne_logo.png',
  'D-리보스와 타우린, 엽산이 복합 처방되어 땀으로 유실된 세포 내 미네랄을 초고속으로 재충전.',
  38000, 85, 'thorne_catalyte_powder');
addProduct('nutrition', 'ElectrolytePro HyperSalts 1500mg 파우더', 'ElectrolytePro', 'electrolytepro_logo.png',
  '여름철 및 고온 밀폐 경기장에서 1시간당 1.5L 이상 땀을 흘리는 선수를 위한 전문 임상 처방 전해질.',
  29000, 110, 'electrolytepro_hypersalts_1500');
addProduct('nutrition', 'EnduranceLab HeavySweat 나트륨 캡슐 (120정)', 'EnduranceLab', 'endurancelab_logo.png',
  '위에서 서서히 붕해되는 장용성 캡슐로 물 한 모금과 삼켜 8km 내내 일정한 혈중 전해질 농도 유지.',
  32000, 100, 'endurancelab_heavysweat_caps');
addProduct('nutrition', 'HydroFuel QuadMineral 고농축 드링크 믹스', 'HydroFuel', 'hydrofuel_logo.png',
  '전신 경련 위험 구간인 7번째 샌드백 런지 전 체내 마그네슘과 칼륨 결핍을 즉각 보충.',
  31000, 105, 'hydrofuel_quadmineral_drink');
addProduct('nutrition', 'OxGel SaltReload 발포 타블렛 (자몽 3튜브)', 'OxGel', 'oxgel_logo.png',
  '물에 닿자마자 10초 만에 완용되는 급속 발포정으로 워밍업 존에서 체내 수분 보유력을 극대화.',
  27000, 125, 'oxgel_saltreload_tabs');

// 2-5. 무당(Sugar-Free) & 케토 수분 유지 전해질 타블렛 (10종)
addProduct('nutrition', 'Nuun Sport 무설탕 발포 전해질 10정 (시트러스)', 'Nuun', 'nuun_logo.png',
  '당류 1g 미만으로 칼로리 부담 없이 순수 전해질만 공급하여 다이어트 및 체중 조절 훈련에 최적화.',
  16000, 180, 'nuun_sport_sugarfree_citrus');
addProduct('nutrition', 'GU Hydration Drink Tabs 무설탕 (트라이베리)', 'GU Energy', 'gu_logo.png',
  '가벼운 탄산감과 저칼로리 포뮬러로 운동 전후 일상적인 수분 보충에도 탁월한 발포정.',
  32000, 110, 'gu_hydration_tabs_berry');
addProduct('nutrition', 'SIS GO Hydro 베리맛 슈가프리 20정', 'SIS', 'sis_logo.png',
  '칼로리 9kcal에 불과하여 탄수화물 젤과 섭취량을 철저히 분리 계산하고 싶은 프로 선수의 선택.',
  18000, 160, 'sis_go_hydro_berry_sugarfree');
addProduct('nutrition', 'Precision Hydration 저칼로리 전해질 탭', 'Precision Hydration', 'precision_hydration_logo.png',
  '설탕 제로 처방으로 위장 내 발효를 억제하여 헛배부름이나 트림 현상을 완벽 차단.',
  34000, 95, 'precision_hydration_lowcal_tabs');
addProduct('nutrition', 'Skratch 무설탕 일일 하이드레이션 믹스', 'Skratch', 'skratch_logo.png',
  '천연 레몬 오일과 구연산염 미네랄로 식단 관리 중에도 갈증을 완벽하게 해소.',
  32000, 80, 'skratch_sugarfree_hydration');
addProduct('nutrition', 'ElectrolytePro ZeroCalorie 전해질 탭', 'ElectrolytePro', 'electrolytepro_logo.png',
  '순수 4대 미네랄 외에 합성 첨가물을 배제하여 깔끔하고 투명한 맛을 내는 발포 타블렛.',
  24000, 140, 'electrolytepro_zerocalorie_tabs');
addProduct('nutrition', 'HydroFuel KetoElectrolyte 자몽 30포', 'HydroFuel', 'hydrofuel_logo.png',
  '케토시스 상태를 유지하면서 젖산 역치를 높여주는 저탄고지 레이서 전용 전해질 스틱.',
  35000, 90, 'hydrofuel_ketoelectrolyte_grapefruit');
addProduct('nutrition', 'OxGel CleanHydrate 라임 슈가프리', 'OxGel', 'oxgel_logo.png',
  '단맛에 물린 선수들을 위한 드라이하고 깔끔한 라임 풍미의 무설탕 수분 보충제.',
  26000, 115, 'oxgel_cleanhydrate_lime');
addProduct('nutrition', 'EnduranceLab PureWater 미네랄 타블렛', 'EnduranceLab', 'endurancelab_logo.png',
  '정수기 물의 삼투압을 세포액 수준으로 맞춰 흡수율을 3배 높여주는 수분 부스터 정제.',
  22000, 130, 'endurancelab_purewater_tabs');
addProduct('nutrition', 'FastRecovery SugarFree 미네랄 믹스 40회', 'FastRecovery', 'fastrecovery_logo.png',
  '당류 0g에 마그네슘 흡수를 돕는 비타민 D3를 배합하여 야간 근육 경련을 예방.',
  29000, 105, 'fastrecovery_sugarfree_mineral');

// 2-6. 젖산 완충 & 근육 피로 지연제 (Beta-Alanine & Bicarb) (10종)
addProduct('nutrition', 'Maurten Bicarb System 15 (탄산수소나트륨 키트)', 'Maurten', 'maurten_logo.png',
  '하이드로겔 미세 캡슐로 중탄산염을 감싸 복통 없이 혈액 내 완충능력을 극대화하는 엘리트 비밀 병기.',
  98000, 40, 'maurten_bicarb_system_15');
addProduct('nutrition', 'Thorne Beta-Alanine SR 서방형 (120정)', 'Thorne', 'thorne_logo.png',
  '시간 지연 방출형 기술로 피부 따끔거림(홍조) 없이 근육 내 카르노신 농도를 80% 높여 월볼 젖산 완충.',
  52000, 95, 'thorne_beta_alanine_sr');
addProduct('nutrition', 'SIS Beta Alanine 순수 파우더 300g', 'SIS', 'sis_logo.png',
  '1회 3.2g 섭취로 1000m 스키에르고 전력 풀링 시 전완근과 삼두근의 작열감을 지연시키는 필수 아미노산.',
  42000, 85, 'sis_beta_alanine_300g');
addProduct('nutrition', 'Pure Encapsulations 카르노신 부스터', 'PureEncapsulations', 'pureencapsulations_logo.png',
  '의사 처방용 순수 베타알라닌과 L-히스티딘 결합체로 무산소 역치(LT) 구간을 뒤로 밀어냄.',
  65000, 50, 'pure_encapsulations_carnosine');
addProduct('nutrition', 'Now Sports 베타알라닌 파우더 500g', 'NowSports', 'nowsports_logo.png',
  '합리적인 가격의 고순도 원료로 매일 트레이닝 루틴에 타먹는 대용량 젖산 완충 파우더.',
  38000, 120, 'now_sports_beta_alanine_500g');
addProduct('nutrition', 'EnduranceLab LacticBuffer 완충 파우더 400g', 'EnduranceLab', 'endurancelab_logo.png',
  '구연산나트륨과 베타알라닌이 듀얼 처방되어 슬레드 밀기 2번째 랩에서 다리가 굳는 현상을 방지.',
  46000, 75, 'endurancelab_lacticbuffer_powder');
addProduct('nutrition', 'HydroFuel AntiBurn 서방성 캡슐 (90캡슐)', 'HydroFuel', 'hydrofuel_logo.png',
  '대퇴사두근의 산성화를 막아 샌드백 런지 100m 구간 통과 시 페이스 유지를 가능케 함.',
  39000, 90, 'hydrofuel_antiburn_caps');
addProduct('nutrition', 'OxGel LactateGuard 완충 앰플 10병', 'OxGel', 'oxgel_logo.png',
  '경기 30분 전 1병 섭취로 혈액 pH를 약알칼리 상태로 유지해주는 액상 완충 솔루션.',
  48000, 65, 'oxgel_lactateguard_ampoules');
addProduct('nutrition', 'FastRecovery CarnoPeak 타블렛 180정', 'FastRecovery', 'fastrecovery_logo.png',
  '근육 피로 물질 축적을 억제하여 8개 랩 전체의 페이스 하락폭을 5% 이내로 안정화.',
  45000, 80, 'fastrecovery_carnopeak_tabs');
addProduct('nutrition', 'ElectrolytePro Bicarb Matrix 복합 파우더', 'ElectrolytePro', 'electrolytepro_logo.png',
  '전해질염과 중탄산염을 조화시켜 장 트러블 없이 젖산 내성을 향상시키는 파우더 믹스.',
  39000, 85, 'electrolytepro_bicarb_matrix');

// 2-7. 무산소 근파워 & 슬레드 푸시 ATP 증강제 (Creatine & HMB) (10종)
addProduct('nutrition', 'Thorne Creatine Monohydrate NSF 인증 450g', 'Thorne', 'thorne_logo.png',
  '불순물 0% 순도 99.9%의 크레아퓨어 원료. 슬레드 푸시 초반 정지 마찰력을 뚫어내는 무산소 ATP 폭발력 증강.',
  48000, 110, 'thorne_creatine_nsf_450g');
addProduct('nutrition', 'Creapure 독일산 순수 크레아틴 500g', 'Creapure', 'creapure_logo.png',
  '물에 뭉침 없이 부드럽게 녹는 초미세 분말 입자로 슬레드와 파머스 캐리 무게 부하를 가볍게 만듦.',
  42000, 130, 'creapure_monohydrate_500g');
addProduct('nutrition', 'Optimum Nutrition 마이크로 크레아틴 600g', 'OptimumNutrition', 'optimumnutrition_logo.png',
  '전 세계에서 가장 검증된 마이크로나이즈드 분말로 근세포 수분 보유력을 높여 근지구력 향상.',
  49000, 100, 'on_micronized_creatine_600g');
addProduct('nutrition', 'Nutricost HMB 1000mg 타블렛 (120정)', 'Nutricost', 'nutricost_logo.png',
  '로잉머신과 런지 등 고강도 편심성 수축 운동 시 발생하는 근섬유 미세 손상과 단백질 분해를 억제.',
  34000, 95, 'nutricost_hmb_1000mg');
addProduct('nutrition', 'Kaged Muscle 크레아틴 HCl 초고흡수 75회', 'KagedMuscle', 'kagedmuscle_logo.png',
  '염산염 크레아틴으로 로딩 기간이나 체중 부종 없이 순수 근력과 파워만 15% 이상 향상.',
  58000, 60, 'kaged_muscle_creatine_hcl');
addProduct('nutrition', 'EnduranceLab PowerATP 크레아틴 믹스', 'EnduranceLab', 'endurancelab_logo.png',
  '크레아틴과 타우린, 베타인을 결합하여 슬레드 밀기 마지막 10m 구간 뒷심을 책임지는 파워 보충제.',
  45000, 80, 'endurancelab_poweratp_mix');
addProduct('nutrition', 'HydroFuel SledForce HMB+Creatine 파우더', 'HydroFuel', 'hydrofuel_logo.png',
  '근력 증가와 근손실 방지 두 가지를 한 스쿱으로 해결하는 하이록스 레이서 전용 파워 블렌드.',
  52000, 75, 'hydrofuel_sledforce_hmb');
addProduct('nutrition', 'OxGel ExplosivePush 크레아틴 캡슐', 'OxGel', 'oxgel_logo.png',
  '소화 흡수가 빠른 캡슐 제형으로 출전 1시간 전 간편하게 복용하는 휴대용 파워 캡슐.',
  36000, 90, 'oxgel_explosivepush_caps');
addProduct('nutrition', 'FastRecovery PureCreatine 무맛 400g', 'FastRecovery', 'fastrecovery_logo.png',
  '단백질 쉐이크나 이온 음료에 섞어 마셔도 맛의 변화가 전혀 없는 100% 무맛 단일 크레아틴.',
  38000, 115, 'fastrecovery_purecreatine_400g');
addProduct('nutrition', 'ElectrolytePro PowerFuel ATP 파우더', 'ElectrolytePro', 'electrolytepro_logo.png',
  '마그네슘과 크레아틴의 킬레이트 결합으로 세포 내 ATP 합성 속도를 2배 가속.',
  44000, 85, 'electrolytepro_powerfuel_atp');

// 2-8. 스테이션 직후 급속 단백질 및 아미노산 회복제 (WPI & EAA) (10종)
addProduct('nutrition', 'SIS REGO Rapid Recovery 1.6kg (초콜릿맛)', 'SIS', 'sis_logo.png',
  '탄수화물과 분리단백질이 3:1 황금비율로 결합되어 경기 직후 30분 골든타임 글리코겐 재합성을 완성.',
  72000, 65, 'sis_rego_rapid_recovery_1600g');
addProduct('nutrition', 'Thorne Whey Protein Isolate 840g 바닐라', 'Thorne', 'thorne_logo.png',
  '유당과 지방을 완벽 분리한 NSF 스포츠 공인 순수 WPI로 유당불내증 없이 25g 단백질 즉각 흡수.',
  85000, 55, 'thorne_wpi_vanilla_840g');
addProduct('nutrition', 'Maurten Solid 160 Cacao 에너지바 (12개입)', 'Maurten', 'maurten_logo.png',
  '귀리와 쌀 베이스의 저섬유질 고에너지 고형 탄수화물 바로 경기 2시간 전 든든한 식사 대용.',
  49000, 80, 'maurten_solid_160_cacao');
addProduct('nutrition', 'Thorne Amino Complex EAA 베리맛 231g', 'Thorne', 'thorne_logo.png',
  '체내 합성이 불가능한 9가지 필수아미노산 전종 함유로 경기 중 근손실 방지 및 빠른 심박 회복 지원.',
  56000, 70, 'thorne_amino_complex_berry');
addProduct('nutrition', 'Dymatize ISO100 가수분해 WPI 2.3kg 고메초코', 'Dymatize', 'dymatize_logo.png',
  '가수분해 공정으로 단백질을 미세 펩타이드로 쪼개어 소화 부담 없이 15분 만에 근육으로 전달.',
  119000, 45, 'dymatize_iso100_gourmet_chocolate');
addProduct('nutrition', 'Tailwind Rebuild 리커버리 믹스 (초콜릿)', 'Tailwind', 'tailwind_logo.png',
  '유기농 쌀 단백질과 코코넛 밀크가 배합된 100% 비건 고성능 리커버리 음료 분말.',
  59000, 60, 'tailwind_rebuild_chocolate');
addProduct('nutrition', 'FastRecovery HydroWPI 95 딸기맛 1kg', 'FastRecovery', 'fastrecovery_logo.png',
  '단백질 함유량 95%의 초고순도 단백질 분말로 샌드백 런지로 찢어진 대퇴부 근섬유 급속 복구.',
  79000, 50, 'fastrecovery_hydrowpi_95_strawberry');
addProduct('nutrition', 'HydroFuel RapidAmino EAA 레몬 300g', 'HydroFuel', 'hydrofuel_logo.png',
  '류신 함량을 40% 강화하여 스테이션 운동 직후 단백질 동화 스위치(mTOR)를 즉시 가동.',
  48000, 75, 'hydrofuel_rapidamino_eaa');
addProduct('nutrition', 'EnduranceLab PostRace GlycoProtein 쉐이크', 'EnduranceLab', 'endurancelab_logo.png',
  '탈진한 하이록스 레이서의 혈당 회복과 근육통 완화를 원스톱으로 해결하는 리커버리 올인원.',
  68000, 60, 'endurancelab_postrace_glycoprotein');
addProduct('nutrition', 'OxGel InstantRecovery 단백질 샷 (6병)', 'OxGel', 'oxgel_logo.png',
  '물통이나 쉐이커 없이 피니시 라인을 통과하자마자 뚜껑을 열어 마시는 20g 액상 단백질 샷.',
  32000, 90, 'oxgel_instantrecovery_shot');

// 2-9. 염증 완화 & 수면 근육통 케어 (Tart Cherry & Curcumin) (10종)
addProduct('nutrition', 'Thorne Curcumin Phytosome 500mg (120캡슐)', 'Thorne', 'thorne_logo.png',
  '일반 커큐민 대비 흡수율을 29배 높인 파이토솜 기술로 8km 러닝과 런지 후 관절 염증을 빠르게 억제.',
  78000, 60, 'thorne_curcumin_phytosome');
addProduct('nutrition', 'Dynamic Health 몽모랑시 타트체리 농축액', 'DynamicHealth', 'dynamichealth_logo.png',
  '천연 멜라토닌과 안토시아닌이 풍부하여 경기 당일 밤 깊은 수면을 유도하고 지연성 근육통(DOMS) 차단.',
  32000, 100, 'dynamic_health_tart_cherry');
addProduct('nutrition', 'SIS Cherry Juice 근육 회복 샷 (10포)', 'SIS', 'sis_logo.png',
  '사워 체리 농축 추출물로 산화 스트레스를 줄이고 다음 날 다리 무거움을 50% 이상 경감.',
  38000, 85, 'sis_cherry_juice_recovery');
addProduct('nutrition', 'Nature\'s Way 고농축 타트체리 1200mg', 'NaturesWay', 'naturesway_logo.png',
  '간편한 캡슐 제형으로 출전 주간 매일 밤 복용하여 최적의 컨디션을 유지시켜주는 항산화제.',
  28000, 110, 'naturesway_tart_cherry_1200mg');
addProduct('nutrition', 'Thorne Magnesium Bisglycinate 파우더', 'Thorne', 'thorne_logo.png',
  '설사 유발 없는 킬레이트 비스글리시네이트 마그네슘으로 신경계를 진정시키고 근육 경련 해소.',
  58000, 75, 'thorne_magnesium_bisglycinate');
addProduct('nutrition', 'FastRecovery TartCherry SleepShot (10병)', 'FastRecovery', 'fastrecovery_logo.png',
  '타트체리와 L-테아닌이 함께 배합되어 레이스 긴장감으로 인한 불면증을 없애고 숙면 케어.',
  35000, 95, 'fastrecovery_tartcherry_sleepshot');
addProduct('nutrition', 'EnduranceLab MuscleCalm 마그네슘 리퀴드', 'EnduranceLab', 'endurancelab_logo.png',
  '흡수가 빠른 액상 제형으로 취침 전 복용 시 야간 종아리 쥐 발생을 원천 차단.',
  34000, 90, 'endurancelab_musclecalm_magnesium');
addProduct('nutrition', 'HydroFuel AntiInflam 커큐민 샷', 'HydroFuel', 'hydrofuel_logo.png',
  '피페린(흑후추 추출물)이 더해져 무릎 연골 부종과 슬개건 통증을 신속하게 가라앉힘.',
  36000, 80, 'hydrofuel_antiinflam_curcumin');
addProduct('nutrition', 'OxGel NightRepair 나이트 앰플 7회분', 'OxGel', 'oxgel_logo.png',
  '수면 중 체내 성장호르몬 분비와 조직 복구를 극대화해주는 7일 집중 케어 프로그램.',
  42000, 70, 'oxgel_nightrepair_ampoules');
addProduct('nutrition', 'ElectrolytePro MuscleRelax 나이트 캡슐', 'ElectrolytePro', 'electrolytepro_logo.png',
  '칼슘과 마그네슘의 2:1 조화로 경기 후 흥분된 근섬유를 부드럽게 이완.',
  29000, 105, 'electrolytepro_musclerelax_caps');

// 2-10. 올인원 카보로딩 & 대용량 지속성 탄수화물 분말 (10종)
addProduct('nutrition', 'Maurten Drink Mix 320 고탄수 분말 14포', 'Maurten', 'maurten_logo.png',
  '물 500ml에 녹여 80g의 탄수화물을 위 부담 없이 섭취. 경기 전날 카보로딩 및 워밍업 단계 완벽 충전.',
  69000, 70, 'maurten_drink_mix_320');
addProduct('nutrition', 'Maurten Drink Mix 160 하이드레이션 18포', 'Maurten', 'maurten_logo.png',
  '40g의 적정 탄수화물과 전해질이 하이드로겔로 장에 흡수되어 워밍업 시 최적의 혈당 유지.',
  58000, 85, 'maurten_drink_mix_160');
addProduct('nutrition', 'SIS Beta Fuel 80g 파우더 (오렌지 15포)', 'SIS', 'sis_logo.png',
  '1:0.8 비율 듀얼 탄수화물로 경기 2~3시간 전 마셔두면 8개 스테이션 내내 고갈 없는 에너지 탱크 구축.',
  64000, 75, 'sis_beta_fuel_80g_powder');
addProduct('nutrition', 'Tailwind Endurance Fuel 810g (만다린)', 'Tailwind', 'tailwind_logo.png',
  '물통에 타서 마시는 것만으로 칼로리와 전해질을 동시에 해결하는 올인원 울트라 뉴트리션.',
  54000, 90, 'tailwind_endurance_mandarin');
addProduct('nutrition', 'Skratch Labs Superfuel 840g 라즈베리', 'Skratch', 'skratch_logo.png',
  '클러스터 덱스트린 함유로 대량 400칼로리를 한 번에 마셔도 복통이나 더부룩함이 없는 지속성 에너지원.',
  64000, 65, 'skratch_superfuel_raspberry');
addProduct('nutrition', 'Karbolyn 카볼린 복합 탄수화물 1kg 무맛', 'Karbolyn', 'karbolyn_logo.png',
  '감자 및 옥수수 전분 기반의 특허 탄수화물로 단순당보다 빠르고 복합당보다 오래 지속되는 에너지 방출.',
  55000, 80, 'karbolyn_complex_carb_1kg');
addProduct('nutrition', 'Vitargo S2 급속 글리코겐 충전제 1kg', 'Vitargo', 'vitargo_logo.png',
  '위 통과 속도가 말토덱스트린보다 2배 빨라 경기 당일 아침 긴급 카보로딩에 최고의 효과를 발휘.',
  62000, 70, 'vitargo_s2_1kg');
addProduct('nutrition', 'EnduranceLab SustainedCarb 100g 10팩', 'EnduranceLab', 'endurancelab_logo.png',
  '이소말툴로오스(팔라티노스) 함유로 혈당 스파이크 없이 2시간 동안 균일한 지방 연소와 파워 공급.',
  48000, 85, 'endurancelab_sustainedcarb');
addProduct('nutrition', 'HydroFuel MarathonEndurance 드링크 믹스', 'HydroFuel', 'hydrofuel_logo.png',
  '수분 공급과 탄수화물 공급을 단 1병으로 해결하여 경기장 워밍업 구역 필수 지참 음료.',
  46000, 95, 'hydrofuel_marathon_endurance');
addProduct('nutrition', 'OxGel LongPace 카보파우더 (레몬 800g)', 'OxGel', 'oxgel_logo.png',
  '미네랄과 비타민 C가 함께 보강되어 장거리 체력 소모전을 준비하는 선수 전용 에너지 파우더.',
  49000, 80, 'oxgel_longpace_carb_powder');


/* =========================================================================
   3. GEAR (100 Unique Items across 10 Distinct Functional Categories)
   ========================================================================= */

// 3-1. 7mm 헤비듀티 네오프렌 무릎 슬리브 (파워 & 관절 보호) (10종)
addProduct('gear', 'Rehband Rx 7mm 오리지널 파워 니 슬리브 (1개입)', 'Rehband', 'rehband_logo.png',
  '전 세계 엘리트 역도 및 하이록스 챔피언들이 검증한 최상위 7mm SBR 네오프렌 슬리브. 샌드백 런지와 스쿼트 시 관절 압박 최강.',
  48000, 80, 'rehband_rx_7mm_original');
addProduct('gear', 'Rogue 7mm 네오프렌 니 슬리브 (성능 공인 세트)', 'Rogue', 'rogue_logo.png',
  '이중 스티치 보강 마감과 단단한 밀착감으로 30kg 샌드백 런지 시 무릎 슬개골 비틀림을 완벽 방지하는 1쌍 세트.',
  92000, 60, 'rogue_7mm_knee_sleeves');
addProduct('gear', 'Harbinger 7mm 파워 니 슬리브 (1쌍 세트)', 'Harbinger', 'harbinger_logo.png',
  '고탄성 7mm 네오프렌이 무릎 관절을 견고히 압박하여 월볼 100개 연속 투척 시 대퇴사두근 부하를 탄성으로 분산.',
  59000, 75, 'harbinger_7mm_power_knee');
addProduct('gear', 'Bear KompleX 7mm 컴프레션 니 슬리브 1쌍', 'BearKomplex', 'bearkomplex_logo.png',
  '통기성 네오프렌 원단과 인체공학 3D 곡선 재단으로 흘러내림 없이 8개 랩 내내 강력한 무릎 압박 유지.',
  85000, 50, 'bearkomplex_7mm_sleeves');
addProduct('gear', 'SBD 7mm 클래식 헤비 스트롱 니슬리브', 'SBD', 'sbd_logo.png',
  '영국산 고밀도 네오프렌으로 제작되어 고중량 슬레드 푸시 시 무릎 인대에 걸리는 엄청난 하중을 든든하게 지지.',
  115000, 40, 'sbd_7mm_classic_sleeves');
addProduct('gear', 'Stoic 7mm 헤비 파워리프팅 슬리브', 'Stoic', 'stoic_logo.png',
  '무릎 굴곡 반발력이 탁월하여 런지 깊이를 깊게 가져가도 무릎 통증 없이 부드럽게 일어날 수 있는 서포트 기어.',
  99000, 45, 'stoic_7mm_heavy_sleeves');
addProduct('gear', 'IronPulse 7mm 카본 패턴 무릎 보호대 (1쌍)', 'IronPulse', 'ironpulse_logo.png',
  '외피에 카본 립스탑 패브릭을 덧대어 샌드백 런지 시 무릎이 거친 인조잔디 바닥에 닿아도 찢어짐 없는 강화 슬리브.',
  69000, 70, 'ironpulse_7mm_carbon_knee');
addProduct('gear', 'HyperShield 7mm 티타늄 강화 무릎보호대', 'HyperShield', 'hypershield_logo.png',
  '측면 스프링 스테이가 내장되어 방향 전환과 버피 착지 시 무릎 안쪽 십자인대 충격을 안전하게 방어.',
  78000, 55, 'hypershield_7mm_titanium');
addProduct('gear', 'GripForge 7mm 프로 락 무릎 슬리브', 'GripForge', 'gripforge_logo.png',
  '내측 상하단 실리콘 밴드가 격렬한 1km 달리기 중에도 슬리브가 종아리로 미끄러져 내려가는 현상을 100% 방지.',
  62000, 65, 'gripforge_7mm_pro_lock');
addProduct('gear', 'TitanStrap 7mm 울트라 서포트 니가드', 'TitanStrap', 'titanstrap_logo.png',
  '두터운 7mm 고압축 폼이 무릎 연골의 열감을 보존하여 쥐와 경련을 예방해주는 헤비 듀티 기어.',
  65000, 60, 'titanstrap_7mm_ultra_support');

// 3-2. 5mm 스피드 & 러닝 유연성 무릎 슬리브 (10종)
addProduct('gear', 'Rehband Rx 5mm 유연 무릎 슬리브 (1쌍)', 'Rehband', 'rehband_logo.png',
  '7mm 대비 30% 가볍고 굴곡성이 뛰어나 8km 러닝 스피드를 전혀 저해하지 않는 하이록스 레이스 데이 표준 슬리브.',
  85000, 70, 'rehband_rx_5mm_speed');
addProduct('gear', '2XU 플렉스 5mm 런 니슬리브 1쌍', '2XU', '2xu_logo.png',
  'PWX 고압축 원단과 5mm 네오프렌 하이브리드로 무릎 보호와 러닝 케이던스를 동시에 만족시키는 경량 슬리브.',
  79000, 65, '2xu_flex_5mm_run_sleeves');
addProduct('gear', 'Rogue 5mm 경량 퍼포먼스 니슬리브', 'Rogue', 'rogue_logo.png',
  '접히는 뒷오금 부위에 신축성 패널을 적용하여 로잉 머신 탑승 시 피가 통하지 않는 압박감을 개선.',
  79000, 60, 'rogue_5mm_lightweight_knee');
addProduct('gear', 'Gymshark 5mm 스피드 니패드 1쌍', 'Gymshark', 'gymshark_logo.png',
  '심리스 봉제 기술로 마찰 쓸림을 제로화하고 달리기와 버피 전환 속도를 높여주는 슬림 슬리브.',
  65000, 55, 'gymshark_5mm_speed_neopad');
addProduct('gear', 'Under Armour 5mm 에어로 니 슬리브', 'Under Armour', 'underarmour_logo.png',
  '히트기어 통풍 라이닝으로 땀이 차지 않고 쾌적하게 무릎 관절을 감싸주는 하이브리드 보호대.',
  68000, 50, 'underarmour_5mm_aero_knee');
addProduct('gear', 'IronPulse 5mm 하이브리드 러닝 슬리브', 'IronPulse', 'ironpulse_logo.png',
  '무릎 전면은 충격 흡수 5mm, 후면은 통기성 스판덱스로 구성된 달리기 특화 하이록스 슬리브.',
  58000, 75, 'ironpulse_5mm_hybrid_run');
addProduct('gear', 'HyperShield 5mm 라이트 플렉스 가드', 'HyperShield', 'hypershield_logo.png',
  '관절 유연성이 필요한 여성 오픈 디비전 및 주니어 선수를 위한 유연 무릎 보호대.',
  52000, 80, 'hypershield_5mm_light_flex');
addProduct('gear', 'CoreVigor 5mm 무릎 모빌리티 슬리브', 'CoreVigor', 'corevigor_logo.png',
  '스쿼트 가동 범위가 좁은 러너도 깊은 월볼 스쿼트 자세를 안정적으로 완성하게 돕는 탄성 서포트.',
  49000, 85, 'corevigor_5mm_knee_mobility');
addProduct('gear', 'GripForge 5mm 에어로 스피드 니가드', 'GripForge', 'gripforge_logo.png',
  '180g의 경량감으로 무릎에 착용한 사실조차 잊게 만드는 민첩성 강화 레이스 슬리브.',
  55000, 70, 'gripforge_5mm_aero_speed');
addProduct('gear', 'TitanStrap 5mm 통기성 런닝 니슬리브', 'TitanStrap', 'titanstrap_logo.png',
  '땀 배출 구멍이 천공된 에어 네오프렌 소재로 장시간 착용에도 피부 짓무름 없는 보호대.',
  54000, 65, 'titanstrap_5mm_breathable');

// 3-3. 슬레드 풀 로프 전용 실리콘 그립 장갑 (10종)
addProduct('gear', 'Harbinger 프로 리스트랩 로프 글러브', 'Harbinger', 'harbinger_logo.png',
  '손목 지지 스트랩 일체형으로 15m 두꺼운 슬레드 풀 로프 당기기 시 손바닥 물집과 손목 꺾임을 완벽 차단.',
  45000, 95, 'harbinger_pro_wristwrap_gloves');
addProduct('gear', 'Bear KompleX 카본 노홀 핸드그립 장갑', 'BearKomplex', 'bearkomplex_logo.png',
  '구멍 없는 탄소섬유 패치로 스키에르고 손잡이와 썰매 로프에서 손바닥 통증 없이 최상의 접지력 확보.',
  68000, 60, 'bearkomplex_carbon_noholes');
addProduct('gear', 'Mechanix Wear 특수 마찰 로프 글러브', 'Mechanix', 'mechanix_logo.png',
  '인조가죽과 손바닥 실리콘 텍스처로 젖은 로프를 강하게 채어 당길 때 마찰열 화상을 방지하는 전술 장갑.',
  42000, 80, 'mechanix_special_rope_gloves');
addProduct('gear', 'Rogue V2 피트니스 레이서 글러브', 'Rogue', 'rogue_logo.png',
  '통기성 에어로 메쉬와 강화 가죽 팜으로 장갑을 낀 채 1km 러닝을 뛰어도 답답함이 없는 하이브리드 글러브.',
  49000, 70, 'rogue_v2_fitness_gloves');
addProduct('gear', 'GripForge SledPull 격자형 실리콘 장갑', 'GripForge', 'gripforge_logo.png',
  '손바닥 전체에 다이아몬드 실리콘 격자 코팅이 되어 있어 악력이 다 털린 상태에서도 로프를 놓치지 않음.',
  46000, 85, 'gripforge_sledpull_silicone_gloves');
addProduct('gear', 'IronPulse 하이퍼그립 풀핑거 장갑', 'IronPulse', 'ironpulse_logo.png',
  '손가락 끝까지 완벽 보호하는 풀핑거 타입으로 로프 쓸림과 버피 시 바닥 오염을 차단.',
  48000, 65, 'ironpulse_hypergrip_fullfinger');
addProduct('gear', 'HyperShield 카본 팜 로프 글러브', 'HyperShield', 'hypershield_logo.png',
  '손바닥 중앙에 충격 흡수 패드가 장착되어 케틀벨 손잡이 압박통을 덜어주는 올라운드 장갑.',
  44000, 75, 'hypershield_carbon_palm_gloves');
addProduct('gear', 'CoreVigor 논슬립 레이스 하프핑거 장갑', 'CoreVigor', 'corevigor_logo.png',
  '손가락 마디가 노출되어 에너지젤 개봉이나 시계 조작이 간편한 반장갑형 레이스 글러브.',
  36000, 90, 'corevigor_nonslip_halfglove');
addProduct('gear', 'TitanStrap 풀링 마스터 헤비 글러브', 'TitanStrap', 'titanstrap_logo.png',
  '로프 견인 시 손바닥 껍질 벗겨짐을 완벽 예방하는 이중 가죽 보강 전문가용 장갑.',
  47000, 70, 'titanstrap_pulling_master');
addProduct('gear', 'Gymshark 그립텍 통기성 트레이닝 장갑', 'Gymshark', 'gymshark_logo.png',
  '땀 배출 벤트 홀과 가벼운 신축성 원단으로 경기 내내 쾌적한 착용감을 선사하는 글러브.',
  39000, 80, 'gymshark_griptech_gloves');

// 3-4. 파머스 캐리 악력 보조 스트랩 & 패드 (10종)
addProduct('gear', 'Harbinger 패디드 코튼 리프팅 스트랩 1쌍', 'Harbinger', 'harbinger_logo.png',
  '네오프렌 손목 패딩이 장착된 헤비 코튼 스트랩으로 데드리프트 및 훈련 중 케틀벨 파지 악력 보조.',
  22000, 150, 'harbinger_padded_cotton_straps');
addProduct('gear', 'Rogue 클래식 헤비 나일론 스트랩', 'Rogue', 'rogue_logo.png',
  '밀림 없는 거친 나일론 직조로 파머스 캐리 중량물 이동 훈련 시 전완근 피로를 대폭 절감.',
  25000, 120, 'rogue_classic_nylon_straps');
addProduct('gear', 'Schiek 1000-DLS 디럭스 리프팅 스트랩', 'Schiek', 'schiek_logo.png',
  '손목 보호 밴드와 논슬립 러버 스트랩이 일체형으로 결합된 고중량 케틀벨 전용 보조대.',
  32000, 90, 'schiek_1000dls_straps');
addProduct('gear', 'IronMind Sew-Easy 리프팅 스트랩', 'IronMind', 'ironmind_logo.png',
  '스트롱맨 대회 공인 스트랩으로 32kg 파머스 캐리 훈련 시 손가락 악력 한계를 뛰어넘게 해줌.',
  35000, 80, 'ironmind_sew_easy_straps');
addProduct('gear', 'GripForge Farmers Hook 실리콘 악력패드', 'GripForge', 'gripforge_logo.png',
  '옥토 케틀벨 손잡이 접촉면의 뼈 눌림 통증을 없애고 마찰력을 40% 끌어올리는 인체공학 패드.',
  28000, 110, 'gripforge_farmers_hook_pad');
addProduct('gear', 'IronPulse 헤비듀티 퀵릴리즈 스트랩', 'IronPulse', 'ironpulse_logo.png',
  '위급 시 손을 즉시 뗄 수 있는 퀵 릴리즈 설계로 안전성과 악력 지지력을 동시에 확보.',
  29000, 100, 'ironpulse_quickrelease_straps');
addProduct('gear', 'TitanStrap 파머스 락 파워 스트랩', 'TitanStrap', 'titanstrap_logo.png',
  '고밀도 직조 웨빙으로 64kg 복합 중량 캐리 시에도 손목 피부 쓸림 없는 편안함 제공.',
  27000, 105, 'titanstrap_farmers_lock');
addProduct('gear', 'HyperShield 인체공학 팜 악력보호 패드', 'HyperShield', 'hypershield_logo.png',
  '굳은살 찢어짐을 방지하고 손바닥 땀을 흡수하여 케틀벨 미끄러짐을 방지하는 실리콘 가드.',
  24000, 130, 'hypershield_palm_grip_pad');
addProduct('gear', 'CoreVigor 논슬립 핸드 러버 스트랩', 'CoreVigor', 'corevigor_logo.png',
  '고무 와이어가 교차 직조되어 땀에 젖어도 손잡이에 단단히 감기는 악력 서포터.',
  23000, 140, 'corevigor_nonslip_rubber_strap');
addProduct('gear', 'Bear KompleX 스웨이드 리프팅 스트랩', 'BearKomplex', 'bearkomplex_logo.png',
  '부드러운 프리미엄 스웨이드 가죽으로 손목 통증 없이 강한 견인력을 발휘하는 리프팅 기어.',
  34000, 85, 'bearkomplex_suede_straps');

// 3-5. 하체 근육 진동 억제 컴프레션 타이츠 (10종)
addProduct('gear', '2XU Core 풀렝스 컴프레션 타이츠', '2XU', '2xu_logo.png',
  '강력한 PWX 원단이 대퇴사두근과 햄스트링을 강력하게 압박하여 8km 러닝 동안 근육 진동 피로 억제.',
  129000, 60, '2xu_core_compression_tights');
addProduct('gear', '2XU MCS Run 하이록스 레이스 숏츠', '2XU', '2xu_logo.png',
  '근육 형상 매핑(MCS) 기술이 허벅지 주요 근육을 단계별로 지지하여 샌드백 런지 시 다리 털림 방지.',
  99000, 70, '2xu_mcs_run_shorts');
addProduct('gear', 'Skins Series-5 엘리트 롱 컴프레션', 'Skins', 'skins_logo.png',
  '최고 등급의 단계적 압박 기술로 혈류 순환을 촉진하고 젖산 축적을 실시간으로 지연시키는 타이츠.',
  159000, 45, 'skins_series5_long_tights');
addProduct('gear', 'Under Armour 히트기어 아머 레깅스', 'Under Armour', 'underarmour_logo.png',
  '4방향 스트레치 원단으로 버피 점프와 스쿼트 가동성을 100% 보장하며 땀을 초고속 건조.',
  69000, 90, 'underarmour_heatgear_leggings');
addProduct('gear', 'Nike Pro Dri-FIT 컴프레션 타이츠', 'Nike', 'nike_logo.png',
  '가볍고 신축성이 뛰어난 드라이핏 패브릭으로 경기 내내 마찰 쓸림 없이 쾌적한 달리기 지원.',
  59000, 100, 'nike_pro_drifit_tights');
addProduct('gear', 'Gymshark 바이탈 2.0 심리스 레깅스', 'Gymshark', 'gymshark_logo.png',
  '봉제선이 없는 심리스 공법으로 런지와 버피 시 피부 마찰 자극을 제로화한 기능성 타이츠.',
  65000, 80, 'gymshark_vital_seamless_leggings');
addProduct('gear', 'IronPulse Quad-Shield 하이록스 타이츠', 'IronPulse', 'ironpulse_logo.png',
  '대퇴사두근 부위에 탄소섬유 리브 라인이 삽입되어 슬레드 밀기 시 하체 출력을 보조하는 타이츠.',
  89000, 55, 'ironpulse_quadshield_tights');
addProduct('gear', 'HyperShield 근육고정 풀서포트 타이츠', 'HyperShield', 'hypershield_logo.png',
  '골반과 무릎 위를 탄탄히 잡아주어 장시간 레이스 중 햄스트링 당김 부상을 사전 차단.',
  79000, 65, 'hypershield_musclefix_tights');
addProduct('gear', 'CoreVigor 카본 압박 레이스 타이츠', 'CoreVigor', 'corevigor_logo.png',
  '체온 상승을 억제하는 냉감 원사와 20-30mmHg 의료용 등급 압박력의 경기 출전용 타이츠.',
  85000, 60, 'corevigor_carbon_compression');
addProduct('gear', 'TitanStrap 리커버리 컴프레션 팬츠', 'TitanStrap', 'titanstrap_logo.png',
  '경기 종료 후 착용하여 다리 부종을 빼주고 심장으로의 정맥 환류를 돕는 회복 전문 타이츠.',
  75000, 70, 'titanstrap_recovery_pants');

// 3-6. 종아리 쥐 방지 카프 가드 & 서포트 슬리브 (10종)
addProduct('gear', '2XU MCS Run 카프 슬리브 (종아리 압박대 1쌍)', '2XU', '2xu_logo.png',
  '종아리 근육 매핑 압박으로 착지 충격파를 흡수하여 레이스 후반부 아킬레스건 염증과 쥐를 완벽 방지.',
  55000, 110, '2xu_mcs_run_calf_sleeves');
addProduct('gear', 'CEP Progressive+ 런 카프 슬리브 3.0', 'CEP', 'cep_logo.png',
  '독일 메디(medi)사의 정밀 압박 프로파일로 종아리 혈액 순환을 30% 증가시켜 심박수 부담 경감.',
  59000, 90, 'cep_progressive_calf_3');
addProduct('gear', 'BV Sport 보스터 엘리트 EVO 카프가드', 'BVSport', 'bvsport_logo.png',
  '올림픽 마라톤 선수들이 애용하는 부위별 차등 압박으로 슬레드 후 종아리 뭉침을 즉각 완화.',
  62000, 80, 'bvsport_booster_elite_evo');
addProduct('gear', 'Compressport R2V2 카프 슬리브 1쌍', 'Compressport', 'compressport_logo.png',
  '무릎 슬개골 보호 텅과 진동 흡수 3D 닷이 결합되어 버피 착지 충격을 획기적으로 완화.',
  58000, 85, 'compressport_r2v2_sleeves');
addProduct('gear', 'Rehband QD 종아리 압박 보호대 1쌍', 'Rehband', 'rehband_logo.png',
  '단단한 3mm 네오프렌 하이브리드로 정강이 쓸림과 종아리 파열 위험을 동시에 막아주는 슬리브.',
  48000, 95, 'rehband_qd_calf_support');
addProduct('gear', 'IronPulse 카프 락 컴프레션 슬리브', 'IronPulse', 'ironpulse_logo.png',
  '종아리 후면 X자 테이핑 라인이 내장되어 슬레드 푸시 시 비복근의 과도한 신전을 방어.',
  42000, 105, 'ironpulse_calf_lock_sleeve');
addProduct('gear', 'HyperShield 3D 엠보 종아리 가드', 'HyperShield', 'hypershield_logo.png',
  '입체 엠보싱 패브릭이 림프 순환을 자극하여 8개 랩 동안 다리 부종과 피로감을 억제.',
  39000, 115, 'hypershield_3d_embo_calf');
addProduct('gear', 'CoreVigor 점프 충격흡수 카프밴드', 'CoreVigor', 'corevigor_logo.png',
  '버피 브로드 점프 80m 구간에서 발목과 종아리로 튀는 충격을 효과적으로 감쇠.',
  36000, 120, 'corevigor_jump_calf_band');
addProduct('gear', 'TitanStrap 혈류촉진 카프 슬리브', 'TitanStrap', 'titanstrap_logo.png',
  '향상된 정맥 환류 압박으로 로잉 머신 후 다리가 무거워지는 현상을 방어해주는 기능성 가드.',
  38000, 100, 'titanstrap_bloodflow_calf');
addProduct('gear', 'GripForge 하이퍼 컴프레션 종아리대', 'GripForge', 'gripforge_logo.png',
  '흘러내림 없는 실리콘 탑 밴드와 자외선 차단 냉감 원사가 적용된 사계절용 카프가드.',
  37000, 110, 'gripforge_hyper_calf_guard');

// 3-7. 버피 & 런지 무릎/정강이 마모 방지 신가드 (10종)
addProduct('gear', 'Bear KompleX 컴프레션 신가드 (1쌍)', 'BearKomplex', 'bearkomplex_logo.png',
  '5mm 네오프렌 정강이 보호 패드로 슬레드 엣지 충돌 및 샌드백 마찰로부터 정강이 피부와 뼈를 완벽 보호.',
  52000, 85, 'bearkomplex_compression_shinguards');
addProduct('gear', 'Rehband QD 정강이 보호 슬리브 1쌍', 'Rehband', 'rehband_logo.png',
  '내마모성 케블라 외피와 지퍼 여닫이 설계로 신발을 벗지 않고도 경기 직전 빠르게 착탈 가능.',
  58000, 70, 'rehband_qd_shin_sleeves');
addProduct('gear', 'Rogue 로프 클라이밍 & 슬레드 신가드', 'Rogue', 'rogue_logo.png',
  '로프 풀링 시 발에 로프가 꼬이거나 쓸릴 때 발생하는 찰과상을 완벽 차단하는 하이엔드 가드.',
  55000, 75, 'rogue_rope_shin_guards');
addProduct('gear', 'RockTape RockGuards 3세대 신가드', 'RockTape', 'rocktape_logo.png',
  '4방향 신축성 라이크라 원단과 배수 구멍이 적용되어 경기 중 열기를 배출하며 정강이 보호.',
  49000, 80, 'rocktape_rockguards_v3');
addProduct('gear', 'HyperShield 버피 듀얼 패딩 신가드', 'HyperShield', 'hypershield_logo.png',
  'EVA 충격 흡수 폼이 정강이 중앙에 내장되어 버피 도약 착지 시 바닥 충돌 충격을 분산.',
  49000, 90, 'hypershield_burpee_dual_shinguard');
addProduct('gear', 'IronPulse 슬레드 충돌방지 신가드 1쌍', 'IronPulse', 'ironpulse_logo.png',
  '썰매 기둥을 잡고 밀 때 정강이가 슬레드 철제 프레임에 부딪혀 생기는 피멍을 원천 방지.',
  46000, 85, 'ironpulse_sled_collision_shin');
addProduct('gear', 'GripForge 인조잔디 쓸림방지 가드', 'GripForge', 'gripforge_logo.png',
  '거친 카펫 마찰열에 정강이 피부가 화상을 입지 않도록 열차단 패브릭으로 마감된 프로 가드.',
  43000, 95, 'gripforge_turf_burn_guard');
addProduct('gear', 'CoreVigor EVA 정강이 쿠션패드', 'CoreVigor', 'corevigor_logo.png',
  '두께 4mm 고밀도 폼이 정강이 뼈를 감싸 런지 동작 시 반대쪽 발뒤꿈치 충돌 부상을 예방.',
  38000, 100, 'corevigor_eva_shin_cushion');
addProduct('gear', 'TitanStrap 방탄 나일론 신슬리브', 'TitanStrap', 'titanstrap_logo.png',
  '1000D 방탄 나일론 패치로 내구성을 극대화하여 수년간의 혹독한 경기에도 끄떡없는 가드.',
  45000, 80, 'titanstrap_ballistic_shin_sleeve');
addProduct('gear', 'Under Armour 아머 신 프로텍터', 'Under Armour', 'underarmour_logo.png',
  '가볍고 밀착감이 우수하여 달리기 속도에 지장을 주지 않는 슬림핏 정강이 보호대.',
  42000, 90, 'underarmour_armour_shin_protect');

// 3-8. 손목 꺾임 방지 고장력 리스트랩 (10종)
addProduct('gear', 'Rogue 60cm 헤비 손목 스트랩 (1쌍)', 'Rogue', 'rogue_logo.png',
  '엄지 걸이 고리와 와이드 벨크로로 슬레드 밀기 시 손목 꺾임을 강력 차단하는 공식 규격 랩.',
  29000, 140, 'rogue_60cm_wrist_wraps');
addProduct('gear', 'Harbinger 엘리트 리스트랩 50cm', 'Harbinger', 'harbinger_logo.png',
  '고탄성 고무사가 직조되어 버피 푸시업과 월볼 캐치 시 손목 인대 늘어남 통증을 사전 예방.',
  26000, 130, 'harbinger_elite_wrist_wraps');
addProduct('gear', 'Schiek 손목 지지대 1112B (패디드)', 'Schiek', 'schiek_logo.png',
  '네오프렌 손목 패딩이 내장되어 장시간 슬레드 밀기에도 혈관 눌림 없이 손목을 강력 지탱.',
  35000, 85, 'schiek_1112b_wrist_support');
addProduct('gear', 'Gangsta Wrist Wraps 고탄성 파워랩', 'SlingShot', 'slingshot_logo.png',
  '파워리프팅 챔피언들이 사용하는 최고 강도의 단단함으로 손목을 깁스처럼 완벽히 고정.',
  45000, 60, 'gangsta_wrist_wraps');
addProduct('gear', 'IronPulse 프로 카본 손목 스트랩', 'IronPulse', 'ironpulse_logo.png',
  '카본 텍스처 패브릭이 땀에 젖어도 벨크로 접착력을 유지하여 레이스 도중 풀림 현상 제로.',
  29000, 110, 'ironpulse_pro_carbon_wristwrap');
addProduct('gear', 'GripForge 썸루프 파워 리스트랩', 'GripForge', 'gripforge_logo.png',
  '빠르게 감고 풀 수 있는 퀵 락 스트랩으로 로잉과 슬레드 전환 시 손목 압박 강도 조절 용이.',
  27000, 120, 'gripforge_thumbloop_wristwrap');
addProduct('gear', 'TitanStrap 스틸 서포트 손목밴드', 'TitanStrap', 'titanstrap_logo.png',
  '유연한 스틸 스프링 지지대가 내장되어 월볼 투척 후 낙하 충격을 손목에서 완충.',
  32000, 95, 'titanstrap_steel_wristband');
addProduct('gear', 'HyperShield 인체공학 손목 프로텍터', 'HyperShield', 'hypershield_logo.png',
  '손바닥 밑부분까지 감싸는 설계로 바닥을 짚고 일어나는 버피 동작 시 손목 관절을 보호.',
  28000, 115, 'hypershield_ergo_wrist_protect');
addProduct('gear', 'CoreVigor 45cm 스피드 리스트랩', 'CoreVigor', 'corevigor_logo.png',
  '여성 선수 및 얇은 손목을 가진 레이서를 위한 가볍고 유연한 45cm 컴팩트 리스트랩.',
  24000, 135, 'corevigor_45cm_speed_wristwrap');
addProduct('gear', 'Rehband 튜닝 손목 서포트 1개입', 'Rehband', 'rehband_logo.png',
  '손목 온도를 따뜻하게 유지하여 힘줄의 유연성을 확보하고 건초염을 방지하는 네오프렌 밴드.',
  25000, 125, 'rehband_tuning_wrist_support');

// 3-9. 땀 차단 쿨맥스 헤드밴드 & 손목밴드 세트 (10종)
addProduct('gear', 'Under Armour 아머 드라이 스웨트 헤드밴드', 'Under Armour', 'underarmour_logo.png',
  '고기능성 수분 흡착 실리콘 라인이 이마에 맺힌 땀을 측면으로 유도하여 눈 따가움을 완벽 차단.',
  26000, 160, 'underarmour_armour_dry_headband');
addProduct('gear', 'Nike 스우시 더블 와이드 손목밴드 (1쌍)', 'Nike', 'nike_logo.png',
  '도톰한 테리 클로스 원단으로 달리기 중 얼굴 땀을 빠르게 닦아낼 수 있는 필수 아이템.',
  19000, 200, 'nike_swoosh_double_wristband');
addProduct('gear', 'Halo 헤드밴드 II 땀유도 실리콘 밴드', 'Halo', 'halo_logo.png',
  '특허받은 SweatSeal 실리콘 띠가 땀방울이 안경이나 눈으로 떨어지는 것을 물리적으로 차단.',
  29000, 120, 'halo_headband_2_sweatseal');
addProduct('gear', 'Lululemon 메탈 벤트 테크 헤드밴드', 'Lululemon', 'lululemon_logo.png',
  '은사를 직조한 실버레슨 기술로 땀 냄새 유발 세균 번식을 억제하는 프리미엄 헤드밴드.',
  28000, 110, 'lululemon_metal_vent_headband');
addProduct('gear', '2XU 퍼포먼스 땀흡수 바이저 캡', '2XU', '2xu_logo.png',
  '실내 경기장 강렬한 조명 눈부심을 막아주고 머리 땀을 빠르게 배출하는 통기성 바이저.',
  32000, 90, '2xu_performance_visor_cap');
addProduct('gear', 'CoreVigor 쿨맥스 실리콘 헤드밴드 3팩', 'CoreVigor', 'corevigor_logo.png',
  '논슬립 실리콘 그립으로 격렬한 버피 브로드점프 도약 시에도 머리에서 벗겨지지 않음.',
  24000, 140, 'corevigor_coolmax_headband_3pack');
addProduct('gear', 'GripForge 안면 땀차단 실리콘 밴드', 'GripForge', 'gripforge_logo.png',
  '초경량 15g 무게로 경기 내내 압박감 없이 이마에 밀착되는 땀 배출 전용 밴드.',
  22000, 150, 'gripforge_facesweat_band');
addProduct('gear', 'IronPulse 드라이핏 손목 스웨트밴드 1쌍', 'IronPulse', 'ironpulse_logo.png',
  '손목 시계와 심박계 위로 흘러내리는 땀을 막아 센서 측정 오류를 방지하는 와이드 밴드.',
  18000, 170, 'ironpulse_dryfit_wristband');
addProduct('gear', 'TitanStrap 통기성 에어로 헤드밴드', 'TitanStrap', 'titanstrap_logo.png',
  '쿨링 원사가 즉각적인 냉각 효과를 주어 머리 열감으로 인한 오버히트를 막아주는 밴드.',
  21000, 135, 'titanstrap_aero_headband');
addProduct('gear', 'Gymshark 심리스 스웨트밴드 2세트', 'Gymshark', 'gymshark_logo.png',
  '봉제선 없는 부드러운 착용감으로 피부 쓸림을 방지하고 스타일리시한 레이스 룩 완성.',
  25000, 130, 'gymshark_seamless_sweatband');

// 3-10. 선수용 경기 수납 & 배번 마그넷 기어 (10종)
addProduct('gear', 'TitanStrap 레이스 빕 마그넷 홀더 (4세트)', 'TitanStrap', 'titanstrap_logo.png',
  '옷감 손상이나 핀 찔림 없이 배번표를 네오디뮴 자석으로 강력 고정하여 격렬한 버피에도 탈락 방지.',
  19000, 220, 'titanstrap_race_bib_magnets');
addProduct('gear', 'Nathan 스피드드로우 휴대용 런닝 물병 530ml', 'Nathan', 'nathan_logo.png',
  '손에 쥐기 쉬운 인체공학 스트랩 핸드헬드 보틀로 런 코스에서 에너지 드링크 음용 용이.',
  35000, 80, 'nathan_speeddraw_bottle_530ml');
addProduct('gear', 'Amphipod 마이크로 러닝 웨이스트 벨트', 'Amphipod', 'amphipod_logo.png',
  '흔들림 제로 바운스 프리 구조로 에너지젤 4포와 스마트폰을 컴팩트하게 밀착 수납.',
  38000, 95, 'amphipod_micro_running_belt');
addProduct('gear', 'FlipBelt 클래식 러닝 웨이스트백', 'FlipBelt', 'flipbelt_logo.png',
  '지퍼나 버클 없이 튜브 형태로 착용하여 런지와 버피 시 배나 허리를 누르지 않는 플랫 벨트.',
  45000, 85, 'flipbelt_classic_waistpack');
addProduct('gear', 'Salomon 액티브 스킨 4L 러닝 조끼', 'Salomon', 'salomon_logo.png',
  '소프트 플라스크 2개가 포함되어 장시간 훈련 시 수분과 뉴트리션을 완벽히 서포트.',
  119000, 40, 'salomon_active_skin_4l');
addProduct('gear', 'TitanStrap 하이록스 기어 백팩 45L 방수', 'TitanStrap', 'titanstrap_logo.png',
  '신발 독립 수납함, 젖은 기어 분리 포켓, 샌드백/벨트 결속 스트랩이 완비된 경기 전용 가방.',
  98000, 50, 'titanstrap_hyrox_gear_backpack_45l');
addProduct('gear', 'Rogue 짐 듀플백 60L 헤비 캔버스', 'Rogue', 'rogue_logo.png',
  '방수 지퍼와 밀리터리급 나일론으로 무거운 보호대, 신발, 뉴트리션을 한 번에 수납하는 백.',
  89000, 55, 'rogue_gym_duffle_bag_60l');
addProduct('gear', 'CoreVigor 카라비너 스포츠 퀵드라이 타월', 'CoreVigor', 'corevigor_logo.png',
  '자중의 5배 수분을 흡수하며 체육관 펜스나 가방에 간편하게 걸 수 있는 컴팩트 타월.',
  18000, 180, 'corevigor_carabiner_sport_towel');
addProduct('gear', 'GripForge 젖은 기어 분리 방수 드라이백 15L', 'GripForge', 'gripforge_logo.png',
  '땀에 흠뻑 젖은 무릎보호대와 경기복을 냄새와 수분 유출 없이 밀폐 수납하는 롤탑 백.',
  24000, 120, 'gripforge_wetgear_drybag_15l');
addProduct('gear', 'IronPulse 트랜지션 메쉬 기어색', 'IronPulse', 'ironpulse_logo.png',
  '통기성 에어메쉬로 제작되어 훈련 후 보호대의 땀을 자연 건조시키며 이동하는 백팩.',
  28000, 110, 'ironpulse_transition_mesh_gearsack');


/* =========================================================================
   4. EQUIPMENT (100 Unique Items across 10 Distinct Functional Categories)
   ========================================================================= */

// 4-1. SkiErg 스테이션 본체 및 마운트 (10종)
addProduct('equipment', 'Concept2 SkiErg PM5 모니터 탑재 본체', 'Concept2', 'concept2_logo.png',
  'HYROX 1번째 공식 스테이션 장비. 정밀한 공기 저항 플라이휠과 실시간 페이스/칼로리 계측 PM5 모니터 내장.',
  1650000, 15, 'concept2_skierg_pm5_main');
addProduct('equipment', 'Concept2 SkiErg 순정 플로어 스탠드', 'Concept2', 'concept2_logo.png',
  '벽면 타공 없이 스키에르고를 자립 설치할 수 있는 캐스터 휠 장착 강철 프레임과 논슬립 발판 베이스.',
  380000, 25, 'concept2_skierg_floor_stand');
addProduct('equipment', 'Concept2 SkiErg 벽걸이 마운트 키트', 'Concept2', 'concept2_logo.png',
  '체육관 벽면에 견고하게 볼팅 고정하여 바닥 공간 효율성을 극대화하는 순정 벽면 마운트 브라켓.',
  120000, 40, 'concept2_skierg_wall_mount_kit');
addProduct('equipment', 'Concept2 SkiErg 순정 교체용 풀코드 세트', 'Concept2', 'concept2_logo.png',
  '수만 회 이상의 강한 풀링 동작에도 끊김 없는 벡트란(Vectran) 강화 섬유 소재의 정품 드라이브 로프.',
  45000, 80, 'concept2_skierg_drive_cords');
addProduct('equipment', 'Concept2 SkiErg 인체공학 에르고 핸들 1쌍', 'Concept2', 'concept2_logo.png',
  '손아귀 피로를 줄이고 땀에 젖어도 미끄러지지 않는 스트랩리스 인체공학 경량 손잡이 순정품.',
  55000, 70, 'concept2_skierg_ergo_handles');
addProduct('equipment', 'IronErg 프로 스키 트레이너 본체', 'IronErg', 'ironerg_logo.png',
  '10단계 정밀 댐퍼 저항과 블루투스 스마트 심박 연동을 지원하는 고내구성 상체 에르고미터.',
  1390000, 18, 'ironerg_pro_ski_trainer');
addProduct('equipment', 'IronErg 독립형 헤비 플로어 스탠드', 'IronErg', 'ironerg_logo.png',
  '진동 흡수 고무 패드와 광폭 스틸 베이스로 파워 풀링 시에도 흔들림 없는 독립 지지 스탠드.',
  320000, 20, 'ironerg_heavy_floor_stand');
addProduct('equipment', 'IronErg 롱그립 스키 핸들 세트', 'IronErg', 'ironerg_logo.png',
  '다양한 그립 각도를 제공하여 삼두근과 광배근 자극을 극대화하는 교체형 에르고 핸들.',
  49000, 60, 'ironerg_longgrip_ski_handles');
addProduct('equipment', 'Rogue SkiErg 바닥 충격흡수 매트 (1.2m x 1.5m)', 'Rogue', 'rogue_logo.png',
  '스키에르고 발판 하부에 깔아 체육관 층간 소음과 바닥 긁힘을 방지하는 고밀도 고무 매트.',
  89000, 45, 'rogue_skierg_floor_mat');
addProduct('equipment', 'SledMaster SkiErg 벽면 보강 브라켓 세트', 'SledMaster', 'sledmaster_logo.png',
  '합판이나 석고보드 벽체에도 스키에르고를 하중 200kg까지 안전하게 지지해주는 보강 철물 키트.',
  65000, 50, 'sledmaster_skierg_wall_bracket');

// 4-2. 공식 파워 슬레드 및 중량 확장 (10종)
addProduct('equipment', 'Centr x HYROX 공식 파워 슬레드 Pro', 'Centr', 'centr_logo.png',
  'HYROX 공식 대회에 실제로 사용되는 오리지널 중량 썰매. 밀기용 듀얼 포스트와 로프 결속용 고리 완비.',
  890000, 20, 'centr_hyrox_official_power_sled');
addProduct('equipment', 'Centr x HYROX 순정 UHMW 스키 플레이트 (4개 세트)', 'Centr', 'centr_logo.png',
  '인조잔디 마찰열에 견디는 고밀도 UHMW 폴리에틸렌 순정 스키 판넬. 썰매 바닥 마모 교체용 세트.',
  160000, 50, 'centr_hyrox_sled_skis_4pack');
addProduct('equipment', 'Centr 슬레드 듀얼 푸시 핸들 바 (1쌍)', 'Centr', 'centr_logo.png',
  '공식 규격 높이의 강철 수직 핸들로 152kg/202kg 하중 전달 시에도 휘어짐 없는 굵은 파이프.',
  120000, 40, 'centr_sled_push_handles');
addProduct('equipment', 'Centr 슬레드 중량 원판 로딩 혼 확장 포스트', 'Centr', 'centr_logo.png',
  '범퍼 플레이트를 최대 300kg까지 적재할 수 있도록 높이를 연장해주는 중앙 스틸 포스트.',
  65000, 55, 'centr_sled_loading_horn_ext');
addProduct('equipment', 'SledMaster 헤비듀티 30kg 경기용 슬레드', 'SledMaster', 'sledmaster_logo.png',
  '자체 중량 30kg의 견고한 강철 튜브 프레임으로 최대 350kg 원판 로딩이 가능한 프로 트레이닝 슬레드.',
  650000, 25, 'sledmaster_heavyduty_sled_30kg');
addProduct('equipment', 'Rogue 에코 슬레드 2.0 터프 전용 썰매', 'Rogue', 'rogue_logo.png',
  '탈부착형 수직 핸들과 콤팩트한 베이스로 실내 터프 트랙 트레이닝에 최적화된 중량 썰매.',
  490000, 30, 'rogue_echo_sled_v2');
addProduct('equipment', 'Torque M1 탱크 마그네틱 저항 슬레드', 'Torque', 'torque_logo.png',
  '원판 적재 없이 바퀴 마그네틱 저항으로 슬레드 밀기를 구현하여 실내 소음이 제로인 첨단 썰매.',
  1950000, 10, 'torque_m1_tank_sled');
addProduct('equipment', 'Eleiko 공인 파워 슬레드 레이스 프레임', 'Eleiko', 'eleiko_logo.png',
  '스웨덴산 정밀 강철로 제작되어 흔들림 없는 완벽한 주행 직선성을 보장하는 최고급 썰매.',
  1150000, 12, 'eleiko_certified_power_sled');
addProduct('equipment', 'TitanTurf 슬레드 브레이크 저항 썰매', 'TitanTurf', 'titanturf_logo.png',
  '가변 저항 패드가 장착되어 좁은 공간에서도 200kg 슬레드 밀기 부하를 손쉽게 재현.',
  750000, 18, 'titanturf_brake_resistance_sled');
addProduct('equipment', 'IronErg 멀티그립 트레이닝 슬레드', 'IronErg', 'ironerg_logo.png',
  '로우/하이 핸들과 수평 핸들이 모두 장착되어 다양한 상하체 각도에서 푸시 훈련이 가능한 슬레드.',
  580000, 22, 'ironerg_multigrip_sled');

// 4-3. 공인 슬레드 풀 로프 및 커넥터 (10종)
addProduct('equipment', 'Centr x HYROX 공인 15m 슬레드 풀 로프 (38mm)', 'Centr', 'centr_logo.png',
  'HYROX 3번째 스테이션 공식 규격 15m 길이, 38mm 직경. 부드러운 편직으로 손바닥 쓸림을 줄인 오리지널 로프.',
  195000, 45, 'centr_hyrox_official_rope_38mm');
addProduct('equipment', 'Centr x HYROX 공인 15m 헤비 로프 (50mm 프로용)', 'Centr', 'centr_logo.png',
  '강력한 파워와 악력을 요구하는 남성 프로 디비전 훈련용 두꺼운 50mm 직경 고장력 썰매 로프.',
  245000, 35, 'centr_hyrox_heavy_rope_50mm');
addProduct('equipment', 'SledMaster 15m 브레이디드 슬레드 견인 로프', 'SledMaster', 'sledmaster_logo.png',
  '올풀림 방지 열수축 고무 캡 마감과 카라비너 체결용 강철 아일렛이 장착된 실전용 트레이닝 로프.',
  165000, 50, 'sledmaster_braided_rope_15m');
addProduct('equipment', 'Rogue 50ft 나일론 슬레드 로프 (카라비너 포함)', 'Rogue', 'rogue_logo.png',
  '내구성이 탁월한 프리미엄 블랙 나일론 소재로 수천 번의 거친 견인에도 마모되지 않는 로프.',
  185000, 40, 'rogue_50ft_nylon_sled_rope');
addProduct('equipment', 'Eleiko 15m 배틀 & 슬레드 마닐라 로프', 'Eleiko', 'eleiko_logo.png',
  '천연 마닐라 삼 원사로 직조되어 땀에 젖어도 손아귀에서 미끄러지지 않는 클래식 로프.',
  175000, 30, 'eleiko_manila_sled_rope_15m');
addProduct('equipment', 'SledMaster 헤비카라비너 슬레드 연결 키트', 'SledMaster', 'sledmaster_logo.png',
  '하중 25kN을 버티는 등반용 강철 카라비너와 고장력 나일론 스트랩으로 슬레드와 로프를 안전 결속.',
  35000, 90, 'sledmaster_heavy_carabiner_kit');
addProduct('equipment', 'TitanTurf 15m 폴리다크론 썰매 견인 로프', 'TitanTurf', 'titanturf_logo.png',
  '유연성과 인장 강도가 우수한 폴리다크론 소재로 손목 부하를 줄여주는 당기기 전용 로프.',
  155000, 45, 'titanturf_polydacron_rope_15m');
addProduct('equipment', 'IronErg 40mm 고장력 당기기 로프 (15m)', 'IronErg', 'ironerg_logo.png',
  '여성 오픈 및 더블스 경기 훈련에 가장 적합한 손에 쏙 들어오는 40mm 직경 하이브리드 로프.',
  170000, 40, 'ironerg_40mm_pull_rope_15m');
addProduct('equipment', 'GripForge 로프 열수축 캡 수리 키트 (4개입)', 'GripForge', 'gripforge_logo.png',
  '오래 사용하여 끝단이 풀린 슬레드 로프를 드라이어 열풍으로 새것처럼 마감해주는 수리용 튜브.',
  18000, 110, 'gripforge_rope_repair_caps');
addProduct('equipment', 'Centr 로프 전용 벽걸이 수납 행거 랙', 'Centr', 'centr_logo.png',
  '15m 헤비 로프를 바닥에 늘어놓지 않고 깔끔하게 감아 보관할 수 있는 벽면 강철 거치대.',
  55000, 60, 'centr_rope_wall_hanger_rack');

// 4-4. RowErg 로잉머신 및 유지보수 (10종)
addProduct('equipment', 'Concept2 RowErg PM5 로잉머신 (표준 레그 36cm)', 'Concept2', 'concept2_logo.png',
  '전 세계 표준이자 HYROX 5번째 스테이션 공식 장비. 1000m 칼로리 페이스를 정밀 계측하는 PM5 탑재.',
  1750000, 15, 'concept2_rowerg_pm5_standard');
addProduct('equipment', 'Concept2 RowErg PM5 로잉머신 (하이 레그 51cm)', 'Concept2', 'concept2_logo.png',
  '시트 높이가 높아 관절 가동 범위가 좁거나 햄스트링이 타이트한 러너도 탑승하기 편한 롱레그 에디션.',
  1950000, 12, 'concept2_rowerg_pm5_tall');
addProduct('equipment', 'Concept2 순정 체인 오일 & 메인터넌스 툴킷', 'Concept2', 'concept2_logo.png',
  '니켈 도금 체인의 마찰 소음을 줄이고 플라이휠 수명을 영구적으로 연장해주는 순정 광유 및 렌치 세트.',
  35000, 100, 'concept2_chain_oil_toolkit');
addProduct('equipment', 'Concept2 실리콘 젤 에르고 시트패드', 'Concept2', 'concept2_logo.png',
  '장시간 1000m 전력 로잉 시 꼬리뼈 통증과 쓸림을 없애주는 인체공학 젤 쿠션 순정 패드.',
  42000, 85, 'concept2_silicone_seat_pad');
addProduct('equipment', 'Concept2 PM5 모니터 스마트폰/태블릿 마운트', 'Concept2', 'concept2_logo.png',
  '로잉 중 실시간 심박수 앱과 페이스 차트를 보며 훈련할 수 있는 PM5 전용 순정 거치대.',
  28000, 95, 'concept2_pm5_device_mount');
addProduct('equipment', 'IronErg 윈드 스마트 로잉머신 PM호환', 'IronErg', 'ironerg_logo.png',
  '에어 플라이휠 저항과 부드러운 알루미늄 슬라이드 레일이 결합된 클럽 트레이닝 로잉머신.',
  1450000, 18, 'ironerg_wind_smart_rower');
addProduct('equipment', 'Rogue 로잉 발판 풋스트랩 교체 키트 (1쌍)', 'Rogue', 'rogue_logo.png',
  '낡아서 미끄러지는 로잉 발판 스트랩을 고장력 나일론 웨빙으로 교체하여 당김 효율 복원.',
  22000, 120, 'rogue_rower_footstrap_kit');
addProduct('equipment', 'Eleiko 프리미엄 체인 커버 로잉머신', 'Eleiko', 'eleiko_logo.png',
  '땀과 먼지로부터 체인을 완벽히 밀폐 보호하여 체육관 내 유지보수 소요를 줄인 고급 로워.',
  1850000, 10, 'eleiko_premium_chain_rower');
addProduct('equipment', 'SledMaster 로잉 슬라이드 레일 클리너 500ml', 'SledMaster', 'sledmaster_logo.png',
  '모노레일에 쌓인 검은 고무 때를 긁힘 없이 닦아내어 시트 롤러 구름성을 새것처럼 복원.',
  19000, 130, 'sledmaster_rail_cleaner_500ml');
addProduct('equipment', 'TitanTurf 로잉머신 전용 바닥 방진 매트', 'TitanTurf', 'titanturf_logo.png',
  '로잉 플라이휠 고속 회전 진동을 흡수하여 바닥 타일 손상과 소음을 완벽 차단하는 2.5m 매트.',
  75000, 50, 'titanturf_rower_mat_250cm');

// 4-5. 공식 옥토 케틀벨 (파머스 캐리 세트) (10종)
addProduct('equipment', 'Centr x HYROX 옥토 케틀벨 16kg (2개 1쌍 / 여성 오픈)', 'Centr', 'centr_logo.png',
  'HYROX 6번째 스테이션 공식 장비. 여성 오픈 규격 16kg 2개 세트. 8각형 디자인으로 캐리 시 허벅지 멍 방지.',
  178000, 30, 'centr_octo_kettlebell_16kg_pair');
addProduct('equipment', 'Centr x HYROX 옥토 케틀벨 24kg (2개 1쌍 / 남성 오픈)', 'Centr', 'centr_logo.png',
  '남성 오픈 및 여성 프로 공식 규격 24kg 2개 세트. 파우더 코팅 손잡이로 땀에 미끄러지지 않는 공식 케틀벨.',
  248000, 35, 'centr_octo_kettlebell_24kg_pair');
addProduct('equipment', 'Centr x HYROX 옥토 케틀벨 32kg (2개 1쌍 / 남성 프로)', 'Centr', 'centr_logo.png',
  '남성 프로 공식 규격 32kg 2개 세트 (총 64kg). 극한의 악력과 코어를 테스트하는 최상위 디비전 장비.',
  318000, 25, 'centr_octo_kettlebell_32kg_pair');
addProduct('equipment', 'Centr 옥토 케틀벨 12kg (2개 1쌍 / 입문 트레이닝)', 'Centr', 'centr_logo.png',
  '파머스 캐리 200m 폼 교정 및 초보자 자세 적응을 위한 경량 12kg 옥토 케틀벨 1쌍.',
  145000, 40, 'centr_octo_kettlebell_12kg_pair');
addProduct('equipment', 'Centr 옥토 케틀벨 20kg (2개 1쌍 / 브릿지 트레이닝)', 'Centr', 'centr_logo.png',
  '16kg에서 24kg로 넘어가는 중간 단계에서 악력과 견갑골 안정성을 키우는 20kg 세트.',
  215000, 35, 'centr_octo_kettlebell_20kg_pair');
addProduct('equipment', 'Centr 옥토 케틀벨 28kg (2개 1쌍 / 프로 빌드업)', 'Centr', 'centr_logo.png',
  '남성 프로 32kg 진입 전 악력 한계를 뚫어주는 점진적 과부하 훈련용 28kg 1쌍.',
  285000, 28, 'centr_octo_kettlebell_28kg_pair');
addProduct('equipment', 'OctaPower 각형 파머스 캐리 전용 케틀벨 24kg 쌍', 'OctaPower', 'octapower_logo.png',
  '허벅지에 닿는 평면 각도를 최적화하고 손잡이에 레이저 널링을 새겨 악력 유지를 돕는 케틀벨 세트.',
  220000, 32, 'octapower_farmers_kb_24kg_pair');
addProduct('equipment', 'OctaPower 와이드 핸들 32kg 케틀벨 세트', 'OctaPower', 'octapower_logo.png',
  '두 손 파지가 가능할 정도로 넓은 손잡이 룸을 확보하여 스윙과 파머스 캐리를 겸용하는 32kg 세트.',
  290000, 22, 'octapower_wide_handle_32kg_pair');
addProduct('equipment', 'Eleiko IWF 트레이닝 케틀벨 16kg 세트', 'Eleiko', 'eleiko_logo.png',
  '스웨덴 정밀 주조 공정으로 무게 오차 0.5% 미만을 보장하는 엘리트 전용 파머스 캐리 케틀벨.',
  210000, 26, 'eleiko_iwf_training_kb_16kg');
addProduct('equipment', 'Rogue 우레탄 각형 케틀벨 24kg 세트 (1쌍)', 'Rogue', 'rogue_logo.png',
  '두꺼운 우레탄 코팅으로 바닥 낙하 시 충격 소음이 적고 녹이 슬지 않는 체육관용 케틀벨.',
  260000, 28, 'rogue_urethane_octo_kb_24kg');

// 4-6. 공식 샌드백 (런지 스테이션 전용) (10종)
addProduct('equipment', 'Centr x HYROX 공식 샌드백 10kg (여성 오픈 런지)', 'Centr', 'centr_logo.png',
  'HYROX 7번째 스테이션 공식 장비. 여성 오픈 100m 런지 규격 10kg. 어깨에 편안히 안착되는 유선형 디자인.',
  125000, 45, 'centr_hyrox_sandbag_10kg');
addProduct('equipment', 'Centr x HYROX 공식 샌드백 20kg (남성 오픈 / 여성 프로)', 'Centr', 'centr_logo.png',
  '가장 치열한 디비전의 공식 20kg 런지 샌드백. 1000D 방탄 나일론 외피와 모래 누출 방지 삼중 락.',
  155000, 50, 'centr_hyrox_sandbag_20kg');
addProduct('equipment', 'Centr x HYROX 공식 샌드백 30kg (남성 프로 공식 규격)', 'Centr', 'centr_logo.png',
  '남성 프로 100m 런지 공식 30kg 초고강도 샌드백. 어깨 쇄골 짓눌림을 완화하는 고밀도 폼 코어 내장.',
  185000, 35, 'centr_hyrox_sandbag_30kg');
addProduct('equipment', 'Centr 트레이닝 샌드백 15kg (유소년/여성 프로 빌드업)', 'Centr', 'centr_logo.png',
  '10kg에서 20kg로 증량 전 런지 밸런스를 잡기 위한 최적의 브릿지 중량 15kg 샌드백.',
  138000, 40, 'centr_training_sandbag_15kg');
addProduct('equipment', 'Centr 트레이닝 샌드백 25kg (남성 프로 적응용)', 'Centr', 'centr_logo.png',
  '30kg 진입 전 승모근과 대퇴사두근 피로도를 테스트하고 자세를 완성하는 25kg 샌드백.',
  168000, 32, 'centr_training_sandbag_25kg');
addProduct('equipment', 'Rogue 피드백 숄더 샌드백 20kg (런지 전용)', 'Rogue', 'rogue_logo.png',
  '어깨 곡선에 맞춰 아치형으로 제작되어 100m 런지 보폭을 넓혀도 어깨에서 흘러내리지 않는 가방.',
  148000, 38, 'rogue_shoulder_sandbag_20kg');
addProduct('equipment', 'Rogue 1000D 방탄 샌드백 30kg 헤비듀티', 'Rogue', 'rogue_logo.png',
  '바닥에 던져도 터지지 않는 이중 밀폐 벨크로와 방수 안감으로 야외 잔디 훈련에도 적합.',
  175000, 30, 'rogue_ballistic_sandbag_30kg');
addProduct('equipment', 'SledMaster 어깨 밀착형 런지 샌드백 20kg', 'SledMaster', 'sledmaster_logo.png',
  '손잡이가 6방향에 달려 있어 런지뿐만 아니라 클린앤프레스 훈련까지 병행 가능한 다기능 샌드백.',
  135000, 42, 'sledmaster_lunge_sandbag_20kg');
addProduct('equipment', 'Eleiko 원통형 패디드 샌드백 10kg', 'Eleiko', 'eleiko_logo.png',
  '부드러운 가죽 질감의 외피로 목과 쇄골 부위 마찰 통증을 극적으로 줄인 엔트리 샌드백.',
  145000, 36, 'eleiko_padded_sandbag_10kg');
addProduct('equipment', 'IronErg 컴팩트 런지 샌드백 30kg', 'IronErg', 'ironerg_logo.png',
  '철분 미세 비드 충전재를 사용하여 부피는 줄이고 밀도를 높여 어깨 균형 유지가 편리한 샌드백.',
  180000, 28, 'ironerg_compact_sandbag_30kg');

// 4-7. 공식 월볼 (메디신 투척 볼) (10종)
addProduct('equipment', 'Centr x HYROX 공식 월볼 4kg (여성 오픈 공식 규격)', 'Centr', 'centr_logo.png',
  'HYROX 8번째 피니시 스테이션 공식 장비. 여성 오픈 75개 투척 규격 4kg. 충격 흡수 메모리폼 코어.',
  89000, 50, 'centr_hyrox_wallball_4kg');
addProduct('equipment', 'Centr x HYROX 공식 월볼 6kg (남성 오픈 / 여성 프로)', 'Centr', 'centr_logo.png',
  '남성 오픈 100개 투척 공식 기준 6kg 월볼. 완벽한 무게 중심 배분으로 타겟 타격 후 일정한 반발 리바운드.',
  109000, 60, 'centr_hyrox_wallball_6kg');
addProduct('equipment', 'Centr x HYROX 공식 월볼 9kg (남성 프로 공식 규격)', 'Centr', 'centr_logo.png',
  '남성 프로 3.0m 높이 100개 투척 공식 9kg 월볼. 두꺼운 내마모성 외피와 미끄럼 방지 그립 텍스처.',
  129000, 45, 'centr_hyrox_wallball_9kg');
addProduct('equipment', 'Centr 월볼 3kg (초보자 자세 연습 및 워밍업)', 'Centr', 'centr_logo.png',
  '월볼 스쿼트 깊이와 던지는 궤적을 교정하기 위한 3kg 소프트 터치 메디신볼.',
  79000, 55, 'centr_wallball_3kg_warmup');
addProduct('equipment', 'Centr 월볼 7kg (남성 오픈 오버로드 트레이닝)', 'Centr', 'centr_logo.png',
  '6kg 실전 볼 투척 전 어깨와 하체 지구력을 한 단계 끌어올리는 7kg 과부하 훈련볼.',
  119000, 40, 'centr_wallball_7kg_overload');
addProduct('equipment', 'Centr 월볼 10kg (남성 프로 파워 오버로드)', 'Centr', 'centr_logo.png',
  '9kg 프로 규격 벽을 넘기 위해 삼각근 폭발력을 극한으로 단련하는 10kg 헤비 월볼.',
  139000, 30, 'centr_wallball_10kg_heavy');
addProduct('equipment', 'WallStrike 크로스스티치 프로 월볼 6kg', 'WallStrike', 'wallstrike_logo.png',
  '이중 십자 교차 봉제선으로 2만 번의 벽면 타격에도 터지거나 찌그러지지 않는 고내구성 볼.',
  98000, 48, 'wallstrike_crossstitch_wallball_6kg');
addProduct('equipment', 'WallStrike 충격 무반동 월볼 9kg', 'WallStrike', 'wallstrike_logo.png',
  '타겟 맞고 튕겨져 나올 때 얼굴 충격을 부드럽게 감쇄해주는 고탄성 충격 흡수 패딩 내장 볼.',
  125000, 35, 'wallstrike_norebound_wallball_9kg');
addProduct('equipment', 'Rogue 에코 월볼 4kg 안티슬립', 'Rogue', 'rogue_logo.png',
  '땀에 젖은 손으로 캐치해도 손가락 사이로 미끄러지지 않는 고무 코팅 질감의 월볼.',
  95000, 42, 'rogue_echo_wallball_4kg');
addProduct('equipment', 'Eleiko 가죽 질감 그립 월볼 6kg', 'Eleiko', 'eleiko_logo.png',
  '클래식 인조가죽 질감으로 촉감이 부드럽고 반복적인 턱 타격 시에도 피부 찰과상을 방지.',
  115000, 38, 'eleiko_leather_grip_wallball_6kg');

// 4-8. 월볼 타겟 랙 및 경기장 규정 프레임 (10종)
addProduct('equipment', 'Centr 월볼 듀얼 규정 타겟 랙 (2.7m / 3.0m)', 'Centr', 'centr_logo.png',
  '여성 규정 2.7m와 남성 규정 3.0m 타겟 플레이트가 일체형으로 결합된 이동식 독립형 강철 스탠드.',
  750000, 15, 'centr_dual_wallball_target_rack');
addProduct('equipment', 'Rogue 월마운트 듀얼 타겟 플레이트 키트', 'Rogue', 'rogue_logo.png',
  '체육관 벽면에 볼팅 고정하여 공인 높이를 오차 없이 구현하는 30cm 레이저 가공 원형 타겟.',
  180000, 30, 'rogue_wallmount_dual_target');
addProduct('equipment', 'Eleiko 독립형 월볼 리그 타겟 포스트', 'Eleiko', 'eleiko_logo.png',
  '헤비 듀티 스틸 기둥으로 9kg 월볼의 반복 타격에도 소음과 흔들림이 전혀 없는 견고한 리그.',
  850000, 12, 'eleiko_freestanding_target_post');
addProduct('equipment', 'WallStrike 레이저 가이드 월볼 디지털 타겟', 'WallStrike', 'wallstrike_logo.png',
  '타겟 타격 시 센서가 감지하여 녹색 LED 불빛과 비프음으로 유효 투척 여부를 즉각 판정.',
  450000, 20, 'wallstrike_laser_digital_target');
addProduct('equipment', 'SledMaster 높이 조절식 월볼 스탠드', 'SledMaster', 'sledmaster_logo.png',
  '핀 조절 방식으로 2.4m부터 3.2m까지 높이를 자유자재로 변경 가능한 유소년 겸용 스탠드.',
  620000, 18, 'sledmaster_height_adj_wallball');
addProduct('equipment', 'IronErg 강철 프레임 듀얼 타겟 마운트', 'IronErg', 'ironerg_logo.png',
  '파워 랙이나 크로스핏 리그 기둥에 브라켓으로 즉시 체결 가능한 공간 절약형 타겟.',
  195000, 28, 'ironerg_dual_target_mount');
addProduct('equipment', 'Rogue Infinity 리그 전용 월볼 암 2.7m', 'Rogue', 'rogue_logo.png',
  'Rogue 인피니티 랙 전용 확장 암으로 체육관 인테리어를 훼손하지 않고 규정 높이 완성.',
  145000, 35, 'rogue_infinity_rig_arm_27');
addProduct('equipment', 'Centr 체육관 4구 대형 월볼 스테이션 리그', 'Centr', 'centr_logo.png',
  '동시에 4명의 선수가 나란히 서서 100개 월볼 레이스를 치를 수 있는 경기장 전용 대형 구조물.',
  2450000, 6, 'centr_4station_wallball_rig');
addProduct('equipment', 'TitanTurf 월볼 바닥 타격 보호 매트 1쌍', 'TitanTurf', 'titanturf_logo.png',
  '월볼이 바닥에 낙하할 때 발생하는 쿵쿵거리는 소음과 볼 외피 손상을 100% 흡수하는 매트.',
  98000, 40, 'titanturf_wallball_drop_mat');
addProduct('equipment', 'WallStrike 반사형 무소음 월볼 타겟 패드', 'WallStrike', 'wallstrike_logo.png',
  '특수 무소음 우레탄으로 코팅되어 도심 상가 피트니스 센터에서도 민원 없이 타격 훈련 가능.',
  220000, 25, 'wallstrike_silent_target_pad');

// 4-9. 인조잔디 슬레드 트랙 & 마킹 터프 (10종)
addProduct('equipment', 'TitanTurf 공인 슬레드 터프 매트 (1.5m x 20m 롤)', 'TitanTurf', 'titanturf_logo.png',
  '썰매 밀기 및 당기기 구간 전용 15mm 초고밀도 나일론 인조잔디. 마찰열 변형 없는 HYROX 공인 터프.',
  980000, 12, 'titanturf_sled_mat_15x20');
addProduct('equipment', 'TitanTurf 대형 런지 & 슬레드 터프 (2.0m x 25m 롤)', 'TitanTurf', 'titanturf_logo.png',
  '100m 샌드백 런지 레인과 썰매 구간을 여유롭게 구축할 수 있는 광폭 2m 규격 인조잔디 롤.',
  1450000, 8, 'titanturf_lunge_sled_mat_20x25');
addProduct('equipment', 'TitanTurf 12.5m 왕복 표시선 일체형 터프', 'TitanTurf', 'titanturf_logo.png',
  '슬레드 푸시 50m(12.5m 4왕복) 반환선이 백색 라인으로 영구 직조되어 테이핑 작업이 필요 없음.',
  1180000, 10, 'titanturf_12_5m_turnline_turf');
addProduct('equipment', 'SledMaster 마찰 저감 15mm 인조잔디 매트', 'SledMaster', 'sledmaster_logo.png',
  '썰매 밑바닥 플라스틱 마모를 줄이고 균일한 저항 계수를 제공하는 특수 코팅 잔디 매트.',
  890000, 15, 'sledmaster_lowfriction_turf_15mm');
addProduct('equipment', 'Rogue 트루 터프 트레이닝 롤 (1.8m x 15m)', 'Rogue', 'rogue_logo.png',
  '충격 흡수 폼 패드가 바닥에 덧대어져 런지 시 무릎이 닿아도 관절 통증이 없는 고급 터프.',
  1250000, 9, 'rogue_true_turf_roll');
addProduct('equipment', 'Eleiko 인도어 트랙 고밀도 잔디 20m', 'Eleiko', 'eleiko_logo.png',
  '사계절 실내 체육관 환경에 최적화된 난연 인증 및 정전기 방지 처리 최고급 인조잔디.',
  1650000, 7, 'eleiko_indoor_track_turf_20m');
addProduct('equipment', 'TitanTurf 터프 연결 전용 심 테이프 (10m 롤)', 'TitanTurf', 'titanturf_logo.png',
  '인조잔디 매트 2장을 틈새 없이 강력하게 결속하여 썰매가 걸려 넘어지는 사고를 방지.',
  45000, 60, 'titanturf_seam_tape_10m');
addProduct('equipment', 'SledMaster 인조잔디 청소용 고성능 브러시', 'SledMaster', 'sledmaster_logo.png',
  '썰매가 지나간 자리의 누운 잔디 파일(Pile)을 다시 세워주어 일정한 마찰력을 유지시키는 장비.',
  65000, 45, 'sledmaster_turf_brush');
addProduct('equipment', 'Centr 경기장 구역 분할 바닥 라인 테이프 50m', 'Centr', 'centr_logo.png',
  '우레탄 바닥에 끈적임 없이 부착되며 러닝 레인과 워크아웃 구역을 시각적으로 명확히 분리.',
  28000, 120, 'centr_floor_marking_tape_50m');
addProduct('equipment', 'TitanTurf 슬레드 스타트/피니시 블록 마커', 'TitanTurf', 'titanturf_logo.png',
  '썰매 앞코 정렬 위치를 알리는 고시인성 네온 옐로우 고무 마커 4개 세트.',
  32000, 80, 'titanturf_sled_start_markers');

// 4-10. 슬레드 범퍼 플레이트 & 경기장 운영 기기 (10종)
addProduct('equipment', 'Eleiko 스포츠 트레이닝 범퍼 원판 25kg (1쌍)', 'Eleiko', 'eleiko_logo.png',
  'HYROX 썰매 남성 프로 202kg 하중 세팅에 필수적인 정밀 규격 IWF 공인 고무 원판 1쌍.',
  450000, 20, 'eleiko_bumper_plates_25kg_pair');
addProduct('equipment', 'Eleiko 스포츠 트레이닝 범퍼 원판 20kg (1쌍)', 'Eleiko', 'eleiko_logo.png',
  '남성 오픈 152kg 썰매 하중을 정확하게 맞추기 위한 고밀도 스틸 허브 장착 20kg 원판.',
  380000, 25, 'eleiko_bumper_plates_20kg_pair');
addProduct('equipment', 'Eleiko 스포츠 트레이닝 범퍼 원판 15kg (1쌍)', 'Eleiko', 'eleiko_logo.png',
  '여성 프로 및 더블스 디비전 썰매 무게 미세 세팅용 내마모성 15kg 범퍼 원판 세트.',
  310000, 30, 'eleiko_bumper_plates_15kg_pair');
addProduct('equipment', 'Eleiko 스포츠 트레이닝 범퍼 원판 10kg (1쌍)', 'Eleiko', 'eleiko_logo.png',
  '여성 오픈 102kg 썰매 적재의 기본이 되는 슬림 프로파일 10kg 범퍼 플레이트 1쌍.',
  240000, 35, 'eleiko_bumper_plates_10kg_pair');
addProduct('equipment', 'Eleiko 우레탄 프랙셔널 플레이트 5kg 세트 (1쌍)', 'Eleiko', 'eleiko_logo.png',
  '슬레드 자체 무게 편차를 킬로그램 단위로 보정하는 정밀 가공 5kg 우레탄 소형 원판.',
  150000, 45, 'eleiko_fractional_plates_5kg_pair');
addProduct('equipment', 'Rogue 대형 LED 인터벌 벽걸이 타이머 (리모컨 포함)', 'Rogue', 'rogue_logo.png',
  '100m 밖에서도 선명하게 보이는 대형 적색/청색 LED 디지털 전광판. HYROX 랩타임 계측 필수품.',
  260000, 30, 'rogue_large_led_timer');
addProduct('equipment', 'Rogue 논더스트 액상 마그네슘 초크 250ml 2병', 'Rogue', 'rogue_logo.png',
  '가루 날림 없이 10초 만에 건조되어 로프 풀과 케틀벨 파머스 캐리 시 극강의 손바닥 마찰력 제공.',
  32000, 150, 'rogue_liquid_chalk_250ml_2pack');
addProduct('equipment', 'Rogue 체육관 대용량 액상 초크 500ml 펌프형', 'Rogue', 'rogue_logo.png',
  '체육관 카운터에 비치하여 여러 선수가 손쉽게 위생적으로 펌핑해 바를 수 있는 대용량 초크.',
  55000, 80, 'rogue_liquid_chalk_500ml_pump');
addProduct('equipment', 'Centr 반환점 턴 마커 콘 세트 (8개입)', 'Centr', 'centr_logo.png',
  '1km 러닝 코스 및 슬레드 12.5m 왕복 구간 반환점을 표시하는 무독성 고탄성 네온 콘.',
  45000, 70, 'centr_turn_marker_cones_8pack');
addProduct('equipment', 'SledMaster 슬레드 원판 수납 트리 랙', 'SledMaster', 'sledmaster_logo.png',
  '슬레드 레인 바로 옆에 범퍼 플레이트를 무게별로 질서정연하게 정리할 수 있는 강철 타워 랙.',
  220000, 25, 'sledmaster_plate_tree_rack');

// 5. Verification & Output
const counts = {
  shoes: products.filter(p => p.categoryId === 'shoes').length,
  nutrition: products.filter(p => p.categoryId === 'nutrition').length,
  gear: products.filter(p => p.categoryId === 'gear').length,
  equipment: products.filter(p => p.categoryId === 'equipment').length,
  total: products.length,
};

console.log('=== PRODUCT MASTER DATASET GENERATION SUMMARY ===');
console.log('Counts by category:', counts);

// Check unique names and unique descriptions
const names = new Set(products.map(p => p.name));
const descs = new Set(products.map(p => p.description));

console.log(`Unique Names: ${names.size} / ${products.length}`);
console.log(`Unique Descriptions: ${descs.size} / ${products.length}`);

if (names.size !== products.length || descs.size !== products.length) {
  console.error('❌ DUPLICATES FOUND! Aborting write.');
  process.exit(1);
}

const outDir = path.join(__dirname, 'data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outFile = path.join(outDir, 'products.json');
fs.writeFileSync(outFile, JSON.stringify(products, null, 2), 'utf-8');
console.log(`✅ SUCCESS: Wrote ${products.length} 100% UNIQUE products to ${outFile}`);
