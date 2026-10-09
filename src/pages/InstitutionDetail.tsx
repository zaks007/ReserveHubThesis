import { useParams, Link, useSearchParams } from "react-router-dom";
import { Star, MapPin, Building2, ArrowLeft } from "lucide-react";
import { useInstitutions } from "@/contexts/InstitutionsContext";
import { typeBadgeClass, typeLabelMap, type Space } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/Breadcrumbs";
import InstitutionMap, { type MapMarker } from "@/components/InstitutionMap";
import ImageGallery from "@/components/ImageGallery";

const InstitutionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const selectedCampusId = searchParams.get("campus");
  const { getById } = useInstitutions();
  const institution = id ? getById(id) : undefined;

  if (!institution) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Institution Not Found</h1>
        <p className="text-muted-foreground mb-6">The institution you are looking for does not exist.</p>
        <Button asChild>
          <Link to="/institutions">Back to Explore</Link>
        </Button>
      </div>
    );
  }

  const hasCampuses = (institution.campuses?.length ?? 0) > 0;
  const selectedCampus = hasCampuses && selectedCampusId
    ? institution.campuses!.find((c) => c.id === selectedCampusId)
    : undefined;

  const galleryImages = (institution.images && institution.images.length > 0)
    ? institution.images
    : (institution.image ? [institution.image] : []);

  let mapMarkers: MapMarker[] = [];
  let mapTitle = "Location";

  if (hasCampuses && !selectedCampus) {
    mapMarkers = institution.campuses!
      .filter((c) => c.coords || c.address || (c as any).maps_url || (c as any).mapsUrl)
      .map((c) => ({
        lat: c.coords?.lat,
        lng: c.coords?.lng,
        title: c.name,
        subtitle: c.address,
        mapsUrl: (c as any).maps_url || (c as any).mapsUrl,
      }));
    mapTitle = "Campuses on the map";
  } else if (selectedCampus) {
    mapMarkers = selectedCampus.buildings
      .filter((b) => b.coords || b.address || (b as any).maps_url || (b as any).mapsUrl)
      .map((b) => ({
        lat: b.coords?.lat,
        lng: b.coords?.lng,
        title: b.name,
        subtitle: b.address,
        mapsUrl: (b as any).maps_url || (b as any).mapsUrl,
      }));
    mapTitle = "Faculty buildings";
  } else if (institution.coords || institution.address || (institution as any).maps_url || (institution as any).mapsUrl) {
    mapMarkers = [{
      lat: institution.coords?.lat,
      lng: institution.coords?.lng,
      title: institution.name,
      subtitle: institution.address,
      mapsUrl: (institution as any).maps_url || (institution as any).mapsUrl,
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2">
          <ImageGallery images={galleryImages} alt={institution.name} aspectRatio="aspect-[16/9]" />
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

      {mapMarkers.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> {mapTitle}
          </h2>
          <InstitutionMap markers={mapMarkers} />
        </div>
      )}

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

      {selectedCampus && (
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{selectedCampus.name}</h2>
            {selectedCampus.address && (
              <p className="text-sm text-muted-foreground">{selectedCampus.address}</p>
            )}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={`/institutions/${institution.id}`}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> All Campuses
            </Link>
          </Button>
        </div>
      )}

      {(() => {
        const buildingsToRender = selectedCampus
          ? selectedCampus.buildings
          : hasCampuses
          ? []
          : institution.buildings;

        if (buildingsToRender.length === 0 && !hasCampuses) {
          return <p className="text-muted-foreground">No spaces available at this institution.</p>;
        }

        return (
          <div className="space-y-8">
            {buildingsToRender.map((building) => (
              <div key={building.id} className="bg-card border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> {building.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {building.spaces.map((space) => (
                    <SpaceCard
                      key={space.id}
                      space={space}
                      institutionId={institution.id}
                      institutionType={institution.type}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
};

function SpaceCard({
  space,
  institutionId,
  institutionType,
}: {
  space: Space;
  institutionId: string;
  institutionType: string;
}) {
  const isNight = institutionType === "hotel" || institutionType === "airbnb";
  const isMonth = institutionType === "garden";
  const unitLabel = space.priceUnit
    ? `/${space.priceUnit}`
    : isNight
    ? "/night"
    : isMonth
    ? "/month"
    : "/hour";

  return (
    <Link
      to={`/institutions/${institutionId}/spaces/${space.id}`}
      className="border rounded-lg overflow-hidden card-hover bg-background flex flex-col"
    >
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {space.image ? (
          <img src={space.image} alt={space.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-base">{space.name}</h4>
            <span
              className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                space.available ? "status-confirmed" : "status-cancelled"
              }`}
            >
              {space.available ? "Available" : "Unavailable"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Capacity: {space.capacity} people</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {space.features.slice(0, 3).map((f) => (
              <span key={f} className="text-[11px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                {f}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t mt-auto">
          <span className="text-sm font-semibold">
            {space.pricePerHour === 0 ? "Free" : `${space.pricePerHour.toLocaleString()} HUF ${unitLabel}`}
          </span>
          <span className="text-xs text-primary font-medium">View details →</span>
        </div>
      </div>
    </Link>
  );
}

export default InstitutionDetail;
