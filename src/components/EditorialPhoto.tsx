import { useState } from 'react';
import type { PhotoItem } from '../types/duet';
import { MONOGRAM_TONES } from '../utils/imageCompression';

interface EditorialPhotoProps {
  photo: PhotoItem;
  displayName: string;
  city?: string;
  className?: string;
  aspectClass?: string;
}

export function EditorialPhoto({
  photo,
  displayName,
  city,
  className = '',
  aspectClass = 'aspect-[4/5]',
}: EditorialPhotoProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const initial = (displayName?.trim()[0] || 'D').toUpperCase();
  const tone = MONOGRAM_TONES[photo.monogramTone || 'sage'];

  if (photo.isMonogram || !photo.url || failed) {
    return (
      <div
        className={`relative w-full ${aspectClass} ${tone.bg} border ${tone.border} flex flex-col items-center justify-center p-8 text-center select-none overflow-hidden ${className}`}
      >
        <div className="w-24 h-24 rounded-full border border-current/20 flex items-center justify-center mb-5 bg-white/60">
          <span className={`font-serif text-5xl ${tone.accent}`}>{initial}</span>
        </div>
        <p className={`font-serif text-2xl ${tone.accent}`}>{displayName}</p>
        {city && (
          <p className="text-xs text-[#71717A] mt-1.5">
            {city} · Privacy-first editorial portrait
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full ${aspectClass} bg-[#F2EFEA] overflow-hidden ${className}`}>
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#EFECE6] animate-pulse"
        />
      )}
      <img
        src={photo.url}
        alt={photo.caption || photo.promptLabel || `${displayName} editorial portrait`}
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
