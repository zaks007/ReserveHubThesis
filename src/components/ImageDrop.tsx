import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

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

export default function ImageDrop({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handle = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    onChange(await toCompressedDataUrl(file));
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]); }}
      className={`relative flex min-h-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed text-sm text-muted-foreground transition-colors ${over ? "border-primary bg-primary/5" : "border-border bg-secondary/40"}`}
    >
      {value ? (
        <>
          <img src={value} alt="Preview" className="h-32 w-full object-cover" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 p-4 text-center">
          <ImagePlus className="h-6 w-6" />
          <span>Drag & drop a picture here, or click to choose</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handle(e.target.files?.[0] ?? undefined)} />
    </div>
  );
}
