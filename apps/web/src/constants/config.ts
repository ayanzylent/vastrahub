export const BRAND_CONFIG = {
  NAME: 'VastraHub',
  DOMAIN: 'vastrahub.com',
  DEFAULT_ADMIN_EMAIL: 'admin@vastrahub.com',
  DEFAULT_SUPERADMIN_EMAIL: 'superadmin@vastrahub.com',
  META_TITLE: 'VastraHub | Premium Indian Fashion',
  META_DESCRIPTION: "Discover premium Indian fashion at VastraHub. Shop handpicked sarees, lehengas, kurtas, and more from India's finest weavers and designers.",
  GUEST_ID_KEY: 'vastrahub_guest_id',
  RECENT_SEARCH_KEY: 'vastrahub_recent_searches'
} as const;

export const FACEBOOK = 'https://facebook.com/AnanyaDesignerOfficial'
export const INSTAGRAM = 'https://instagram.com/saree.by.ananyadesigner'

/** Display / tel: link format */
export const PHONE_NUMBER = "+91 9641472617";

/** Digits only, for wa.me links */
export const PHONE_NUMBER_E164 = "919641472617";

export function buildWhatsAppUrl(message = ""): string {
  const base = `https://wa.me/${PHONE_NUMBER_E164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
