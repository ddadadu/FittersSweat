export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-[#0c0c0c] py-12 text-neutral-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="text-lg font-black italic text-white tracking-tight">
            FITTER<span className="text-[#FFD700]">SWEAT</span>
          </div>
          <p className="text-xs text-neutral-400">
            국내 최초 HYROX(하이록스) 올인원 커뮤니티 커머스 & AI 검색 추천 플랫폼
          </p>
          <p className="text-xs text-neutral-400">
            컴퓨터공학과 캡스톤 디자인 졸업작품 | Fastify 4 + Next.js 14 + PostgreSQL pgvector
          </p>
        </div>
        <div className="text-xs text-neutral-400 text-center md:text-right space-y-1">
          <p>© 2026 FitterSweat. All rights reserved.</p>
          <p className="text-neutral-400">HYROX is a registered trademark of Upsolut Sports GmbH.</p>
        </div>
      </div>
    </footer>
  );
}
