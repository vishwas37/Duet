import { X } from 'lucide-react';
import type { ToastItem } from '../types/duet';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map((toast) => {
        const toneClasses =
          toast.tone === 'terracotta'
            ? 'bg-[#FBF1EE] border-[#E8C5B8] text-[#8F432C]'
            : toast.tone === 'sage'
            ? 'bg-[#EEF3F0] border-[#C9DBD1] text-[#2B4639]'
            : 'bg-white border-[#EAE6DF] text-[#18181B]';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border shadow-sm text-sm ${toneClasses}`}
          >
            <span className="leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
