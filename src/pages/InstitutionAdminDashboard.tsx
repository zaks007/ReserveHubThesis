import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  Building2,
  MapPin,
  DoorOpen,
  CalendarDays,
  Check,
  X,
  UserCheck,
  CheckCircle2,
  XCircle,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings, statusBadgeClass, statusLabel } from "@/contexts/BookingsContext";
import { useInstitutions } from "@/contexts/InstitutionsContext";
import InstitutionStructureEditor, { structureLists } from "@/components/InstitutionStructureEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DEMO_REQUESTS_KEY = "reservehub_campus_admin_requests_v1";

type Tab = "overview" | "campuses" | "buildings" | "rooms" | "bookings" | "staff_requests";

const InstitutionAdminDashboard = () => {
  const { user } = useAuth();
  const { bookings, updateStatus } = useBookings();
  const { institutions, getById } = useInstitutions();
  const [tab, setTab] = useState<Tab>("overview");
  const [staffRequests, setStaffRequests] = useState<any[]>([]);

  const institution =
    getById(user?.institutionId || "") ||
    institutions.find((i) => i.type === user?.institutionType) ||
    institutions[0];

  // Load requests from Supabase OR localStorage fallback so it works everywhere
  const loadStaffRequests = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("campus_admin_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // Merge DB rows with any local demo rows
        const stored = JSON.parse(localStorage.getItem(DEMO_REQUESTS_KEY) || "[]");
        const existingIds = new Set(data.map((d: any) => d.id));
        const combined = [...data, ...stored.filter((s: any) => !existingIds.has(s.id))];
        setStaffRequests(combined);
        return;
      }
    } catch {
      // Fallback
    }

    const stored = JSON.parse(localStorage.getItem(DEMO_REQUESTS_KEY) || "[]");
    setStaffRequests(stored);
  };

  // Re-run whenever user changes OR when clicking onto the tab
  useEffect(() => {
    void loadStaffRequests();
  }, [user, tab]);

  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.role === "institution_pending") {
    return (
      <div className="container py-16 max-w-xl text-center">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-2">Awaiting Super Admin Approval</h1>
          <p className="text-muted-foreground mb-4">
            Your institution registration is being reviewed.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Browse spaces in the meantime</Link>
          </Button>
        </div>
      </div>
    );
  }
  if (user.role !== "institution_admin") return <Navigate to="/" replace />;
  if (!institution)
    return <div className="container py-16 text-center text-muted-foreground">No institution found.</div>;

  const myBookings = bookings.filter((b) => b.institutionId === institution.id);
  const pending = myBookings.filter((b) => b.status === "pending");
  const { campuses, buildings, rooms } = structureLists(institution);
  
  // Show staff requests tab for universities
  const isUniversity =
    institution.type === "university" ||
    user.institutionType === "university" ||
    (institution.campuses && institution.campuses.length > 0);

  const pendingStaff = staffRequests.filter((r) => r.status === "pending");

  // Approve / Reject Teacher Campus Admin Application
  const handleReviewStaff = async (id: string, status: "approved" | "rejected") => {
    // 1. Always update localStorage so it's instant in demo and real accounts
    const stored = JSON.parse(localStorage.getItem(DEMO_REQUESTS_KEY) || "[]");
    const updated = stored.map((r: any) => (r.id === id ? { ...r, status } : r));
    localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(updated));
    setStaffRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

    // 2. Also update Supabase table if it exists
    try {
      await (supabase as any)
        .from("campus_admin_requests")
        .update({ status })
        .eq("id", id);
    } catch {
      // Ignore DB errors
    }

    toast({
      title: status === "approved" ? "Teacher approved as Campus Admin!" : "Request rejected",
    });
  };

  return (
    <div className="container py-8">
      <p className="text-sm text-muted-foreground mb-1">Institution Admin</p>
      <h1 className="text-3xl font-bold mb-8">{institution.name}</h1>

      {/* Tabs navigation */}
      <div className="flex gap-1 border-b mb-8 overflow-x-auto">
        {[
          { k: "overview", label: "Overview" },
          { k: "campuses", label: `Campuses (${campuses.length})` },
          { k: "buildings", label: `Buildings (${buildings.length})` },
          { k: "rooms", label: `Rooms (${rooms.length})` },
          { k: "bookings", label: `Bookings (${myBookings.length})` },
          ...(isUniversity
            ? [
                {
                  k: "staff_requests",
                  label: `Campus Admin Requests (${pendingStaff.length} pending)`,
                },
              ]
            : []),
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as Tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.k
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: MapPin, label: "Campuses", value: campuses.length },
              { icon: Building2, label: "Buildings", value: buildings.length },
              { icon: DoorOpen, label: "Rooms", value: rooms.length },
              {
                icon: CalendarDays,
                label: "Pending bookings",
                value: pending.length,
                accent: "bg-amber-500/15 text-amber-700",
              },
            ].map((s) => (
              <div key={s.label} className="bg-card border rounded-xl p-5">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${
                    s.accent || "bg-primary/10 text-primary"
                  }`}
                >
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick link card for pending staff requests */}
          {isUniversity && (
            <div className="bg-card border rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Campus Administrator Requests</h3>
                  <p className="text-xs text-muted-foreground">
                    {pendingStaff.length} teacher{pendingStaff.length === 1 ? "" : "s"} awaiting campus approval
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => setTab("staff_requests")}>
                View Applications
              </Button>
            </div>
          )}
        </div>
      )}

      {(tab === "campuses" || tab === "buildings" || tab === "rooms") && (
        <InstitutionStructureEditor key={tab} institution={institution} tab={tab} />
      )}

      {/* BOOKINGS TAB */}
      {tab === "bookings" && (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-4 font-semibold">Space</th>
                <th className="text-left p-4 font-semibold">When</th>
                <th className="text-left p-4 font-semibold">User</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myBookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No bookings yet.
                  </td>
                </tr>
              )}
              {myBookings.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="p-4 font-medium">{b.spaceName}</td>
                  <td className="p-4 text-muted-foreground">
                    {b.date} · {b.startTime}-{b.endTime}
                  </td>
                  <td className="p-4 text-muted-foreground">{b.userEmail}</td>
                  <td className="p-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadgeClass[b.status]}`}>
                      {statusLabel[b.status]}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1">
                    {b.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            updateStatus(b.id, "approved");
                            toast({ title: "Approved" });
                          }}
                        >
                          <Check className="h-4 w-4 text-emerald-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            updateStatus(b.id, "rejected");
                            toast({ title: "Rejected" });
                          }}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CAMPUS ADMIN REQUESTS TAB (RIGHT AFTER BOOKINGS) */}
      {tab === "staff_requests" && (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" /> Teacher Applications for Campus Administrator
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and approve teachers to manage rooms and buildings for their campus.
            </p>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-4 font-semibold">Teacher Name</th>
                <th className="text-left p-4 font-semibold">Email</th>
                <th className="text-left p-4 font-semibold">Requested Campus</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No teacher campus admin requests yet.
                  </td>
                </tr>
              )}
              {staffRequests.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-4 font-medium">{r.teacher_name || r.teacherName}</td>
                  <td className="p-4 text-muted-foreground">{r.teacher_email || r.teacherEmail}</td>
                  <td className="p-4 font-medium flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {r.campus_name || r.campusName}
                  </td>
                  <td className="p-4">
                    {r.status === "approved" && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                      </span>
                    )}
                    {r.status === "pending" && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 w-fit">
                        Pending
                      </span>
                    )}
                    {r.status === "rejected" && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive flex items-center gap-1 w-fit">
                        <XCircle className="h-3.5 w-3.5" /> Rejected
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-1">
                    {r.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-emerald-700 hover:text-emerald-800"
                          onClick={() => handleReviewStaff(r.id, "approved")}
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1 text-destructive hover:text-destructive"
                          onClick={() => handleReviewStaff(r.id, "rejected")}
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
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
