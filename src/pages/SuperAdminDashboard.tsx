import { useMemo, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Building2, Users, ShieldCheck, Inbox, Check, X, Plus, Trash2, ExternalLink, Pencil, RotateCcw, Calendar, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth, InstitutionRequest } from "@/contexts/AuthContext";
import { useBookings, statusBadgeClass, statusLabel, BookingStatus } from "@/contexts/BookingsContext";
import { useInstitutions } from "@/contexts/InstitutionsContext";
import { typeLabelMap } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const StatCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number | string; accent?: string }) => (
  <div className="bg-card border rounded-xl p-5">
    <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${accent || "bg-primary/10 text-primary"}`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

type TabKey = "overview" | "requests" | "institutions" | "bookings" | "admins";

const SuperAdminDashboard = () => {
  const { user, loading, setOwnerMode, requests, approveRequest, rejectRequest, superAdminEmails, addSuperAdminEmail, removeSuperAdminEmail } = useAuth();
  const { bookings, updateStatus, cancelBooking } = useBookings();
  const { institutions, resetInstitution, overrides, deleteInstitution } = useInstitutions();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("overview");
  const [rejectTarget, setRejectTarget] = useState<InstitutionRequest | null>(null);
  const [reason, setReason] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [bookingFilter, setBookingFilter] = useState<BookingStatus | "all">("all");

  const filteredBookingsEarly = useMemo(
    () => bookings.filter(b => bookingFilter === "all" || b.status === bookingFilter),
    [bookings, bookingFilter]
  );

  if (loading) return <div className="container py-16 text-center text-muted-foreground">Checking your account…</div>;
  if (user?.canSuperAdmin && user.role !== "super_admin") {
    return (
      <div className="container max-w-md py-16 text-center">
        <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">You're in normal user mode</h1>
        <p className="text-muted-foreground mb-6">Switch back to Super Admin to manage the platform.</p>
        <Button onClick={() => setOwnerMode("super_admin")}>Switch to Super Admin</Button>
      </div>
    );
  }
  if (!user || user.role !== "super_admin") return <Navigate to="/" replace />;

  const doDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This also removes its campuses, buildings and spaces.`)) return;
    try { await deleteInstitution(id); toast({ title: "Institution deleted", description: name }); }
    catch (e: any) { toast({ title: "Could not delete", description: e.message, variant: "destructive" }); }
  };

  const pending = requests.filter(r => r.status === "pending");
  const approved = requests.filter(r => r.status === "approved");
  const rejected = requests.filter(r => r.status === "rejected");

  const doReject = () => {
    if (!rejectTarget) return;
    rejectRequest(rejectTarget.id, reason);
    toast({ title: "Request rejected", description: rejectTarget.name });
    setRejectTarget(null); setReason("");
  };

  const doAddAdmin = () => {
    if (!newAdminEmail.includes("@")) { toast({ title: "Invalid email", variant: "destructive" }); return; }
    addSuperAdminEmail(newAdminEmail);
    toast({ title: "Authorized email added", description: newAdminEmail });
    setNewAdminEmail("");
  };

  const filteredBookings = filteredBookingsEarly;

  const tabs: { k: TabKey; label: string }[] = [
    { k: "overview", label: "Overview" },
    { k: "requests", label: `Requests (${pending.length})` },
    { k: "institutions", label: `Institutions (${institutions.length})` },
    { k: "bookings", label: `All Bookings (${bookings.length})` },
    { k: "admins", label: "Authorized Admins" },
  ];

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Super Admin</h1>
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => setOwnerMode("user")}>Use as normal user</Button>
      </div>
      <p className="text-muted-foreground mb-8">Full control over the ReserveHub platform — institutions, bookings, requests and admins.</p>

      <div className="flex gap-1 border-b mb-8 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
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
          <StatCard icon={Building2} label="Active Institutions" value={institutions.length} />
          <StatCard icon={Inbox} label="Pending Requests" value={pending.length} accent="bg-amber-500/15 text-amber-700" />
          <StatCard icon={Check} label="Approved Requests" value={approved.length} accent="bg-emerald-500/15 text-emerald-700" />
          <StatCard icon={X} label="Rejected Requests" value={rejected.length} accent="bg-rose-500/15 text-rose-700" />
          <StatCard icon={Calendar} label="Total Bookings" value={bookings.length} />
          <StatCard icon={Check} label="Approved Bookings" value={bookings.filter(b => b.status === "approved").length} accent="bg-emerald-500/15 text-emerald-700" />
          <StatCard icon={Inbox} label="Pending Bookings" value={bookings.filter(b => b.status === "pending").length} accent="bg-amber-500/15 text-amber-700" />
          <StatCard icon={ShieldCheck} label="Authorized Admins" value={superAdminEmails.length} />
        </div>
      )}

      {tab === "requests" && (
        <div className="space-y-4">
          {requests.length === 0 && <p className="text-muted-foreground text-center py-12">No requests yet.</p>}
          {requests.map(r => (
            <div key={r.id} className="bg-card border rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-bold text-lg">{r.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{typeLabelMap[r.type as keyof typeof typeLabelMap] || r.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                      r.status === "pending" ? "status-pending" : r.status === "approved" ? "status-confirmed" : "status-cancelled"
                    }`}>{r.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{r.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <span><span className="text-muted-foreground">City:</span> {r.city}</span>
                    <span><span className="text-muted-foreground">Contact:</span> {r.contactEmail}</span>
                    <span><span className="text-muted-foreground">Submitted:</span> {new Date(r.submittedAt).toLocaleDateString()}</span>
                    {r.website && <a href={r.website} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">Website <ExternalLink className="h-3 w-3" /></a>}
                  </div>
                  {r.rejectionReason && (
                    <div className="mt-3 p-2 bg-rose-500/10 text-rose-700 rounded text-sm">
                      <span className="font-semibold">Reason:</span> {r.rejectionReason}
                    </div>
                  )}
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => { approveRequest(r.id); toast({ title: "Approved", description: r.name }); }}>
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => setRejectTarget(r)}>
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "institutions" && (
        <>
        <div className="flex justify-end mb-4">
          <Button onClick={() => navigate("/admin/institutions/new")}><Plus className="h-4 w-4 mr-1" /> Add institution</Button>
        </div>
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 hidden md:table-cell">Type</th>
                <th className="px-4 py-3 hidden lg:table-cell">City</th>
                <th className="px-4 py-3 hidden md:table-cell">Rating</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map(i => {
                const edited = !!overrides[i.id];
                return (
                  <tr key={i.id} className="border-t">
                    <td className="px-4 py-3">
                      <Link to={`/institutions/${i.id}`} className="font-medium hover:text-primary">{i.name}</Link>
                      {edited && <span className="ml-2 text-[10px] uppercase tracking-wider text-primary font-semibold">edited</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">{typeLabelMap[i.type]}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{i.city}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{i.rating.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/institutions/${i.id}/edit`)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => doDelete(i.id, i.name)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {edited && (
                          <Button size="sm" variant="ghost" onClick={() => { resetInstitution(i.id); toast({ title: "Reset to default" }); }}>
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      {tab === "bookings" && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(["all", "pending", "approved", "rejected", "cancelled"] as const).map(s => (
              <Button key={s} variant={bookingFilter === s ? "default" : "outline"} size="sm" onClick={() => setBookingFilter(s)}>
                {s === "all" ? `All (${bookings.length})` : `${statusLabel[s]} (${bookings.filter(b => b.status === s).length})`}
              </Button>
            ))}
          </div>
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Space</th>
                  <th className="px-4 py-3 hidden md:table-cell">Institution</th>
                  <th className="px-4 py-3 hidden lg:table-cell">When</th>
                  <th className="px-4 py-3 hidden md:table-cell">User</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No bookings.</td></tr>
                )}
                {filteredBookings.map(b => (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{b.spaceName}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{b.institutionName}</td>
                    <td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">{b.date} · {b.startTime}–{b.endTime}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{b.userEmail}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusBadgeClass[b.status]}`}>
                        {statusLabel[b.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {b.status !== "approved" && (
                          <Button size="sm" variant="outline" onClick={() => { updateStatus(b.id, "approved"); toast({ title: "Booking approved" }); }}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {b.status !== "rejected" && b.status !== "cancelled" && (
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/30"
                            onClick={() => { updateStatus(b.id, "rejected", "Rejected by super admin"); toast({ title: "Booking rejected" }); }}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {b.status !== "cancelled" && (
                          <Button size="sm" variant="ghost"
                            onClick={() => { cancelBooking(b.id); toast({ title: "Booking cancelled" }); }}>
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "admins" && (
        <div className="max-w-2xl">
          <div className="bg-card border rounded-xl p-6 mb-6">
            <h3 className="font-semibold mb-1">Add authorized email</h3>
            <p className="text-sm text-muted-foreground mb-4">Only emails on this list can sign up as Super Admin.</p>
            <div className="flex gap-2">
              <Input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="email@example.com" />
              <Button onClick={doAddAdmin}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>
          </div>
          <div className="bg-card border rounded-xl overflow-hidden">
            {superAdminEmails.map(e => (
              <div key={e} className="flex items-center justify-between p-4 border-b last:border-0">
                <span className="font-mono text-sm">{e}</span>
                <Button
                  variant="ghost" size="sm"
                  className="text-destructive"
                  onClick={() => { removeSuperAdminEmail(e); toast({ title: "Removed", description: e }); }}
                  disabled={e.toLowerCase() === user.email.toLowerCase()}
                  title={e.toLowerCase() === user.email.toLowerCase() ? "You can't remove yourself" : ""}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject request dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={o => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject {rejectTarget?.name}?</DialogTitle></DialogHeader>
          <div>
            <p className="text-sm text-muted-foreground mb-3">Optionally provide a reason that will be visible to the applicant.</p>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="e.g. Insufficient information provided" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doReject}>Confirm Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default SuperAdminDashboard;
