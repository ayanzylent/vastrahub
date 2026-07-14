import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "success"
  | "warning"
  | "info"
  | "neutral"
  | "danger";

const toneClasses: Record<StatusTone, string> = {
  success:
    "border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  warning:
    "border-transparent bg-amber-500/15 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  info: "border-transparent bg-sky-500/15 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  neutral: "border-transparent bg-muted text-muted-foreground",
  danger:
    "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20",
};

/**
 * Semantic status pill built on the (strictly-vega) Badge primitive.
 * Use for admin/storefront status indicators so colour carries meaning
 * instead of a single brand colour everywhere.
 */
export function StatusBadge({
  tone,
  className,
  ...props
}: React.ComponentProps<typeof Badge> & { tone: StatusTone }) {
  return <Badge className={cn(toneClasses[tone], className)} {...props} />;
}
