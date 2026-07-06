import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Static promotional CTA at the bottom of the homepage. Intentionally NOT
 * admin-configurable — it's fixed marketing copy shipped in code.
 */
export function CtaBanner() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 md:p-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-0 h-[300px] w-[300px] rounded-full bg-chart-2/10 blur-3xl" />
          </div>
          <div className="relative text-center">
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-primary-foreground">
              Get 20% Off Your First Order
            </h2>
            <p className="mt-4 text-primary-foreground/80 max-w-lg mx-auto">
              Sign up today and get exclusive access to our newest collections plus ₹500 off on your
              first purchase.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button variant="secondary" size="lg" asChild>
                <Link href="/signup">Create Account</Link>
              </Button>
              <Button variant="secondary" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
