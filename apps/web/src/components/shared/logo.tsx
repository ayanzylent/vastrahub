import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  asLink?: boolean;
}

const sizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl md:text-3xl",
};

export function Logo({ size = "md", className, asLink = true }: LogoProps) {
  const content = (
    <span
      className={cn(
        "font-heading font-bold tracking-tight select-none",
        sizeClasses[size],
        className
      )}
    >
      <span className="gradient-text">Vastra</span>
      <span className="text-accent-400">Hub</span>
    </span>
  );

  if (asLink) {
    return (
      <Link href="/" className="flex items-center gap-1 transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }

  return content;
}
