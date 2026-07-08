export const APP_CONFIG = {
  MAX_CART_ITEMS: 50,
  MAX_CART_ITEM_QTY: 10,
  MAX_ADDRESSES_PER_USER: 10,
  MAX_WISHLIST_ITEMS: 100,
  MAX_REVIEW_MEDIA: 5,
  MAX_CATEGORY_DEPTH: 4,
  GUEST_CART_TTL_DAYS: 30,
  STOCK_RESERVATION_TIMEOUT_MINS: 15,
  ORDER_NUMBER_PREFIX: 'VH',
  SLUG_MAX_LENGTH: 200,
  SLUG_MIN_LENGTH: 3,
  MAX_VARIANT_MEDIA_GROUPS: 20,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MAX_TAGS_PER_PRODUCT: 20,
  MAX_PRODUCTS_PER_COLLECTION: 500,
  MAX_COLLECTION_RULES: 10,
  MAX_FEATURED_COLLECTIONS: 12,
  /** Days to retain soft-deleted products/SKUs before hard-deleting them. */
  SOFT_DELETE_RETENTION_DAYS: 30,
} as const;

export const BRAND_CONFIG = {
  NAME: 'VastraHub',
  DOMAIN: 'vastrahub.com',
  DEFAULT_ADMIN_EMAIL: 'admin@vastrahub.com',
  DEFAULT_SUPERADMIN_EMAIL: 'superadmin@vastrahub.com',
  META_TITLE: 'VastraHub | Premium Indian Fashion',
  META_DESCRIPTION: "Discover premium Indian fashion at VastraHub. Shop handpicked sarees, lehengas, kurtas, and more from India's finest weavers and designers.",
  GUEST_ID_KEY: 'vastrahub_guest_id',
} as const;
