"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, RotateCcw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { toEmbedSrc } from "@/lib/video-embed";
import { hasResponsiveImage } from "@/lib/responsive-image";
import type { IHeroConfig, IHomepageBlock, IAnnouncementBar, IProductPageConfig } from "@/types";
import {
  DEFAULT_HERO,
  DEFAULT_ANNOUNCEMENT_BAR,
  DEFAULT_PRODUCT_PAGE,
  DEFAULT_HOMEPAGE_BLOCKS,
} from "@/constants";
import { HeroEditor } from "@/components/admin/settings/hero-editor";
import { HomepageBuilder } from "@/components/admin/settings/homepage-builder";
import { AnnouncementBarEditor } from "@/components/admin/settings/announcement-bar-editor";
import { ProductPageEditor } from "@/components/admin/settings/product-page-editor";
import { revalidateHome } from "./actions";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SiteSettingsPayload {
  hero: IHeroConfig;
  homepageBlocks: IHomepageBlock[];
  announcementBar: IAnnouncementBar;
  productPage: IProductPageConfig;
}

function validate(
  hero: IHeroConfig,
  blocks: IHomepageBlock[],
  announcement: IAnnouncementBar,
  productPage: IProductPageConfig,
): string | null {
  if (hero.slides.length === 0) return "The hero needs at least one slide.";
  if (hero.slides.some((slide) => !slide.heading.trim())) return "Every hero slide needs a heading.";
  if (announcement.enabled && !announcement.messages.some((message) => message.trim())) {
    return "The announcement bar needs at least one message.";
  }
  if (productPage.estimatedDelivery.minDays > productPage.estimatedDelivery.maxDays) {
    return "Estimated delivery minimum days cannot exceed maximum days.";
  }
  if (productPage.sections.some((section) => !section.title.trim() || !section.content.trim())) {
    return "Every product information section needs a title and content.";
  }
  for (const b of blocks) {
    if (b.type === "banner" && b.enabled && !hasResponsiveImage(b.config?.image)) {
      return "Enabled image banners need at least one image (desktop, tablet, or mobile).";
    }
    if (b.type === "videoEmbed") {
      for (const v of b.config.videos) {
        if (v.url.trim() && !toEmbedSrc(v.provider, v.url).ok) {
          return "One or more video URLs are invalid — fix or remove them.";
        }
      }
    }
  }
  return null;
}

export default function AdminSettingsPage() {
  const { data: sessionData } = useSession();
  const userRole = sessionData?.user?.role;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [hero, setHero] = useState<IHeroConfig>(DEFAULT_HERO);
  const [blocks, setBlocks] = useState<IHomepageBlock[]>(DEFAULT_HOMEPAGE_BLOCKS);
  const [announcement, setAnnouncement] = useState<IAnnouncementBar>(DEFAULT_ANNOUNCEMENT_BAR);
  const [productPage, setProductPage] = useState<IProductPageConfig>(DEFAULT_PRODUCT_PAGE);

  const router = useRouter();

  useEffect(() => {
    if (sessionData && userRole === "admin") {
      router.replace("/admin/dashboard");
    }
  }, [sessionData, userRole, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.get<SiteSettingsPayload>("/api/v1/admin/site-settings");
      if (cancelled) return;
      if (res.success && res.data) {
        setHero(res.data.hero ?? DEFAULT_HERO);
        setBlocks(res.data.homepageBlocks ?? DEFAULT_HOMEPAGE_BLOCKS);
        setAnnouncement(res.data.announcementBar ?? DEFAULT_ANNOUNCEMENT_BAR);
        setProductPage(res.data.productPage ?? DEFAULT_PRODUCT_PAGE);
      } else {
        toast.error(res.error || "Failed to load settings");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (sessionData && userRole !== "superadmin") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            Special permissions are required to access this page.
          </p>
          <Button variant="default" asChild>
            <Link href="/admin/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  async function handleSave() {
    const err = validate(hero, blocks, announcement, productPage);
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const res = await api.put<SiteSettingsPayload>("/api/v1/admin/site-settings", {
        hero,
        homepageBlocks: blocks,
        announcementBar: announcement,
        productPage,
      });
      if (res.success) {
        toast.success("Settings saved");
        revalidateHome().catch(() => {});
      } else {
        toast.error(res.error || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      const res = await api.post<SiteSettingsPayload>("/api/v1/admin/site-settings/reset");
      if (res.success && res.data) {
        setHero(res.data.hero ?? DEFAULT_HERO);
        setBlocks(res.data.homepageBlocks ?? DEFAULT_HOMEPAGE_BLOCKS);
        setAnnouncement(res.data.announcementBar ?? DEFAULT_ANNOUNCEMENT_BAR);
        setProductPage(res.data.productPage ?? DEFAULT_PRODUCT_PAGE);
        toast.success("Reset to defaults");
        revalidateHome().catch(() => {});
        setResetOpen(false);
      } else {
        toast.error(res.error || "Failed to reset");
      }
    } catch {
      toast.error("Failed to reset");
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure homepage, announcement bar, and product page settings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setResetOpen(true)}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="announcement">Announcement bar</TabsTrigger>
          <TabsTrigger value="product">Product page</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <div className="max-w-2xl">
            <HeroEditor value={hero} onChange={setHero} />
          </div>
        </TabsContent>

        <TabsContent value="homepage">
          <HomepageBuilder blocks={blocks} onChange={setBlocks} />
        </TabsContent>

        <TabsContent value="announcement">
          <div className="max-w-2xl">
            <AnnouncementBarEditor value={announcement} onChange={setAnnouncement} />
          </div>
        </TabsContent>

        <TabsContent value="product">
          <div className="max-w-3xl">
            <ProductPageEditor value={productPage} onChange={setProductPage} />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset settings to defaults?</DialogTitle>
            <DialogDescription>
              This deletes the current site settings and recreates a clean default with only a hero
              slide. Homepage blocks, announcement bar, and product page content will be cleared.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={resetting}>
              {resetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
