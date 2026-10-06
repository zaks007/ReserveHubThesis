import { Navigate } from "react-router-dom";
import { MapPin, DoorOpen, CalendarDays, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings, statusBadgeClass, statusLabel } from "@/contexts/BookingsContext";
import { getInstitutionById } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const CampusAdminDashboard = () => {
  const { user } = useAuth();
  const { bookings, updateStatus } = useBookings();

  if (!user || user.role !== "campus_admin") return <Navigate to="/" replace />;

  const institution = getInstitutionById(user.institutionId || "");
  const campus = institution?.campuses?.find(c => c.id === user.campusId);

  if (!institution || !campus) {
    return (
      <div className="container py-16 max-w-md text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No campus assigned.</p>
      </div>
    );
  }

  const buildings = campus.buildings;
  const rooms = buildings.flatMap(b => b.spaces.map(s => ({ ...s, building: b.name })));
  const myBookings = bookings.filter(b => b.institutionId === institution.id && b.campusId === campus.id);

  return (
    <div className="container py-8">
      <p className="text-sm text-muted-foreground mb-1">Campus Admin · {institution.name}</p>
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2"><MapPin className="h-6 w-6 text-primary" /> {campus.name}</h1>
      <p className="text-muted-foreground mb-8">You can only manage rooms and bookings for this campus.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: DoorOpen, label: "Rooms", value: rooms.length },
          { icon: CalendarDays, label: "Total bookings", value: myBookings.length },
          { icon: AlertCircle, label: "Awaiting approval", value: myBookings.filter(b => b.status === "pending").length, accent: "bg-amber-500/15 text-amber-700" },
        ].map(s => (
          <div key={s.label} className="bg-card border rounded-xl p-5">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${s.accent || "bg-primary/10 text-primary"}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-3">Room availability</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {rooms.map(r => (
          <div key={r.id} className="bg-card border rounded-xl p-4 flex gap-3">
            <img src={r.image} alt="" className="h-16 w-16 rounded object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{r.name}</p>
              <p className="text-xs text-muted-foreground mb-2">{r.building} · cap. {r.capacity}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${r.available ? "status-confirmed" : "status-cancelled"}`}>
                {r.available ? "Available" : "Unavailable"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-3">Booking requests</h2>
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-secondary/50">
            <th className="text-left p-4 font-semibold">Room</th>
            <th className="text-left p-4 font-semibold">When</th>
            <th className="text-left p-4 font-semibold">Status</th>
            <th className="text-right p-4 font-semibold">Actions</th>
          </tr></thead>
          <tbody>
            {myBookings.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No bookings for this campus yet.</td></tr>}
            {myBookings.map(b => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="p-4 font-medium">{b.spaceName}</td>
                <td className="p-4 text-muted-foreground">{b.date} · {b.startTime}-{b.endTime}</td>
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
    </div>
  );
};

export default CampusAdminDashboard;
