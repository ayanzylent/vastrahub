/**
 * A single media item (image or video) in a product's variant media.
 */
export interface IMediaItem {
  type: 'image' | 'video';
  url: string;
  alt: string;
  sortOrder: number;
  thumbnailUrl?: string | null;
  /** Duration in seconds — only applicable for video type. */
  durationSecs?: number | null;
  /** MIME type of the media file. */
  mimeType: string;
}

/**
 * Media grouped by variant value.
 * A product's visual media is organized per variant (e.g., per color).
 */
export interface IVariantMedia {
  variantValue: string;
  variantLabel: string;
  variantSlug: string;
  media: IMediaItem[];
  isCoverGroup: boolean;
}
