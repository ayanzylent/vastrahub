/**
 * Audit log Mongoose plugin.
 * Automatically creates audit log entries on save/update operations.
 */

import type { Schema, Document } from 'mongoose';
import mongoose from 'mongoose';

export interface AuditOptions {
  actorId?: string;
  actorRole?: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

/**
 * Mongoose plugin that creates audit log entries on document changes.
 * Audit info is passed via save options: doc.save({ auditOptions: { actorId, ... } })
 */
export function auditLogPlugin(schema: Schema, options?: { entityType?: string }): void {
  const entityType = options?.entityType;

  schema.post('save', async function (doc: Document) {
    if (!entityType) return;

    try {
      const auditOptions = (this as unknown as { $locals?: { auditOptions?: AuditOptions } })
        .$locals?.auditOptions;

      if (!auditOptions?.actorId) return;

      const AuditLogModel = mongoose.model('AuditLog');
      const isNew = doc.isNew;

      // Calculate changes for updates
      const changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];
      if (!isNew) {
        const modifiedPaths = doc.modifiedPaths();
        for (const path of modifiedPaths) {
          if (['updatedAt', 'createdAt', '__v'].includes(path)) continue;
          changes.push({
            field: path,
            oldValue: undefined, // Previous value not easily available in post-save
            newValue: doc.get(path),
          });
        }
      }

      await AuditLogModel.create({
        actorId: auditOptions.actorId,
        actorRole: auditOptions.actorRole,
        actorEmail: auditOptions.actorEmail,
        entity: entityType,
        entityId: doc._id?.toString(),
        action: isNew ? 'create' : 'update',
        changes,
        reason: auditOptions.reason,
        ipAddress: auditOptions.ipAddress,
        userAgent: auditOptions.userAgent,
      });
    } catch (err) {
      // Audit logging should never break the main operation
      console.error('Audit log creation failed:', (err as Error).message);
    }
  });
}
