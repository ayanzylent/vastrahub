/**
 * Audit Log model.
 * APPEND ONLY — no updatedAt, no updates, no deletes.
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose';

// ---------- Interfaces ----------

export interface IAuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface IAuditLogDocument extends Document {
  actorId: string;
  actorRole?: string;
  actorEmail?: string;
  entity: string;
  entityId: string;
  action: string;
  changes: IAuditChange[];
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ---------- Sub-schemas ----------

const auditChangeSchema = new Schema<IAuditChange>(
  {
    field: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

// ---------- Main schema ----------

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: {
      type: String,
      required: [true, 'Actor ID is required'],
    },
    actorRole: { type: String },
    actorEmail: { type: String },
    entity: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: ['product', 'sku', 'category', 'order', 'user', 'coupon', 'payment', 'review', 'media'],
    },
    entityId: {
      type: String,
      required: [true, 'Entity ID is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: ['create', 'update', 'delete', 'status_change', 'login', 'logout', 'export'],
    },
    changes: {
      type: [auditChangeSchema],
      default: [],
    },
    reason: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    createdAt: {
      type: Date,
      default: () => new Date(),
      immutable: true,
    },
  },
  {
    // APPEND ONLY: no updatedAt
    timestamps: false,
    collection: 'audit_logs',
  },
);

// ---------- Indexes ----------

auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// ---------- Export ----------

export const AuditLog: Model<IAuditLogDocument> = mongoose.models.AuditLog
  || mongoose.model<IAuditLogDocument>('AuditLog', auditLogSchema);
