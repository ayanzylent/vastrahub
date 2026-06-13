import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-accent-500/5 blur-3xl" />
      </div>

      <div className="relative text-center space-y-6">
        <h1 className="font-heading text-8xl md:text-9xl font-bold gradient-text">
          404
        </h1>
        <h2 className="font-heading text-2xl md:text-3xl font-semibold">
          Page Not Found
        </h2>
        <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
          The page you&apos;re looking for seems to have wandered off like an
          unstitched fabric. Let&apos;s get you back on track.
        </p>
        <Button variant="brand" size="lg" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
