import { Copy, Mail, X } from 'lucide-react';
import type { DevOtpPreviewMessage } from '../lib/emailOtpService';

interface DevOtpInboxDrawerProps {
  preview: DevOtpPreviewMessage | null;
  onClose: () => void;
  onQuickFill: (code: string) => void;
}

export function DevOtpInboxDrawer({
  preview,
  onClose,
  onQuickFill,
}: DevOtpInboxDrawerProps) {
  if (!preview) return null;

  return (
    <aside
      aria-label="Dev Email Inbox Preview"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[380px] z-50 bg-white border border-[#EAE6DF] rounded-3xl shadow-lg p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#EEF3F0] text-[#3F6251] flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#3F6251]">Dev Email Inbox Preview</p>
            <p className="text-xs text-[#71717A] truncate max-w-[230px]">
              To: {preview.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close email inbox preview"
          className="p-1.5 rounded-full text-[#71717A] hover:text-[#18181B] hover:bg-[#FAF9F6]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-[#71717A] leading-relaxed mb-3">
        No external SMTP endpoint is configured yet, so your 6-digit passwordless verification code is previewed here.
      </p>

      <div className="flex items-center justify-between gap-3 bg-[#FAF9F6] border border-[#EAE6DF] rounded-2xl px-4 py-3 mb-3">
        <span
          data-testid="dev-otp-code"
          className="font-mono text-2xl font-semibold tracking-[0.28em] text-[#18181B] tabular-nums"
        >
          {preview.code}
        </span>
        <button
          type="button"
          onClick={() => onQuickFill(preview.code)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3F6251] text-white text-xs font-medium hover:bg-[#345143] transition-colors whitespace-nowrap shrink-0"
        >
          <Copy className="w-3.5 h-3.5" />
          Auto-fill
        </button>
      </div>

      <p className="text-[11px] text-[#71717A]">
        Expires in 10 minutes · Set <code className="font-mono">VITE_EMAIL_OTP_ENDPOINT</code> for Resend email delivery.
      </p>
    </aside>
  );
}
