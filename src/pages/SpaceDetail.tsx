import { useParams, useNavigate } from "react-router-dom";
import { Users, Check, Clock, DollarSign } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Breadcrumbs from "@/components/Breadcrumbs";
import ImageGallery from "@/components/ImageGallery";
import RoomAvailabilityCalendar from "@/components/RoomAvailabilityCalendar";
import { getSpaceById, defaultPriceUnit, priceUnitLabel, PriceUnit } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";
import { useAuth, isUniversityUserRole } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";
import { useInstitutions } from "@/contexts/InstitutionsContext";

const SpaceDetail = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createBooking } = useBookings();
  const { institutions } = useInstitutions();

  const result = useMemo(() => {
    const id = spaceId || "";
    for (const institution of institutions) {
      for (const campus of institution.campuses || []) for (const building of campus.buildings) {
        const space = building.spaces.find((s) => s.id === id);
        if (space) return { space, building, institution, campus };
      }
      for (const building of institution.buildings || []) {
        const space = building.spaces.find((s) => s.id === id);
        if (space) return { space, building, institution, campus: undefined };
      }
    }
    return getSpaceById(id);
  }, [institutions, spaceId]);

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [units, setUnits] = useState<number>(1);

  if (!result) {
    return <div className="container py-20 text-center"><p className="text-lg text-muted-foreground">Space not found.</p></div>;
  }

  const { space, building, institution, campus } = result;

  const isUniSpace = institution.type === "university";
  const isInternalUni = !!user && isUniversityUserRole(user.role);
  const isFreeAndInstant = isUniSpace && isInternalUni;
  const unit: PriceUnit = space.priceUnit || defaultPriceUnit[institution.type];
  const effectivePrice = isFreeAndInstant ? 0 : space.pricePerHour;

  const totalPrice = (() => {
    if (effectivePrice === 0) return 0;
    if (unit === "hour") {
      if (!startTime || !endTime || startTime >= endTime) return 0;
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const hours = (eh + em / 60) - (sh + sm / 60);
      return Math.max(0, Math.round(hours * effectivePrice));
    }
    return effectivePrice * Math.max(1, units);
  })();

  const breadcrumbs = [
    { label: "Explore", to: "/institutions" },
    { label: institution.name, to: `/institutions/${institution.id}` },
    ...(campus ? [{ label: campus.name }] : []),
    { label: building.name },
    { label: space.name },
  ];

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role === "guest") {
      toast({ title: "Please log in to book", variant: "destructive" });
      navigate("/auth/login");
      return;
    }
    if (!date) {
      toast({ title: "Please choose a date", variant: "destructive" });
      return;
    }
    let bookStart = "00:00";
    let bookEnd = "23:59";
    if (unit === "hour") {
      if (!startTime || !endTime) {
        toast({ title: "Please fill in start and end time", variant: "destructive" });
        return;
      }
      if (startTime >= endTime) {
        toast({ title: "End time must be after start time", variant: "destructive" });
        return;
      }
      bookStart = startTime;
      bookEnd = endTime;
    } else {
      if (units < 1) {
        toast({ title: `Please enter at least 1 ${unit}`, variant: "destructive" });
        return;
      }
    }
    const durationLabel =
      unit === "hour"
        ? `${bookStart}–${bookEnd}`
        : unit === "night"
        ? `${units} night${units > 1 ? "s" : ""}`
        : `${units} month${units > 1 ? "s" : ""}`;

    const res = await createBooking(
      {
        spaceId: space.id,
        spaceName: `${space.name} · ${durationLabel}`,
        institutionId: institution.id,
        institutionName: institution.name,
        buildingName: building.name,
        campusId: campus?.id,
        date,
        startTime: bookStart,
        endTime: bookEnd,
        capacity: space.capacity,
        userEmail: user.email,
      },
      { autoApprove: isFreeAndInstant, free: isFreeAndInstant }
    );
    if (!res.ok) {
      toast({ title: "Booking conflict", description: res.error, variant: "destructive" });
      return;
    }
    toast({
      title: isFreeAndInstant ? "Booking confirmed!" : "Booking submitted!",
      description: isFreeAndInstant
        ? "Free instant booking for university users."
        : "Your request is now pending approval.",
    });
    navigate("/my-bookings");
  };

  const priceLabel = effectivePrice === 0
    ? "Free"
    : `${effectivePrice.toLocaleString()} HUF / ${priceUnitLabel[unit]}`;

  const spaceGalleryImages = space.images && space.images.length > 0
    ? space.images
    : [space.image].filter(Boolean);

  return (
    <div className="container py-4">
      <Breadcrumbs items={breadcrumbs} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <ImageGallery images={spaceGalleryImages} alt={space.name} />
          </div>
          <h1 className="text-3xl font-bold mb-4">{space.name}</h1>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card border rounded-lg p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Capacity</p>
              <p className="font-bold text-lg">{space.capacity}</p>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Price / {priceUnitLabel[unit]}</p>
              <p className="font-bold text-lg">
                {effectivePrice === 0 ? "Free" : `${effectivePrice.toLocaleString()} HUF`}
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={`font-bold text-lg ${space.available ? "text-success" : "text-destructive"}`}>
                {space.available ? "Available" : "Occupied"}
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-3">Features & Amenities</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {space.features.map((f) => (
              <div key={f} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-3">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold mb-3">Availability Calendar</h2>
          <RoomAvailabilityCalendar spaceId={space.id} />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card border rounded-xl p-6 sticky top-24">
            <h3 className="text-xl font-bold mb-1">Reserve This Space</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {priceLabel} · {institution.name}
            </p>
            {isFreeAndInstant && (
              <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700">
                ✓ University access: free booking with instant confirmation.
              </div>
            )}
            {isUniSpace && !isInternalUni && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                External users: bookings require approval from the campus admin.
              </div>
            )}
            <form onSubmit={handleReserve} className="space-y-4">
              <div>
                <Label>{unit === "hour" ? "Date" : unit === "night" ? "Check-in date" : "Start date"}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
              </div>

              {unit === "hour" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Start</Label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>End</Label>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1" />
                  </div>
                </div>
              )}

              {unit !== "hour" && (
                <div>
                  <Label>Duration ({unit === "night" ? "nights" : "months"})</Label>
                  <Input
                    type="number"
                    min={1}
                    max={unit === "night" ? 30 : 24}
                    value={units}
                    onChange={(e) => setUnits(parseInt(e.target.value || "1", 10))}
                    className="mt-1"
                  />
                </div>
              )}

              {effectivePrice > 0 && totalPrice > 0 && (
                <div className="rounded-lg bg-secondary/60 px-3 py-2 text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">Estimated total</span>
                  <span className="font-bold">{totalPrice.toLocaleString()} HUF</span>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={!space.available}>
                {!space.available ? "Currently Unavailable" : isFreeAndInstant ? "Book Instantly (Free)" : "Submit Booking Request"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {isFreeAndInstant ? "Confirmed immediately for university members." : "Bookings require approval from the institution."}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceDetail;
