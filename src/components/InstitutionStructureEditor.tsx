import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MultiImageDrop from "@/components/MultiImageDrop";
import { useInstitutions, type StructureTable } from "@/contexts/InstitutionsContext";
import type { Institution } from "@/data/mockData";
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

export function structureLists(institution: Institution) {
  const campuses = institution.campuses || [];
  const buildings = [
    ...campuses.flatMap((c) => c.buildings.map((b) => ({ ...b, campusId: c.id as string | undefined, campus: c.name as string | undefined }))),
    ...institution.buildings.map((b) => ({ ...b, campusId: undefined, campus: undefined })),
  ];
  const rooms = buildings.flatMap((b) => b.spaces.map((s) => ({ ...s, buildingId: b.id, building: b.name })));
  return { campuses, buildings, rooms };
}

export default function InstitutionStructureEditor({ institution, tab: fixedTab }: { institution: Institution; tab?: StructureTab }) {
  const { saveRow, deleteRow } = useInstitutions();
  const [ownTab, setOwnTab] = useState<StructureTab>("rooms");
  const tab = fixedTab ?? ownTab;
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const [saving, setSaving] = useState(false);
  const { campuses, buildings, rooms } = structureLists(institution);
  const q = search.toLowerCase();
  const match = (name: string) => !q || name.toLowerCase().includes(q);
  const isDemo = !UUID_RE.test(institution.id);

  const startAdd = () => {
    if (tab === "campuses") setEditing({ table: "campuses", id: null, form: { name: "", address: "" } });
    if (tab === "buildings") setEditing({ table: "buildings", id: null, form: { name: "", address: "", campus_id: campuses[0]?.id ?? "" } });
    if (tab === "rooms") {
      if (!buildings.length) { toast({ title: "Add a building first", variant: "destructive" }); return; }
      setEditing({
        table: "spaces",
        id: null,
        form: {
          name: "",
          building_id: buildings[0].id,
          capacity: 10,
          price_per_unit: 0,
          price_unit: "hour",
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
    if (!String(f.name || "").trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    let row: Record<string, unknown>;
    if (editing.table === "campuses") {
      row = { name: f.name, address: f.address || null, institution_id: institution.id };
    } else if (editing.table === "buildings") {
      row = { name: f.name, address: f.address || null, campus_id: f.campus_id || null, institution_id: institution.id };
    } else {
      const imagesArr: string[] = Array.isArray(f.images) && f.images.length > 0 ? f.images : (f.image_url ? [f.image_url] : []);
      const cover = imagesArr[0] || f.image_url || null;
      row = {
        name: f.name,
        building_id: f.building_id,
        capacity: Number(f.capacity) || 1,
        price_per_unit: Number(f.price_per_unit) || 0,
        price_unit: f.price_unit,
        features: String(f.features || "").split(",").map((x) => x.trim()).filter(Boolean),
        image_url: cover,
        images: imagesArr,
        is_active: !!f.is_active,
      };
    }
    setSaving(true);
    try {
      await saveRow(editing.table, editing.id, row);
      toast({ title: editing.id ? "Changes saved" : "Added", description: String(f.name) });
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

  const set = (k: string, v: any) => setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  const EditPanel = () => {
    if (!editing) return null;
    const f = editing.form;
    const title = `${editing.id ? "Edit" : "Add"} ${editing.table === "spaces" ? "room" : editing.table.slice(0, -1)}`;
    return (
      <div className="border-2 border-primary/30 rounded-xl p-5 mb-4 bg-background">
        <h3 className="font-semibold text-lg mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name *"><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          {editing.table !== "spaces" && (
            <Field label="Address"><Input value={f.address || ""} onChange={(e) => set("address", e.target.value)} /></Field>
          )}
          {editing.table === "buildings" && campuses.length > 0 && (
            <Field label="Campus">
              <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={f.campus_id} onChange={(e) => set("campus_id", e.target.value)}>
                <option value="">No campus</option>
                {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}
          {editing.table === "spaces" && (
            <>
              <Field label="Building">
                <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={f.building_id} onChange={(e) => set("building_id", e.target.value)}>
                  {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}{b.campus ? ` · ${b.campus}` : ""}</option>)}
                </select>
              </Field>
              <Field label="Capacity"><Input type="number" min={1} value={f.capacity} onChange={(e) => set("capacity", e.target.value)} /></Field>
              <Field label="Price (HUF)"><Input type="number" min={0} value={f.price_per_unit} onChange={(e) => set("price_per_unit", e.target.value)} /></Field>
              <Field label="Price unit">
                <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={f.price_unit} onChange={(e) => set("price_unit", e.target.value)}>
                  <option value="hour">per hour</option><option value="night">per night</option><option value="month">per month</option>
                </select>
              </Field>
              <Field label="Features (comma separated)"><Input value={f.features} onChange={(e) => set("features", e.target.value)} placeholder="Projector, Whiteboard" /></Field>
              <Field label="Available for booking">
                <label className="flex items-center gap-2 h-10 text-sm">
                  <input type="checkbox" checked={!!f.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Available
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
          <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </div>
    );
  };

  const RowActions = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
    </div>
  );

  return (
    <div>
      {!fixedTab && (
        <div className="flex gap-1 border-b mb-4">
          {(["campuses", "buildings", "rooms"] as StructureTab[]).map((t) => (
            <button key={t} type="button" onClick={() => { setOwnTab(t); setEditing(null); setSearch(""); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 capitalize ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t} ({t === "campuses" ? campuses.length : t === "buildings" ? buildings.length : rooms.length})
            </button>
          ))}
        </div>
      )}
      <div className="bg-card border rounded-xl p-6">
        {isDemo && (
          <p className="text-sm mb-4 p-3 rounded-lg bg-amber-500/10 text-amber-700">
            This is demo data that isn't in the database, so changes can't be saved here.
          </p>
        )}
        <div className="flex items-center justify-between mb-4 gap-3">
          <Input placeholder={`Search ${tab}...`} className="max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button size="sm" onClick={startAdd}><Plus className="h-4 w-4 mr-1" /> Add new</Button>
        </div>
        {EditPanel()}
        <div className="space-y-2">
          {tab === "campuses" && campuses.length === 0 && <p className="text-sm text-muted-foreground p-3">No campuses yet.</p>}
          {tab === "campuses" && campuses.filter((c) => match(c.name)).map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.buildings.length} buildings{c.address ? ` · ${c.address}` : ""}</p></div>
              <RowActions
                onEdit={() => setEditing({ table: "campuses", id: c.id, form: { name: c.name, address: c.address || "" } })}
                onDelete={() => remove("campuses", c.id, c.name)}
              />
            </div>
          ))}
          {tab === "buildings" && buildings.filter((b) => match(b.name)).map((b) => (
            <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div><p className="font-medium">{b.name}</p><p className="text-xs text-muted-foreground">{b.spaces.length} rooms{b.campus ? ` · ${b.campus}` : ""}</p></div>
              <RowActions
                onEdit={() => setEditing({ table: "buildings", id: b.id, form: { name: b.name, address: b.address || "", campus_id: b.campusId || "" } })}
                onDelete={() => remove("buildings", b.id, b.name)}
              />
            </div>
          ))}
          {tab === "rooms" && rooms.filter((s) => match(s.name)).map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                {s.image && <img src={s.image} alt="" className="h-10 w-10 rounded object-cover shrink-0" />}
                <div className="min-w-0"><p className="font-medium truncate">{s.name}</p><p className="text-xs text-muted-foreground">{s.building} · cap. {s.capacity}</p></div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.available ? "status-confirmed" : "status-cancelled"}`}>{s.available ? "Available" : "Unavailable"}</span>
                <RowActions
                  onEdit={() => setEditing({
                    table: "spaces",
                    id: s.id,
                    form: {
                      name: s.name,
                      building_id: s.buildingId,
                      capacity: s.capacity,
                      price_per_unit: s.pricePerHour,
                      price_unit: s.priceUnit || "hour",
                      features: Array.isArray(s.features) ? s.features.join(", ") : "",
                      image_url: s.image,
                      images: s.images && s.images.length > 0 ? s.images : (s.image ? [s.image] : []),
                      is_active: s.available,
                    },
                  })}
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
