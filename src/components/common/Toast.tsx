import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-18 md:bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200 ${
              isSuccess
                ? 'bg-emerald-500/95 text-white border-emerald-400'
                : isError
                ? 'bg-rose-500/95 text-white border-rose-400'
                : 'bg-slate-900/95 dark:bg-slate-800/95 text-white border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 shrink-0" />}
              {isError && <AlertCircle className="w-5 h-5 shrink-0" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 shrink-0 text-blue-400" />}
              <span className="text-sm font-medium leading-snug break-words">{toast.message}</span>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const Toast = ToastContainer;
