/**
 * Common reusable TypeBox schemas.
 * Shared primitives used across multiple module schemas.
 */

import { Type, type TSchema } from '@sinclair/typebox';

// ---------- Primitives ----------

/** MongoDB ObjectId string (24 hex chars). */
export const ObjectId = Type.String({
  pattern: '^[a-f\\d]{24}$',
  description: 'MongoDB ObjectId (24 hex characters)',
});

// ---------- Pagination ----------

/** Standard pagination query parameters (all optional strings from querystring). */
export const PaginationQuery = Type.Object({
  page: Type.Optional(Type.String({ description: 'Page number (1-based)' })),
  limit: Type.Optional(Type.String({ description: 'Items per page' })),
  search: Type.Optional(Type.String({ description: 'Search term' })),
});

// ---------- Common params ----------

/** Standard `:id` route parameter. */
export const IdParams = Type.Object({
  id: ObjectId,
});
