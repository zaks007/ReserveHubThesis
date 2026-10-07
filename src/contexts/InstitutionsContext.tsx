import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { institutions as baseInstitutions, type Institution, type Campus, type Building, type Space } from "@/data/mockData";
import hotelDivinusAsset from "@/assets/hotel-divinus.png.asset.json";

export type SaveMode = "db" | "local";
export type InstitutionPatch = Partial<
  Pick<Institution, "name" | "description" | "city" | "rating" | "image" | "images" | "address">
>;

interface InstitutionsContextValue {
  institutions: Institution[];
  getById: (id: string) => Institution | undefined;
  updateInstitution: (id: string, patch: InstitutionPatch) => Promise<SaveMode>;
  resetInstitution: (id: string) => void;
  overrides: Record<string, InstitutionPatch>;
  usingDatabase: boolean;
  createInstitution: (data: NewInstitution) => Promise<SaveMode>;
  deleteInstitution: (id: string) => Promise<SaveMode>;
  saveRow: (table: StructureTable, id: string | null, row: Record<string, unknown>) => Promise<void>;
  deleteRow: (table: StructureTable, id: string) => Promise<void>;
}

export type StructureTable = "campuses" | "buildings" | "spaces";
const NOT_SAVED = "Not saved — database refused the change.";

export interface NewInstitution {
  name: string;
  type: string;
  city: string;
  description?: string;
  address?: string;
  image?: string;
  images?: string[];
  rating?: number;
}

const Ctx = createContext<InstitutionsContextValue | null>(null);
const KEY = "reservehub_institution_overrides_v1";

const loadOverrides = (): Record<string, InstitutionPatch> => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

function transformDbSpace(s: any): Space {
  const rawImages: string[] = Array.isArray(s.images) && s.images.length > 0
    ? s.images
    : (Array.isArray(s.image_urls) && s.image_urls.length > 0 ? s.image_urls : []);
  const mainImage = rawImages[0] || s.image_url || "";
  const images = rawImages.length > 0 ? rawImages : (mainImage ? [mainImage] : []);

  return {
    id: s.id,
    name: s.name,
    capacity: s.capacity ?? 1,
    image: mainImage,
    images,
    features: s.features ?? [],
    pricePerHour: s.price_per_unit ?? 0,
    priceUnit: s.price_unit ?? "hour",
    available: s.is_active ?? true,
  };
}

function transformDbBuilding(b: any): Building {
  return {
    id: b.id,
    name: b.name,
    coords: b.lat && b.lng ? { lat: Number(b.lat), lng: Number(b.lng) } : undefined,
    address: b.address || undefined,
    spaces: (b.spaces || []).map(transformDbSpace),
  };
}

function transformDbCampus(c: any): Campus {
  return {
    id: c.id,
    name: c.name,
    coords: c.lat && c.lng ? { lat: Number(c.lat), lng: Number(c.lng) } : undefined,
    address: c.address || undefined,
    buildings: (c.buildings || []).map(transformDbBuilding),
  };
}

function transformDbInstitution(inst: any, campuses: Campus[] = [], buildings: Building[] = []): Institution {
  const isHotelDivinus = inst.name === "Hotel Divinus Debrecen";
  const rawImages: string[] = Array.isArray(inst.images) && inst.images.length > 0
    ? inst.images
    : (Array.isArray(inst.image_urls) && inst.image_urls.length > 0 ? inst.image_urls : []);

  // Use uploaded images first; only fallback to the asset if no custom images were uploaded
  const mainImage = rawImages[0] || inst.image_url || (isHotelDivinus ? hotelDivinusAsset.url : "");
  const images = rawImages.length > 0 ? rawImages : (mainImage ? [mainImage] : []);

  return {
    id: inst.id,
    name: inst.name,
    type: inst.type,
    city: inst.city,
    description: inst.description || "",
    image: mainImage,
    images,
    rating: isHotelDivinus ? (inst.rating ?? 5) : (inst.rating ?? 0),
    coords: inst.lat && inst.lng ? { lat: Number(inst.lat), lng: Number(inst.lng) } : undefined,
    address: inst.address || undefined,
    campuses: campuses.length > 0 ? campuses : undefined,
    buildings: buildings.length > 0 ? buildings : [],
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CREATED_KEY = "reservehub_local_institutions_v1";
const DELETED_KEY = "reservehub_deleted_institutions_v1";
const loadJson = <T,>(k: string, fallback: T): T => {
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

export const InstitutionsProvider = ({ children }: { children: ReactNode }) => {
  const [overrides, setOverrides] = useState<Record<string, InstitutionPatch>>(loadOverrides);
  const [localCreated, setLocalCreated] = useState<Institution[]>(() => loadJson(CREATED_KEY, []));
  const [localDeleted, setLocalDeleted] = useState<string[]>(() => loadJson(DELETED_KEY, []));
  const [dbInstitutions, setDbInstitutions] = useState<Institution[] | null>(null);
  const [usingDatabase, setUsingDatabase] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(overrides));
  }, [overrides]);
  useEffect(() => { localStorage.setItem(CREATED_KEY, JSON.stringify(localCreated)); }, [localCreated]);
  useEffect(() => { localStorage.setItem(DELETED_KEY, JSON.stringify(localDeleted)); }, [localDeleted]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [{ data: insts }, { data: camps }, { data: blds }] = await Promise.all([
          supabase.from("institutions").select("*"),
          supabase.from("campuses").select("*, buildings(*, spaces(*))"),
          supabase.from("buildings").select("*, spaces(*)").is("campus_id", null),
        ]);

        if (cancelled) return;

        if (!insts || insts.length === 0) {
          setDbInstitutions(null);
          setUsingDatabase(false);
          return;
        }

        const campusesByInstitution = new Map<string, any[]>();
        for (const c of camps || []) {
          const list = campusesByInstitution.get(c.institution_id) || [];
          list.push(c);
          campusesByInstitution.set(c.institution_id, list);
        }

        const buildingsByInstitution = new Map<string, any[]>();
        for (const b of blds || []) {
          const list = buildingsByInstitution.get(b.institution_id) || [];
          list.push(b);
          buildingsByInstitution.set(b.institution_id, list);
        }

        const transformed: Institution[] = insts.map((inst) => {
          const campusRows = campusesByInstitution.get(inst.id) || [];
          const buildingRows = buildingsByInstitution.get(inst.id) || [];
          return transformDbInstitution(
            inst,
            campusRows.map(transformDbCampus),
            buildingRows.map(transformDbBuilding)
          );
        });

        setDbInstitutions(transformed);
        setUsingDatabase(true);
      } catch (err) {
        console.error("Failed to load institutions from Supabase:", err);
        setDbInstitutions(null);
        setUsingDatabase(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const toRow = (p: InstitutionPatch | NewInstitution) => {
    const r: Record<string, unknown> = {};
    if (p.name !== undefined) r.name = p.name;
    if ((p as NewInstitution).type !== undefined) r.type = (p as NewInstitution).type;
    if (p.city !== undefined) r.city = p.city;
    if (p.description !== undefined) r.description = p.description;
    if (p.address !== undefined) r.address = p.address || null;
    if (p.image !== undefined) r.image_url = p.image || null;
    if (p.images !== undefined) {
      r.images = p.images;
      if (p.images.length > 0) {
        r.image_url = p.images[0];
      }
    }
    if (p.rating !== undefined) r.rating = p.rating;
    return r;
  };

  const institutions = useMemo<Institution[]>(() => {
    const source = [...(dbInstitutions ?? baseInstitutions), ...localCreated];
    return source
      .filter((i) => !localDeleted.includes(i.id))
      .map((i) => (overrides[i.id] ? { ...i, ...overrides[i.id] } : i));
  }, [dbInstitutions, overrides, localCreated, localDeleted]);

  const isDbRow = (id: string) => usingDatabase && UUID_RE.test(id);

  const value: InstitutionsContextValue = {
    institutions,
    overrides,
    usingDatabase,
    getById: (id) => institutions.find((i) => i.id === id),
    updateInstitution: async (id, patch) => {
      if (id.startsWith("local-")) {
        setLocalCreated((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
        return "local";
      }
      if (isDbRow(id)) {
        const row = toRow(patch);
        const { data, error } = await supabase
          .from("institutions")
          .update(row as any)
          .eq("id", id)
          .select("id");
        if (!error && data && data.length > 0) {
          setReloadKey((k) => k + 1);
          return "db";
        }
      }
      setOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
      return "local";
    },
    createInstitution: async (data) => {
      if (usingDatabase) {
        const { data: rows, error } = await supabase
          .from("institutions")
          .insert(toRow(data) as any)
          .select("id");
        if (!error && rows && rows.length > 0) {
          setReloadKey((k) => k + 1);
          return "db";
        }
      }
      const imagesList = data.images && data.images.length > 0
        ? data.images
        : (data.image ? [data.image] : []);
      const inst: Institution = {
        id: `local-${Date.now()}`,
        name: data.name,
        type: data.type as Institution["type"],
        city: data.city,
        description: data.description || "",
        address: data.address || undefined,
        image: imagesList[0] || data.image || "",
        images: imagesList,
        rating: data.rating ?? 0,
        buildings: [],
      };
      setLocalCreated((prev) => [...prev, inst]);
      return "local";
    },
    deleteInstitution: async (id) => {
      if (id.startsWith("local-")) {
        setLocalCreated((prev) => prev.filter((i) => i.id !== id));
        return "local";
      }
      if (isDbRow(id)) {
        const { data, error } = await supabase.from("institutions").delete().eq("id", id).select("id");
        if (!error && data && data.length > 0) {
          setReloadKey((k) => k + 1);
          return "db";
        }
      }
      setLocalDeleted((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return "local";
    },
    saveRow: async (table, id, row) => {
      const q = id
        ? supabase.from(table).update(row as any).eq("id", id).select("id")
        : supabase.from(table).insert(row as any).select("id");
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error(NOT_SAVED);
      setReloadKey((k) => k + 1);
    },
    deleteRow: async (table, id) => {
      const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error(NOT_SAVED);
      setReloadKey((k) => k + 1);
    },
    resetInstitution: (id) => {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setLocalDeleted((prev) => prev.filter((x) => x !== id));
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useInstitutions = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useInstitutions must be used within InstitutionsProvider");
  return ctx;
};
