import { useSiteSettings, type AdSlot } from "@/hooks/useSiteSettings";

interface AdSlotProps {
  slot: "ad_top" | "ad_mid" | "ad_bottom";
  className?: string;
}

/**
 * Renders an admin-defined ad slot.
 * Supports either an uploaded image (PNG/JPG, optionally wrapped in a link)
 * or raw HTML / AdSense snippet. Returns null when disabled or empty.
 */
const AdSlotView = ({ slot, className = "" }: AdSlotProps) => {
  const { data: settings } = useSiteSettings();
  const ad: AdSlot | undefined = settings?.[slot];

  if (!ad?.enabled) return null;

  const hasImage = !!ad.image_url?.trim();
  const hasHtml = !!ad.html?.trim();
  if (!hasImage && !hasHtml) return null;

  return (
    <div className={`w-full bg-muted/30 border-y border-border ${className}`}>
      <div className="container py-3 flex justify-center">
        {hasImage ? (
          ad.link_url?.trim() ? (
            <a
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block max-w-full"
            >
              <img
                src={ad.image_url}
                alt={ad.alt || "advertisement"}
                loading="lazy"
                className="max-w-full h-auto max-h-32 object-contain rounded"
              />
            </a>
          ) : (
            <img
              src={ad.image_url}
              alt={ad.alt || "advertisement"}
              loading="lazy"
              className="max-w-full h-auto max-h-32 object-contain rounded"
            />
          )
        ) : (
          <div
            className="ad-slot max-w-full overflow-hidden text-center"
            // Admin-controlled HTML — only set by authenticated admins via RLS-protected site_settings
            dangerouslySetInnerHTML={{ __html: ad.html }}
          />
        )}
      </div>
    </div>
  );
};

export default AdSlotView;
