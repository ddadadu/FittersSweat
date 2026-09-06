'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, ShoppingBag, MessageSquare, Sparkles, User, ShoppingCart } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/events', label: '대회 일정', icon: Trophy },
    { href: '/products', label: '직매입 장비', icon: ShoppingBag },
    { href: '/community', label: '커뮤니티', icon: MessageSquare },
    { href: '/search', label: 'AI 맞춤추천', icon: Sparkles, highlight: true },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#121212]/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-black italic tracking-tighter text-white">
            FITTER<span className="text-[#FFD700]">SWEAT</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest bg-[#FFD700] text-black px-1.5 py-0.5 rounded">
            HYROX
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'text-[#FFD700]'
                    : link.highlight
                    ? 'text-yellow-400 hover:text-[#FFD700]'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center space-x-4">
          <Link
            href="/cart"
            className="p-2 text-neutral-300 hover:text-[#FFD700] transition-colors relative"
            title="장바구니"
          >
            <ShoppingCart className="w-5 h-5" />
          </Link>
          <Link
            href="/mypage"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-neutral-700 text-xs font-semibold text-neutral-200 hover:border-[#FFD700] hover:text-[#FFD700] transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>내 계정</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
