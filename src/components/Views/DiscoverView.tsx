import { useState } from 'react';
import { RefreshCw, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import type {
  DiscoveryPreferences,
  ReportReason,
  UserProfile,
} from '../../types/duet';
import {
  ProfileCardContent,
  type LikeTargetSelection,
} from '../ProfileCardContent';
import { LikeNoteModal } from '../Modals/LikeNoteModal';
import { SafetyModal } from '../Modals/SafetyModal';

interface DiscoverViewProps {
  currentUser: UserProfile;
  queue: UserProfile[];
  filters: DiscoveryPreferences;
  canUndoPass: boolean;
  onPass: (profile: UserProfile) => void;
  onUndoPass: () => void;
  onSendLike: (
    profile: UserProfile,
    target: LikeTargetSelection,
    note: string
  ) => void;
  onBlock: (profile: UserProfile) => void;
  onReport: (
    profile: UserProfile,
    reason: ReportReason,
    details: string,
    alsoBlock: boolean
  ) => void;
  onOpenFilters: () => void;
  onResetFilters: () => void;
  onResetSampleQueue: () => void;
}

export function DiscoverView({
  currentUser,
  queue,
  filters,
  canUndoPass,
  onPass,
  onUndoPass,
  onSendLike,
  onBlock,
  onReport,
  onOpenFilters,
  onResetFilters,
  onResetSampleQueue,
}: DiscoverViewProps) {
  const [likeModalTarget, setLikeModalTarget] = useState<LikeTargetSelection | null>(
    null
  );
  const [safetyOpen, setSafetyOpen] = useState(false);

  const activeProfile = queue[0] ?? null;

  const activeFilterChips: string[] = [];
  if (filters.cities.length > 0) {
    activeFilterChips.push(filters.cities.join(', '));
  }
  if (!filters.interestedInGenders.includes('Everyone')) {
    activeFilterChips.push(filters.interestedInGenders.join(', '));
  }
  if (filters.prioritizeQueerCommunity) {
    activeFilterChips.push('Queer Community Priority');
  }
  if (filters.relationshipStyles && filters.relationshipStyles.length > 0) {
    activeFilterChips.push(filters.relationshipStyles.join(', '));
  }

  if (!activeProfile) {
    return (
      <div className="max-w-xl mx-auto px-5 py-16 text-center">
        <div className="bg-white border border-[#EAE6DF] rounded-[2rem] p-9 space-y-5">
          <p className="text-xs font-medium text-[#3F6251]">Discover Queue</p>
          <h1 className="font-serif text-4xl text-[#18181B]">
            You’ve seen every match in this view.
          </h1>
          <p className="text-sm text-[#71717A] leading-relaxed">
            Widen your city or age filters, undo a recent pass, or revisit sample profiles while new intentionally childfree members join.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {canUndoPass && (
              <button
                type="button"
                onClick={onUndoPass}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#FAF9F6] border border-[#EAE6DF] text-sm font-medium text-[#18181B] hover:border-[#3F6251]"
              >
                <RotateCcw className="w-4 h-4" />
                Undo last pass
              </button>
            )}
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143]"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Reset filters
            </button>
            <button
              type="button"
              onClick={onResetSampleQueue}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-[#EAE6DF] text-sm font-medium text-[#52525B] hover:border-[#3F6251]"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-28 md:pb-16">
      {currentUser.safetySettings.pauseProfile && (
        <div className="mb-6 px-5 py-3.5 rounded-2xl bg-[#FBF1EE] border border-[#E8C5B8] text-xs text-[#8F432C] flex items-center justify-between gap-4">
          <span>
            Your profile is currently paused. You can still browse or chat with existing connections.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Hinge-style Vertical Editorial Profile */}
        <div className="lg:col-span-8">
          <ProfileCardContent
            key={activeProfile.uid}
            profile={activeProfile}
            viewerValues={currentUser.valuesAndLifestyle}
            interactive
            onLikeTarget={(target) => setLikeModalTarget(target)}
            onOpenSafetyMenu={() => setSafetyOpen(true)}
          />
        </div>

        {/* Desktop Companion Column: Pass, Undo & Filter Summary */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-5">
          <div className="bg-white border border-[#EAE6DF] rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#71717A]">Intentional Pace</p>
              <span className="text-xs text-[#3F6251] tabular-nums font-medium">
                {queue.length} in queue
              </span>
            </div>
            <p className="text-sm text-[#52525B] leading-relaxed">
              Tap the heart on any specific photo or prompt on{' '}
              <span className="text-[#18181B] font-medium">
                {activeProfile.displayName}’s
              </span>{' '}
              profile to send a thoughtful like or note.
            </p>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => onPass(activeProfile)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full border border-[#EAE6DF] bg-[#FAF9F6] text-sm font-medium text-[#18181B] hover:border-[#C86D51] hover:text-[#C86D51] transition-colors"
              >
                <X className="w-4 h-4" />
                Pass on {activeProfile.displayName}
              </button>

              {canUndoPass && (
                <button
                  type="button"
                  onClick={onUndoPass}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-full border border-[#EAE6DF] bg-white text-xs font-medium text-[#52525B] hover:text-[#18181B] hover:border-[#3F6251] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Undo last pass
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#EAE6DF] rounded-[2rem] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#71717A]">Active Preferences</p>
              <button
                type="button"
                onClick={onOpenFilters}
                className="text-xs font-medium text-[#3F6251] hover:underline"
              >
                Adjust
              </button>
            </div>
            <p className="text-xs text-[#52525B] leading-relaxed">
              Ages {filters.ageMin}–{filters.ageMax}
              {activeFilterChips.length > 0
                ? ` · ${activeFilterChips.join(' · ')}`
                : ' · All cities · Everyone'}
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile Floating Bottom-Left Pass & Undo Controls */}
      <div className="lg:hidden fixed bottom-[76px] left-4 z-30 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onPass(activeProfile)}
          aria-label={`Pass on ${activeProfile.displayName}`}
          className="w-14 h-14 rounded-full bg-white border border-[#EAE6DF] shadow-lg flex items-center justify-center text-[#18181B] hover:text-[#C86D51] active:scale-95 transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        {canUndoPass && (
          <button
            type="button"
            onClick={onUndoPass}
            aria-label="Undo last pass"
            className="h-11 px-4 rounded-full bg-white/95 backdrop-blur-sm border border-[#EAE6DF] shadow-md inline-flex items-center gap-1.5 text-xs font-medium text-[#52525B]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Undo
          </button>
        )}
      </div>

      {likeModalTarget && (
        <LikeNoteModal
          profile={activeProfile}
          target={likeModalTarget}
          onClose={() => setLikeModalTarget(null)}
          onSubmit={(note) => {
            onSendLike(activeProfile, likeModalTarget, note);
            setLikeModalTarget(null);
          }}
        />
      )}

      {safetyOpen && (
        <SafetyModal
          profile={activeProfile}
          onClose={() => setSafetyOpen(false)}
          onBlock={() => {
            onBlock(activeProfile);
            setSafetyOpen(false);
          }}
          onReport={(reason, details, alsoBlock) => {
            onReport(activeProfile, reason, details, alsoBlock);
            setSafetyOpen(false);
          }}
        />
      )}
    </div>
  );
}
