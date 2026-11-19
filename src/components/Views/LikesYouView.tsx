import { Heart, MessageSquareQuote, ShieldCheck, X } from 'lucide-react';
import type { LikeInteraction, UserProfile } from '../../types/duet';
import { formatRelativeTime } from '../../utils/matching';
import { EditorialPhoto } from '../EditorialPhoto';

interface LikesYouViewProps {
  incomingLikes: { like: LikeInteraction; sender: UserProfile }[];
  onMatch: (like: LikeInteraction, sender: UserProfile) => void;
  onDismiss: (like: LikeInteraction, sender: UserProfile) => void;
  onGoToDiscover: () => void;
}

export function LikesYouView({
  incomingLikes,
  onMatch,
  onDismiss,
  onGoToDiscover,
}: LikesYouViewProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24 md:pb-16">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#3F6251] mb-1.5">
            Intentional Queue
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#18181B]">
            Likes You
          </h1>
        </div>
        <p className="text-sm text-[#71717A]">
          See exactly which photo or prompt sparked someone’s interest before you match.
        </p>
      </header>

      {incomingLikes.length === 0 ? (
        <div className="max-w-lg bg-white border border-[#EAE6DF] rounded-[2rem] p-9 space-y-4">
          <h2 className="font-serif text-3xl text-[#18181B]">
            Your queue is calm right now.
          </h2>
          <p className="text-sm text-[#71717A] leading-relaxed">
            When someone likes one of your photos or leaves a thoughtful note on a prompt, it will appear right here.
          </p>
          <button
            type="button"
            onClick={onGoToDiscover}
            className="inline-flex items-center px-6 py-3 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143] transition-colors"
          >
            Explore Discover
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {incomingLikes.map(({ like, sender }) => {
            const coverPhoto = [...sender.photos].sort((a, b) => a.order - b.order)[0];
            return (
              <article
                key={like.id}
                className="bg-white border border-[#EAE6DF] rounded-[2rem] overflow-hidden flex flex-col justify-between shadow-[0_2px_20px_rgba(24,24,27,0.03)]"
              >
                <div>
                  {/* Highlighted Target Element + Opening Note */}
                  <div className="p-6 bg-[#FBF1EE]/65 border-b border-[#EFE3DC] space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-[#C86D51] inline-flex items-center gap-1.5">
                        <MessageSquareQuote className="w-3.5 h-3.5" />
                        Liked your {like.targetElementType || 'profile'}
                        {like.targetElementQuestion
                          ? ` · ${like.targetElementQuestion}`
                          : ''}
                      </span>
                      <span className="text-[#71717A] tabular-nums">
                        {formatRelativeTime(like.createdAt)}
                      </span>
                    </div>

                    {like.targetElementType === 'prompt' && like.targetElementPreview && (
                      <p className="text-xs text-[#52525B] italic line-clamp-2">
                        “{like.targetElementPreview}”
                      </p>
                    )}

                    {like.note && (
                      <p className="font-serif text-2xl leading-snug text-[#18181B]">
                        “{like.note}”
                      </p>
                    )}
                  </div>

                  {/* Sender Snapshot */}
                  <div className="p-6 flex items-center gap-4">
                    {coverPhoto && (
                      <div className="w-20 shrink-0 rounded-2xl overflow-hidden border border-[#EAE6DF]">
                        <EditorialPhoto
                          photo={coverPhoto}
                          displayName={sender.displayName}
                          city={sender.city}
                          aspectClass="aspect-[3/4]"
                        />
                      </div>
                    )}

                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h2 className="font-serif text-3xl leading-none text-[#18181B]">
                          {sender.displayName}, <span className="tabular-nums">{sender.age}</span>
                        </h2>
                        {sender.pronouns.length > 0 && (
                          <span className="text-xs font-medium text-[#6D4C6E]">
                            {sender.pronouns.join(' · ')}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#71717A]">
                        {sender.city}
                        {sender.workOrCraft ? ` · ${sender.workOrCraft}` : ''}
                      </p>

                      <p className="inline-flex items-center gap-1 text-xs font-medium text-[#3F6251]">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        {sender.childfreeStanceBadge}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Clear Actions: Dismiss or Match & Start Chat */}
                <div className="px-6 pb-6 pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onDismiss(like, sender)}
                    aria-label={`Dismiss like from ${sender.displayName}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-full border border-[#EAE6DF] bg-[#FAF9F6] text-sm font-medium text-[#52525B] hover:border-[#C86D51] hover:text-[#C86D51] transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => onMatch(like, sender)}
                    aria-label={`Match and start chat with ${sender.displayName}`}
                    className="flex-[1.6] inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143] transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    Match &amp; Start Chat
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
