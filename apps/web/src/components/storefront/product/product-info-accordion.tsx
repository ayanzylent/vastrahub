"use client";

import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { IProductInfoBlock, IProductPageConfig } from "@/types";

function hasInfoBlock(block: IProductInfoBlock): boolean {
  const hasContent = !!block.content?.trim();
  const hasLink = !!block.linkText?.trim() && !!block.linkHref?.trim();
  return hasContent || hasLink;
}

interface ProductInfoAccordionProps {
  productDetails: Array<{ label: string; value: string }>;
  descriptionText: string;
  tags?: string[];
  productPageSettings: IProductPageConfig;
}

export function ProductInfoAccordion({
  productDetails,
  descriptionText,
  tags,
  productPageSettings,
}: ProductInfoAccordionProps) {
  const showReturnAndExchange = hasInfoBlock(productPageSettings.returnAndExchange);
  const showShippingInformation = hasInfoBlock(productPageSettings.shippingInformation);
  const showSellerInformation = hasInfoBlock(productPageSettings.sellerInformation);

  const accordionItems: string[] = [];
  if (productDetails.length > 0) accordionItems.push("details");
  if (descriptionText) accordionItems.push("description");
  if (showReturnAndExchange) accordionItems.push("return");
  if (showShippingInformation) accordionItems.push("shipping");
  if (showSellerInformation) accordionItems.push("seller");
  const defaultAccordionValue = accordionItems[0];

  if (accordionItems.length === 0) return null;

  return (
    <>
      <Separator />
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultAccordionValue}
        className="w-full"
      >
        {productDetails.length > 0 && (
          <AccordionItem value="details">
            <AccordionTrigger className="hover:no-underline">Product Details</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-0 overflow-hidden rounded-lg border border-border/50">
                {productDetails.map(({ label, value }, i) => (
                  <div
                    key={label}
                    className={cn(
                      "flex items-start gap-4 px-3 py-2.5 text-sm",
                      i % 2 === 0 ? "bg-muted/30" : "",
                    )}
                  >
                    <span className="w-[130px] shrink-0 text-xs text-muted-foreground">
                      {label}
                    </span>
                    <span className="flex-1 break-words text-xs font-medium">{value}</span>
                  </div>
                ))}
              </div>
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-3">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {descriptionText && (
          <AccordionItem value="description">
            <AccordionTrigger className="hover:no-underline">Description</AccordionTrigger>
            <AccordionContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {descriptionText}
              </p>
            </AccordionContent>
          </AccordionItem>
        )}

        {showReturnAndExchange && (
          <AccordionItem value="return">
            <AccordionTrigger className="hover:no-underline">Return and exchange</AccordionTrigger>
            <AccordionContent>
              {productPageSettings.returnAndExchange.content?.trim() && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {productPageSettings.returnAndExchange.content}
                </p>
              )}
              {productPageSettings.returnAndExchange.linkHref &&
                productPageSettings.returnAndExchange.linkText && (
                  <Link
                    href={productPageSettings.returnAndExchange.linkHref}
                    className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    {productPageSettings.returnAndExchange.linkText}
                  </Link>
                )}
            </AccordionContent>
          </AccordionItem>
        )}

        {showShippingInformation && (
          <AccordionItem value="shipping">
            <AccordionTrigger className="hover:no-underline">Shipping information</AccordionTrigger>
            <AccordionContent>
              {productPageSettings.shippingInformation.content?.trim() && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {productPageSettings.shippingInformation.content}
                </p>
              )}
              {productPageSettings.shippingInformation.linkHref &&
                productPageSettings.shippingInformation.linkText && (
                  <Link
                    href={productPageSettings.shippingInformation.linkHref}
                    className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    {productPageSettings.shippingInformation.linkText}
                  </Link>
                )}
            </AccordionContent>
          </AccordionItem>
        )}

        {showSellerInformation && (
          <AccordionItem value="seller">
            <AccordionTrigger className="hover:no-underline">Seller information</AccordionTrigger>
            <AccordionContent>
              {productPageSettings.sellerInformation.content?.trim() && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {productPageSettings.sellerInformation.content}
                </p>
              )}
              {productPageSettings.sellerInformation.linkHref &&
                productPageSettings.sellerInformation.linkText && (
                  <Link
                    href={productPageSettings.sellerInformation.linkHref}
                    className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    {productPageSettings.sellerInformation.linkText}
                  </Link>
                )}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </>
  );
}
