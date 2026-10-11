import { useParams, useNavigate } from "react-router-dom";
import { Users, Check, Clock, DollarSign, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getSpaceById, defaultPriceUnit, priceUnitLabel, PriceUnit } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";
import { useAuth, isUniversityUserRole } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";
import { useInstitutions } from "@/contexts/InstitutionsContext";

// Helper to add days to an ISO YYYY-MM-DD string without timezone skew
function addDays(isoDate: string, days: number): string {
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const nextY = dt.getFullYear();
  const nextM = String(dt.getMonth() + 1).padStart(2, "0");
  const nextD = String(dt.getDate()).padStart(2, "0");
  return `${nextY}-${nextM}-${nextD}`;
}

const SpaceDetail = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createBooking, getBookingsForSpace } = useBookings();
  const { institutions } = useInstitutions();

  const result = useMemo(() => {
    const id = spaceId || "";
    for (const institution of institutions) {
      for (const campus of institution.campuses || []) {
        for (const building of campus.buildings) {
          const space = building.spaces.find((s) => s.id === id);
          if (space) return { space, building, institution, campus };
        }
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
  const [units, setUnits] = useState<number>(1); // # of nights or months
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!result) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg text-muted-foreground">Space not found.</p>
      </div>
    );
  }

  const { space, building, institution, campus } = result;

  // Multi-image collection for space
  const images: string[] = useMemo(() => {
    const list: string[] = [];
    if (space.images && Array.isArray(space.images) && space.images.length > 0) {
      list.push(...space.images.filter(Boolean));
    }
    if (space.image && !list.includes(space.image)) {
      list.unshift(space.image);
    }
    return list.length > 0 ? list : [space.image || "/placeholder.svg"];
  }, [space]);

  const activeImage = images[currentImageIndex] || images[0];

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
      const hours = eh + em / 60 - (sh + sm / 60);
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

  // Active bookings for this specific space
  const activeBookings = useMemo(() => {
    return getBookingsForSpace(space.id).filter(
      (b) => b.status === "approved" || b.status === "pending"
    );
  }, [getBookingsForSpace, space.id]);

  // Taken time slots for the chosen date (per-hour spaces)
  const bookedSlotsOnDate = useMemo(() => {
    if (!date || unit !== "hour") return [];
    return activeBookings
      .filter((b) => b.date === date)
      .map((b) => `${b.startTime}–${b.endTime}`);
  }, [activeBookings, date, unit]);

  // Conflict detection based on booking type
  const conflictMessage = useMemo(() => {
    if (!date) return null;

    if (unit === "hour") {
      if (!startTime || !endTime || startTime >= endTime) return null;
      const overlap = activeBookings.find(
        (b) => b.date === date && startTime < b.endTime && b.startTime < endTime
      );
      if (overlap) {
        return `Someone has already booked this space on this day from ${overlap.startTime} to ${overlap.endTime}. Please choose another time window or date.`;
      }
      return null;
    }

    if (unit === "night") {
      const nightCount = Math.max(1, units || 1);
      const requestedNights: string[] = [];
      for (let i = 0; i < nightCount; i++) {
        requestedNights.push(addDays(date, i));
      }

      const bookedNight = activeBookings.find((b) => requestedNights.includes(b.date));
      if (bookedNight) {
        return `Someone has already booked this space for the night of ${bookedNight.date}. Please select different dates.`;
      }
      return null;
    }

    // Default / per-month: match starting date or overlapping day
    const matched = activeBookings.find((b) => b.date === date);
    if (matched) {
      return `Someone has already booked this space on ${date}. Please select another date.`;
    }
    return null;
  }, [activeBookings, date, startTime, endTime, unit, units]);

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

    // Block submission if conflict detected
    if (conflictMessage) {
      toast({
        title: "Already Booked",
        description: conflictMessage,
        variant: "destructive",
      });
      return;
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
      toast({
        title: "Booking conflict",
        description: res.error || "Someone has already booked that day or time.",
        variant: "destructive",
      });
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

  const priceLabel =
    effectivePrice === 0
      ? "Free"
      : `${effectivePrice.toLocaleString()} HUF / ${priceUnitLabel[unit]}`;

  return (
    <div className="container py-4">
      <Breadcrumbs items={breadcrumbs} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Main Space Photo & Carousel */}
          <div className="relative rounded-xl overflow-hidden aspect-[16/9] mb-4 bg-muted group">
            <img
              src={activeImage}
              alt={space.name}
              className="w-full h-full object-cover transition-opacity duration-200"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
                  }
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition shadow"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition shadow"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-3 right-3 text-xs bg-black/70 text-white px-2 py-1 rounded">
                  {currentImageIndex + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {/* Thumbnails if multiple images exist */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${
                    idx === currentImageIndex
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

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
              <p
                className={`font-bold text-lg ${
                  space.available ? "text-success" : "text-destructive"
                }`}
              >
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
        </div>

        {/* Booking Card */}
        <div className="lg:col-span-1">
          <div className="bg-card border rounded-xl p-6 sticky top-24">
            <h3 className="text-xl font-bold mb-1">Reserve This Space</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {priceLabel} · {institution.name}
            </p>

            {isFreeAndInstant && (
              <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                ✓ University access: free booking with instant confirmation.
              </div>
            )}
            {isUniSpace && !isInternalUni && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                External users: bookings require approval from the campus admin.
              </div>
            )}

            <form onSubmit={handleReserve} className="space-y-4">
              <div>
                <Label>
                  {unit === "hour"
                    ? "Date"
                    : unit === "night"
                    ? "Check-in date"
                    : "Start date"}
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* For hourly spaces: show slots already taken today */}
              {unit === "hour" && date && bookedSlotsOnDate.length > 0 && (
                <div className="rounded-lg bg-secondary/50 p-2.5 text-xs">
                  <p className="text-muted-foreground font-medium mb-1">
                    Booked slots on this day:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {bookedSlotsOnDate.map((slot, i) => (
                      <span
                        key={i}
                        className="rounded bg-destructive/15 text-destructive px-2 py-0.5 font-medium"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {unit === "hour" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Start</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>End</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="mt-1"
                    />
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

              {/* Real-time Conflict Alert Message */}
              {conflictMessage && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Already Booked</p>
                    <p className="mt-0.5 leading-relaxed">{conflictMessage}</p>
                  </div>
                </div>
              )}

              {effectivePrice > 0 && totalPrice > 0 && !conflictMessage && (
                <div className="rounded-lg bg-secondary/60 px-3 py-2 text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">Estimated total</span>
                  <span className="font-bold">{totalPrice.toLocaleString()} HUF</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!space.available || !!conflictMessage}
              >
                {!space.available
                  ? "Currently Unavailable"
                  : conflictMessage
                  ? "Already Booked for this Time / Date"
                  : isFreeAndInstant
                  ? "Book Instantly (Free)"
                  : "Submit Booking Request"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                {isFreeAndInstant
                  ? "Confirmed immediately for university members."
                  : "Bookings require approval from the institution."}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceDetail;
