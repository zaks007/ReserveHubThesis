import { useParams, Link, useSearchParams } from "react-router-dom";
import { MapPin, Star, Users, DoorOpen, Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/Breadcrumbs";
import InstitutionMap, { MapMarker } from "@/components/InstitutionMap";
import ImageGallery from "@/components/ImageGallery";
import { typeLabelMap, typeBadgeClass } from "@/data/mockData";
import type { Space } from "@/data/mockData";
import { useInstitutions } from "@/contexts/InstitutionsContext";

const InstitutionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { getById } = useInstitutions();
  const institution = getById(id || "");

  if (!institution) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg text-muted-foreground">Institution not found.</p>
      </div>
    );
  }

  const hasCampuses = institution.campuses && institution.campuses.length > 0;
  const selectedCampusId = searchParams.get("campus");
  const selectedCampus = hasCampuses
    ? institution.campuses!.find((c) => c.id === selectedCampusId)
    : undefined;

  let mapMarkers: MapMarker[] = [];
  let mapTitle = "Location";

  if (hasCampuses && !selectedCampus) {
    mapMarkers = institution.campuses!
      .filter((c) => c.coords)
      .map((c) => ({ lat: c.coords!.lat, lng: c.coords!.lng, title: c.name, subtitle: c.address }));
    mapTitle = "Campuses on the map";
  } else if (selectedCampus) {
    mapMarkers = selectedCampus.buildings
      .filter((b) => b.coords)
      .map((b) => ({ lat: b.coords!.lat, lng: b.coords!.lng, title: b.name, subtitle: b.address }));
    mapTitle = "Faculty buildings";
  } else if (institution.coords) {
    mapMarkers = [{
      lat: institution.coords.lat,
      lng: institution.coords.lng,
      title: institution.name,
      subtitle: institution.address,
    }];
    mapTitle = "Location";
  }

  const galleryImages = institution.images && institution.images.length > 0
    ? institution.images
    : [institution.image].filter(Boolean);

  return (
    <div className="container py-4">
      <Breadcrumbs items={[
        { label: "Explore", to: "/institutions" },
        { label: institution.name, to: `/institutions/${institution.id}` },
        ...(selectedCampus ? [{ label: selectedCampus.name }] : []),
      ]} />

      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2">
          <div className="rounded-xl overflow-hidden aspect-[16/9]">
            <ImageGallery images={galleryImages} alt={institution.name} />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <span className={`self-start text-xs font-semibold px-3 py-1 rounded-full mb-3 ${typeBadgeClass[institution.type]}`}>
            {typeLabelMap[institution.type]}
          </span>
          <h1 className="text-3xl font-bold mb-2">{institution.name}</h1>
          <p className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <MapPin className="h-4 w-4" /> {institution.city}
          </p>
          <p className="flex items-center gap-1.5 text-muted-foreground mb-4">
            <Star className="h-4 w-4 fill-accent text-accent" /> {institution.rating} rating
          </p>
          <p className="text-foreground/80">{institution.description}</p>
        </div>
      </div>

      {/* Map */}
      {mapMarkers.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> {mapTitle}
          </h2>
          <InstitutionMap markers={mapMarkers} />
        </div>
      )}

      {/* University: campus list first */}
      {hasCampuses && !selectedCampus && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Campuses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {institution.campuses!.map((campus) => {
              const totalRooms = campus.buildings.reduce((sum, b) => sum + b.spaces.length, 0);
              return (
                <div key={campus.id} className="bg-card border rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{campus.name}</h3>
                    {campus.address && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                        <MapPin className="h-3.5 w-3.5" /> {campus.address}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" /> {campus.buildings.length} Buildings
                      </span>
                      <span className="flex items-center gap-1">
                        <DoorOpen className="h-4 w-4" /> {totalRooms} Spaces
                      </span>
                    </div>
                  </div>
                  <Button asChild className="w-full">
                    <Link to={`/institutions/${institution.id}?campus=${campus.id}`}>
                      View Faculty Buildings
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Campus detail view */}
      {selectedCampus && (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <Button asChild variant="outline" size="sm">
              <Link to={`/institutions/${institution.id}`}>
                <ArrowLeft className="h-4 w-4 mr-1" /> All Campuses
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{selectedCampus.name}</h2>
              {selectedCampus.address && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {selectedCampus.address}
                </p>
              )}
            </div>
          </div>
          <BuildingList buildings={selectedCampus.buildings} institutionId={institution.id} />
        </div>
      )}

      {/* Non-university institutions: buildings and rooms */}
      {!hasCampuses && institution.buildings.length > 0 && (
        <BuildingList buildings={institution.buildings} institutionId={institution.id} />
      )}
    </div>
  );
};

const BuildingList = ({ buildings, institutionId }: { buildings: { id: string; name: string; address?: string; spaces: Space[] }[]; institutionId: string }) => (
  <div className="space-y-8">
    {buildings.map((building) => (
      <div key={building.id}>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold">{building.name}</h3>
          {building.address && (
            <span className="text-sm text-muted-foreground flex items-center gap-1 ml-2">
              <MapPin className="h-3.5 w-3.5" /> {building.address}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {building.spaces.map((space) => (
            <div key={space.id} className="bg-card border rounded-lg overflow-hidden card-hover flex flex-col">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={space.image} alt={space.name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h4 className="font-bold text-base mb-1">{space.name}</h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {space.capacity}</span>
                  <span className="font-semibold text-foreground">
                    {space.pricePerHour === 0 ? "Free" : `${space.pricePerHour.toLocaleString()} HUF / ${space.priceUnit || "hour"}`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {space.features.slice(0, 3).map((f) => (
                    <span key={f} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{f}</span>
                  ))}
                  {space.features.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{space.features.length - 3}</span>
                  )}
                </div>
                <div className="mt-auto">
                  {space.available ? (
                    <Button asChild className="w-full" size="sm">
                      <Link to={`/spaces/${space.id}`}>Book Now</Link>
                    </Button>
                  ) : (
                    <Button className="w-full" size="sm" disabled variant="secondary">Unavailable</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default InstitutionDetail;
