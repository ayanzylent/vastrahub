/**
 * Admin Users module TypeBox schemas.
 * Request validation for admin user management routes.
 */

import { Type, type Static } from '@sinclair/typebox';
import { IdParams, PaginationQuery } from '../../schemas/common.schema.js';

export const AdminUserIdParams = IdParams;
export type AdminUserIdParamsType = Static<typeof AdminUserIdParams>;

export const AdminUserListQuery = PaginationQuery;
export type AdminUserListQueryType = Static<typeof AdminUserListQuery>;

export const PromoteToAdminBody = Type.Object({
  email: Type.String({ format: 'email', minLength: 1 }),
});
export type PromoteToAdminBodyType = Static<typeof PromoteToAdminBody>;

export const SearchCustomersQuery = Type.Object({
  search: Type.String({ minLength: 1, description: 'Search term (email or name)' }),
});
export type SearchCustomersQueryType = Static<typeof SearchCustomersQuery>;
