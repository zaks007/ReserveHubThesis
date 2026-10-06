import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Building2, MapPin, DoorOpen, CalendarDays, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings, statusBadgeClass, statusLabel } from "@/contexts/BookingsContext";
import { useInstitutions } from "@/contexts/InstitutionsContext";
import InstitutionStructureEditor, { structureLists } from "@/components/InstitutionStructureEditor";
import { toast } from "@/hooks/use-toast";

type Tab = "overview" | "campuses" | "buildings" | "rooms" | "bookings";
const InstitutionAdminDashboard = () => {
  const { user } = useAuth();
  const { bookings, updateStatus } = useBookings();
  const { institutions, getById } = useInstitutions();
  const [tab, setTab] = useState<Tab>("overview");

  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.role === "institution_pending") {
    return (
      <div className="container py-16 max-w-xl text-center">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-8">
          <div className="h-14 w-14 mx-auto rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center mb-4">
            <CalendarDays className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Awaiting Super Admin Approval</h1>
          <p className="text-muted-foreground mb-4">
            Your institution registration is being reviewed. You'll be able to manage campuses, buildings, rooms, and bookings once approved.
          </p>
          <Button asChild variant="outline"><Link to="/">Browse spaces in the meantime</Link></Button>
        </div>
      </div>
    );
  }
  if (user.role !== "institution_admin") return <Navigate to="/" replace />;

  const institution =
    getById(user.institutionId || "") ||
    institutions.find((i) => i.type === user.institutionType) ||
    institutions[0];
  if (!institution) return <div className="container py-16 text-center text-muted-foreground">No institution found.</div>;

  const myBookings = bookings.filter((b) => b.institutionId === institution.id);
  const pending = myBookings.filter((b) => b.status === "pending");
  const { campuses, buildings, rooms } = structureLists(institution);

  return (
    <div className="container py-8">
      <p className="text-sm text-muted-foreground mb-1">Institution Admin</p>
      <h1 className="text-3xl font-bold mb-8">{institution.name}</h1>

      <div className="flex gap-1 border-b mb-8 overflow-x-auto">
        {[
          { k: "overview", label: "Overview" },
          { k: "campuses", label: `Campuses (${campuses.length})` },
          { k: "buildings", label: `Buildings (${buildings.length})` },
          { k: "rooms", label: `Rooms (${rooms.length})` },
          { k: "bookings", label: `Bookings (${myBookings.length})` },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => { setTab(t.k as Tab); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: MapPin, label: "Campuses", value: campuses.length },
            { icon: Building2, label: "Buildings", value: buildings.length },
            { icon: DoorOpen, label: "Rooms", value: rooms.length },
            { icon: CalendarDays, label: "Pending bookings", value: pending.length, accent: "bg-amber-500/15 text-amber-700" },
          ].map((s) => (
            <div key={s.label} className="bg-card border rounded-xl p-5">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${s.accent || "bg-primary/10 text-primary"}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {(tab === "campuses" || tab === "buildings" || tab === "rooms") && (
        <InstitutionStructureEditor key={tab} institution={institution} tab={tab} />
      )}

      {tab === "bookings" && (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-secondary/50">
              <th className="text-left p-4 font-semibold">Space</th>
              <th className="text-left p-4 font-semibold">When</th>
              <th className="text-left p-4 font-semibold">User</th>
              <th className="text-left p-4 font-semibold">Status</th>
              <th className="text-right p-4 font-semibold">Actions</th>
            </tr></thead>
            <tbody>
              {myBookings.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No bookings yet.</td></tr>}
              {myBookings.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="p-4 font-medium">{b.spaceName}</td>
                  <td className="p-4 text-muted-foreground">{b.date} · {b.startTime}-{b.endTime}</td>
                  <td className="p-4 text-muted-foreground">{b.userEmail}</td>
                  <td className="p-4"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadgeClass[b.status]}`}>{statusLabel[b.status]}</span></td>
                  <td className="p-4 text-right space-x-1">
                    {b.status === "pending" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => { updateStatus(b.id, "approved"); toast({ title: "Approved" }); }}><Check className="h-4 w-4 text-emerald-600" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => { updateStatus(b.id, "rejected"); toast({ title: "Rejected" }); }}><X className="h-4 w-4 text-destructive" /></Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InstitutionAdminDashboard;
