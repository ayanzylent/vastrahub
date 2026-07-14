import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { JsonLd } from "@/components/common/json-ld";
import { ProductPage } from "@/components/storefront/product/product-page";
import { BRAND_CONFIG, DEFAULT_PRODUCT_PAGE } from "@/constants";
import { getProductCoverImageUrl, type ProductDetailData } from "@/lib/product-seo";
import { buildPageMetadata } from "@/lib/seo";
import {
  fetchProductPageSettings,
  fetchStorefrontProductBySlug,
} from "@/lib/storefront-fetch";
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
} from "@/lib/structured-data";
import type { IProductPageConfig } from "@/types";

interface ProductRouteParams {
  slug: string;
  variant?: string[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<ProductRouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await fetchStorefrontProductBySlug<ProductDetailData>(slug);
  const product = res?.data;

  if (!product) {
    return buildPageMetadata({
      title: "Product not found",
      description: BRAND_CONFIG.META_DESCRIPTION,
      path: `/products/${slug}`,
      noIndex: true,
    });
  }

  const title = product.metadata?.metaTitle?.trim() || product.name;
  const description =
    product.metadata?.metaDescription?.trim() ||
    product.shortDescription?.trim() ||
    product.description?.replace(/<[^>]+>/g, "").slice(0, 160) ||
    `Shop ${product.name} at ${BRAND_CONFIG.NAME}.`;
  const image = getProductCoverImageUrl(product);

  return buildPageMetadata({
    title,
    description,
    path: `/products/${product.slug}`,
    image,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<ProductRouteParams>;
}) {
  const { slug, variant } = await params;
  const variantParam = variant?.[0];

  const [productRes, settingsRes] = await Promise.all([
    fetchStorefrontProductBySlug<ProductDetailData>(slug),
    fetchProductPageSettings<IProductPageConfig>(),
  ]);

  if (productRes?.redirect && productRes.newSlug) {
    redirect(
      `/products/${productRes.newSlug}${variantParam ? `/${variantParam}` : ""}`,
    );
  }

  if (!productRes?.data) {
    notFound();
  }

  const product = productRes.data;
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    ...(product.category
      ? [{ name: product.category.name, path: `/categories/${product.category.slug}` }]
      : []),
    { name: product.name, path: `/products/${product.slug}` },
  ];

  return (
    <>
      <JsonLd data={buildProductJsonLd(product)} />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <ProductPage
        initialProduct={product}
        initialSettings={settingsRes?.data ?? DEFAULT_PRODUCT_PAGE}
      />
    </>
  );
}
