import type { VideoProvider } from '../types/index.js';

/**
 * Safe social-video embedding.
 *
 * We NEVER render provider-supplied embed HTML. Instead we validate the URL
 * against a host allowlist, extract the id/path we recognise, and build a
 * provider-specific iframe `src` that WE control. Kept in sync with
 * apps/web/src/lib/video-embed.ts (no shared package).
 */

export interface EmbedResult {
  ok: boolean;
  src?: string;
  error?: string;
}

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com']);
const FACEBOOK_HOSTS = new Set(['facebook.com', 'www.facebook.com', 'web.facebook.com', 'fb.watch']);

function parseHttps(url: string): URL | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  return u;
}

function youtubeId(u: URL): string | null {
  if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
  if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null;
  if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null;
  return u.searchParams.get('v');
}

/** Validate `url` for `provider` and return a safe iframe src. */
export function toEmbedSrc(provider: VideoProvider, url: string): EmbedResult {
  const u = parseHttps(url);
  if (!u) return { ok: false, error: 'Enter a valid https:// URL' };

  switch (provider) {
    case 'youtube': {
      if (!YOUTUBE_HOSTS.has(u.hostname)) return { ok: false, error: 'Not a YouTube URL' };
      const id = youtubeId(u);
      if (!id || !/^[\w-]{6,20}$/.test(id)) {
        return { ok: false, error: 'Could not find the YouTube video id' };
      }
      return { ok: true, src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    case 'instagram': {
      if (!INSTAGRAM_HOSTS.has(u.hostname)) return { ok: false, error: 'Not an Instagram URL' };
      const m = u.pathname.match(/^\/(p|reel|tv)\/([\w-]+)\/?/);
      if (!m) return { ok: false, error: 'Use a post/reel URL, e.g. instagram.com/reel/XXXX' };
      return { ok: true, src: `https://www.instagram.com/${m[1]}/${m[2]}/embed` };
    }
    case 'facebook': {
      if (!FACEBOOK_HOSTS.has(u.hostname)) return { ok: false, error: 'Not a Facebook URL' };
      return {
        ok: true,
        src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u.toString())}&show_text=false`,
      };
    }
    default:
      return { ok: false, error: 'Unsupported provider' };
  }
}
