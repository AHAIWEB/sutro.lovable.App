import { useSiteSettings, type AdSlot } from "@/hooks/useSiteSettings";

interface AdSlotProps {
  slot: "ad_top" | "ad_mid" | "ad_bottom";
  className?: string;
}

/**
 * Renders an admin-defined HTML ad slot.
 * Returns null when the slot is disabled or empty so it doesn't take layout space.
 */
const AdSlotView = ({ slot, className = "" }: AdSlotProps) => {
  const { data: settings } = useSiteSettings();
  const ad: AdSlot | undefined = settings?.[slot];

  if (!ad?.enabled || !ad.html?.trim()) return null;

  return (
    <div className={`w-full bg-muted/30 border-y border-border ${className}`}>
      <div className="container py-3 flex justify-center">
        <div
          className="ad-slot max-w-full overflow-hidden text-center"
          // Admin-controlled HTML — only set by authenticated admins via RLS-protected site_settings
          dangerouslySetInnerHTML={{ __html: ad.html }}
        />
      </div>
    </div>
  );
};

export default AdSlotView;
