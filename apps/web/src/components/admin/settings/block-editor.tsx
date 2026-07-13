"use client";

import type { ComponentType } from "react";
import { Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  IHomepageBlock,
  ICategoryShowcaseBlock,
  ICollectionShowcaseBlock,
  IFeaturedProductsBlock,
  IVideoEmbedBlock,
  IBannerBlock,
  IImageMosaicBlock,
  IImageMosaicItem,
  ILogoMarqueeBlock,
  ILogoMarqueeItem,
  VideoProvider,
  IVideoEmbedItem,
  BlockType,
} from "@/types";
import { ResponsiveImageField } from "./responsive-image-field";
import { LogoImageField } from "./logo-image-field";
import { CategoryPicker, CollectionPicker, ProductPicker } from "./item-pickers";
import { toEmbedSrc } from "@/lib/video-embed";
import { SITE_SETTINGS_LIMITS } from "@/constants";
import { TextField, Segmented, SectionLabel, selectCls } from "./fields";

function blockConfig<T>(block: { config?: T }, fallback: T): T {
  return block.config ?? fallback;
}

// ---------- Per-type editors ----------

function CategoryShowcaseEditor({
  block,
  onChange,
}: {
  block: ICategoryShowcaseBlock;
  onChange: (b: IHomepageBlock) => void;
}) {
  const c = blockConfig(block, { categoryIds: [], layout: "grid" as const });
  const set = (patch: Partial<ICategoryShowcaseBlock["config"]>) =>
    onChange({ ...block, config: { ...c, ...patch } });
  return (
    <div className="space-y-4">
      <TextField label="Title" value={c.title ?? ""} onChange={(v) => set({ title: v || undefined })} maxLength={120} />
      <TextField label="Subtitle" value={c.subtitle ?? ""} onChange={(v) => set({ subtitle: v || undefined })} maxLength={200} />
      <Segmented
        label="Layout"
        value={c.layout}
        onChange={(v) => set({ layout: v })}
        options={[
          { value: "grid", label: "Grid" },
          { value: "carousel", label: "Carousel" },
        ]}
      />
      <div className="space-y-2">
        <SectionLabel>Categories</SectionLabel>
        <CategoryPicker ids={c.categoryIds} onChange={(ids) => set({ categoryIds: ids })} />
      </div>
    </div>
  );
}

function CollectionShowcaseEditor({
  block,
  onChange,
}: {
  block: ICollectionShowcaseBlock;
  onChange: (b: IHomepageBlock) => void;
}) {
  const c = blockConfig(block, { collectionIds: [], layout: "grid" as const });
  const set = (patch: Partial<ICollectionShowcaseBlock["config"]>) =>
    onChange({ ...block, config: { ...c, ...patch } });
  return (
    <div className="space-y-4">
      <TextField label="Title" value={c.title ?? ""} onChange={(v) => set({ title: v || undefined })} maxLength={120} />
      <TextField label="Subtitle" value={c.subtitle ?? ""} onChange={(v) => set({ subtitle: v || undefined })} maxLength={200} />
      <Segmented
        label="Layout"
        value={c.layout ?? "grid"}
        onChange={(v) => set({ layout: v })}
        options={[
          { value: "grid", label: "Grid" },
          { value: "carousel", label: "Carousel" },
        ]}
      />
      <div className="space-y-2">
        <SectionLabel>Collections</SectionLabel>
        <CollectionPicker ids={c.collectionIds} onChange={(ids) => set({ collectionIds: ids })} />
      </div>
    </div>
  );
}

function FeaturedProductsEditor({
  block,
  onChange,
}: {
  block: IFeaturedProductsBlock;
  onChange: (b: IHomepageBlock) => void;
}) {
  const c = blockConfig(block, { productIds: [], layout: "grid" as const });
  const set = (patch: Partial<IFeaturedProductsBlock["config"]>) =>
    onChange({ ...block, config: { ...c, ...patch } });
  return (
    <div className="space-y-4">
      <TextField label="Title" value={c.title ?? ""} onChange={(v) => set({ title: v || undefined })} maxLength={120} />
      <TextField label="Subtitle" value={c.subtitle ?? ""} onChange={(v) => set({ subtitle: v || undefined })} maxLength={200} />
      <Segmented
        label="Layout"
        value={c.layout ?? "grid"}
        onChange={(v) => set({ layout: v })}
        options={[
          { value: "grid", label: "Grid" },
          { value: "carousel", label: "Carousel" },
        ]}
      />
      <div className="space-y-2">
        <SectionLabel>Products</SectionLabel>
        <ProductPicker ids={c.productIds} onChange={(ids) => set({ productIds: ids })} />
      </div>
    </div>
  );
}

function VideoEmbedEditor({
  block,
  onChange,
}: {
  block: IVideoEmbedBlock;
  onChange: (b: IHomepageBlock) => void;
}) {
  const c = blockConfig(block, { videos: [] });
  const set = (patch: Partial<IVideoEmbedBlock["config"]>) =>
    onChange({ ...block, config: { ...c, ...patch } });

  function updateVideo(index: number, patch: Partial<IVideoEmbedItem>) {
    set({ videos: c.videos.map((v, i) => (i === index ? { ...v, ...patch } : v)) });
  }
  function addVideo() {
    set({ videos: [...c.videos, { provider: "youtube", url: "", caption: "" }] });
  }
  function removeVideo(index: number) {
    set({ videos: c.videos.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4">
      <TextField label="Title" value={c.title ?? ""} onChange={(v) => set({ title: v || undefined })} maxLength={120} />
      <TextField label="Subtitle" value={c.subtitle ?? ""} onChange={(v) => set({ subtitle: v || undefined })} maxLength={200} />

      <div className="space-y-3">
        <SectionLabel>Videos</SectionLabel>
        {c.videos.length === 0 && (
          <p className="rounded-md border border-dashed border-border/60 py-6 text-center text-sm text-muted-foreground">
            No videos yet.
          </p>
        )}
        {c.videos.map((v, i) => {
          const check = v.url.trim() ? toEmbedSrc(v.provider, v.url) : null;
          return (
            <div key={i} className="space-y-2 rounded-md border border-border/50 p-3">
              <div className="flex items-center gap-2">
                <select
                  value={v.provider}
                  onChange={(e) => updateVideo(i, { provider: e.target.value as VideoProvider })}
                  className={`${selectCls} max-w-[140px]`}
                >
                  <option value="youtube">YouTube</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-8 w-8 text-destructive"
                  onClick={() => removeVideo(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={v.url}
                onChange={(e) => updateVideo(i, { url: e.target.value })}
                placeholder="Paste the video/reel URL"
                maxLength={600}
              />
              <Input
                value={v.caption ?? ""}
                onChange={(e) => updateVideo(i, { caption: e.target.value || undefined })}
                placeholder="Caption (optional)"
                maxLength={160}
              />
              {check && (
                <p
                  className={`flex items-center gap-1.5 text-xs ${
                    check.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                  }`}
                >
                  {check.ok ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  {check.ok ? "Valid embed" : check.error}
                </p>
              )}
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVideo}
          disabled={c.videos.length >= SITE_SETTINGS_LIMITS.MAX_VIDEOS_PER_BLOCK}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add video
        </Button>
      </div>
    </div>
  );
}

function BannerEditor({
  block,
  onChange,
}: {
  block: IBannerBlock;
  onChange: (b: IHomepageBlock) => void;
}) {
  const c = blockConfig(block, {});
  const set = (patch: Partial<IBannerBlock["config"]>) =>
    onChange({ ...block, config: { ...c, ...patch } });
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <SectionLabel>Banner image (per device)</SectionLabel>
        <p className="text-xs text-muted-foreground">
          Upload at least one image for any device — missing sizes fall back automatically (e.g.
          desktop-only art is used on tablet and mobile).
        </p>
        <ResponsiveImageField instanceId={block.id} value={c.image} onChange={(img) => set({ image: img })} />
      </div>
      <TextField
        label="Link (optional)"
        value={c.href ?? ""}
        onChange={(v) => set({ href: v || undefined })}
        placeholder="/collections/sale or https://…"
        maxLength={500}
      />
      <div className="space-y-2">
        <Label>Alt text (optional)</Label>
        <Input
          value={c.alt ?? ""}
          onChange={(e) => set({ alt: e.target.value || undefined })}
          placeholder="Describe the banner for accessibility"
          maxLength={200}
        />
      </div>
    </div>
  );
}

const MOSAIC_SLOT_LABELS = [
  "Tall left",
  "Landscape top (middle / right)",
  "Landscape bottom (middle / left)",
  "Tall right",
] as const;

function ImageMosaicEditor({
  block,
  onChange,
}: {
  block: IImageMosaicBlock;
  onChange: (b: IHomepageBlock) => void;
}) {
  const c = blockConfig(block, { items: [{}, {}, {}, {}] as IImageMosaicItem[] });
  const items = [...(c.items ?? [])];
  while (items.length < 4) items.push({});
  const padded = items.slice(0, 4);

  function setItem(index: number, patch: Partial<IImageMosaicItem>) {
    const next = padded.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ ...block, config: { ...c, items: next } });
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Upload all 4 tiles. Desktop shows tall | stacked landscapes | tall; tablet and mobile use
        an interlocking 2-column layout.
      </p>
      {padded.map((item, index) => (
        <div key={index} className="space-y-3 rounded-lg border border-border/60 p-3">
          <SectionLabel>
            Tile {index + 1} — {MOSAIC_SLOT_LABELS[index]}
          </SectionLabel>
          <ResponsiveImageField
            instanceId={`${block.id}-${index}`}
            value={item.image}
            onChange={(img) => setItem(index, { image: img })}
          />
          <TextField
            label="Title / label (optional)"
            value={item.title ?? ""}
            onChange={(v) => setItem(index, { title: v || undefined })}
            placeholder="e.g. BESTSELLERS"
            maxLength={80}
          />
          <TextField
            label="Promo badge (optional)"
            value={item.badge ?? ""}
            onChange={(v) => setItem(index, { badge: v || undefined })}
            placeholder="e.g. BUY 2 GET 1 FREE"
            maxLength={60}
          />
          <TextField
            label="Link (optional)"
            value={item.href ?? ""}
            onChange={(v) => setItem(index, { href: v || undefined })}
            placeholder="/collections/sale or https://…"
            maxLength={500}
          />
          <div className="space-y-2">
            <Label>Alt text (optional)</Label>
            <Input
              value={item.alt ?? ""}
              onChange={(e) => setItem(index, { alt: e.target.value || undefined })}
              placeholder="Describe the image for accessibility"
              maxLength={200}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function LogoMarqueeEditor({
  block,
  onChange,
}: {
  block: ILogoMarqueeBlock;
  onChange: (b: IHomepageBlock) => void;
}) {
  const c = blockConfig(block, { items: [] as ILogoMarqueeItem[] });
  const set = (patch: Partial<ILogoMarqueeBlock["config"]>) =>
    onChange({ ...block, config: { ...c, ...patch } });

  function updateItem(index: number, patch: Partial<ILogoMarqueeItem>) {
    set({ items: c.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) });
  }
  function addItem() {
    set({ items: [...c.items, {}] });
  }
  function removeItem(index: number) {
    set({ items: c.items.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4">
      <TextField
        label="Title"
        value={c.title ?? ""}
        onChange={(v) => set({ title: v || undefined })}
        placeholder="Trusted by"
        maxLength={120}
      />

      <div className="space-y-3">
        <SectionLabel>Logos</SectionLabel>
        <p className="text-xs text-muted-foreground">
          Add at least 2 logos. Upload a dark-mode variant when the light logo would be hard to
          see on dark backgrounds (black vs white marks).
        </p>
        {c.items.length === 0 && (
          <p className="rounded-md border border-dashed border-border/60 py-6 text-center text-sm text-muted-foreground">
            No logos yet.
          </p>
        )}
        {c.items.map((item, i) => (
          <div key={i} className="space-y-3 rounded-md border border-border/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <SectionLabel>Logo {i + 1}</SectionLabel>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => removeItem(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <LogoImageField
                instanceId={`${block.id}-${i}-light`}
                value={item.imageKey}
                onChange={(key) => updateItem(i, { imageKey: key })}
                label="Light mode"
                hint="Required"
                required
              />
              <LogoImageField
                instanceId={`${block.id}-${i}-dark`}
                value={item.imageKeyDark}
                onChange={(key) => updateItem(i, { imageKeyDark: key })}
                label="Dark mode"
                hint="Optional"
                emptyHint="Falls back to inverted light logo"
              />
            </div>
            <TextField
              label="Link (optional)"
              value={item.href ?? ""}
              onChange={(v) => updateItem(i, { href: v || undefined })}
              placeholder="/collections/partners or https://…"
              maxLength={500}
            />
            <div className="space-y-2">
              <Label>Alt text (optional)</Label>
              <Input
                value={item.alt ?? ""}
                onChange={(e) => updateItem(i, { alt: e.target.value || undefined })}
                placeholder="Describe the logo for accessibility"
                maxLength={200}
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={c.items.length >= SITE_SETTINGS_LIMITS.MAX_LOGO_MARQUEE_ITEMS}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add logo
        </Button>
      </div>
    </div>
  );
}

// ---------- Dispatcher ----------

export function BlockEditor({
  block,
  onChange,
}: {
  block: IHomepageBlock;
  onChange: (b: IHomepageBlock) => void;
}) {
  const Editor = BLOCK_EDITORS[block.type] as ComponentType<{
    block: typeof block;
    onChange: (block: IHomepageBlock) => void;
  }> | undefined;
  return Editor
    ? <Editor block={block} onChange={onChange} />
    : <p className="text-sm text-muted-foreground">This block type is not supported by this editor.</p>;
}

const BLOCK_EDITORS = {
  categoryShowcase: CategoryShowcaseEditor,
  collectionShowcase: CollectionShowcaseEditor,
  featuredProducts: FeaturedProductsEditor,
  videoEmbed: VideoEmbedEditor,
  banner: BannerEditor,
  imageMosaic: ImageMosaicEditor,
  logoMarquee: LogoMarqueeEditor,
} satisfies Record<BlockType, ComponentType<never>>;
