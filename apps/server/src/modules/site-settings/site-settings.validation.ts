/**
 * Business-rule validation for site settings updates.
 * TypeBox enforces shape; these checks enforce admin-facing rules.
 */

import type {
  ICta,
  IHeroConfig,
  IHomepageBlock,
  IAnnouncementBar,
  IProductPageConfig,
} from '../../types/index.js';
import { ValidationError } from '../../lib/errors.js';
import { hasResponsiveImage } from '../../lib/responsive-image.js';
import { toEmbedSrc } from '../../lib/video-embed.js';

function validateOptionalLinkPair(
  text: string | undefined,
  href: string | undefined,
  fieldLabel: string,
): void {
  const hasText = !!text?.trim();
  const hasHref = !!href?.trim();
  if (hasText !== hasHref) {
    throw new ValidationError(
      `${fieldLabel} must include both link text and URL, or be left empty.`,
    );
  }
}

function validateCta(cta: ICta | undefined, fieldLabel: string): void {
  if (!cta) return;
  const hasLabel = cta.label.trim().length > 0;
  const hasHref = cta.href.trim().length > 0;
  if (hasLabel !== hasHref) {
    throw new ValidationError(
      `${fieldLabel} must include both button text and a link, or be left empty.`,
    );
  }
}

export function validateHero(hero: IHeroConfig): void {
  if (hero.slides.length === 0) {
    throw new ValidationError('The hero needs at least one slide.');
  }

  for (const slide of hero.slides) {
    validateCta(slide.primaryCta, 'Primary button');
    validateCta(slide.secondaryCta, 'Secondary button');
  }

  if (!hero.slides.some((slide) => slide.enabled)) {
    throw new ValidationError('At least one hero slide must be enabled.');
  }
}

export function validateAnnouncement(bar: IAnnouncementBar): void {
  if (bar.enabled && !bar.messages.some((message) => message.trim())) {
    throw new ValidationError('The announcement bar needs at least one message.');
  }
  validateOptionalLinkPair(bar.linkText, bar.linkHref, 'Announcement bar link');
}

export function validateProductPage(productPage: IProductPageConfig): void {
  const { minDays, maxDays } = productPage.estimatedDelivery;
  if (minDays > maxDays) {
    throw new ValidationError('Estimated delivery minimum days cannot exceed maximum days');
  }

  validateOptionalLinkPair(
    productPage.returnAndExchange.linkText,
    productPage.returnAndExchange.linkHref,
    'Return and exchange link',
  );
  validateOptionalLinkPair(
    productPage.shippingInformation.linkText,
    productPage.shippingInformation.linkHref,
    'Shipping information link',
  );
  validateOptionalLinkPair(
    productPage.sellerInformation.linkText,
    productPage.sellerInformation.linkHref,
    'Seller information link',
  );
}

export function validateHomepageBlocks(blocks: IHomepageBlock[]): void {
  for (const block of blocks) {
    if (block.type === 'banner' && block.enabled && !hasResponsiveImage(block.config?.image)) {
      throw new ValidationError(
        'Enabled image banner blocks require at least one image (desktop, tablet, or mobile).',
      );
    }

    if (block.type === 'imageMosaic' && block.enabled) {
      const items = block.config?.items ?? [];
      const allFilled =
        items.length === 4 && items.every((item) => hasResponsiveImage(item.image));
      if (!allFilled) {
        throw new ValidationError(
          'Enabled image mosaic blocks require an image on all 4 tiles.',
        );
      }
    }

    if (block.type === 'logoMarquee' && block.enabled) {
      const withLogo = (block.config?.items ?? []).filter(
        (item) => typeof item.imageKey === 'string' && item.imageKey.trim().length > 0,
      );
      if (withLogo.length < 2) {
        throw new ValidationError(
          'Enabled logo marquee blocks require at least 2 logos.',
        );
      }
    }

    if (block.type === 'videoEmbed' && block.enabled) {
      for (const video of block.config.videos) {
        const url = video.url.trim();
        if (!url) {
          throw new ValidationError('Remove empty video rows or fill in every video URL.');
        }
        if (!toEmbedSrc(video.provider, url).ok) {
          throw new ValidationError('One or more video URLs are invalid — fix or remove them.');
        }
      }
    }
  }
}

export interface SiteSettingsValidationInput {
  hero: IHeroConfig;
  homepageBlocks: IHomepageBlock[];
  announcementBar: IAnnouncementBar;
  productPage: IProductPageConfig;
}

export function assertValidSettings(input: SiteSettingsValidationInput): void {
  validateHero(input.hero);
  validateAnnouncement(input.announcementBar);
  validateProductPage(input.productPage);
  validateHomepageBlocks(input.homepageBlocks);
}
