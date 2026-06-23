"use client";

import { useState } from "react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { DropZone } from "@heroui-pro/react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { SortableImage } from "@/components/dashboard/SortableImage";

type VillaImageManagerProps = {
  imageUrls: string[];
  villaId: string | undefined;
  onImagesChange: (urls: string[]) => void;
  onMainImageChange: (url: string) => void;
  onError: (msg: string) => void;
};

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function VillaImageManager({
  imageUrls,
  villaId,
  onImagesChange,
  onMainImageChange,
  onError,
}: VillaImageManagerProps) {
  const [uploading, setUploading] = useState(false);

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= imageUrls.length) return;
    const urls = [...imageUrls];
    [urls[index], urls[target]] = [urls[target], urls[index]];
    onImagesChange(urls);
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error("Supabase non disponible");

      const uploaded: string[] = [];

      for (const file of files) {
        if (file.size > MAX_SIZE) {
          onError(`« ${file.name} » dépasse 5 Mo`);
          continue;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          onError(`Format non accepté : ${file.name}`);
          continue;
        }

        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const filePath = `villas/${villaId || "new"}/${fileName}`;

        const { error: upErr } = await supabase.storage
          .from("villa-images")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (upErr) throw upErr;

        const { data: publicUrl } = supabase.storage.from("villa-images").getPublicUrl(filePath);
        uploaded.push(publicUrl.publicUrl);
      }

      if (uploaded.length > 0) {
        const next = [...imageUrls, ...uploaded];
        onImagesChange(next);
        if (imageUrls.length === 0) onMainImageChange(uploaded[0]!);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload échoué");
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = (fileList: FileList) => {
    void uploadFiles(Array.from(fileList));
  };

  const handleDrop = async (e: {
    items: Array<{ kind: string; getFile?: () => Promise<File> }>;
  }) => {
    const dropped: File[] = [];
    for (const item of e.items) {
      if (item.kind === "file" && item.getFile) {
        dropped.push(await item.getFile());
      }
    }
    void uploadFiles(dropped);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-navy/50">
          Photos ({imageUrls.length})
        </p>
      </div>

      <DropZone className="w-full">
        <DropZone.Area
          onDrop={handleDrop as never}
          className="rounded-xl border-2 border-dashed border-navy/15 bg-navy/[0.02] p-6 transition-colors hover:border-gold/50"
        >
          <DropZone.Icon className="text-gold" />
          <DropZone.Label className="font-sora text-sm text-navy">
            Glissez vos photos ici
          </DropZone.Label>
          <DropZone.Description className="text-xs text-muted">
            JPEG, PNG, WebP ou AVIF — max 5 Mo par fichier
          </DropZone.Description>
          <DropZone.Trigger>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-md border border-navy/15 bg-white px-3 py-2 text-sm font-medium text-navy transition-colors hover:bg-navy/5 cursor-pointer">
              <KayvilaPngIcon name="upload" size={18} alt="" />
              {uploading ? "Upload..." : "Parcourir"}
            </span>
          </DropZone.Trigger>
        </DropZone.Area>
        <DropZone.Input accept="image/jpeg,image/png,image/webp,image/avif" onSelect={handleSelect} />
      </DropZone>

      {imageUrls.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {imageUrls.map((url, idx) => (
            <SortableImage
              key={url}
              url={url}
              isPrimary={idx === 0}
              canMoveUp={idx > 0}
              canMoveDown={idx < imageUrls.length - 1}
              onMoveUp={() => moveImage(idx, -1)}
              onMoveDown={() => moveImage(idx, 1)}
              onSetPrimary={(newUrl) => {
                const urls = [...imageUrls];
                const currIdx = urls.indexOf(newUrl);
                if (currIdx > 0) {
                  [urls[0], urls[currIdx]] = [urls[currIdx], urls[0]];
                  onImagesChange(urls);
                }
              }}
              onRemove={(remUrl) => {
                onImagesChange(imageUrls.filter((u) => u !== remUrl));
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
