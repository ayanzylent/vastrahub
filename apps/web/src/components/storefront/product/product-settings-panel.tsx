"use client";

import {
  Banknote,
  CalendarDays,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { IProductPageBadges, IProductPageConfig } from "@/types";
import { PRODUCT_PAGE_BADGE_FIELDS } from "@/constants";
import { formatDeliveryRange } from "@/lib/delivery-date";

const BADGE_ICONS: Record<keyof IProductPageBadges, LucideIcon> = {
  easyReturn: RotateCcw,
  easyReplacement: RefreshCw,
  cod: Banknote,
  freeDelivery: Truck,
  authentic: ShieldCheck,
};

const BADGE_META = PRODUCT_PAGE_BADGE_FIELDS.map((field) => ({
  ...field,
  Icon: BADGE_ICONS[field.key],
}));

export function ProductSettingsPanel({ settings }: { settings: IProductPageConfig }) {
  const activeBadges = BADGE_META.filter((badge) => settings.badges[badge.key]);
  const showDelivery = settings.estimatedDelivery.enabled;

  if (!showDelivery && activeBadges.length === 0) return null;

  return (
    <div className="space-y-3">
      {showDelivery && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="rounded-md bg-primary/10 p-2">
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estimated delivery</p>
            <p className="text-sm font-semibold">{formatDeliveryRange(settings.estimatedDelivery)}</p>
          </div>
        </div>
      )}

      {activeBadges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeBadges.map(({ key, label, Icon }) => (
            <div
              key={key}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5 text-xs font-medium"
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
