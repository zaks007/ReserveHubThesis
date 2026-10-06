import { useState, useMemo, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBookings } from "@/contexts/BookingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Props {
  spaceId: string;
}

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const localKey = (id: string) => `reservehub_avail_${id}`;

const RoomAvailabilityCalendar = ({ spaceId }: Props) => {
  const { getBookingsForSpace } = useBookings();
  const { user } = useAuth();
  const [cursor, setCursor] = useState(new Date());
  const [available, setAvailable] = useState<Set<string>>(new Set());

  const canEdit = !!user && ["institution_admin", "campus_admin", "super_admin"].includes(user.role);
  const useDb = isUuid(spaceId) && !!user && !user.isDemo;

  const load = useCallback(async () => {
    let dates: string[] = [];
    if (isUuid(spaceId)) {
      const { data, error } = await supabase.from("space_availability" as any).select("date").eq("space_id", spaceId);
      if (!error) dates = (data ?? []).map((r: any) => String(r.date));
    }
    try { dates = [...dates, ...JSON.parse(localStorage.getItem(localKey(spaceId)) || "[]")]; } catch { /* ignore */ }
    setAvailable(new Set(dates));
  }, [spaceId]);

  useEffect(() => { void load(); }, [load]);

  const bookings = getBookingsForSpace(spaceId).filter(b => b.status === "approved" || b.status === "pending");

  const { year, month, daysInMonth, firstDayOffset } = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const dim = new Date(y, m + 1, 0).getDate();
    const offset = (new Date(y, m, 1).getDay() + 6) % 7;
    return { year: y, month: m, daysInMonth: dim, firstDayOffset: offset };
  }, [cursor]);

  const monthName = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  const dateStr = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const toggle = async (d: number) => {
    if (!canEdit) return;
    const ds = dateStr(d);
    const next = new Set(available);
    const on = !next.has(ds);
    on ? next.add(ds) : next.delete(ds);
    setAvailable(next);
    if (useDb) {
      const q = supabase.from("space_availability" as any);
      const { error } = on
        ? await q.insert({ space_id: spaceId, date: ds } as any)
        : await q.delete().eq("space_id", spaceId).eq("date", ds);
      if (!error) return;
      console.error("availability save", error);
    }
    const local = [...next];
    localStorage.setItem(localKey(spaceId), JSON.stringify(local));
  };

  const cells: (number | null)[] = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{monthName}</h3>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" aria-label="Previous month" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" aria-label="Next month" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      {canEdit && <p className="text-xs text-muted-foreground mb-2">Click a day to mark it available or unavailable.</p>}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground mb-1">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ds = dateStr(d);
          const items = bookings.filter(b => b.date === ds);
          const hasApproved = items.some(b => b.status === "approved");
          const hasPending = items.some(b => b.status === "pending");
          const isAvail = available.has(ds);
          const bg = hasApproved ? "bg-destructive/15" : hasPending ? "bg-accent/40" : isAvail ? "bg-primary/20" : "bg-secondary/40";
          return (
            <button type="button" key={i} onClick={() => toggle(d)} disabled={!canEdit}
              className={`aspect-square rounded p-1 text-xs flex flex-col gap-0.5 border text-left ${isToday(d) ? "border-primary" : "border-transparent"} ${bg} ${canEdit ? "cursor-pointer hover:ring-2 hover:ring-primary/40" : "cursor-default"}`}>
              <span className={`font-semibold ${isToday(d) ? "text-primary" : ""}`}>{d}</span>
              {items.length > 0 && <span className="text-[10px] text-muted-foreground truncate">{items.length} booking{items.length > 1 ? "s" : ""}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-primary/40" /> Available</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-destructive/40" /> Booked</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Pending</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-secondary border" /> Not set</span>
      </div>
    </div>
  );
};

export default RoomAvailabilityCalendar;
