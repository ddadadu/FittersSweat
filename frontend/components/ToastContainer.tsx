'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '@/stores/useToastStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          const isError = toast.type === 'error';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start space-x-2.5 p-4 rounded-xl border shadow-2xl backdrop-blur-md bg-[#141414]/95 text-white ${
                isSuccess
                  ? 'border-emerald-500/40'
                  : isWarning
                  ? 'border-[#FFD700]/60'
                  : isError
                  ? 'border-rose-500/50'
                  : 'border-neutral-700'
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-[#FFD700] shrink-0 mt-0.5" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
              {!isSuccess && !isWarning && !isError && (
                <Info className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
              )}

              <div className="flex-1 text-xs sm:text-sm font-medium leading-snug break-keep">
                {toast.message}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-neutral-400 hover:text-white transition-colors p-0.5 rounded"
                aria-label="알림 닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
