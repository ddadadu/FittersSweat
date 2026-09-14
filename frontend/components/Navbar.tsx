'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  ShoppingBag,
  MessageSquare,
  Sparkles,
  ShoppingCart,
  User,
  Menu,
  X,
  LogIn,
  LogOut,
} from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, isAuthenticated, logout, setAuthModalOpen } = useAuthStore();

  // Subscribe to getItemCount() from useCartStore
  const itemCount = useCartStore((state) => {
    // Explicit access to state.items for reactive subscription tracking
    if (state.items) {
      return state.getItemCount();
    }
    return 0;
  });
  const prevCountRef = useRef(itemCount);

  // Prevent SSR Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // 150ms pop/pulse animation on cart count changes
  useEffect(() => {
    if (!mounted) return;
    if (prevCountRef.current !== itemCount) {
      prevCountRef.current = itemCount;
      setIsPulsing(true);
      const timer = setTimeout(() => {
        setIsPulsing(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [itemCount, mounted]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "/events", label: "대회 일정", icon: Trophy },
    { href: "/products", label: "장비몰", icon: ShoppingBag },
    { href: "/community", label: "커뮤니티", icon: MessageSquare },
    { href: "/recommend", label: "AI 맞춤추천", icon: Sparkles },
  ];

  const isRouteActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isCartActive = isRouteActive("/cart");
  const isMypageActive = isRouteActive("/mypage");

  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0A]/85 backdrop-blur-md border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] rounded-lg py-1 px-1 -ml-1"
          aria-label="FittersSweat 홈으로 이동"
        >
          <span className="text-2xl font-black italic tracking-tighter text-white group-hover:text-neutral-100 transition-colors">
            FITTER<span className="text-[#FFD700]">SWEAT</span>
          </span>
          <span className="text-[10px] uppercase font-black tracking-widest bg-[#FFD700] text-black px-1.5 py-0.5 rounded shadow-sm">
            HYROX
          </span>
        </Link>

        {/* Center: 4 Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-4 h-16">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isRouteActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative h-16 flex items-center space-x-1.5 px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] ${
                  active
                    ? "text-[#FFD700]"
                    : "text-[#A3A3A3] hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${active ? "text-[#FFD700]" : "text-[#A3A3A3]"}`} />
                <span>{link.label}</span>
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FFD700]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Cart & MyPage (Desktop & Mobile) */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* Cart Icon with Live Count Badge & Pulse Interaction */}
          <Link
            href="/cart"
            className={`relative min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] ${
              isCartActive
                ? "text-[#FFD700]"
                : "text-[#A3A3A3] hover:text-white"
            }`}
            aria-label={`장바구니 ${mounted && itemCount > 0 ? `(${itemCount}개 담김)` : "비어있음"}`}
          >
            <ShoppingCart className="w-5 h-5" />
            {mounted && itemCount > 0 && (
              <span
                data-testid="cart-badge"
                className={`absolute top-1 right-1 bg-[#FFD700] text-black font-black text-xs px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center pointer-events-none transition-transform duration-150 ${
                  isPulsing ? "scale-125" : "scale-100"
                }`}
              >
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          {/* Desktop Auth State & MyPage Link */}
          {mounted && (
            isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  href="/mypage"
                  className={`flex items-center space-x-1.5 min-h-[44px] px-3.5 py-2 rounded-full border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] ${
                    isMypageActive
                      ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10"
                      : "border-[#333333] text-neutral-200 hover:border-[#FFD700] hover:text-[#FFD700]"
                  }`}
                >
                  <User className="w-4 h-4 text-[#FFD700]" />
                  <span className="font-bold">{user?.name || '러너'}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => logout()}
                  className="min-h-[44px] px-3 py-2 text-xs font-medium text-neutral-400 hover:text-rose-400 transition-colors flex items-center space-x-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  aria-label="로그아웃"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>로그아웃</span>
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true, 'login')}
                  className="min-h-[44px] px-3.5 py-2 rounded-full border border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black transition-all text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-[#FFD700]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>로그인 / 회원가입</span>
                </button>
              </div>
            )
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-lg text-[#A3A3A3] hover:text-white hover:bg-[#1F1F1F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
            aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden border-t border-[#262626] bg-[#0A0A0A]/95 backdrop-blur-md px-4 pt-2 pb-6 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isRouteActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[#1F1F1F] text-[#FFD700] border-l-2 border-[#FFD700]"
                      : "text-[#A3A3A3] hover:text-white hover:bg-[#141414]"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-[#FFD700]" : "text-[#A3A3A3]"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#262626] flex flex-col space-y-1">
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
                isCartActive
                  ? "bg-[#1F1F1F] text-[#FFD700] border-l-2 border-[#FFD700]"
                  : "text-[#A3A3A3] hover:text-white hover:bg-[#141414]"
              }`}
            >
              <div className="flex items-center space-x-3">
                <ShoppingCart className={`w-5 h-5 ${isCartActive ? "text-[#FFD700]" : "text-[#A3A3A3]"}`} />
                <span>장바구니</span>
              </div>
              {mounted && itemCount > 0 && (
                <span className="bg-[#FFD700] text-black font-black text-xs px-2 py-0.5 rounded-full">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Auth Links */}
            {mounted && (
              isAuthenticated ? (
                <>
                  <div className="px-4 py-2 flex items-center space-x-3 text-xs text-neutral-400 bg-[#141414] rounded-xl border border-[#262626] my-1">
                    <div className="w-8 h-8 rounded-full bg-[#1F1F1F] border border-[#FFD700]/40 flex items-center justify-center font-black text-[#FFD700] text-sm shrink-0">
                      {(user?.name || 'R').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="truncate min-w-0">
                      <p className="font-bold text-white truncate">{user?.name || '러너'}</p>
                      <p className="text-[11px] text-[#8A8A8A] truncate">{user?.email}</p>
                    </div>
                  </div>

                  <Link
                    href="/mypage"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
                      isMypageActive
                        ? "bg-[#1F1F1F] text-[#FFD700] border-l-2 border-[#FFD700]"
                        : "text-[#A3A3A3] hover:text-white hover:bg-[#141414]"
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span>마이페이지</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>로그아웃</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalOpen(true, 'login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center space-x-2 px-4 py-3 min-h-[44px] rounded-xl text-sm font-bold bg-[#FFD700] hover:bg-yellow-400 text-black transition-colors w-full text-center my-1"
                >
                  <LogIn className="w-4 h-4" />
                  <span>로그인 / 회원가입</span>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
