import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./AuthContext";
import { useInstitutions } from "./InstitutionsContext";
import { bookings as seedBookings, type Booking } from "@/data/mockData";

export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface SimBooking extends Omit<Booking, "status"> {
  status: BookingStatus;
  spaceId: string;
  institutionId: string;
  campusId?: string;
  userEmail: string;
  userId?: string;
  rejectionReason?: string;
}

interface BookingsContextValue {
  bookings: SimBooking[];
  createBooking: (b: Omit<SimBooking, "id" | "status">, opts?: { autoApprove?: boolean; free?: boolean }) => Promise<{ ok: boolean; error?: string; booking?: SimBooking }>;
  updateStatus: (id: string, status: BookingStatus, reason?: string) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  hasConflict: (spaceId: string, date: string, start: string, end: string, ignoreId?: string) => boolean;
  getBookingsForSpace: (spaceId: string) => SimBooking[];
}

const Ctx = createContext<BookingsContextValue | null>(null);

const seed: SimBooking[] = seedBookings.map((b, i) => ({
  ...b,
  status: (b.status === "confirmed" ? "approved" : b.status === "pending" ? "pending" : "cancelled") as BookingStatus,
  spaceId: ["s1", "s4", "s6", "s3", "s5"][i] || "s1",
  institutionId: ["inst-1", "inst-3", "inst-4", "inst-2", "inst-6"][i] || "inst-1",
  campusId: i === 3 ? "c1" : undefined,
  userEmail: "user@demo.hu",
}));

const DEMO_KEY = "reservehub_demo_bookings";
const loadDemo = (): SimBooking[] => {
  if (typeof window === "undefined") return seed;
  try { const v = JSON.parse(localStorage.getItem(DEMO_KEY) || "null"); return Array.isArray(v) ? v : seed; } catch { return seed; }
};
const saveDemo = (list: SimBooking[]) => { try { localStorage.setItem(DEMO_KEY, JSON.stringify(list)); } catch { /* ignore */ } };

export const BookingsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { institutions } = useInstitutions();
  const [bookings, setBookings] = useState<SimBooking[]>(seed);

  // Resolve names/ids from the loaded institutions tree
  const enrich = useCallback((spaceId: string) => {
    for (const inst of institutions) {
      for (const c of inst.campuses ?? []) {
        for (const b of c.buildings ?? []) {
          const s = b.spaces.find(s => s.id === spaceId);
          if (s) return {
            spaceName: s.name, institutionName: inst.name,
            buildingName: b.name, institutionId: inst.id, campusId: c.id, capacity: s.capacity,
          };
        }
      }
      for (const b of inst.buildings ?? []) {
        const s = b.spaces.find(s => s.id === spaceId);
        if (s) return {
          spaceName: s.name, institutionName: inst.name,
          buildingName: b.name, institutionId: inst.id, campusId: undefined as string | undefined, capacity: s.capacity,
        };
      }
    }
    return { spaceName: "Unknown space", institutionName: "", buildingName: "", institutionId: "", campusId: undefined, capacity: 0 };
  }, [institutions]);

  const refresh = useCallback(async () => {
    if (!user || user.isDemo) { setBookings(loadDemo()); return; } // demo roles use local data
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("bookings load", error); return; }
    const ids = [...new Set((data ?? []).map((r: any) => r.user_id))];
    const emails: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,email").in("id", ids);
      for (const p of profs ?? []) emails[(p as any).id] = (p as any).email;
    }
    const rows: SimBooking[] = (data ?? []).map((r: any) => {
      const meta = enrich(r.space_id);
      return {
        id: r.id,
        spaceId: r.space_id,
        spaceName: meta.spaceName,
        institutionId: meta.institutionId,
        campusId: meta.campusId,
        institutionName: meta.institutionName,
        buildingName: meta.buildingName,
        capacity: meta.capacity,
        date: r.date,
        startTime: String(r.start_time).slice(0, 5),
        endTime: String(r.end_time).slice(0, 5),
        status: r.status as BookingStatus,
        userEmail: emails[r.user_id] ?? "",
        userId: r.user_id,
        rejectionReason: r.rejection_reason ?? undefined,
      };
    });
    setBookings(rows);
  }, [user, enrich]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Realtime updates
  useEffect(() => {
    if (!user || user.isDemo) return;
    const ch = supabase
      .channel("bookings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => { void refresh(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user, refresh]);

  const overlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart < bEnd && bStart < aEnd;

  const hasConflict: BookingsContextValue["hasConflict"] = (spaceId, date, start, end, ignoreId) => {
    return bookings.some(b =>
      b.id !== ignoreId &&
      b.spaceId === spaceId &&
      b.date === date &&
      (b.status === "approved" || b.status === "pending") &&
      overlap(start, end, b.startTime, b.endTime)
    );
  };

  const createBooking: BookingsContextValue["createBooking"] = async (b, opts) => {
    if (hasConflict(b.spaceId, b.date, b.startTime, b.endTime)) {
      return { ok: false, error: "This time slot conflicts with an existing booking." };
    }
    if (!user || user.isDemo) {
      // demo mode: keep locally
      const booking: SimBooking = { ...b, userId: user?.id, id: `bk-${Date.now()}`, status: opts?.autoApprove ? "approved" : "pending" };
      setBookings(prev => { const n = [booking, ...prev]; saveDemo(n); return n; });
      return { ok: true, booking };
    }
    const status: BookingStatus = opts?.autoApprove ? "approved" : "pending";
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        space_id: b.spaceId,
        user_id: user.id,
        date: b.date,
        start_time: b.startTime,
        end_time: b.endTime,
        status,
        total_price: 0,
      })
      .select()
      .single();
    if (error || !data) {
      console.error("bookings insert", error);
      return { ok: false, error: error?.message || "Failed to create booking" };
    }
    await refresh();
    return { ok: true, booking: { ...b, id: data.id, status, userId: user.id } };
  };

  const updateStatus: BookingsContextValue["updateStatus"] = async (id, status, reason) => {
    if (!user || user.isDemo) {
      setBookings(prev => { const n = prev.map(b => b.id === id ? { ...b, status, rejectionReason: reason } : b); saveDemo(n); return n; });
      return;
    }
    if (status === "approved") {
      // Approval also charges the guest and splits the (simulated) money.
      const { error } = await (supabase as any).rpc("approve_booking_with_payment", { _booking_id: id });
      await refresh();
      if (error) toast({ title: "Approval failed", description: error.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("bookings")
      .update({ status, rejection_reason: reason ?? null })
      .eq("id", id);
    await refresh();
    if (error) toast({ title: "Could not update booking", description: error.message, variant: "destructive" });
  };

  const cancelBooking = async (id: string) => updateStatus(id, "cancelled");

  const getBookingsForSpace = (spaceId: string) => bookings.filter(b => b.spaceId === spaceId);

  return (
    <Ctx.Provider value={{ bookings, createBooking, updateStatus, cancelBooking, hasConflict, getBookingsForSpace }}>
      {children}
    </Ctx.Provider>
  );
};

export const useBookings = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBookings must be used within BookingsProvider");
  return ctx;
};

export const statusBadgeClass: Record<BookingStatus, string> = {
  pending: "status-pending",
  approved: "status-confirmed",
  rejected: "status-cancelled",
  cancelled: "status-cancelled",
};

export const statusLabel: Record<BookingStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};
