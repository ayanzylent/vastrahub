/**
 * Media service for Cloudflare R2 operations.
 * Handles presigned URL generation, deletion, and validation.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import { MEDIA_CONSTRAINTS } from '@vastrahub/shared-constants';
import { getConfig } from '../config/env.js';

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3Client) {
    const config = getConfig();
    _s3Client = new S3Client({
      region: config.R2_REGION,
      endpoint: config.R2_ACCOUNT_ENDPOINT,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID,
        secretAccessKey: config.R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true, //only for supabase
    });
  }
  return _s3Client;
}

/**
 * Generate a presigned URL for direct browser-to-R2 uploads.
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const config = getConfig();
  const command = new PutObjectCommand({
    Bucket: config.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn });
}

/**
 * Delete a media object from R2.
 */
export async function deleteMediaObject(key: string): Promise<void> {
  const config = getConfig();
  const command = new DeleteObjectCommand({
    Bucket: config.R2_BUCKET_NAME,
    Key: key,
  });

  await getS3Client().send(command);
}

/**
 * Get the public URL for a media object.
 */
export function getPublicUrl(key: string): string {
  const config = getConfig();
  return `${config.R2_PUBLIC_URL}/${key}`;
}

/**
 * Generate a unique storage key for a media upload.
 */
export function generateMediaKey(
  prefix: 'products' | 'reviews' | 'categories',
  entityId: string,
  extension: string,
): string {
  const timestamp = Date.now();
  const id = nanoid(12);
  return `${prefix}/${entityId}/${timestamp}-${id}.${extension}`;
}

/**
 * Validate a media upload against constraints.
 */
export function validateMediaUpload(
  category: keyof typeof MEDIA_CONSTRAINTS,
  contentType: string,
  fileSize: number,
): { valid: boolean; error?: string } {
  const constraints = MEDIA_CONSTRAINTS[category];

  if (!constraints.allowedMimeTypes.includes(contentType as never)) {
    return {
      valid: false,
      error: `Invalid content type "${contentType}". Allowed: ${constraints.allowedMimeTypes.join(', ')}`,
    };
  }

  if (fileSize > constraints.maxSizeBytes) {
    const maxMB = constraints.maxSizeBytes / (1024 * 1024);
    return {
      valid: false,
      error: `File size ${(fileSize / (1024 * 1024)).toFixed(1)}MB exceeds maximum ${maxMB}MB`,
    };
  }

  return { valid: true };
}
