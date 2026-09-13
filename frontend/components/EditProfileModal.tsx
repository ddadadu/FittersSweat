'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/useAuthStore';
import { X, User, Lock, AlertCircle, CheckCircle2, Save } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName?: string;
  currentEmail?: string;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  currentName = '',
  currentEmail = '',
}: EditProfileModalProps) {
  const { updateProfile } = useAuthStore();

  const [name, setName] = useState(currentName);
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, currentName]);

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
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('이름을 입력해 주세요.');
      return;
    }

    if (changePassword) {
      if (!currentPassword) {
        setErrorMessage('현재 비밀번호를 입력해 주세요.');
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setErrorMessage('새 비밀번호는 최소 6자 이상이어야 합니다.');
        return;
      }
      if (newPassword !== newPasswordConfirm) {
        setErrorMessage('새 비밀번호가 일치하지 않습니다.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await updateProfile({
        name: name.trim(),
        ...(changePassword ? { currentPassword, newPassword } : {}),
      });

      setSuccessMessage('회원 정보가 성공적으로 변경되었습니다.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || '회원 정보 수정 중 오류가 발생했습니다.');
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
            aria-labelledby="edit-profile-title"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-7 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 id="edit-profile-title" className="text-xl font-black text-white tracking-tight">
                내 정보 수정
              </h2>
              <p className="text-xs text-[#A3A3A3] mt-1">
                프로필 이름 및 계정 비밀번호를 변경할 수 있습니다.
              </p>
            </div>

            {/* Feedback Alerts */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                  이메일 (변경 불가)
                </label>
                <input
                  type="email"
                  disabled
                  value={currentEmail}
                  className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-4 py-2.5 text-sm text-neutral-400 cursor-not-allowed opacity-75"
                />
              </div>

              {/* Name */}
              <div>
                <label htmlFor="edit-name" className="block text-xs font-semibold text-neutral-400 mb-1.5">
                  이름 <span className="text-[#FFD700]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름 입력"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                  />
                  <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Password Change Toggle */}
              <div className="pt-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setChangePassword(!changePassword)}
                  className="text-xs font-bold text-[#FFD700] hover:underline flex items-center space-x-1.5 py-1"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{changePassword ? '비밀번호 변경 취소' : '비밀번호 변경하기'}</span>
                </button>
              </div>

              {/* Password Fields */}
              {changePassword && (
                <div className="space-y-3 pt-2 bg-[#1A1A1A] p-4 rounded-xl border border-[#262626]">
                  <div>
                    <label
                      htmlFor="edit-current-password"
                      className="block text-xs font-semibold text-neutral-400 mb-1.5"
                    >
                      현재 비밀번호 <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      id="edit-current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="현재 비밀번호 입력"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-new-password"
                      className="block text-xs font-semibold text-neutral-400 mb-1.5"
                    >
                      새 비밀번호 <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      id="edit-new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="6자 이상 입력"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-new-password-confirm"
                      className="block text-xs font-semibold text-neutral-400 mb-1.5"
                    >
                      새 비밀번호 확인 <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      id="edit-new-password-confirm"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      placeholder="새 비밀번호 다시 입력"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-colors"
                    />
                  </div>
                </div>
              )}

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
                  disabled={isSubmitting}
                  className="flex-1 min-h-[44px] rounded-xl bg-[#FFD700] hover:bg-yellow-400 disabled:opacity-50 text-black font-black text-sm transition-all shadow-md shadow-yellow-500/15 flex items-center justify-center space-x-1.5 active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>저장하기</span>
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
