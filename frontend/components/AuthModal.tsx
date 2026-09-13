'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/useAuthStore';
import { X, Mail, Lock, User, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export default function AuthModal() {
  const { authModalOpen, authModalTab, setAuthModalOpen, login, signup } = useAuthStore();

  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync tab with store state when opened
  useEffect(() => {
    if (authModalOpen) {
      setTab(authModalTab);
      setErrorMessage(null);
    }
  }, [authModalOpen, authModalTab]);

  // Lock body scroll when modal is open and handle Escape key
  useEffect(() => {
    if (!authModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAuthModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [authModalOpen, setAuthModalOpen]);

  const handleClose = () => {
    setErrorMessage(null);
    setAuthModalOpen(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('이메일을 입력해 주세요.');
      return;
    }
    if (!password) {
      setErrorMessage('비밀번호를 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email.trim(), password);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || '이메일 또는 비밀번호가 일치하지 않습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('이름을 입력해 주세요.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('이메일을 입력해 주세요.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('올바른 이메일 형식을 입력해 주세요 (예: runner@example.com).');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      await signup(email.trim(), password, name.trim());
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || '회원가입 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className="relative w-full max-w-md bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden"
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD700] via-yellow-400 to-[#FFD700]" />

            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between pb-5 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#FFD700]" />
                <h2 id="auth-modal-title" className="text-lg font-black text-white italic tracking-tight">
                  FITTER<span className="text-[#FFD700]">SWEAT</span> AUTH
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="닫기"
                className="w-10 h-10 -mr-2 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Toggle */}
            <div className="flex p-1 mt-5 mb-6 bg-neutral-900 border border-neutral-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMessage(null);
                }}
                className={`flex-1 min-h-[40px] rounded-lg text-xs font-black transition-all flex items-center justify-center ${
                  tab === 'login'
                    ? 'bg-[#FFD700] text-black shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('signup');
                  setErrorMessage(null);
                }}
                className={`flex-1 min-h-[40px] rounded-lg text-xs font-black transition-all flex items-center justify-center ${
                  tab === 'signup'
                    ? 'bg-[#FFD700] text-black shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                회원가입
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Form Content */}
            {tab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    이메일 <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="login-email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="runner@example.com"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                    />
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    비밀번호 <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="login-password"
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호 입력"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                    />
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] mt-2 rounded-xl bg-[#FFD700] hover:bg-yellow-400 disabled:opacity-50 text-black font-black text-sm transition-all shadow-lg shadow-yellow-500/15 flex items-center justify-center space-x-2 active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>로그인 중...</span>
                    </div>
                  ) : (
                    <>
                      <span>로그인</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <p className="text-xs text-neutral-400">
                    아직 FittersSweat 회원이 아니신가요?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setTab('signup');
                        setErrorMessage(null);
                      }}
                      className="text-[#FFD700] font-bold hover:underline ml-1"
                    >
                      회원가입하기
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <label htmlFor="signup-name" className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    이름 <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="signup-name"
                      name="name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="성명 입력 (예: 홍길동)"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                    />
                    <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    이메일 <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="signup-email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="runner@example.com"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                    />
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    비밀번호 <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="signup-password"
                      name="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="6자 이상 입력"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                    />
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-password-confirm" className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    비밀번호 확인 <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="signup-password-confirm"
                      name="passwordConfirm"
                      autoComplete="new-password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="비밀번호 다시 입력"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                    />
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] mt-2 rounded-xl bg-[#FFD700] hover:bg-yellow-400 disabled:opacity-50 text-black font-black text-sm transition-all shadow-lg shadow-yellow-500/15 flex items-center justify-center space-x-2 active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>회원가입 처리 중...</span>
                    </div>
                  ) : (
                    <>
                      <span>회원가입 완료</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <p className="text-xs text-neutral-400">
                    이미 계정이 있으신가요?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setTab('login');
                        setErrorMessage(null);
                      }}
                      className="text-[#FFD700] font-bold hover:underline ml-1"
                    >
                      로그인하기
                    </button>
                  </p>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
