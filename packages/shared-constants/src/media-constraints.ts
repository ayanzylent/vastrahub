export const MEDIA_CONSTRAINTS = {
  PRODUCT_IMAGE: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  },
  PRODUCT_VIDEO: {
    maxSizeBytes: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: ['video/mp4', 'video/webm'],
    maxDurationSecs: 300, // 5 minutes
  },
  REVIEW_IMAGE: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  REVIEW_VIDEO: {
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ['video/mp4'],
    maxDurationSecs: 60, // 1 minute
  },
  CATEGORY_IMAGE: {
    maxSizeBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
} as const;

export type MediaCategory = keyof typeof MEDIA_CONSTRAINTS;
