'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  X,
  Mail,
  Lock,
  User,
  AlertCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  RotateCw,
  Loader2,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function AuthModal() {
  const { authModalOpen, authModalTab, setAuthModalOpen, login, signup } = useAuthStore();

  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email OTP verification state
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState<number>(300);

  const resetOtpState = () => {
    setIsSendingOtp(false);
    setIsOtpSent(false);
    setOtpCode('');
    setIsVerifyingOtp(false);
    setIsEmailVerified(false);
    setVerificationToken(null);
    setOtpTimer(300);
    setInfoMessage(null);
    setErrorMessage(null);
  };

  // Sync tab with store state when opened
  useEffect(() => {
    if (authModalOpen) {
      setTab(authModalTab);
      resetOtpState();
    }
  }, [authModalOpen, authModalTab]);

  // 5-minute countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOtpSent && !isEmailVerified && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && isOtpSent && !isEmailVerified) {
      setErrorMessage('인증번호 유효시간(5분)이 초과되었습니다. 재발송해 주세요.');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpSent, isEmailVerified, otpTimer]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
    resetOtpState();
    setAuthModalOpen(false);
  };

  const handleSendOtp = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('올바른 이메일 형식을 입력해 주세요 (예: runner@example.com).');
      return;
    }

    try {
      setIsSendingOtp(true);
      const res = await fetchApi<{ success: boolean; message: string }>(
        '/api/v1/auth/send-verification-email',
        {
          method: 'POST',
          body: JSON.stringify({ email: email.trim() }),
        }
      );
      setIsOtpSent(true);
      setOtpTimer(300);
      setInfoMessage(res.message || '인증번호가 발송되었습니다. 이메일을 확인해 주세요.');
    } catch (err: any) {
      setErrorMessage(err.message || '인증번호 발송에 실패했습니다.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMessage('6자리 인증번호를 정확히 입력해 주세요.');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const res = await fetchApi<{ success: boolean; verificationToken: string; message: string }>(
        '/api/v1/auth/verify-email-code',
        {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), code: otpCode.trim() }),
        }
      );

      setIsEmailVerified(true);
      setVerificationToken(res.verificationToken);
      setInfoMessage('이메일 인증이 완료되었습니다.');
    } catch (err: any) {
      setErrorMessage(err.message || '인증번호 확인에 실패했습니다.');
    } finally {
      setIsVerifyingOtp(false);
    }
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

    if (!isEmailVerified || !verificationToken) {
      setErrorMessage('이메일 인증번호 확인을 완료해 주세요.');
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
      await signup(email.trim(), password, name.trim(), verificationToken);
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

            {/* Info / Success Banner */}
            {infoMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{infoMessage}</span>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="signup-email" className="block text-xs font-semibold text-neutral-400">
                      이메일 <span className="text-rose-400">*</span>
                    </label>
                    {isEmailVerified && (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>인증 완료</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        id="signup-email"
                        name="email"
                        autoComplete="email"
                        value={email}
                        readOnly={isEmailVerified}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (isOtpSent) resetOtpState();
                        }}
                        placeholder="runner@example.com"
                        className={`w-full bg-neutral-900 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                          isEmailVerified
                            ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-200 cursor-not-allowed'
                            : 'border-neutral-700 focus:border-[#FFD700]'
                        }`}
                      />
                      <Mail className={`w-4 h-4 absolute left-3.5 top-3 pointer-events-none ${
                        isEmailVerified ? 'text-emerald-400' : 'text-neutral-500'
                      }`} />
                    </div>
                    {!isEmailVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || !email.trim()}
                        className="min-h-[42px] px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-[#FFD700] text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center space-x-1.5"
                      >
                        {isSendingOtp ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFD700]" />
                            <span>발송 중...</span>
                          </>
                        ) : isOtpSent ? (
                          <>
                            <RotateCw className="w-3.5 h-3.5 text-[#FFD700]" />
                            <span>재발송</span>
                          </>
                        ) : (
                          <span>인증번호 발송</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* 6-Digit OTP Verification Field */}
                {isOtpSent && !isEmailVerified && (
                  <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-300">인증 코드 6자리</span>
                      <span className="flex items-center space-x-1 text-[11px] font-mono font-bold text-[#FFD700]">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimer(otpTimer)}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="6자리 숫자"
                        className="flex-1 bg-black/60 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-center text-white tracking-[0.3em] font-mono font-bold focus:outline-none focus:border-[#FFD700] transition-colors"
                        aria-label="이메일 6자리 인증코드 입력"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || otpCode.length !== 6}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-[#FFD700] hover:bg-yellow-400 text-black text-xs font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center space-x-1"
                      >
                        {isVerifyingOtp ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                            <span>확인 중...</span>
                          </>
                        ) : (
                          <span>인증 확인</span>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      입력하신 이메일의 수신함(또는 스팸함)을 확인해 주세요.
                    </p>
                  </div>
                )}

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
