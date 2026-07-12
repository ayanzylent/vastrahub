import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { getMediaUrl } from "@/lib/media";
import type { ICollection } from "@/types";

export function CollectionCard({ col }: { col: ICollection }) {
  const image = col.bannerImage || col.image;
  return (
    <Link href={`/collections/${col.slug}`}>
      <Card className="group overflow-hidden hover:border-primary/30 transition-all duration-300">
        <CardContent className="p-0">
          <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center overflow-hidden">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getMediaUrl(image)}
                alt={col.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <span className="text-3xl font-heading font-bold text-primary/30 group-hover:text-primary/50 transition-colors">
                {col.name[0]}
              </span>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-heading text-lg font-semibold group-hover:text-primary transition-colors">
              {col.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
              {col.description || `${col.productCount} products`}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
