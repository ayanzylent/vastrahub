import type { TimestampFields } from './common.types.js';
import type { IMediaItem } from './media.types.js';

/**
 * Product review document.
 */
export interface IReview extends TimestampFields {
  _id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  comment?: string;
  media: IMediaItem[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
}
