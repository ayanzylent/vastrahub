/**
 * Purge schema — TypeBox validation for the purge endpoint.
 */

import { Type } from '@sinclair/typebox';

export const PurgeQuery = Type.Object({
  dryRun: Type.Optional(Type.String({ description: 'Set to "true" for a dry run (preview only)' })),
  days: Type.Optional(Type.String({ description: 'Override retention days (default: 30)' })),
});
