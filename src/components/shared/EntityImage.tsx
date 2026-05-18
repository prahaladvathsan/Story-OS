import { ImageIcon } from "lucide-react";
import { useAssetUrl } from "../../hooks/useAssetUrl";
import { cn } from "../../lib/utils";

type EntityImageProps = {
  assetId?: string;
  alt: string;
  className?: string;
};

export function EntityImage({ assetId, alt, className }: EntityImageProps) {
  const { url } = useAssetUrl(assetId);

  if (!url) {
    return (
      <div
        className={cn(
          "flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-[color:var(--line)] bg-white/40 text-[color:var(--muted)] dark:bg-white/5",
          className,
        )}
      >
        <ImageIcon size={18} />
      </div>
    );
  }

  return <img src={url} alt={alt} className={cn("aspect-[4/3] rounded-2xl object-cover", className)} />;
}

