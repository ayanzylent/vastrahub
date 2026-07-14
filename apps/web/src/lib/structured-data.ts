import { getProductCoverImageUrl, type ProductDetailData } from "@/lib/product-seo";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import { BRAND_CONFIG } from "@/constants";

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_CONFIG.NAME,
    url: getSiteUrl(),
    logo: absoluteUrl("/icon"),
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_CONFIG.NAME,
    url: getSiteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/shop?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildProductJsonLd(product: ProductDetailData) {
  const image = getProductCoverImageUrl(product);
  const price = product.minPricePaise ?? product.basePricePaise ?? 0;
  const availability =
    product.totalStock > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.shortDescription ||
      product.description?.replace(/<[^>]+>/g, "").slice(0, 300) ||
      product.name,
    url: absoluteUrl(`/products/${product.slug}`),
    ...(image ? { image: [image] } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(product.averageRating > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating,
            reviewCount: Math.max(1, product.reviewCount || 1),
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "INR",
      price: (price / 100).toFixed(2),
      availability,
      seller: {
        "@type": "Organization",
        name: BRAND_CONFIG.NAME,
      },
    },
  };
}
