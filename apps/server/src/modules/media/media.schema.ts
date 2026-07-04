/**
 * Media module TypeBox schemas.
 * Request validation for media upload and delete routes.
 */

import { Type, type Static } from '@sinclair/typebox';

export const InitiateUploadBody = Type.Object({
  type: Type.Union([Type.Literal('image'), Type.Literal('video')]),
  fileName: Type.String({ minLength: 1 }),
  contentType: Type.String({ minLength: 1 }),
  fileSize: Type.Integer({ minimum: 1, description: 'File size in bytes' }),
  context: Type.Union([
    Type.Literal('product'),
    Type.Literal('review'),
    Type.Literal('category'),
    Type.Literal('collection'),
  ]),
});
export type InitiateUploadBodyType = Static<typeof InitiateUploadBody>;
