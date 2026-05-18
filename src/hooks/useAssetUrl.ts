import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";

export function useAssetUrl(assetId?: string) {
  const asset = useLiveQuery(async () => (assetId ? db.assets.get(assetId) : undefined), [assetId]);
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!asset) {
      setUrl(undefined);
      return;
    }

    if (asset.kind === "external") {
      setUrl(asset.sourceUrl);
      return;
    }

    if (!asset.blob) {
      setUrl(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(asset.blob as Blob);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [asset]);

  return {
    asset,
    url,
  };
}

