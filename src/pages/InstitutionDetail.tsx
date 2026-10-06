import { useParams, Link, useSearchParams } from "react-router-dom";
import { MapPin, Star, Users, DoorOpen, Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/Breadcrumbs";
import InstitutionMap, { MapMarker } from "@/components/InstitutionMap";
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

  // Build map markers based on the current view
  let mapMarkers: MapMarker[] = [];
  let mapTitle = "Location";

  if (hasCampuses && !selectedCampus) {
    // University overview — show all campuses
    mapMarkers = institution.campuses!
      .filter((c) => c.coords)
      .map((c) => ({ lat: c.coords!.lat, lng: c.coords!.lng, title: c.name, subtitle: c.address }));
    mapTitle = "Campuses on the map";
  } else if (selectedCampus) {
    // Campus detail — show faculty buildings
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
            <img src={institution.image} alt={institution.name} className="w-full h-full object-cover" />
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
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-2">Choose a campus</h2>
          <p className="text-muted-foreground mb-6">
            Pick a campus to view its available seminar rooms and lecture halls.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {institution.campuses!.map((campus) => {
              const spaceCount = campus.buildings.reduce((sum, b) => sum + b.spaces.length, 0);
              return (
                <Link
                  key={campus.id}
                  to={`/institutions/${institution.id}?campus=${campus.id}`}
                  className="bg-card border rounded-xl p-6 card-hover flex items-start gap-4"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{campus.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {campus.buildings.length} {campus.buildings.length === 1 ? "faculty" : "faculties"} · {spaceCount} rooms
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* University: selected campus drill-down */}
      {hasCampuses && selectedCampus && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{selectedCampus.name}</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/institutions/${institution.id}`}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> All campuses
              </Link>
            </Button>
          </div>
          {selectedCampus.buildings.map((building) => (
            <div key={building.id} className="mb-8">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-muted-foreground" />
                {building.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {building.spaces.map((space) => (
                  <SpaceCard key={space.id} space={space} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Non-university: buildings */}
      {!hasCampuses && institution.buildings.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Available Spaces</h2>
          {institution.buildings.map((building) => (
            <div key={building.id} className="mb-8">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-muted-foreground" />
                {building.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {building.spaces.map((space) => (
                  <SpaceCard key={space.id} space={space} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SpaceCard = ({ space }: { space: Space }) => {
  const unitShort = space.priceUnit === "night" ? "night" : space.priceUnit === "month" ? "mo" : "hr";
  return (
    <div className="bg-card rounded-lg border overflow-hidden card-hover">
      <div className="aspect-[16/10] overflow-hidden">
        <img src={space.image} alt={space.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <h4 className="font-semibold mb-1">{space.name}</h4>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
          <Users className="h-3.5 w-3.5" /> Capacity: {space.capacity}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {space.features.slice(0, 3).map((f) => (
            <span key={f} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{f}</span>
          ))}
          {space.features.length > 3 && (
            <span className="text-xs text-muted-foreground">+{space.features.length - 3}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-primary">
            {space.pricePerHour === 0 ? "Free" : `${space.pricePerHour.toLocaleString()} HUF/${unitShort}`}
          </span>
          {space.available ? (
            <Button size="sm" asChild>
              <Link to={`/spaces/${space.id}`}>Book Now</Link>
            </Button>
          ) : (
            <Button size="sm" disabled>Unavailable</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstitutionDetail;
