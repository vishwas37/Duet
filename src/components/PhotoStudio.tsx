import { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { PhotoItem } from '../types/duet';
import { PHOTO_PROMPT_LABELS } from '../data/constants';
import { deleteProfilePhotoAsset, uploadProfilePhoto } from '../lib/duetStore';
import { MONOGRAM_TONES } from '../utils/imageCompression';
import { EditorialPhoto } from './EditorialPhoto';

interface PhotoStudioProps {
  uid: string;
  displayName: string;
  city: string;
  photos: PhotoItem[];
  onChange: (nextPhotos: PhotoItem[]) => void;
  onNotify?: (message: string, tone?: 'sage' | 'terracotta' | 'neutral') => void;
}

export function PhotoStudio({
  uid,
  displayName,
  city,
  photos,
  onChange,
  onNotify,
}: PhotoStudioProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);

  const sortedPhotos = [...photos].sort((a, b) => a.order - b.order);

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onNotify?.('Please choose an image file (JPEG, PNG, or WebP).', 'terracotta');
      return;
    }

    if (sortedPhotos.length >= 6) {
      onNotify?.('You can include up to 6 photos on your profile.', 'neutral');
      return;
    }

    const slotIndex = sortedPhotos.length;
    setUploadingSlot(slotIndex);
    setUploadProgress(10);

    try {
      const uploaded = await uploadProfilePhoto(uid, file, slotIndex, (pct) => {
        setUploadProgress(pct);
      });
      const next = [...sortedPhotos, uploaded].map((p, idx) => ({ ...p, order: idx }));
      onChange(next);
      setEditingPhotoId(uploaded.id);
      onNotify?.('Photo compressed and added to your profile.', 'sage');
    } catch (err) {
      onNotify?.(
        err instanceof Error ? err.message : 'Unable to upload photo right now.',
        'terracotta'
      );
    } finally {
      setUploadingSlot(null);
      setUploadProgress(0);
    }
  };

  const handleAddMonogramCard = (tone: keyof typeof MONOGRAM_TONES = 'sage') => {
    if (sortedPhotos.length >= 6) {
      onNotify?.('Remove a photo first to add an Editorial Monogram card.', 'neutral');
      return;
    }
    const monogramPhoto: PhotoItem = {
      id: `monogram_${Date.now()}`,
      url: '',
      storagePath: `local/monogram_${Date.now()}`,
      order: sortedPhotos.length,
      isMonogram: true,
      monogramTone: tone,
      promptLabel: 'Privacy-first cover card',
      caption: 'Sharing photos once we mutually connect.',
    };
    const next = [...sortedPhotos, monogramPhoto].map((p, idx) => ({ ...p, order: idx }));
    onChange(next);
    setEditingPhotoId(monogramPhoto.id);
    onNotify?.('Editorial Monogram portrait added.', 'sage');
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sortedPhotos.length) return;
    const copy = [...sortedPhotos];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    onChange(copy.map((p, idx) => ({ ...p, order: idx })));
  };

  const handleDelete = async (photo: PhotoItem) => {
    await deleteProfilePhotoAsset(photo);
    const next = sortedPhotos
      .filter((p) => p.id !== photo.id)
      .map((p, idx) => ({ ...p, order: idx }));
    onChange(next);
    if (editingPhotoId === photo.id) {
      setEditingPhotoId(null);
    }
    onNotify?.('Photo removed.', 'neutral');
  };

  const handleUpdateMeta = (
    photoId: string,
    patch: Partial<Pick<PhotoItem, 'promptLabel' | 'caption' | 'monogramTone'>>
  ) => {
    onChange(
      sortedPhotos.map((p) => (p.id === photoId ? { ...p, ...patch } : p))
    );
  };

  const activeEditPhoto = sortedPhotos.find((p) => p.id === editingPhotoId) || null;

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
        aria-label="Upload profile photo"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, slotIdx) => {
          const photo = sortedPhotos[slotIdx];
          const isUploadingHere = uploadingSlot === slotIdx;

          if (photo) {
            const isSelected = editingPhotoId === photo.id;
            return (
              <div
                key={photo.id}
                className={`group relative rounded-3xl overflow-hidden border bg-white transition-all ${
                  isSelected
                    ? 'border-[#3F6251] ring-2 ring-[#3F6251]/20'
                    : 'border-[#EAE6DF]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setEditingPhotoId(isSelected ? null : photo.id)}
                  className="block w-full text-left"
                  aria-label={`Edit caption for photo ${slotIdx + 1}`}
                >
                  <EditorialPhoto
                    photo={photo}
                    displayName={displayName || 'You'}
                    city={city}
                    aspectClass="aspect-[3/4]"
                  />
                </button>

                <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[11px] font-medium tabular-nums">
                  {slotIdx === 0 ? 'Cover' : slotIdx + 1}
                </div>

                <div className="p-2.5 flex items-center justify-between gap-1 bg-white border-t border-[#F2EFEA]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(slotIdx, -1)}
                      disabled={slotIdx === 0}
                      aria-label={`Move photo ${slotIdx + 1} left`}
                      className="p-1.5 rounded-full text-[#52525B] hover:bg-[#FAF9F6] disabled:opacity-30"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(slotIdx, 1)}
                      disabled={slotIdx === sortedPhotos.length - 1}
                      aria-label={`Move photo ${slotIdx + 1} right`}
                      className="p-1.5 rounded-full text-[#52525B] hover:bg-[#FAF9F6] disabled:opacity-30"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDelete(photo)}
                    aria-label={`Delete photo ${slotIdx + 1}`}
                    className="p-1.5 rounded-full text-[#71717A] hover:text-[#C86D51] hover:bg-[#FBF1EE] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <button
              key={`slot-${slotIdx}`}
              type="button"
              disabled={uploadingSlot !== null}
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[3/4] rounded-3xl border border-dashed border-[#D6D0C6] bg-white/70 hover:bg-white hover:border-[#3F6251] transition-colors flex flex-col items-center justify-center gap-2 p-4 text-center disabled:opacity-60"
            >
              {isUploadingHere ? (
                <>
                  <Loader2 className="w-6 h-6 text-[#3F6251] animate-spin" />
                  <span className="text-xs font-medium text-[#3F6251] tabular-nums">
                    Uploading {uploadProgress}%
                  </span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-[#EAE6DF] flex items-center justify-center text-[#52525B]">
                    <ImagePlus className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-[#18181B]">
                    {slotIdx === 0 ? 'Add Cover Photo' : `Add Photo ${slotIdx + 1}`}
                  </span>
                  <span className="text-[11px] text-[#71717A]">
                    Auto-resized to 1080px
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Privacy-first Editorial Monogram Option */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF]">
        <div>
          <p className="text-sm font-medium text-[#18181B]">
            Prefer a privacy-first cover portrait?
          </p>
          <p className="text-xs text-[#71717A] mt-0.5">
            Add an Editorial Monogram card if you prefer sharing face photos privately after matching.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleAddMonogramCard('sage')}
          disabled={sortedPhotos.length >= 6}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#EAE6DF] text-xs font-medium text-[#18181B] hover:border-[#3F6251] disabled:opacity-40 whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#3F6251]" />
          Add Editorial Monogram
        </button>
      </div>

      {/* Caption & Prompt Editor for selected photo */}
      {activeEditPhoto && (
        <div className="bg-white border border-[#EAE6DF] rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#18181B]">
              Photo Prompt &amp; Caption
            </p>
            <button
              type="button"
              onClick={() => setEditingPhotoId(null)}
              className="text-xs text-[#3F6251] font-medium hover:underline"
            >
              Done
            </button>
          </div>

          {activeEditPhoto.isMonogram && (
            <div>
              <p className="text-xs text-[#71717A] mb-2">Monogram Paper Tone</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(MONOGRAM_TONES) as (keyof typeof MONOGRAM_TONES)[]).map(
                  (toneKey) => (
                    <button
                      key={toneKey}
                      type="button"
                      onClick={() =>
                        handleUpdateMeta(activeEditPhoto.id, { monogramTone: toneKey })
                      }
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        activeEditPhoto.monogramTone === toneKey
                          ? 'bg-[#3F6251] text-white border-[#3F6251]'
                          : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF]'
                      }`}
                    >
                      {MONOGRAM_TONES[toneKey].label}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="photo-prompt-select"
              className="block text-xs text-[#71717A] mb-1.5"
            >
              Hinge-style Photo Prompt (optional)
            </label>
            <select
              id="photo-prompt-select"
              value={activeEditPhoto.promptLabel || ''}
              onChange={(e) =>
                handleUpdateMeta(activeEditPhoto.id, {
                  promptLabel: e.target.value || undefined,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm text-[#18181B] focus:outline-none focus:border-[#3F6251]"
            >
              <option value="">No prompt header</option>
              {PHOTO_PROMPT_LABELS.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="photo-caption-input"
              className="block text-xs text-[#71717A] mb-1.5"
            >
              Short Caption (optional, max 160 chars)
            </label>
            <input
              id="photo-caption-input"
              type="text"
              maxLength={160}
              value={activeEditPhoto.caption || ''}
              onChange={(e) =>
                handleUpdateMeta(activeEditPhoto.id, {
                  caption: e.target.value,
                })
              }
              placeholder="e.g. Late afternoon filter coffee in Indiranagar."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm text-[#18181B] focus:outline-none focus:border-[#3F6251]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
