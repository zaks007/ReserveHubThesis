import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Institution, typeLabelMap, typeBadgeClass } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const InstitutionCard = ({ institution }: { institution: Institution }) => {
  const images = (institution.images && institution.images.length > 0)
    ? institution.images
    : [institution.image].filter(Boolean);

  const [activeIdx, setActiveIdx] = useState(0);

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx((curr) => (curr === 0 ? images.length - 1 : curr - 1));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx((curr) => (curr === images.length - 1 ? 0 : curr + 1));
  };

  return (
    <div className="h-full overflow-hidden rounded-lg border bg-card card-hover flex flex-col group">
      {/* Photo carousel area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={images[activeIdx] || institution.image}
          alt={institution.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Previous / Next Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full opacity-90 transition-opacity z-10 shadow"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full opacity-90 transition-opacity z-10 shadow"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10 pointer-events-none">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIdx ? "w-3 bg-white shadow" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex min-h-[230px] flex-col p-5 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeBadgeClass[institution.type]}`}>
            {typeLabelMap[institution.type]}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            {institution.rating}
          </span>
        </div>
        <h3 className="font-bold text-lg mb-1">{institution.name}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="h-3.5 w-3.5" />
          {institution.city}
        </p>
        <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">
          {institution.description}
        </p>
        <Button asChild className="w-full mt-auto">
          <Link to={`/institutions/${institution.id}`}>View Details</Link>
        </Button>
      </div>
    </div>
  );
};

export default InstitutionCard;
