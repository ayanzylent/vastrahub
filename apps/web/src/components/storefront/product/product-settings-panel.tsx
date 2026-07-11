"use client";

import Link from "next/link";
import {
  CalendarDays,
  CircleHelp,
  Info,
  RotateCcw,
  Shield,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { IProductPageConfig, ProductInfoIcon } from "@/types";
import { formatDeliveryRange } from "@/lib/delivery-date";

const ICONS = {
  rotate: RotateCcw,
  truck: Truck,
  store: Store,
  help: CircleHelp,
  info: Info,
  shield: Shield,
} satisfies Record<ProductInfoIcon, LucideIcon>;

export function ProductSettingsPanel({ settings }: { settings: IProductPageConfig }) {
  const sections = settings.sections.filter((section) => section.enabled);

  if (!settings.estimatedDelivery.enabled && sections.length === 0) return null;

  return (
    <div className="space-y-3">
      {settings.estimatedDelivery.enabled && (
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

      {sections.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {sections.map((section) => {
            const Icon = ICONS[section.icon] ?? Info;
            return (
              <div key={section.id} className="rounded-lg border border-border/50 bg-muted/30 p-3">
                <div className="flex items-start gap-2.5">
                  <div className="shrink-0 rounded-md bg-primary/10 p-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{section.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
                      {section.content}
                    </p>
                    {section.linkHref && section.linkText && (
                      <Link href={section.linkHref} className="mt-1.5 inline-block text-[11px] font-medium text-primary hover:underline">
                        {section.linkText}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
