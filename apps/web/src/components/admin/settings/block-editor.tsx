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
  VideoProvider,
  IVideoEmbedItem,
  BlockType,
} from "@/types";
import { ResponsiveImageField } from "./responsive-image-field";
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
} satisfies Record<BlockType, ComponentType<never>>;
