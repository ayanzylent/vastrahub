/**
 * Resolves a media key to a full public URL.
 * If the input is already an absolute URL, it returns it as is.
 */
export function getMediaUrl(keyOrUrl: string | null | undefined): string {
  if (!keyOrUrl) return "";
  
  if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://") || keyOrUrl.startsWith("data:")) {
    return keyOrUrl;
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_MEDIA_URL || "";
  if (!baseUrl) {
    console.warn("NEXT_PUBLIC_MEDIA_URL is not set. Media links may be broken.");
  }

  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanKey = keyOrUrl.startsWith("/") ? keyOrUrl.slice(1) : keyOrUrl;
  
  return `${cleanBase}/${cleanKey}`;
}
