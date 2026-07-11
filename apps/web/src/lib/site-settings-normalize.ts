import { DEFAULT_ANNOUNCEMENT_BAR, DEFAULT_HERO, DEFAULT_PRODUCT_PAGE } from "@/constants";
import type {
  IAnnouncementBar,
  IHeroConfig,
  IHomepageBlock,
  IProductPageConfig,
} from "@/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export function normalizeHero(value: unknown): IHeroConfig {
  const raw = asRecord(value);
  if (Array.isArray(raw.slides)) {
    return {
      ...structuredClone(DEFAULT_HERO),
      ...raw,
      version: 1,
      slides: raw.slides.map((slide, index) => ({
        id: `hero-${index + 1}`,
        enabled: true,
        ...asRecord(slide),
      })),
    } as IHeroConfig;
  }
  return {
    ...structuredClone(DEFAULT_HERO),
    slides: [{ id: "legacy-hero", enabled: true, ...raw } as IHeroConfig["slides"][number]],
  };
}

export function normalizeAnnouncement(value: unknown): IAnnouncementBar {
  const raw = asRecord(value);
  if (Array.isArray(raw.messages)) {
    return {
      ...structuredClone(DEFAULT_ANNOUNCEMENT_BAR),
      ...raw,
      version: 1,
      messages: raw.messages.map(String),
    } as IAnnouncementBar;
  }
  return {
    ...structuredClone(DEFAULT_ANNOUNCEMENT_BAR),
    ...raw,
    version: 1,
    mode: "simple",
    messages: [typeof raw.message === "string" ? raw.message : ""],
  } as IAnnouncementBar;
}

export function normalizeProductPage(value: unknown): IProductPageConfig {
  const raw = asRecord(value);
  const delivery = asRecord(raw.estimatedDelivery);
  return {
    ...structuredClone(DEFAULT_PRODUCT_PAGE),
    ...raw,
    version: 1,
    estimatedDelivery: { ...DEFAULT_PRODUCT_PAGE.estimatedDelivery, ...delivery },
    sections: Array.isArray(raw.sections)
      ? raw.sections.map((section, index) => ({
          id: `product-info-${index + 1}`,
          version: 1,
          enabled: true,
          ...asRecord(section),
        })) as IProductPageConfig["sections"]
      : structuredClone(DEFAULT_PRODUCT_PAGE.sections),
  };
}

export function normalizeHomepageBlocks(value: unknown): IHomepageBlock[] {
  return Array.isArray(value)
    ? value.map((block) => ({ version: 1, ...asRecord(block) })) as IHomepageBlock[]
    : [];
}
