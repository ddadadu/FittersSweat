import Link from "next/link";
import { Trophy, ShoppingBag, MessageSquare, Sparkles, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[#262626] bg-[#0A0A0A] text-[#A3A3A3] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#262626]">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center space-x-2">
              <span className="text-2xl font-black italic tracking-tighter text-white">
                FITTER<span className="text-[#FFD700]">SWEAT</span>
              </span>
              <span className="text-[10px] uppercase font-black tracking-widest bg-[#FFD700] text-black px-1.5 py-0.5 rounded">
                HYROX
              </span>
            </Link>
            <p className="text-sm text-[#A3A3A3] max-w-md leading-relaxed">
              국내 최초 HYROX(하이록스) 올인원 커뮤니티 커머스 & AI 맞춤 추천 플랫폼.
              공식 대회 일정 연동, 레이서 검증 직매입 장비, 그리고 실전 완주 팁을 한곳에서 제공합니다.
            </p>
            <div className="flex items-center space-x-3 text-xs text-[#737373]">
              <span className="inline-flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>100% 정품 직매입 보증</span>
              </span>
            </div>
          </div>

          {/* Service Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5]">주요 서비스</h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href="/events" className="hover:text-[#FFD700] transition-colors inline-flex items-center space-x-2 py-1.5 min-h-[36px]">
                  <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
                  <span>대회 일정</span>
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-[#FFD700] transition-colors inline-flex items-center space-x-2 py-1.5 min-h-[36px]">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#FFD700]" />
                  <span>장비몰</span>
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-[#FFD700] transition-colors inline-flex items-center space-x-2 py-1.5 min-h-[36px]">
                  <MessageSquare className="w-3.5 h-3.5 text-[#FFD700]" />
                  <span>커뮤니티</span>
                </Link>
              </li>
              <li>
                <Link href="/recommend" className="hover:text-[#FFD700] transition-colors inline-flex items-center space-x-2 py-1.5 min-h-[36px]">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
                  <span>AI 맞춤추천</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Account / Support */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5]">계정 및 지원</h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href="/cart" className="hover:text-[#FFD700] transition-colors inline-flex items-center py-1.5 min-h-[36px]">
                  장바구니
                </Link>
              </li>
              <li>
                <Link href="/mypage" className="hover:text-[#FFD700] transition-colors inline-flex items-center py-1.5 min-h-[36px]">
                  마이페이지
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimers */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737373]">
          <p>© 2026 FitterSweat. All rights reserved.</p>
          <p className="text-center sm:text-right">
            HYROX is a registered trademark of Upsolut Sports GmbH. FittersSweat is an independent platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
