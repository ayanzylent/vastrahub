import { getMediaUrl } from "@/lib/media";
import type { ICategory, IProduct, ISku } from "@/types";

export type ProductDetailData = IProduct & {
  category?: ICategory;
  skus?: ISku[];
  sisterProducts?: Array<{
    _id: string;
    name: string;
    slug: string;
    variantMedia?: Array<{
      isCoverGroup?: boolean;
      media?: Array<{ type: string; url: string; alt?: string; thumbnailUrl?: string }>;
    }>;
    basePricePaise?: number;
    baseMrpPaise?: number;
    minPricePaise?: number;
    maxPricePaise?: number;
    minMrpPaise?: number;
    maxMrpPaise?: number;
  }>;
};

/** First cover image URL for OG / JSON-LD. */
export function getProductCoverImageUrl(product: {
  variantMedia?: Array<{
    isCoverGroup?: boolean;
    media?: Array<{ type: string; url: string }>;
  }>;
}): string | null {
  if (!product.variantMedia?.length) return null;
  const coverGroup =
    product.variantMedia.find((vm) => vm.isCoverGroup) || product.variantMedia[0];
  if (!coverGroup?.media?.length) return null;
  const firstImage = coverGroup.media.find((m) => m.type === "image");
  return firstImage?.url ? getMediaUrl(firstImage.url) : null;
}
