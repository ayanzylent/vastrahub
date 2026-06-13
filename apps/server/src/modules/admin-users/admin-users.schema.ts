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

export const UpdateRoleBody = Type.Object({
  role: Type.String({ minLength: 1 }),
});
export type UpdateRoleBodyType = Static<typeof UpdateRoleBody>;
