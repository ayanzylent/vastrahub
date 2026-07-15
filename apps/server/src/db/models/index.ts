/**
 * Barrel export for all Mongoose models.
 * Importing this file ensures all models are registered with Mongoose.
 */

export { Category } from './category.model.js';
export type { ICategoryDocument, ICategoryAncestor } from './category.model.js';

export { Collection } from './collection.model.js';
export type {
  ICollectionDocument,
  ICollectionRule,
  CollectionType,
  CollectionMatchMode,
  CollectionRuleField,
  CollectionRuleOperator,
} from './collection.model.js';

export { Product } from './product.model.js';
export type {
  IProductDocument,
  IMediaItem,
  IVariantMedia,
  IVariantOption,
  IVariantOptionValue,
  ISlugHistoryEntry,
} from './product.model.js';

export { Sku } from './sku.model.js';
export type { ISkuDocument } from './sku.model.js';

export { Cart } from './cart.model.js';
export type { ICartDocument, ICartItem } from './cart.model.js';

export { Order } from './order.model.js';
export type {
  IOrderDocument,
  IOrderItem,
  IOrderPricing,
  ICouponSnapshot,
  IShippingAddress,
  IStatusHistoryEntry,
  IShippingInfo,
  InventoryHold,
} from './order.model.js';

export { Payment } from './payment.model.js';
export type { IPaymentDocument, IRefund, IWebhookEvent } from './payment.model.js';

export { Review } from './review.model.js';
export type { IReviewDocument, IReviewMediaItem } from './review.model.js';

export { Wishlist } from './wishlist.model.js';
export type { IWishlistDocument, IWishlistItem } from './wishlist.model.js';

export { Coupon } from './coupon.model.js';
export type { ICouponDocument, ICouponRules } from './coupon.model.js';

export { AuditLog } from './audit-log.model.js';
export type { IAuditLogDocument, IAuditChange } from './audit-log.model.js';

export { Address } from './address.model.js';
export type { IAddressDocument } from './address.model.js';

export { SiteSettings } from './site-settings.model.js';
export type { ISiteSettingsDocument } from './site-settings.model.js';
