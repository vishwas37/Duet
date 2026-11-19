import { useState } from 'react';
import { Heart, Lock, X } from 'lucide-react';
import type { UserProfile } from '../../types/duet';
import type { LikeTargetSelection } from '../ProfileCardContent';
import { EditorialPhoto } from '../EditorialPhoto';

interface LikeNoteModalProps {
  profile: UserProfile;
  target: LikeTargetSelection;
  onClose: () => void;
  onSubmit: (note: string) => void;
}

export function LikeNoteModal({
  profile,
  target,
  onClose,
  onSubmit,
}: LikeNoteModalProps) {
  const [note, setNote] = useState('');
  const allowsNotes = profile.safetySettings.allowNotesBeforeMatch;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Send like to ${profile.displayName}`}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/45 backdrop-blur-xs p-0 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-[#EAE6DF] rounded-t-[2rem] md:rounded-[2rem] p-6 md:p-7 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-[#E5E0D8] rounded-full mx-auto mb-4 md:hidden" />

        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs text-[#71717A]">Sending a like to</p>
            <h2 className="font-serif text-3xl text-[#18181B]">
              {profile.displayName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close like modal"
            className="min-w-[40px] min-h-[40px] rounded-full hover:bg-[#FAF9F6] flex items-center justify-center text-[#71717A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compact preview of the exact photo or prompt liked */}
        <div className="bg-[#FAF9F6] border border-[#EAE6DF] rounded-2xl p-4 mb-5">
          {target.targetElementType === 'photo' && target.photoItem ? (
            <div className="flex items-center gap-4">
              <div className="w-20 shrink-0 rounded-xl overflow-hidden">
                <EditorialPhoto
                  photo={target.photoItem}
                  displayName={profile.displayName}
                  city={profile.city}
                  aspectClass="aspect-[3/4]"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#3F6251]">
                  {target.targetElementQuestion || 'Selected photo'}
                </p>
                <p className="text-sm text-[#52525B] mt-1 line-clamp-3">
                  {target.photoItem.caption || `Liked this portrait from ${profile.displayName}'s gallery.`}
                </p>
              </div>
            </div>
          ) : (
            <div>
              {target.targetElementQuestion && (
                <p className="text-xs text-[#71717A] mb-1.5">
                  {target.targetElementQuestion}
                </p>
              )}
              <p className="font-serif text-xl text-[#18181B] leading-snug">
                “{target.targetElementPreview}”
              </p>
            </div>
          )}
        </div>

        {/* Consent-respecting opening note input */}
        {allowsNotes ? (
          <div className="mb-6">
            <label
              htmlFor="like-note-input"
              className="block text-xs font-medium text-[#52525B] mb-2"
            >
              Add a thoughtful comment (optional)
            </label>
            <textarea
              id="like-note-input"
              rows={3}
              maxLength={280}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Respond to ${profile.displayName}'s ${
                target.targetElementType === 'photo' ? 'photo' : 'prompt'
              }...`}
              className="w-full rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] px-4 py-3 text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#3F6251] resize-none"
            />
            <div className="mt-1.5 flex justify-end">
              <span className="text-[11px] text-[#71717A] tabular-nums">
                {note.length}/280
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-[#F6F1F6] border border-[#E5D9E6] text-xs text-[#583C59]">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {profile.displayName} prefers receiving messages only after a mutual match. You can still send a quiet like on this{' '}
              {target.targetElementType}.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-5 rounded-full border border-[#EAE6DF] text-sm font-medium text-[#52525B] hover:bg-[#FAF9F6] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(allowsNotes ? note.trim() : '')}
            className="flex-[1.6] inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143] transition-colors"
          >
            <Heart className="w-4 h-4" />
            {note.trim() && allowsNotes ? 'Send Like & Note' : 'Send Like'}
          </button>
        </div>
      </div>
    </div>
  );
}
