"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** When provided, page controls render as crawlable links. */
  hrefForPage?: (page: number) => string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  hrefForPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  function renderControl(
    targetPage: number,
    content: React.ReactNode,
    options: { disabled?: boolean; active?: boolean; ariaLabel?: string },
  ) {
    const className = `h-9 w-9 ${options.active ? "bg-primary hover:bg-primary/90" : ""}`;

    if (hrefForPage && !options.disabled) {
      return (
        <Button
          variant={options.active ? "default" : "outline"}
          size="icon"
          className={className}
          asChild
        >
          <Link
            href={hrefForPage(targetPage)}
            aria-label={options.ariaLabel}
            aria-current={options.active ? "page" : undefined}
            onClick={(event) => {
              // Keep client listing state in sync without a full reload.
              event.preventDefault();
              onPageChange(targetPage);
            }}
          >
            {content}
          </Link>
        </Button>
      );
    }

    return (
      <Button
        variant={options.active ? "default" : "outline"}
        size="icon"
        className={className}
        disabled={options.disabled}
        aria-label={options.ariaLabel}
        aria-current={options.active ? "page" : undefined}
        onClick={() => onPageChange(targetPage)}
      >
        {content}
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      {renderControl(page - 1, <ChevronLeft className="h-4 w-4" />, {
        disabled: page <= 1,
        ariaLabel: "Previous page",
      })}
      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <span key={p}>
            {renderControl(p, p, {
              active: p === page,
              ariaLabel: `Page ${p}`,
            })}
          </span>
        ),
      )}
      {renderControl(page + 1, <ChevronRight className="h-4 w-4" />, {
        disabled: page >= totalPages,
        ariaLabel: "Next page",
      })}
    </div>
  );
}
