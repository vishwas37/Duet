export interface CompressedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Compresses and resizes an image file client-side via Canvas API
 * (max 1080px on longest edge, JPEG quality 0.82) before uploading to Firebase Storage.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1080,
  quality = 0.82
): Promise<CompressedImageResult> {
  const dataUrlInput = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode the selected image.'));
    image.src = dataUrlInput;
  });

  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    const scale = maxDimension / Math.max(targetWidth, targetHeight);
    targetWidth = Math.round(targetWidth * scale);
    targetHeight = Math.round(targetHeight * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas rendering context is unavailable.');
  }

  ctx.fillStyle = '#FAF9F6';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Image compression failed.'));
          return;
        }
        resolve(result);
      },
      'image/jpeg',
      quality
    );
  });

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return { blob, dataUrl, width: targetWidth, height: targetHeight };
}

export const MONOGRAM_TONES = {
  sage: {
    bg: 'bg-[#EEF3F0]',
    accent: 'text-[#3F6251]',
    border: 'border-[#D5E2DA]',
    label: 'Botanical Sage',
  },
  terracotta: {
    bg: 'bg-[#FBF1EE]',
    accent: 'text-[#C86D51]',
    border: 'border-[#EED8D0]',
    label: 'Warm Terracotta',
  },
  plum: {
    bg: 'bg-[#F6F1F6]',
    accent: 'text-[#6D4C6E]',
    border: 'border-[#E5D9E6]',
    label: 'Soft Plum',
  },
  charcoal: {
    bg: 'bg-[#F4F2EE]',
    accent: 'text-[#18181B]',
    border: 'border-[#E2DDD4]',
    label: 'Warm Linen',
  },
} as const;
