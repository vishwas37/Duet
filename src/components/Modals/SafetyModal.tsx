import { useState } from 'react';
import { Ban, Flag, ShieldAlert, UserMinus, X } from 'lucide-react';
import type { ReportReason, UserProfile } from '../../types/duet';
import { REPORT_REASONS } from '../../data/constants';

interface SafetyModalProps {
  profile: UserProfile;
  showUnmatch?: boolean;
  onClose: () => void;
  onBlock: () => void;
  onUnmatch?: () => void;
  onReport: (reason: ReportReason, details: string, alsoBlock: boolean) => void;
}

export function SafetyModal({
  profile,
  showUnmatch = false,
  onClose,
  onBlock,
  onUnmatch,
  onReport,
}: SafetyModalProps) {
  const [mode, setMode] = useState<'menu' | 'report'>('menu');
  const [selectedReason, setSelectedReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Safety controls for ${profile.displayName}`}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/45 backdrop-blur-xs p-0 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white border border-[#EAE6DF] rounded-t-[2rem] md:rounded-[2rem] p-6 md:p-7 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#C86D51]" />
            <h2 className="font-serif text-2xl text-[#18181B]">
              {mode === 'menu' ? `Safety · ${profile.displayName}` : 'Report Boundary Violation'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close safety menu"
            className="min-w-[40px] min-h-[40px] rounded-full hover:bg-[#FAF9F6] flex items-center justify-center text-[#71717A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'menu' ? (
          <div className="space-y-3">
            <p className="text-sm text-[#71717A] leading-relaxed mb-4">
              Duet enforces zero tolerance for childfree pressure, misogyny, queerphobia, transphobia, or boundary violations. Actions are confidential.
            </p>

            {showUnmatch && onUnmatch && (
              <button
                type="button"
                onClick={onUnmatch}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-[#EAE6DF] hover:bg-[#FAF9F6] text-left transition-colors"
              >
                <UserMinus className="w-4 h-4 text-[#52525B]" />
                <div>
                  <p className="text-sm font-medium text-[#18181B]">Unmatch {profile.displayName}</p>
                  <p className="text-xs text-[#71717A]">Ends this conversation immediately.</p>
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={onBlock}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-[#EAE6DF] hover:bg-[#FBF1EE] hover:border-[#E8C5B8] text-left transition-colors"
            >
              <Ban className="w-4 h-4 text-[#C86D51]" />
              <div>
                <p className="text-sm font-medium text-[#18181B]">Block &amp; Hide</p>
                <p className="text-xs text-[#71717A]">
                  Removes {profile.displayName} immediately from Discover, Likes You, and Matches.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('report')}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-[#E8C5B8] bg-[#FBF1EE]/60 hover:bg-[#FBF1EE] text-left transition-colors"
            >
              <Flag className="w-4 h-4 text-[#C86D51]" />
              <div>
                <p className="text-sm font-medium text-[#8F432C]">Report {profile.displayName}</p>
                <p className="text-xs text-[#9C5742]">
                  Flag misrepresented childfree status, pressure, sexism, or harassment.
                </p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-[#71717A] mb-2">
                Select a reason
              </legend>
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                    selectedReason === reason
                      ? 'bg-[#FBF1EE] border-[#C86D51] text-[#18181B]'
                      : 'bg-[#FAF9F6] border-[#EAE6DF] text-[#52525B]'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="mt-0.5 accent-[#C86D51]"
                  />
                  <span className="text-sm leading-snug">{reason}</span>
                </label>
              ))}
            </fieldset>

            <div>
              <label
                htmlFor="report-details"
                className="block text-xs font-medium text-[#71717A] mb-1.5"
              >
                Additional context (optional)
              </label>
              <textarea
                id="report-details"
                rows={3}
                maxLength={500}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Share anything our safety team should know..."
                className="w-full rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] px-4 py-3 text-sm text-[#18181B] focus:outline-none focus:border-[#C86D51] resize-none"
              />
            </div>

            <label className="flex items-center gap-2.5 text-sm text-[#18181B] cursor-pointer">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="w-4 h-4 accent-[#3F6251]"
              />
              Also block and hide {profile.displayName} immediately
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('menu')}
                className="flex-1 py-3 rounded-full border border-[#EAE6DF] text-sm font-medium text-[#52525B] hover:bg-[#FAF9F6]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => onReport(selectedReason, details, alsoBlock)}
                className="flex-[1.5] py-3 rounded-full bg-[#C86D51] text-white text-sm font-medium hover:bg-[#B45E43] transition-colors"
              >
                Submit Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
