/**
 * Soft-delete Mongoose plugin.
 * Adds deletedAt field, auto-filters queries, and provides soft-delete/restore methods.
 */

import type { Schema, Query, CallbackError, Document, Model, HydratedDocument } from 'mongoose';

export interface SoftDeleteDocument {
  deletedAt: Date | null;
  isDeleted: boolean;
  softDelete(): Promise<void>;
  restore(): Promise<void>;
}

export interface SoftDeleteModel<T> extends Model<T> {
  findWithDeleted(filter?: Record<string, unknown>): Query<HydratedDocument<T>[], HydratedDocument<T>>;
}

/**
 * Mongoose plugin that adds soft-delete capability.
 */
export function softDeletePlugin(schema: Schema): void {
  // Add the deletedAt field
  schema.add({
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  });

  // Add isDeleted virtual
  schema.virtual('isDeleted').get(function (this: { deletedAt: Date | null }) {
    return this.deletedAt !== null;
  });

  // Auto-filter queries to exclude soft-deleted documents
  const queryMiddleware = [
    'find',
    'findOne',
    'countDocuments',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndReplace',
    'updateOne',
    'updateMany',
  ] as const;

  for (const method of queryMiddleware) {
    schema.pre(method, function (this: Query<unknown, unknown>, next: (err?: CallbackError) => void) {
      const filter = this.getFilter();
      // Only add the filter if deletedAt is not explicitly queried
      if (filter.deletedAt === undefined) {
        // Also check if $or contains deletedAt conditions
        const orConditions = (filter as Record<string, unknown>)['$or'];
        const hasDeletedAtInOr = Array.isArray(orConditions)
          && orConditions.some((c: Record<string, unknown>) => c.deletedAt !== undefined);

        if (!hasDeletedAtInOr) {
          this.where({ deletedAt: null });
        }
      }
      next();
    });
  }

  // Instance method: softDelete
  schema.method('softDelete', async function (this: Document & { deletedAt: Date | null }) {
    this.deletedAt = new Date();
    await this.save();
  });

  // Instance method: restore
  schema.method('restore', async function (this: Document & { deletedAt: Date | null }) {
    this.deletedAt = null;
    await this.save();
  });

  // Static method: findWithDeleted (bypasses the auto-filter)
  schema.static('findWithDeleted', function (filter: Record<string, unknown> = {}) {
    return this.find({ ...filter, deletedAt: { $exists: true } }).setOptions({
      _softDeleteBypassed: true,
    });
  });

  // Ensure toJSON includes virtuals
  schema.set('toJSON', { virtuals: true });
  schema.set('toObject', { virtuals: true });
}
