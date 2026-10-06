import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InstitutionCard from "@/components/InstitutionCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { institutions as baseInstitutions, InstitutionType, typeLabelMap } from "@/data/mockData";
import { useInstitutions } from "@/contexts/InstitutionsContext";
import { useBookings } from "@/contexts/BookingsContext";
import { institutionMatchesSearch } from "@/lib/searchFilters";

const types: (InstitutionType | "all")[] = ["all", "hotel", "university", "sports", "garden", "airbnb"];

// Static derived data (features / cities) is fine off the base mock data —
// admin overrides only tweak labels, not the structural taxonomy.
const allFeatures = Array.from(new Set(baseInstitutions.flatMap(i =>
  (i.campuses?.flatMap(c => c.buildings.flatMap(b => b.spaces.flatMap(s => s.features))) || [])
    .concat(i.buildings.flatMap(b => b.spaces.flatMap(s => s.features)))
))).sort();

const cities = Array.from(new Set(baseInstitutions.map(i => i.city))).sort();

const InstitutionList = () => {
  const [searchParams] = useSearchParams();
  const { institutions } = useInstitutions();
  const { bookings } = useBookings();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = useState<InstitutionType | "all">((searchParams.get("type") as any) || "all");
  const [city, setCity] = useState<string>("all");
  const [minCapacity, setMinCapacity] = useState<string>(searchParams.get("guests") || "");
  const [feature, setFeature] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("to") || "");

  const filtered = useMemo(() => {
    return institutions.filter((inst) => {
      if (typeFilter !== "all" && inst.type !== typeFilter) return false;
      if (city !== "all" && inst.city !== city) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!inst.name.toLowerCase().includes(q) && !inst.city.toLowerCase().includes(q) && !inst.description.toLowerCase().includes(q)) return false;
      }
      const allSpaces = (inst.campuses?.flatMap(c => c.buildings.flatMap(b => b.spaces)) || []).concat(inst.buildings.flatMap(b => b.spaces));
      if (minCapacity && !allSpaces.some(s => s.capacity >= Number(minCapacity))) return false;
      if (feature !== "all" && !allSpaces.some(s => s.features.includes(feature))) return false;
      if (!institutionMatchesSearch(inst, { guests: Number(minCapacity) || 0, from: dateFrom, to: dateTo }, bookings)) return false;
      return true;
    });
  }, [institutions, query, typeFilter, city, minCapacity, feature, dateFrom, dateTo, bookings]);

  const reset = () => { setQuery(""); setTypeFilter("all"); setCity("all"); setMinCapacity(""); setFeature("all"); setDateFrom(""); setDateTo(""); };
  const hasFilters = query || typeFilter !== "all" || city !== "all" || minCapacity || feature !== "all" || dateFrom;

  return (
    <div className="container py-4">
      <Breadcrumbs items={[{ label: "Explore Institutions" }]} />

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-card border rounded-lg px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search institutions..." className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-4 w-4 mr-1" /> Filters {hasFilters && <span className="ml-1 bg-primary text-primary-foreground rounded-full text-[10px] px-1.5">on</span>}
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {types.map((t) => (
          <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(t)}>
            {t === "all" ? "All" : typeLabelMap[t]}
          </Button>
        ))}
      </div>

      {showFilters && (
        <div className="bg-card border rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">City</label>
            <select className="w-full h-9 rounded-md border bg-background px-3 text-sm" value={city} onChange={e => setCity(e.target.value)}>
              <option value="all">All cities</option>
              {cities.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Min capacity</label>
            <Input type="number" min={0} placeholder="Any" value={minCapacity} onChange={e => setMinCapacity(e.target.value)} className="h-9" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Feature</label>
            <select className="w-full h-9 rounded-md border bg-background px-3 text-sm" value={feature} onChange={e => setFeature(e.target.value)}>
              <option value="all">Any feature</option>
              {allFeatures.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          {hasFilters && (
            <div className="md:col-span-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={reset}><X className="h-4 w-4 mr-1" /> Clear filters</Button>
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground mb-6">
        {filtered.length} institution{filtered.length !== 1 ? "s" : ""} found
        {dateFrom && ` · free ${dateFrom}${dateTo && dateTo !== dateFrom ? ` → ${dateTo}` : ""}`}
        {minCapacity && ` · ${minCapacity}+ guests`}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((inst) => <InstitutionCard key={inst.id} institution={inst} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <SlidersHorizontal className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No institutions found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default InstitutionList;
