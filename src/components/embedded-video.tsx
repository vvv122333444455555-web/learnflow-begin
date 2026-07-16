/** Embeds a YouTube / Vimeo / raw mp4 video URL. Returns null if empty. */
export function EmbeddedVideo({ url }: { url?: string | null }) {
  if (!url) return null;
  const src = toEmbed(url);
  if (!src) return null;
  if (src.endsWith(".mp4") || src.endsWith(".webm")) {
    return (
      <video controls className="w-full rounded-xl aspect-video bg-black" src={src}>
        متصفحك لا يدعم تشغيل الفيديو.
      </video>
    );
  }
  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
      <iframe
        src={src}
        title="video"
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function toEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return url;
      if (u.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  } catch {
    return null;
  }
}
