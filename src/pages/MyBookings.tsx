import { Calendar, Building2, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useBookings, statusBadgeClass, statusLabel } from "@/contexts/BookingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const MyBookings = () => {
  const { bookings, cancelBooking } = useBookings();
  const { user } = useAuth();

  const myList = user ? bookings.filter(b => (b.userId ? b.userId === user.id : b.userEmail === user.email)) : [];

  return (
    <div className="container py-4">
      <Breadcrumbs items={[{ label: "My Bookings" }]} />
      <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
      <p className="text-muted-foreground mb-8">Track requests, approvals, and cancellations.</p>

      {myList.length === 0 && (
        <div className="text-center py-16 bg-card border rounded-xl">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-muted-foreground mb-4">You don't have any bookings yet.</p>
          <Button asChild><Link to="/institutions">Browse spaces</Link></Button>
        </div>
      )}

      <div className="space-y-4">
        {myList.map((b) => (
          <div key={b.id} className="bg-card border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="font-bold text-lg">{b.spaceName}</h3>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadgeClass[b.status]}`}>
                  {statusLabel[b.status]}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {b.institutionName}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {b.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {b.startTime} - {b.endTime}</span>
              </div>
              {b.rejectionReason && (
                <p className="text-sm text-destructive mt-2"><span className="font-semibold">Reason:</span> {b.rejectionReason}</p>
              )}
            </div>
            {(b.status === "pending" || b.status === "approved") && (
              <Button variant="outline" size="sm" onClick={() => { cancelBooking(b.id); toast({ title: "Booking cancelled" }); }}
                className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10">
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyBookings;
