import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MultiImageDrop from "@/components/MultiImageDrop";
import { useInstitutions, type StructureTable } from "@/contexts/InstitutionsContext";
import type { Institution, InstitutionType, PriceUnit } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

export type StructureTab = "campuses" | "buildings" | "rooms";
type Editing = { table: StructureTable; id: string | null; form: Record<string, any> } | null;
const UUID_RE = /^[0-9a-f-]{36}$/i;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
    {children}
  </div>
);

// Hierarchy rules per institution type:
// i. Hotel: Institution > Spaces (rooms)
// ii. University: Institution > Campuses > Buildings > Spaces
// iii. Sports Facility: Institution > Buildings > Spaces (time-based)
// iv. Community Garden: Institution > Spaces (plots)
// v. Airbnb: Institution > Spaces (units)
export function getAllowedTabs(type: InstitutionType): StructureTab[] {
  switch (type) {
    case "university":
      return ["campuses", "buildings", "rooms"];
    case "sports":
      return ["buildings", "rooms"];
    case "hotel":
    case "garden":
    case "airbnb":
    default:
      return ["rooms"];
  }
}

export function getTabDisplayNames(type: InstitutionType): Record<StructureTab, string> {
  switch (type) {
    case "hotel":
      return { campuses: "Campuses", buildings: "Buildings", rooms: "Hotel Rooms & Suites" };
    case "garden":
      return { campuses: "Campuses", buildings: "Sections", rooms: "Garden Plots" };
    case "airbnb":
      return { campuses: "Campuses", buildings: "Properties", rooms: "Units & Listings" };
    case "sports":
      return { campuses: "Campuses", buildings: "Facilities & Arenas", rooms: "Courts & Spaces" };
    case "university":
    default:
      return { campuses: "Campuses", buildings: "Faculty Buildings", rooms: "Lecture Halls & Rooms" };
  }
}

export function structureLists(institution: Institution) {
  const campuses = institution.campuses || [];
  const buildings = [
    ...campuses.flatMap((c) =>
      c.buildings.map((b) => ({
        ...b,
        campusId: c.id as string | undefined,
        campus: c.name as string | undefined,
      }))
    ),
    ...institution.buildings.map((b) => ({
      ...b,
      campusId: undefined,
      campus: undefined,
    })),
  ];
  const rooms = buildings.flatMap((b) =>
    b.spaces.map((s) => ({
      ...s,
      buildingId: b.id,
      building: b.name,
    }))
  );
  return { campuses, buildings, rooms };
}

export default function InstitutionStructureEditor({
  institution,
  tab: fixedTab,
}: {
  institution: Institution;
  tab?: StructureTab;
}) {
  const { saveRow, deleteRow } = useInstitutions();
  const allowedTabs = useMemo(() => getAllowedTabs(institution.type), [institution.type]);
  const tabNames = useMemo(() => getTabDisplayNames(institution.type), [institution.type]);

  const [ownTab, setOwnTab] = useState<StructureTab>(() => allowedTabs[allowedTabs.length - 1]);
  const activeTab: StructureTab = fixedTab && allowedTabs.includes(fixedTab)
    ? fixedTab
    : allowedTabs.includes(ownTab)
    ? ownTab
    : allowedTabs[0];

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const [saving, setSaving] = useState(false);
  const { campuses, buildings, rooms } = structureLists(institution);
  const q = search.toLowerCase();
  const match = (name: string) => !q || name.toLowerCase().includes(q);
  const isDemo = !UUID_RE.test(institution.id);

  const isDirectSpaceInstitution = allowedTabs.length === 1 && allowedTabs[0] === "rooms";

  const defaultPriceUnitForType: PriceUnit =
    institution.type === "hotel" || institution.type === "airbnb"
      ? "night"
      : institution.type === "garden"
      ? "month"
      : "hour";

  const startAdd = async () => {
    if (activeTab === "campuses") {
      setEditing({
        table: "campuses",
        id: null,
        form: { name: "", address: "", maps_url: "" },
      });
    } else if (activeTab === "buildings") {
      setEditing({
        table: "buildings",
        id: null,
        form: {
          name: "",
          address: "",
          maps_url: "",
          campus_id: campuses[0]?.id ?? "",
        },
      });
    } else if (activeTab === "rooms") {
      let targetBuildingId = buildings[0]?.id;

      if (!targetBuildingId && isDirectSpaceInstitution) {
        try {
          const defaultName = institution.name ? `${institution.name} Spaces` : "Main Units";
          setSaving(true);
          await saveRow("buildings", null, {
            name: defaultName,
            address: institution.address || null,
            institution_id: institution.id,
          });
          toast({ title: "Configuring space structure..." });
          return;
        } catch (e: any) {
          toast({
            title: "Could not create root space group",
            description: e.message,
            variant: "destructive",
          });
          setSaving(false);
          return;
        } finally {
          setSaving(false);
        }
      }

      if (!targetBuildingId && !isDirectSpaceInstitution) {
        toast({
          title: `Add a ${institution.type === "sports" ? "facility" : "building"} first`,
          description: "Spaces must belong to a building or facility.",
          variant: "destructive",
        });
        return;
      }

      setEditing({
        table: "spaces",
        id: null,
        form: {
          name: "",
          building_id: targetBuildingId,
          capacity: institution.type === "hotel" || institution.type === "airbnb" ? 2 : 10,
          price_per_unit: institution.type === "hotel" ? 25000 : institution.type === "airbnb" ? 18000 : 0,
          price_unit: defaultPriceUnitForType,
          features: "",
          image_url: "",
          images: [],
          is_active: true,
        },
      });
    }
  };

  const save = async () => {
    if (!editing) return;
    const f = editing.form;
    if (!String(f.name || "").trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    let cleanAddress = f.address?.trim() || null;
    if (f.maps_url?.trim() && !cleanAddress) {
      cleanAddress = f.maps_url.trim();
    }

    let row: Record<string, unknown>;

    if (editing.table === "campuses") {
      row = {
        name: f.name.trim(),
        address: cleanAddress,
        institution_id: institution.id,
      };
    } else if (editing.table === "buildings") {
      row = {
        name: f.name.trim(),
        address: cleanAddress,
        campus_id: f.campus_id || null,
        institution_id: institution.id,
      };
    } else {
      const imagesArr: string[] =
        Array.isArray(f.images) && f.images.length > 0
          ? f.images
          : f.image_url
          ? [f.image_url]
          : [];
      const cover = imagesArr[0] || f.image_url || null;

      row = {
        name: f.name.trim(),
        building_id: f.building_id || buildings[0]?.id,
        capacity: Number(f.capacity) || 1,
        price_per_unit: Number(f.price_per_unit) || 0,
        price_unit: f.price_unit || defaultPriceUnitForType,
        features: String(f.features || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        image_url: cover,
        images: imagesArr,
        is_active: !!f.is_active,
      };
    }

    setSaving(true);
    try {
      await saveRow(editing.table, editing.id, row);
      toast({
        title: editing.id ? "Changes saved" : "Added successfully",
        description: String(f.name),
      });
      setEditing(null);
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (table: StructureTable, id: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    try {
      await deleteRow(table, id);
      toast({ title: "Deleted", description: name });
    } catch (e: any) {
      toast({ title: "Could not delete", description: e.message, variant: "destructive" });
    }
  };

  const set = (k: string, v: any) =>
    setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  const EditPanel = () => {
    if (!editing) return null;
    const f = editing.form;
    const itemNoun =
      editing.table === "spaces"
        ? tabNames.rooms.toLowerCase()
        : editing.table === "buildings"
        ? tabNames.buildings.toLowerCase()
        : "campus";

    const title = `${editing.id ? "Edit" : "Add"} ${itemNoun}`;

    return (
      <div className="border-2 border-primary/30 rounded-xl p-5 mb-4 bg-background">
        <h3 className="font-semibold text-lg mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name *">
            <Input
              value={f.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={`e.g. ${
                institution.type === "hotel"
                  ? "Deluxe King Room"
                  : institution.type === "garden"
                  ? "Plot A-12"
                  : institution.type === "sports"
                  ? "Indoor Tennis Court 1"
                  : "Lecture Hall A"
              }`}
            />
          </Field>

          {editing.table !== "spaces" && (
            <>
              <Field label="Address">
                <Input
                  placeholder="e.g. Kassai út 26"
                  value={f.address || ""}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Google Maps Link or Coordinates (optional)">
                  <Input
                    placeholder="https://maps.app.goo.gl/... or 47.5418, 21.6428"
                    value={f.maps_url || ""}
                    onChange={(e) => set("maps_url", e.target.value)}
                  />
                </Field>
              </div>
            </>
          )}

          {editing.table === "buildings" && campuses.length > 0 && (
            <Field label="Campus">
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={f.campus_id}
                onChange={(e) => set("campus_id", e.target.value)}
              >
                <option value="">No campus</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {editing.table === "spaces" && (
            <>
              {!isDirectSpaceInstitution && (
                <Field label={institution.type === "sports" ? "Facility / Area" : "Building"}>
                  <select
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={f.building_id}
                    onChange={(e) => set("building_id", e.target.value)}
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                        {b.campus ? ` · ${b.campus}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="Capacity (people)">
                <Input
                  type="number"
                  min={1}
                  value={f.capacity}
                  onChange={(e) => set("capacity", e.target.value)}
                />
              </Field>

              <Field label="Price (HUF)">
                <Input
                  type="number"
                  min={0}
                  value={f.price_per_unit}
                  onChange={(e) => set("price_per_unit", e.target.value)}
                />
              </Field>

              <Field label="Booking Duration Unit">
                <select
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  value={f.price_unit}
                  onChange={(e) => set("price_unit", e.target.value)}
                >
                  <option value="hour">per hour (time-based)</option>
                  <option value="night">per night (stay-based)</option>
                  <option value="month">per month (long-term)</option>
                </select>
              </Field>

              <Field label="Features & Amenities (comma separated)">
                <Input
                  value={f.features}
                  onChange={(e) => set("features", e.target.value)}
                  placeholder="Wi-Fi, AC, Shower, Projector"
                />
              </Field>

              <Field label="Available for booking">
                <label className="flex items-center gap-2 h-10 text-sm">
                  <input
                    type="checkbox"
                    checked={!!f.is_active}
                    onChange={(e) => set("is_active", e.target.checked)}
                  />
                  <span>Active & Available</span>
                </label>
              </Field>

              <div className="md:col-span-2">
                <Field label="Photos (first photo is used as main cover)">
                  <MultiImageDrop
                    values={f.images || []}
                    onChange={(urls) => {
                      set("images", urls);
                      set("image_url", urls[0] || "");
                    }}
                  />
                </Field>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    );
  };

  const RowActions = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} aria-label="Edit">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive"
        onClick={onDelete}
        aria-label="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div>
      {!fixedTab && allowedTabs.length > 1 && (
        <div className="flex gap-1 border-b mb-4">
          {allowedTabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setOwnTab(t);
                setEditing(null);
                setSearch("");
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition-colors ${
                activeTab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tabNames[t]} (
              {t === "campuses"
                ? campuses.length
                : t === "buildings"
                ? buildings.length
                : rooms.length}
              )
            </button>
          ))}
        </div>
      )}

      <div className="bg-card border rounded-xl p-6">
        {isDemo && (
          <p className="text-sm mb-4 p-3 rounded-lg bg-amber-500/10 text-amber-700">
            This is demo data that isn't stored in the live database. Local edits apply in your session.
          </p>
        )}

        <div className="flex items-center justify-between mb-4 gap-3">
          <Input
            placeholder={`Search ${tabNames[activeTab].toLowerCase()}...`}
            className="max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button size="sm" onClick={startAdd} disabled={saving}>
            <Plus className="h-4 w-4 mr-1" /> Add new {tabNames[activeTab].toLowerCase().slice(0, -1)}
          </Button>
        </div>

        {EditPanel()}

        <div className="space-y-2">
          {activeTab === "campuses" && campuses.length === 0 && (
            <p className="text-sm text-muted-foreground p-3">No campuses yet.</p>
          )}

          {activeTab === "campuses" &&
            campuses.filter((c) => match(c.name)).map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.buildings.length} buildings{c.address ? ` · ${c.address}` : ""}
                  </p>
                </div>
                <RowActions
                  onEdit={() =>
                    setEditing({
                      table: "campuses",
                      id: c.id,
                      form: {
                        name: c.name,
                        address: c.address || "",
                        maps_url: (c as any).maps_url || (c as any).mapsUrl || "",
                      },
                    })
                  }
                  onDelete={() => remove("campuses", c.id, c.name)}
                />
              </div>
            ))}

          {activeTab === "buildings" && buildings.length === 0 && (
            <p className="text-sm text-muted-foreground p-3">No {tabNames.buildings.toLowerCase()} yet.</p>
          )}

          {activeTab === "buildings" &&
            buildings.filter((b) => match(b.name)).map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.spaces.length} spaces{b.campus ? ` · ${b.campus}` : ""}
                  </p>
                </div>
                <RowActions
                  onEdit={() =>
                    setEditing({
                      table: "buildings",
                      id: b.id,
                      form: {
                        name: b.name,
                        address: b.address || "",
                        maps_url: (b as any).maps_url || (b as any).mapsUrl || "",
                        campus_id: b.campusId || "",
                      },
                    })
                  }
                  onDelete={() => remove("buildings", b.id, b.name)}
                />
              </div>
            ))}

          {activeTab === "rooms" && rooms.length === 0 && (
            <p className="text-sm text-muted-foreground p-3">No {tabNames.rooms.toLowerCase()} yet.</p>
          )}

          {activeTab === "rooms" &&
            rooms.filter((s) => match(s.name)).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  {s.image && (
                    <img src={s.image} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {!isDirectSpaceInstitution && `${s.building} · `}cap. {s.capacity} · {s.pricePerHour.toLocaleString()} HUF / {s.priceUnit || defaultPriceUnitForType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      s.available ? "status-confirmed" : "status-cancelled"
                    }`}
                  >
                    {s.available ? "Available" : "Unavailable"}
                  </span>
                  <RowActions
                    onEdit={() =>
                      setEditing({
                        table: "spaces",
                        id: s.id,
                        form: {
                          name: s.name,
                          building_id: s.buildingId,
                          capacity: s.capacity,
                          price_per_unit: s.pricePerHour,
                          price_unit: s.priceUnit || defaultPriceUnitForType,
                          features: Array.isArray(s.features) ? s.features.join(", ") : "",
                          image_url: s.image,
                          images:
                            s.images && s.images.length > 0 ? s.images : s.image ? [s.image] : [],
                          is_active: s.available,
                        },
                      })
                    }
                    onDelete={() => remove("spaces", s.id, s.name)}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
