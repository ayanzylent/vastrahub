/**
 * Address model.
 * Stores user shipping/billing addresses.
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IAddressDocument extends Document {
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddressDocument>(
  {
    userId: { type: String, required: true, index: true },
    label: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'addresses' },
);

addressSchema.index({ userId: 1, isDefault: 1 });

export const Address: Model<IAddressDocument> = mongoose.models.Address
  || mongoose.model<IAddressDocument>('Address', addressSchema);
