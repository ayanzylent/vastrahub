import type { TimestampFields } from './common.types';

interface ICategoryAncestor {
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
  /** Feature on the storefront homepage (category showcase). */
  isFeatured: boolean;
  sortOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  productCount: number;
}
