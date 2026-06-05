"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/supabase";
import { SortableImage } from "@/components/dashboard/SortableImage";

type VillaImageManagerProps = {
  imageUrls: string[];
  villaId: string | undefined;
  onImagesChange: (urls: string[]) => void;
  onMainImageChange: (url: string) => void;
  onError: (msg: string) => void;
};

export function VillaImageManager({
  imageUrls,
  villaId,
  onImagesChange,
  onMainImageChange,
  onError,
}: VillaImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= imageUrls.length) return;
    const urls = [...imageUrls];
    [urls[index], urls[target]] = [urls[target], urls[index]];
    onImagesChange(urls);
  };

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      onError("L'image ne doit pas dépasser 5 Mo");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.type)) {
      onError("Format accepté : JPEG, PNG, WebP ou AVIF");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error("Supabase non disponible");

      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const filePath = `villas/${villaId || "new"}/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from("villa-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (upErr) throw upErr;

      const { data: publicUrl } = supabase.storage
        .from("villa-images")
        .getPublicUrl(filePath);

      onImagesChange([...imageUrls, publicUrl.publicUrl]);
      if (imageUrls.length === 0) onMainImageChange(publicUrl.publicUrl);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload échoué");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-navy/50">
          Photos ({imageUrls.length})
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {uploading ? "Upload..." : "Ajouter"}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleUpload}
        className="hidden"
        aria-hidden
      />

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
                const urls = imageUrls.filter((u) => u !== remUrl);
                onImagesChange(urls);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed border-navy/10 bg-navy/[0.02] text-[11px] text-navy/55">
          Aucune photo. Cliquez sur Ajouter pour en uploader.
        </div>
      )}
    </div>
  );
}
