import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared vertical spacing between a block header and its content. */
export const HOME_BLOCK_HEADER_CLASS = "mb-6 md:mb-8";

/** Vertical gap between homepage blocks — applied in BlockRenderer. */
export const HOME_BLOCK_LIST_CLASS = "flex flex-col gap-8 md:gap-10 pt-8 md:pt-10";

export function HomeBlockSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(className)}>
      <div className="mx-auto max-w-7xl px-4 md:px-6">{children}</div>
    </section>
  );
}
