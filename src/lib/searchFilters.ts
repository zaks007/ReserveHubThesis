import type { Institution } from "@/data/mockData";

export interface SearchCriteria { guests?: number; from?: string; to?: string }

const allSpaces = (inst: Institution) =>
  (inst.campuses?.flatMap((c) => c.buildings.flatMap((b) => b.spaces)) || []).concat(
    inst.buildings.flatMap((b) => b.spaces),
  );

/** True when the institution has at least one space fitting the guest count
 *  that is not already booked (pending/approved) on any day in the range. */
export function institutionMatchesSearch(
  inst: Institution,
  { guests = 0, from = "", to = "" }: SearchCriteria,
  bookings: { spaceId: string; date: string; status: string }[],
) {
  if (!guests && !from) return true;
  const end = to || from;
  return allSpaces(inst).some((s) => {
    if (!s.available) return false;
    if (guests && s.capacity < guests) return false;
    if (from) {
      const clash = bookings.some(
        (b) => b.spaceId === s.id && (b.status === "approved" || b.status === "pending") && b.date >= from && b.date <= end,
      );
      if (clash) return false;
    }
    return true;
  });
}
