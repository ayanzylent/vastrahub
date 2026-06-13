/**
 * Dashboard module TypeBox schemas.
 * Request validation for dashboard routes.
 */

import { Type, type Static } from '@sinclair/typebox';

export const RecentOrdersQuery = Type.Object({
  limit: Type.Optional(Type.String()),
});
export type RecentOrdersQueryType = Static<typeof RecentOrdersQuery>;
