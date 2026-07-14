import type { IProductPageBadges } from "@/types";

/** Shared product-page badge registry (admin editor + storefront panel). */
export const PRODUCT_PAGE_BADGE_FIELDS: Array<{
  key: keyof IProductPageBadges;
  label: string;
  desc: string;
}> = [
  {
    key: "easyReturn",
    label: "Easy Return",
    desc: "Show an Easy Return badge on the product page",
  },
  {
    key: "easyReplacement",
    label: "Easy Replacement",
    desc: "Show an Easy Replacement badge on the product page",
  },
  {
    key: "cod",
    label: "Cash on Delivery",
    desc: "Show a COD badge on the product page",
  },
  {
    key: "freeDelivery",
    label: "Free Delivery",
    desc: "Show a Free Delivery badge on the product page",
  },
  {
    key: "authentic",
    label: "Authentic",
    desc: "Show an Authentic badge on the product page",
  },
];
