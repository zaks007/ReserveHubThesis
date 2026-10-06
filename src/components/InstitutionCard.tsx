import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { Institution, typeLabelMap, typeBadgeClass } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const InstitutionCard = ({ institution }: { institution: Institution }) => {
  return (
    <div className="h-full overflow-hidden rounded-lg border bg-card card-hover">
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={institution.image}
          alt={institution.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="flex min-h-[230px] flex-col p-5">
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
        <Button asChild className="w-full">
          <Link to={`/institutions/${institution.id}`}>View Details</Link>
        </Button>
      </div>
    </div>
  );
};

export default InstitutionCard;
