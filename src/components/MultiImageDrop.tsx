import { useRef, useState } from "react";
import { ImagePlus, X, Star } from "lucide-react";

const toCompressedDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 1280;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

export interface MultiImageDropProps {
  values?: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

export function MultiImageDrop({ values = [], onChange, maxImages = 10 }: MultiImageDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFiles = async (fileList?: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setLoading(true);
    try {
      const imageFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      const newUrls = await Promise.all(imageFiles.map(toCompressedDataUrl));
      const combined = [...values, ...newUrls].slice(0, maxImages);
      onChange(combined);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const setAsCover = (index: number) => {
    if (index === 0) return;
    const selected = values[index];
    const rest = values.filter((_, i) => i !== index);
    onChange([selected, ...rest]);
  };

  return (
    <div className="space-y-3">
      {/* Upload Drop Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative flex min-h-[110px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-4 text-sm text-muted-foreground transition-colors ${
          over ? "border-primary bg-primary/5" : "border-border bg-secondary/30 hover:bg-secondary/50"
        }`}
      >
        <div className="flex flex-col items-center gap-1.5 text-center">
          <ImagePlus className="h-6 w-6 text-primary" />
          <span className="font-medium text-foreground">
            {loading ? "Processing photos…" : "Upload photos (click or drag & drop)"}
          </span>
          <span className="text-xs text-muted-foreground">Select multiple images at once · Max {maxImages}</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Previews Grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {values.map((url, idx) => (
            <div key={idx} className="group relative aspect-[4/3] rounded-lg overflow-hidden border bg-muted">
              <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute left-1.5 top-1.5 flex items-center gap-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Cover
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAsCover(idx);
                    }}
                    className="p-1.5 rounded-full bg-background/90 text-foreground hover:bg-background text-xs"
                    title="Set as main cover photo"
                  >
                    Set cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(idx);
                  }}
                  className="p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiImageDrop;
