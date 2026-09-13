'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/useAuthStore';
import { X, AlertTriangle, Lock, Trash2 } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const router = useRouter();
  const { deleteAccount } = useAuthStore();

  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password) {
      setErrorMessage('계정 비밀번호를 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await deleteAccount(password);
      onClose();
      router.push('/');
    } catch (err: any) {
      setErrorMessage(err.message || '비밀번호가 일치하지 않거나 회원 탈퇴 처리에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#141414] border border-rose-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl z-10"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Warning Icon */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 id="delete-account-title" className="text-xl font-black text-white tracking-tight">
                  회원 탈퇴 확인
                </h2>
                <p className="text-xs text-rose-400 font-semibold">
                  되돌릴 수 없는 작업입니다
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="mb-6 p-4 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs text-neutral-300 space-y-1.5 leading-relaxed">
              <p className="font-bold text-rose-300">⚠️ 탈퇴 전 유의사항:</p>
              <ul className="list-disc list-inside space-y-1 text-neutral-400">
                <li>현재까지의 주문 내역 및 결제 데이터가 삭제됩니다.</li>
                <li>작성하신 모든 완주 후기 및 댓글이 함께 삭제됩니다.</li>
                <li>탈퇴 후에는 동일한 이메일로 다시 가입하더라도 기존 데이터가 복구되지 않습니다.</li>
              </ul>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs"
              >
                {errorMessage}
              </div>
            )}

            {/* Confirmation Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="delete-confirm-password"
                  className="block text-xs font-semibold text-neutral-300 mb-1.5"
                >
                  본인 확인을 위해 현재 비밀번호를 입력해 주세요.
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="delete-confirm-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 min-h-[44px] rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-semibold text-sm transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !password}
                  className="flex-1 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-sm transition-all shadow-md shadow-rose-600/20 flex items-center justify-center space-x-1.5 active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>탈퇴 확정</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
