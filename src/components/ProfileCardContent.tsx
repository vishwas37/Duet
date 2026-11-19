import { Heart, MoreHorizontal, ShieldCheck } from 'lucide-react';
import type { PhotoItem, PromptItem, TargetElementType, UserProfile } from '../types/duet';
import { getSharedValues } from '../utils/matching';
import { EditorialPhoto } from './EditorialPhoto';

export interface LikeTargetSelection {
  targetElementType: TargetElementType;
  targetElementId: string;
  targetElementPreview: string;
  targetElementQuestion?: string;
  photoItem?: PhotoItem;
}

interface ProfileCardContentProps {
  profile: UserProfile;
  viewerValues?: string[];
  interactive?: boolean;
  onLikeTarget?: (target: LikeTargetSelection) => void;
  onOpenSafetyMenu?: () => void;
}

export function ProfileCardContent({
  profile,
  viewerValues = [],
  interactive = true,
  onLikeTarget,
  onOpenSafetyMenu,
}: ProfileCardContentProps) {
  const sharedValues = new Set(getSharedValues(viewerValues, profile.valuesAndLifestyle));

  const sortedPhotos = [...profile.photos].sort((a, b) => a.order - b.order);
  const prompts = profile.prompts;

  const vitals: string[] = [];
  if (profile.showGender && profile.genders.length > 0) {
    vitals.push(profile.genders.join(' / '));
  }
  if (profile.showOrientation && profile.orientations.length > 0) {
    vitals.push(profile.orientations.join(' / '));
  }
  if (profile.relationshipStyles.length > 0) {
    vitals.push(profile.relationshipStyles.join(' · '));
  }
  if (profile.workOrCraft) {
    vitals.push(profile.workOrCraft);
  }
  if (profile.hometown) {
    vitals.push(`From ${profile.hometown}`);
  }

  const renderPhotoCard = (photo: PhotoItem, index: number) => (
    <article
      key={photo.id}
      className="bg-white border border-[#EAE6DF] rounded-[2rem] overflow-hidden shadow-[0_2px_20px_rgba(24,24,27,0.03)]"
    >
      {photo.promptLabel && (
        <div className="px-6 pt-5 pb-3 border-b border-[#F2EFEA]">
          <p className="text-xs font-medium text-[#71717A]">{photo.promptLabel}</p>
        </div>
      )}
      <div className="relative">
        <EditorialPhoto
          photo={photo}
          displayName={profile.displayName}
          city={profile.city}
          aspectClass={index === 0 ? 'aspect-[4/5] md:aspect-[4/4.2]' : 'aspect-[4/4.3]'}
        />
        {interactive && onLikeTarget && (
          <button
            type="button"
            onClick={() =>
              onLikeTarget({
                targetElementType: 'photo',
                targetElementId: photo.id,
                targetElementPreview: photo.url || photo.caption || `${profile.displayName}'s portrait`,
                targetElementQuestion: photo.promptLabel || `Photo ${index + 1}`,
                photoItem: photo,
              })
            }
            aria-label={`Like ${profile.displayName}'s photo ${index + 1}`}
            className="absolute bottom-4 right-4 min-w-[48px] min-h-[48px] rounded-full bg-white/95 backdrop-blur-sm border border-[#EAE6DF] text-[#3F6251] shadow-md flex items-center justify-center hover:bg-[#3F6251] hover:text-white hover:border-[#3F6251] active:scale-95 transition-all"
          >
            <Heart className="w-5 h-5" />
          </button>
        )}
      </div>
      {photo.caption && (
        <div className="px-6 py-4 bg-white">
          <p className="text-sm text-[#3F3F46] leading-relaxed">{photo.caption}</p>
        </div>
      )}
    </article>
  );

  const renderPromptCard = (prompt: PromptItem, index: number) => (
    <article
      key={prompt.id}
      className="relative bg-white border border-[#EAE6DF] rounded-[2rem] p-7 md:p-9 shadow-[0_2px_20px_rgba(24,24,27,0.03)]"
    >
      <p className="text-xs font-medium text-[#71717A] mb-3.5">{prompt.question}</p>
      <blockquote className="font-serif text-[1.75rem] md:text-[2.1rem] leading-[1.22] text-[#18181B] pr-12">
        “{prompt.answer}”
      </blockquote>
      {interactive && onLikeTarget && (
        <button
          type="button"
          onClick={() =>
            onLikeTarget({
              targetElementType: 'prompt',
              targetElementId: prompt.id,
              targetElementPreview: prompt.answer,
              targetElementQuestion: prompt.question,
            })
          }
          aria-label={`Like ${profile.displayName}'s prompt: ${prompt.question}`}
          className="absolute bottom-5 right-5 min-w-[46px] min-h-[46px] rounded-full bg-[#FAF9F6] border border-[#EAE6DF] text-[#3F6251] flex items-center justify-center hover:bg-[#3F6251] hover:text-white hover:border-[#3F6251] active:scale-95 transition-all"
          data-prompt-index={index}
        >
          <Heart className="w-4 h-4" />
        </button>
      )}
    </article>
  );

  const remainingPhotos = sortedPhotos.slice(2);
  const thirdPrompt = prompts[2];

  return (
    <div className="space-y-6">
      {/* Header Block */}
      <header className="bg-white border border-[#EAE6DF] rounded-[2rem] px-6 py-5 md:px-8 md:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-serif text-4xl md:text-[2.75rem] leading-none text-[#18181B]">
                {profile.displayName}, <span className="tabular-nums">{profile.age}</span>
              </h1>
              {profile.pronouns.length > 0 && (
                <span className="text-sm text-[#6D4C6E] font-medium">
                  {profile.pronouns.join(' · ')}
                </span>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-[#71717A]">
              <span className="text-[#18181B] font-medium">{profile.city}</span>
              <span className="inline-flex items-center gap-1 text-[#3F6251] font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {profile.childfreeStanceBadge}
              </span>
              {profile.showSterilizedBadge &&
                profile.childfreeStanceBadge !== 'Childfree & Sterilized / Vasectomy' && (
                  <span className="text-[#3F6251]">Sterilized / Vasectomy</span>
                )}
              {profile.isSample && (
                <span className="text-xs text-[#71717A]">Sample Member</span>
              )}
            </div>
          </div>

          {interactive && onOpenSafetyMenu && (
            <button
              type="button"
              onClick={onOpenSafetyMenu}
              aria-label={`Safety options for ${profile.displayName}`}
              className="min-w-[44px] min-h-[44px] rounded-full border border-[#EAE6DF] bg-[#FAF9F6] text-[#71717A] hover:text-[#18181B] hover:border-[#D4CFC6] flex items-center justify-center shrink-0 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Vitals Strip — Clean wrapping typographic metadata with zero mid-word clipping */}
        {vitals.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-[#F2EFEA]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-[#52525B] leading-snug">
              {vitals.map((vital, idx) => (
                <span key={`${vital}-${idx}`} className="inline-flex items-center gap-3">
                  {idx > 0 && (
                    <span aria-hidden="true" className="text-[#D4CFC6]">
                      ·
                    </span>
                  )}
                  <span>{vital}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Photo 1 (Hero) */}
      {sortedPhotos[0] && renderPhotoCard(sortedPhotos[0], 0)}

      {/* Prompt 1 */}
      {prompts[0] && renderPromptCard(prompts[0], 0)}

      {/* Photo 2 */}
      {sortedPhotos[1] && renderPhotoCard(sortedPhotos[1], 1)}

      {/* Values & Lifestyle Card */}
      {profile.valuesAndLifestyle.length > 0 && (
        <section className="bg-white border border-[#EAE6DF] rounded-[2rem] px-6 py-6 md:px-8 md:py-7">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <h2 className="font-serif text-2xl text-[#18181B]">Values &amp; Rhythm</h2>
            {sharedValues.size > 0 && (
              <span className="text-xs text-[#3F6251] font-medium tabular-nums">
                {sharedValues.size} shared with you
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.valuesAndLifestyle.map((value) => {
              const isShared = sharedValues.has(value);
              const isQueerTag = value === 'Queer community';
              return (
                <span
                  key={value}
                  className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
                    isShared
                      ? 'bg-[#EEF3F0] border-[#3F6251]/45 text-[#2C4739] font-medium'
                      : isQueerTag
                      ? 'bg-[#F6F1F6] border-[#6D4C6E]/25 text-[#583C59]'
                      : 'bg-[#FAF9F6] border-[#EAE6DF] text-[#52525B]'
                  }`}
                >
                  {value}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Prompt 2 */}
      {prompts[1] && renderPromptCard(prompts[1], 1)}

      {/* Interleave Photos 3–6 & Prompt 3 */}
      {remainingPhotos[0] && renderPhotoCard(remainingPhotos[0], 2)}
      {thirdPrompt && renderPromptCard(thirdPrompt, 2)}
      {remainingPhotos.slice(1).map((photo, idx) => renderPhotoCard(photo, idx + 3))}
    </div>
  );
}
