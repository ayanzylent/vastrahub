import type { IVideoEmbedBlock } from "@/types";
import { toEmbedSrc } from "@/lib/video-embed";
import { VideoEmbedScroll } from "./video-embed-scroll";
import { HOME_BLOCK_HEADER_CLASS, HomeBlockSection } from "./home-block-section";

export function VideoEmbedBlock({ block }: { block: IVideoEmbedBlock }) {
  const c = block.config ?? { videos: [] };
  // Re-validate the stored (untrusted) URL before rendering an iframe.
  const items = (c.videos ?? [])
    .map((v) => {
      const embed = toEmbedSrc(v.provider, v.url);
      if (!embed.ok || !embed.src) return null;
      return {
        provider: v.provider,
        caption: v.caption,
        embedSrc: embed.src,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (items.length === 0) return null;

  return (
    <HomeBlockSection>
      {(c.title || c.subtitle) && (
        <div className={HOME_BLOCK_HEADER_CLASS}>
          {c.title && (
            <h2 className="font-heading text-2xl md:text-3xl font-bold">{c.title}</h2>
          )}
          {c.subtitle && <p className="mt-2 text-muted-foreground">{c.subtitle}</p>}
        </div>
      )}

      <VideoEmbedScroll items={items} />
    </HomeBlockSection>
  );
}
