import type { TimestampFields } from './common.types.js';

/**
 * An ancestor entry in a category's breadcrumb trail.
 */
export interface ICategoryAncestor {
  _id: string;
  name: string;
  slug: string;
}

/**
 * Category document.
 */
export interface ICategory extends TimestampFields {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  ancestors: ICategoryAncestor[];
  image?: string;
  isActive: boolean;
  sortOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  productCount: number;
}
