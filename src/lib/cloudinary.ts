// Cloudinary URL builder - no SDK required
// Uses direct URL construction for optimal bundle size

const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;

if (!cloudName) {
  console.warn('Missing PUBLIC_CLOUDINARY_CLOUD_NAME environment variable');
}

// Types for image effects
export interface CloudinaryEffect {
  blur?: number | 'faces' | 'region';
  grayscale?: boolean;
  sepia?: number;
  pixelate?: number;
  oil_paint?: number;
  cartoonify?: boolean;
  vignette?: number;
  saturation?: number;
  brightness?: number;
  contrast?: number;
}

// Types for image transformations
export interface CloudinaryImageOptions {
  publicId: string;
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'limit' | 'pad' | 'lfill' | 'mfit';
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  gravity?: string;
  aspectRatio?: number;
  effects?: CloudinaryEffect;
  dpr?: number | 'auto';
}

/**
 * Build effects transformation string from CloudinaryEffect object
 * @param effects - Effects to apply
 * @returns Comma-separated effects string
 */
function buildEffectsString(effects?: CloudinaryEffect): string {
  if (!effects) return '';

  const effectTransforms: string[] = [];

  if (effects.blur) {
    effectTransforms.push(typeof effects.blur === 'number' ? `e_blur:${effects.blur}` : `e_blur_${effects.blur}`);
  }
  if (effects.grayscale) effectTransforms.push('e_grayscale');
  if (effects.sepia) effectTransforms.push(`e_sepia:${effects.sepia}`);
  if (effects.pixelate) effectTransforms.push(`e_pixelate:${effects.pixelate}`);
  if (effects.oil_paint) effectTransforms.push(`e_oil_paint:${effects.oil_paint}`);
  if (effects.cartoonify) effectTransforms.push('e_cartoonify');
  if (effects.vignette) effectTransforms.push(`e_vignette:${effects.vignette}`);
  if (effects.saturation) effectTransforms.push(`e_saturation:${effects.saturation}`);
  if (effects.brightness) effectTransforms.push(`e_brightness:${effects.brightness}`);
  if (effects.contrast) effectTransforms.push(`e_contrast:${effects.contrast}`);

  return effectTransforms.join(',');
}

/**
 * Build a Cloudinary image URL with transformations
 * @param options - Image transformation options
 * @returns Fully qualified Cloudinary URL
 */
export function buildCloudinaryUrl(options: CloudinaryImageOptions): string {
  const {
    publicId,
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    gravity,
    aspectRatio,
    effects,
    dpr = 'auto',
  } = options;

  const transformations: string[] = [];

  // Add DPR (device pixel ratio)
  if (dpr) transformations.push(`dpr_${dpr}`);

  // Add crop mode
  if (crop) transformations.push(`c_${crop}`);

  // Add dimensions
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);

  // Add aspect ratio if specified
  if (aspectRatio && !height) transformations.push(`ar_${aspectRatio}`);

  // Add gravity for cropping
  if (gravity) transformations.push(`g_${gravity}`);

  // Add quality
  if (quality) transformations.push(`q_${quality}`);

  // Add format
  if (format) transformations.push(`f_${format}`);

  // Add effects if any
  const effectsString = buildEffectsString(effects);
  if (effectsString) {
    transformations.push(effectsString);
  }

  const transformString = transformations.length > 0 ? `${transformations.join(',')}/` : '';

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}${publicId}`;
}

/**
 * Generate responsive srcset for multiple screen sizes
 * @param options - Responsive image options
 * @returns srcset string for img tag
 */
export function getCloudinaryResponsiveSet(options: {
  publicId: string;
  sizes: number[];
  crop?: string;
  quality?: number | 'auto';
  format?: string;
  aspectRatio?: number;
  effects?: CloudinaryEffect;
  dpr?: number | 'auto';
}): string {
  const { publicId, sizes, crop, quality, format, aspectRatio, effects, dpr } = options;

  return sizes
    .map((size) => {
      const url = buildCloudinaryUrl({
        publicId,
        width: size,
        height: aspectRatio ? Math.round(size * aspectRatio) : undefined,
        crop: crop as any,
        quality,
        format: format as any,
        effects,
        dpr,
      });
      return `${url} ${size}w`;
    })
    .join(', ');
}

/**
 * Helper function to get video URL
 * @param publicId - Cloudinary public ID for the video
 * @returns Cloudinary video URL
 */
export function getCloudinaryVideoUrl(publicId: string): string {
  return `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}`;
}

/**
 * Simple helper to get image URL (for backwards compatibility)
 * @param publicId - Cloudinary public ID
 * @returns Basic Cloudinary image URL
 */
export function getCloudinaryImageUrl(publicId: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
}
