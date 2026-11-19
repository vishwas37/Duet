import { useState } from 'react';
import { Cloud, LogOut, ShieldCheck } from 'lucide-react';
import {
  ALL_CURATED_PROMPTS,
  CHILDFREE_STANCE_OPTIONS,
  CITY_QUICK_PICKS,
  GENDER_OPTIONS,
  ORIENTATION_OPTIONS,
  PRONOUN_OPTIONS,
  RELATIONSHIP_STYLE_OPTIONS,
  VALUES_AND_LIFESTYLE_OPTIONS,
} from '../../data/constants';
import type { UserProfile } from '../../types/duet';
import { PhotoStudio } from '../PhotoStudio';
import { ProfileCardContent } from '../ProfileCardContent';

interface ProfileViewProps {
  profile: UserProfile;
  cloudSynced: boolean;
  onUpdateProfile: (next: UserProfile) => void;
  onConnectGoogleSync: () => void;
  onSignOut: () => void;
  onNotify: (message: string, tone?: 'sage' | 'terracotta' | 'neutral') => void;
}

export function ProfileView({
  profile,
  cloudSynced,
  onUpdateProfile,
  onConnectGoogleSync,
  onSignOut,
  onNotify,
}: ProfileViewProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const patchProfile = (patch: Partial<UserProfile>) => {
    onUpdateProfile({
      ...profile,
      ...patch,
      updatedAt: Date.now(),
    });
  };

  const toggleArrayField = (
    field: 'pronouns' | 'genders' | 'orientations' | 'relationshipStyles' | 'valuesAndLifestyle',
    value: string,
    max: number
  ) => {
    const current = profile[field];
    const exists = current.includes(value);
    if (exists) {
      if (current.length <= 1) return;
      patchProfile({ [field]: current.filter((v) => v !== value) });
    } else if (current.length < max) {
      patchProfile({ [field]: [...current, value] });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-24 md:pb-16 space-y-8">
      {/* Header & Preview vs Edit Segmented Control */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#3F6251] mb-1">
            Your Editorial Profile
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#18181B]">
            {profile.displayName}
          </h1>
        </div>

        <div
          role="tablist"
          aria-label="Profile display mode"
          className="inline-flex p-1 rounded-full bg-[#EFECE6] border border-[#EAE6DF]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'edit'}
            onClick={() => setMode('edit')}
            className={`px-5 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'edit'
                ? 'bg-white text-[#18181B] shadow-xs'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            Edit Profile
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'preview'}
            onClick={() => setMode('preview')}
            className={`px-5 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'preview'
                ? 'bg-white text-[#18181B] shadow-xs'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            Preview
          </button>
        </div>
      </header>

      {mode === 'preview' ? (
        <div className="max-w-2xl mx-auto">
          <ProfileCardContent profile={profile} interactive={false} />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Cloud Sync Banner if using Dev OTP Preview */}
          {!cloudSynced && (
            <div className="bg-[#EEF3F0]/80 border border-[#D4E2DA] rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3 max-w-xl">
                <Cloud className="w-5 h-5 text-[#3F6251] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#2C4739]">
                    Saved locally via Email OTP Preview
                  </p>
                  <p className="text-xs text-[#456354] mt-0.5 leading-relaxed">
                    Connect with Google anytime to mirror your profile, photo uploads, and real-time chats to Cloud Firestore &amp; Firebase Storage.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onConnectGoogleSync}
                className="px-4 py-2 rounded-full bg-[#3F6251] text-white text-xs font-medium hover:bg-[#345143] whitespace-nowrap shrink-0"
              >
                Enable Cloud Sync
              </button>
            </div>
          )}

          {/* Photo Studio */}
          <section className="bg-white border border-[#EAE6DF] rounded-[2rem] p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="font-serif text-3xl text-[#18181B]">Photo Studio</h2>
              <p className="text-xs text-[#71717A] mt-1">
                Upload up to 6 photos (compressed &amp; stored in Firebase Storage), reorder frames, or tap any photo to edit its Hinge prompt &amp; caption.
              </p>
            </div>
            <PhotoStudio
              uid={profile.uid}
              displayName={profile.displayName}
              city={profile.city}
              photos={profile.photos}
              onChange={(nextPhotos) => patchProfile({ photos: nextPhotos })}
              onNotify={onNotify}
            />
          </section>

          {/* Identity & Vitals */}
          <section className="bg-white border border-[#EAE6DF] rounded-[2rem] p-6 sm:p-8 space-y-6">
            <h2 className="font-serif text-3xl text-[#18181B]">Identity &amp; Vitals</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="edit-name" className="block text-xs text-[#71717A] mb-1.5">
                  Display Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  maxLength={60}
                  value={profile.displayName}
                  onChange={(e) => patchProfile({ displayName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm focus:outline-none focus:border-[#3F6251]"
                />
              </div>

              <div>
                <label htmlFor="edit-city" className="block text-xs text-[#71717A] mb-1.5">
                  City
                </label>
                <select
                  id="edit-city"
                  value={
                    CITY_QUICK_PICKS.includes(
                      profile.city as (typeof CITY_QUICK_PICKS)[number]
                    )
                      ? profile.city
                      : 'Bengaluru'
                  }
                  onChange={(e) => patchProfile({ city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm focus:outline-none focus:border-[#3F6251]"
                >
                  {CITY_QUICK_PICKS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-craft" className="block text-xs text-[#71717A] mb-1.5">
                  Work / Craft
                </label>
                <input
                  id="edit-craft"
                  type="text"
                  maxLength={120}
                  value={profile.workOrCraft || ''}
                  onChange={(e) => patchProfile({ workOrCraft: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm focus:outline-none focus:border-[#3F6251]"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#52525B] mb-2">Pronouns</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set([...PRONOUN_OPTIONS, ...profile.pronouns])).map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleArrayField('pronouns', item, 4)}
                      className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
                        profile.pronouns.includes(item)
                          ? 'bg-[#6D4C6E] text-white border-[#6D4C6E]'
                          : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF]'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-[#52525B]">Gender Identity</p>
                <label className="inline-flex items-center gap-2 text-xs text-[#71717A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.showGender}
                    onChange={(e) => patchProfile({ showGender: e.target.checked })}
                    className="accent-[#3F6251]"
                  />
                  Show on profile
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set([...GENDER_OPTIONS, ...profile.genders])).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleArrayField('genders', g, 6)}
                    className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
                      profile.genders.includes(g)
                        ? 'bg-[#3F6251] text-white border-[#3F6251]'
                        : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-[#52525B]">Sexual Orientation</p>
                <label className="inline-flex items-center gap-2 text-xs text-[#71717A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.showOrientation}
                    onChange={(e) => patchProfile({ showOrientation: e.target.checked })}
                    className="accent-[#3F6251]"
                  />
                  Show on profile
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set([...ORIENTATION_OPTIONS, ...profile.orientations])).map(
                  (o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => toggleArrayField('orientations', o, 6)}
                      className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
                        profile.orientations.includes(o)
                          ? 'bg-[#3F6251] text-white border-[#3F6251]'
                          : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF]'
                      }`}
                    >
                      {o}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#52525B] mb-2">
                Relationship Structure
              </p>
              <div className="flex flex-wrap gap-2">
                {RELATIONSHIP_STYLE_OPTIONS.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleArrayField('relationshipStyles', style, 5)}
                    className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
                      profile.relationshipStyles.includes(style)
                        ? 'bg-[#3F6251] text-white border-[#3F6251]'
                        : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF]'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#52525B] mb-2">
                Childfree Stance Badge
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CHILDFREE_STANCE_OPTIONS.map((badge) => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => patchProfile({ childfreeStanceBadge: badge })}
                    className={`px-4 py-2.5 rounded-2xl text-left text-xs font-medium border transition-colors ${
                      profile.childfreeStanceBadge === badge
                        ? 'bg-[#EEF3F0] border-[#3F6251] text-[#2C4739]'
                        : 'bg-[#FAF9F6] border-[#EAE6DF] text-[#52525B]'
                    }`}
                  >
                    {badge}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#52525B] mb-2">
                Values &amp; Lifestyle (up to 8)
              </p>
              <div className="flex flex-wrap gap-2">
                {VALUES_AND_LIFESTYLE_OPTIONS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => toggleArrayField('valuesAndLifestyle', val, 8)}
                    className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
                      profile.valuesAndLifestyle.includes(val)
                        ? 'bg-[#3F6251] text-white border-[#3F6251]'
                        : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Editorial Prompts */}
          <section className="bg-white border border-[#EAE6DF] rounded-[2rem] p-6 sm:p-8 space-y-5">
            <h2 className="font-serif text-3xl text-[#18181B]">Written Prompts</h2>
            <div className="space-y-4">
              {profile.prompts.map((prompt, index) => (
                <div
                  key={prompt.id}
                  className="p-5 rounded-3xl bg-[#FAF9F6] border border-[#EAE6DF] space-y-3"
                >
                  <select
                    aria-label={`Prompt ${index + 1} question`}
                    value={prompt.question}
                    onChange={(e) => {
                      const nextPrompts = profile.prompts.map((p, idx) =>
                        idx === index ? { ...p, question: e.target.value } : p
                      );
                      patchProfile({ prompts: nextPrompts });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE6DF] text-sm focus:outline-none focus:border-[#3F6251]"
                  >
                    {ALL_CURATED_PROMPTS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>

                  <textarea
                    rows={3}
                    maxLength={260}
                    aria-label={`Prompt ${index + 1} answer`}
                    value={prompt.answer}
                    onChange={(e) => {
                      const nextPrompts = profile.prompts.map((p, idx) =>
                        idx === index ? { ...p, answer: e.target.value } : p
                      );
                      patchProfile({ prompts: nextPrompts });
                    }}
                    className="w-full px-3.5 py-3 rounded-xl bg-white border border-[#EAE6DF] text-sm focus:outline-none focus:border-[#3F6251] resize-none"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Consent, Safety & Account Controls */}
          <section className="bg-white border border-[#EAE6DF] rounded-[2rem] p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#3F6251]" />
              <h2 className="font-serif text-3xl text-[#18181B]">
                Safety &amp; Privacy Controls
              </h2>
            </div>

            <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] cursor-pointer">
              <div>
                <p className="text-sm font-medium text-[#18181B]">
                  Proactive Incognito Discovery Mode
                </p>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Only show my profile to people I have liked first.
                </p>
              </div>
              <input
                type="checkbox"
                checked={profile.safetySettings.proactiveIncognitoMode}
                onChange={(e) =>
                  patchProfile({
                    safetySettings: {
                      ...profile.safetySettings,
                      proactiveIncognitoMode: e.target.checked,
                    },
                  })
                }
                className="mt-1 w-5 h-5 accent-[#3F6251]"
              />
            </label>

            <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] cursor-pointer">
              <div>
                <p className="text-sm font-medium text-[#18181B]">
                  Allow opening notes with likes
                </p>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Disable to receive written notes only after a mutual match.
                </p>
              </div>
              <input
                type="checkbox"
                checked={profile.safetySettings.allowNotesBeforeMatch}
                onChange={(e) =>
                  patchProfile({
                    safetySettings: {
                      ...profile.safetySettings,
                      allowNotesBeforeMatch: e.target.checked,
                    },
                  })
                }
                className="mt-1 w-5 h-5 accent-[#3F6251]"
              />
            </label>

            <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] cursor-pointer">
              <div>
                <p className="text-sm font-medium text-[#18181B]">Pause my profile</p>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Temporarily hide yourself from Discover while keeping your existing connections active.
                </p>
              </div>
              <input
                type="checkbox"
                checked={profile.safetySettings.pauseProfile}
                onChange={(e) =>
                  patchProfile({
                    safetySettings: {
                      ...profile.safetySettings,
                      pauseProfile: e.target.checked,
                    },
                  })
                }
                className="mt-1 w-5 h-5 accent-[#3F6251]"
              />
            </label>

            <div className="pt-4 border-t border-[#F2EFEA] flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-[#71717A]">
                Signed in via passwordless email:{' '}
                <span className="text-[#18181B] font-medium">{profile.email}</span>
              </div>

              {confirmSignOut ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmSignOut(false)}
                    className="px-4 py-2 rounded-full border border-[#EAE6DF] text-xs font-medium text-[#52525B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="px-4 py-2 rounded-full bg-[#C86D51] text-white text-xs font-medium hover:bg-[#B45E43]"
                  >
                    Confirm Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmSignOut(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#EAE6DF] text-xs font-medium text-[#52525B] hover:border-[#C86D51] hover:text-[#C86D51] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
