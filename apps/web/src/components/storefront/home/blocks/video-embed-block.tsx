import type { IVideoEmbedBlock } from "@/types";
import { toEmbedSrc } from "@/lib/video-embed";

export function VideoEmbedBlock({ block }: { block: IVideoEmbedBlock }) {
  const c = block.config;
  // Re-validate the stored (untrusted) URL before rendering an iframe.
  const items = (c.videos ?? [])
    .map((v) => ({ v, embed: toEmbedSrc(v.provider, v.url) }))
    .filter((x) => x.embed.ok && x.embed.src);

  if (items.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {(c.title || c.subtitle) && (
          <div className="mb-10">
            {c.title && (
              <h2 className="font-heading text-2xl md:text-3xl font-bold">{c.title}</h2>
            )}
            {c.subtitle && <p className="mt-2 text-muted-foreground">{c.subtitle}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(({ v, embed }, i) => {
            const aspect = v.provider === "youtube" ? "aspect-video" : "aspect-[4/5]";
            return (
              <div key={i} className="space-y-2">
                <div
                  className={`relative overflow-hidden rounded-xl border border-border/50 bg-muted ${aspect}`}
                >
                  <iframe
                    src={embed.src}
                    title={v.caption || "Embedded video"}
                    className="absolute inset-0 h-full w-full"
                    loading="lazy"
                    allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                {v.caption && <p className="text-sm text-muted-foreground">{v.caption}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
