import type { TimestampFields } from './common.types.js';

/**
 * Actions that can be audited.
 */
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  STATUS_CHANGE = 'status_change',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
}

/**
 * Entity types that can be audited.
 */
export enum AuditEntity {
  PRODUCT = 'product',
  SKU = 'sku',
  CATEGORY = 'category',
  ORDER = 'order',
  USER = 'user',
  COUPON = 'coupon',
  PAYMENT = 'payment',
  REVIEW = 'review',
  MEDIA = 'media',
}

/**
 * Audit log document.
 */
export interface IAuditLog extends TimestampFields {
  _id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  userId: string;
  userName: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  ipAddress?: string;
  userAgent?: string;
}
