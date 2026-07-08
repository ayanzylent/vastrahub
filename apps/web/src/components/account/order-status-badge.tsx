import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

/** Human-readable label for each order status. */
const STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "Pending",
  [OrderStatus.CONFIRMED]: "Confirmed",
  [OrderStatus.PROCESSING]: "Processing",
  [OrderStatus.SHIPPED]: "Shipped",
  [OrderStatus.OUT_FOR_DELIVERY]: "Out for Delivery",
  [OrderStatus.DELIVERED]: "Delivered",
  [OrderStatus.CANCELLED]: "Cancelled",
  [OrderStatus.RETURN_REQUESTED]: "Return Requested",
  [OrderStatus.RETURN_APPROVED]: "Return Approved",
  [OrderStatus.RETURN_PICKED_UP]: "Return Picked Up",
  [OrderStatus.RETURNED]: "Returned",
  [OrderStatus.REFUNDED]: "Refunded",
  [OrderStatus.FAILED]: "Failed",
};

/**
 * Tone classes per status, using semantic tokens plus the emerald accent
 * already used elsewhere in the storefront for positive states.
 */
const STATUS_TONE: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "bg-muted text-muted-foreground",
  [OrderStatus.CONFIRMED]: "bg-primary/10 text-primary",
  [OrderStatus.PROCESSING]: "bg-primary/10 text-primary",
  [OrderStatus.SHIPPED]: "bg-primary/10 text-primary",
  [OrderStatus.OUT_FOR_DELIVERY]: "bg-primary/10 text-primary",
  [OrderStatus.DELIVERED]:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  [OrderStatus.CANCELLED]: "bg-destructive/10 text-destructive",
  [OrderStatus.RETURN_REQUESTED]: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  [OrderStatus.RETURN_APPROVED]: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  [OrderStatus.RETURN_PICKED_UP]: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  [OrderStatus.RETURNED]: "bg-muted text-muted-foreground",
  [OrderStatus.REFUNDED]: "bg-muted text-muted-foreground",
  [OrderStatus.FAILED]: "bg-destructive/10 text-destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const label = STATUS_LABEL[status] ?? status;
  const tone = STATUS_TONE[status] ?? "bg-muted text-muted-foreground";
  return (
    <Badge variant="secondary" className={cn("border-transparent", tone)}>
      {label}
    </Badge>
  );
}
