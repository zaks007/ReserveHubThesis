import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  aspectRatio?: string;
}

export function ImageGallery({
  images,
  alt,
  aspectRatio = "aspect-[16/9]",
}: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const validImages = (images || []).filter(Boolean);

  if (validImages.length === 0) {
    return (
      <div className={`rounded-xl overflow-hidden bg-muted flex items-center justify-center ${aspectRatio}`}>
        <p className="text-sm text-muted-foreground">No image available</p>
      </div>
    );
  }

  const prev = () => setActiveIndex((i) => (i === 0 ? validImages.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i === validImages.length - 1 ? 0 : i + 1));

  return (
    <div className="space-y-3">
      {/* Main Display */}
      <div className={`relative rounded-xl overflow-hidden ${aspectRatio} bg-black/5 border`}>
        <img
          src={validImages[activeIndex]}
          alt={`${alt} - photo ${activeIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-300"
        />

        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 hover:bg-background text-foreground flex items-center justify-center shadow backdrop-blur-sm transition-transform active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 hover:bg-background text-foreground flex items-center justify-center shadow backdrop-blur-sm transition-transform active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
              {activeIndex + 1} / {validImages.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {validImages.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative shrink-0 h-16 w-24 rounded-lg overflow-hidden border-2 transition-all ${
                activeIndex === i ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : "border-border opacity-60 hover:opacity-100"
              }`}
            >
              <img src={url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
