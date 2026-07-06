/**
 * Media service — presigned URL generation and media deletion.
 */

import { nanoid } from 'nanoid';
import {
  generatePresignedUploadUrl,
  deleteMediaObject,
  getPublicUrl,
  validateMediaUpload,
} from '../../lib/media.js';
import { ValidationError } from '../../lib/errors.js';
import type { MediaCategory } from '@vastrahub/shared-constants';

// ---------- Interfaces ----------

export interface InitiateUploadInput {
  type: 'image' | 'video';
  fileName: string;
  contentType: string;
  fileSize: number;
  context: 'product' | 'review' | 'category' | 'collection' | 'homepage';
}

export interface UploadUrlResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

// ---------- Helpers ----------

/**
 * Map context + type to media constraint category.
 */
function getMediaCategory(context: string, type: string): MediaCategory {
  const mapping: Record<string, MediaCategory> = {
    'product_image': 'PRODUCT_IMAGE',
    'product_video': 'PRODUCT_VIDEO',
    'review_image': 'REVIEW_IMAGE',
    'review_video': 'REVIEW_VIDEO',
    'category_image': 'CATEGORY_IMAGE',
    'collection_image': 'COLLECTION_IMAGE',
    'homepage_image': 'HOMEPAGE_IMAGE',
  };

  const key = `${context}_${type}`;
  const category = mapping[key];
  if (!category) {
    throw new ValidationError(`Unsupported media type: ${type} for context: ${context}`);
  }
  return category;
}

// ---------- Service functions ----------

/**
 * Initiate a media upload — validate and generate presigned URL.
 */
export async function initiateUpload(input: InitiateUploadInput): Promise<UploadUrlResult> {
  const { type, fileName, contentType, fileSize, context } = input;

  // Map to constraint category
  const category = getMediaCategory(context, type);

  // Validate against constraints
  const validation = validateMediaUpload(category, contentType, fileSize);
  if (!validation.valid) {
    throw new ValidationError(validation.error ?? 'Invalid media upload');
  }

  // Generate unique key
  const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
  const key = `${context}s/${nanoid()}${extension ? `.${extension}` : ''}`;

  // Generate presigned URL (15 minutes)
  const expiresIn = 900;
  const uploadUrl = await generatePresignedUploadUrl(key, contentType, expiresIn);
  const publicUrl = getPublicUrl(key);

  return {
    uploadUrl,
    publicUrl,
    key,
    expiresIn,
  };
}

/**
 * Delete a media object from R2.
 */
export async function deleteMedia(key: string): Promise<{ deleted: true }> {
  if (!key || key.length === 0) {
    throw new ValidationError('Media key is required');
  }

  await deleteMediaObject(key);
  return { deleted: true };
}
