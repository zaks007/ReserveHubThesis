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
  Calendar,
  Settings,
  ExternalLink,
  Save,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MultiImageDrop from "@/components/MultiImageDrop";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings, statusBadgeClass, statusLabel } from "@/contexts/BookingsContext";
import { useInstitutions } from "@/contexts/InstitutionsContext";
import InstitutionStructureEditor, { structureLists } from "@/components/InstitutionStructureEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DEMO_REQUESTS_KEY = "reservehub_campus_admin_requests_v1";

type Tab = "overview" | "campuses" | "buildings" | "rooms" | "bookings" | "staff_requests" | "details";

const InstitutionAdminDashboard = () => {
  const { user } = useAuth();
  const { bookings, updateStatus } = useBookings();
  const { institutions, getById, updateInstitution } = useInstitutions();
  const [tab, setTab] = useState<Tab>("overview");
  const [staffRequests, setStaffRequests] = useState<any[]>([]);

  const institution =
    getById(user?.institutionId || "") ||
    institutions.find((i) => i.type === user?.institutionType) ||
    institutions[0];

  const isDirectSpaces =
    institution?.type === "hotel" || institution?.type === "garden" || institution?.type === "airbnb";
  const isSports = institution?.type === "sports";
  const isUniversity =
    institution?.type === "university" ||
    user?.institutionType === "university" ||
    (institution?.campuses && institution.campuses.length > 0);

  // Institution Profile details form state
  const [detailsForm, setDetailsForm] = useState({
    name: "",
    city: "Debrecen",
    address: "",
    mapsUrl: "",
    description: "",
    image: "",
    images: [] as string[],
  });
  const [savingDetails, setSavingDetails] = useState(false);

  useEffect(() => {
    if (institution) {
      const imgs =
        institution.images && institution.images.length > 0
          ? institution.images
          : institution.image
          ? [institution.image]
          : [];
      setDetailsForm({
        name: institution.name || "",
        city: institution.city || "Debrecen",
        address: institution.address || "",
        mapsUrl: (institution as any).maps_url || (institution as any).mapsUrl || "",
        description: institution.description || "",
        image: institution.image || imgs[0] || "",
        images: imgs,
      });
    }
  }, [institution?.id, institution?.name, institution?.address, institution?.image]);

  // Auto-switch to valid tab if current tab is invalid for this institution type
  useEffect(() => {
    if (isDirectSpaces && (tab === "campuses" || tab === "buildings" || tab === "staff_requests")) {
      setTab("overview");
    } else if (isSports && (tab === "campuses" || tab === "staff_requests")) {
      setTab("overview");
    }
  }, [institution?.type, isDirectSpaces, isSports, tab]);

  // Load requests from Supabase OR localStorage fallback so it works everywhere
  const loadStaffRequests = async () => {
    if (!isUniversity) return;
    try {
      const { data, error } = await (supabase as any)
        .from("campus_admin_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
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

  useEffect(() => {
    void loadStaffRequests();
  }, [user, tab, isUniversity]);

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
  const confirmed = myBookings.filter((b) => b.status === "approved");
  const { campuses, buildings, rooms } = structureLists(institution);

  const pendingStaff = staffRequests.filter((r) => r.status === "pending");

  const spaceTabLabel =
    institution.type === "hotel"
      ? `Rooms (${rooms.length})`
      : institution.type === "garden"
      ? `Plots & Spaces (${rooms.length})`
      : institution.type === "airbnb"
      ? `Units & Spaces (${rooms.length})`
      : isSports
      ? `Courts & Spaces (${rooms.length})`
      : `Rooms (${rooms.length})`;

  const availableTabs: { k: Tab; label: string }[] = [{ k: "overview", label: "Overview" }];

  if (isUniversity) {
    availableTabs.push({ k: "campuses", label: `Campuses (${campuses.length})` });
  }

  if (isUniversity || isSports) {
    availableTabs.push({
      k: "buildings",
      label: isSports ? `Facilities (${buildings.length})` : `Buildings (${buildings.length})`,
    });
  }

  availableTabs.push({ k: "rooms", label: spaceTabLabel });
  availableTabs.push({ k: "bookings", label: `Bookings (${myBookings.length})` });

  if (isUniversity) {
    availableTabs.push({
      k: "staff_requests",
      label: `Campus Admin Requests (${pendingStaff.length} pending)`,
    });
  }

  availableTabs.push({ k: "details", label: "Institution Details" });

  const handleReviewStaff = async (id: string, status: "approved" | "rejected") => {
    const stored = JSON.parse(localStorage.getItem(DEMO_REQUESTS_KEY) || "[]");
    const updated = stored.map((r: any) => (r.id === id ? { ...r, status } : r));
    localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify(updated));
    setStaffRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

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

  const handleSaveDetails = async () => {
    if (!detailsForm.name.trim() || !detailsForm.city.trim()) {
      toast({ title: "Name and city are required", variant: "destructive" });
      return;
    }
    setSavingDetails(true);
    try {
      const imgs =
        detailsForm.images && detailsForm.images.length > 0
          ? detailsForm.images
          : detailsForm.image
          ? [detailsForm.image]
          : [];
      const cover = imgs[0] || detailsForm.image || "";
      const patch = {
        name: detailsForm.name,
        city: detailsForm.city,
        address: detailsForm.address || null,
        maps_url: detailsForm.mapsUrl || null,
        mapsUrl: detailsForm.mapsUrl || null,
        description: detailsForm.description,
        image: cover,
        images: imgs,
      };

      const mode = await updateInstitution(institution.id, patch as any);
      toast({
        title: "Institution details saved!",
        description: mode === "local" ? "Saved to local cache" : "Saved to database",
      });
    } catch (err: any) {
      toast({ title: "Failed to save details", description: err.message, variant: "destructive" });
    } finally {
      setSavingDetails(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground capitalize">{institution.type} Administrator</p>
          <h1 className="text-3xl font-bold">{institution.name}</h1>
          {institution.address && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <MapPin className="h-3.5 w-3.5 text-primary" /> {institution.address}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={tab === "details" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("details")}
            className="gap-1.5"
          >
            <Settings className="h-4 w-4" /> Edit Details
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/institutions/${institution.id}`} target="_blank" rel="noreferrer" className="gap-1.5">
              <ExternalLink className="h-4 w-4" /> View Public Page
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-1 border-b mb-8 overflow-x-auto">
        {availableTabs.map((t) => (
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
            {isDirectSpaces && (
              <>
                <div className="bg-card border rounded-xl p-5">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-primary/10 text-primary">
                    <DoorOpen className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{rooms.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {institution.type === "hotel" ? "Total Rooms" : "Total Spaces"}
                  </p>
                </div>

                <div className="bg-card border rounded-xl p-5">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{myBookings.length}</p>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                </div>

                <div className="bg-card border rounded-xl p-5">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{confirmed.length}</p>
                  <p className="text-sm text-muted-foreground">Active Bookings</p>
                </div>

                <div className="bg-card border rounded-xl p-5">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-amber-500/15 text-amber-700">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{pending.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Approvals</p>
                </div>
              </>
            )}

            {isSports && (
              <>
                <div className="bg-card border rounded-xl p-5">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{buildings.length}</p>
                  <p className="text-sm text-muted-foreground">Sports Facilities</p>
                </div>

                <div className="bg-card border rounded-xl p-5">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-primary/10 text-primary">
                    <DoorOpen className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{rooms.length}</p>
                  <p className="text-sm text-muted-foreground">Courts & Fields</p>
                </div>

                <div className="bg-card border rounded-xl p-5">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{myBookings.length}</p>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                </div>

                <div className="bg-card border rounded-xl p-5">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-amber-500/15 text-amber-700">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{pending.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Bookings</p>
                </div>
              </>
            )}

            {isUniversity && (
              <>
                <div className="bg-card border rounded-xl p-5">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{campuses.length}</p>
                  <p className="text-sm text-muted-foreground">Campuses</p>
                </div>

                <div className="bg-card border rounded-xl p-5">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{buildings.length}</p>
                  <p className="text-sm text-muted-foreground">Buildings</p>
                </div>

                <div className="bg-card border rounded-xl p-5">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-primary/10 text-primary">
                    <DoorOpen className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{rooms.length}</p>
                  <p className="text-sm text-muted-foreground">Rooms</p>
                </div>

                <div className="bg-card border rounded-xl p-5">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 bg-amber-500/15 text-amber-700">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{pending.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Bookings</p>
                </div>
              </>
            )}
          </div>

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

      {/* STRUCTURE TABS */}
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

      {/* CAMPUS ADMIN REQUESTS TAB */}
      {tab === "staff_requests" && isUniversity && (
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

      {/* INSTITUTION DETAILS EDIT TAB */}
      {tab === "details" && (
        <div className="bg-card border rounded-xl p-6 max-w-4xl shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" /> Institution Profile & Details
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update your public profile, address, Google Maps link, photos, and description.
              </p>
            </div>
            <Button onClick={handleSaveDetails} disabled={savingDetails} className="gap-2">
              <Save className="h-4 w-4" />
              {savingDetails ? "Saving…" : "Save Changes"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Institution Name *</label>
              <Input
                value={detailsForm.name}
                onChange={(e) => setDetailsForm({ ...detailsForm, name: e.target.value })}
                placeholder="e.g. Hotel Divinus Debrecen"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">City *</label>
              <Input
                value={detailsForm.city}
                onChange={(e) => setDetailsForm({ ...detailsForm, city: e.target.value })}
                placeholder="e.g. Debrecen"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Street Address</label>
              <Input
                value={detailsForm.address}
                onChange={(e) => setDetailsForm({ ...detailsForm, address: e.target.value })}
                placeholder="e.g. Nagyerdei krt. 1, 4032 Debrecen"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Google Maps Location Link (optional)
                </label>
                {detailsForm.mapsUrl && (
                  <a
                    href={detailsForm.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" /> Test open link
                  </a>
                )}
              </div>
              <Input
                value={detailsForm.mapsUrl}
                onChange={(e) => setDetailsForm({ ...detailsForm, mapsUrl: e.target.value })}
                placeholder="https://maps.app.goo.gl/... or https://maps.google.com/?q=..."
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Provide a Google Maps sharing link so guests can view location and get directions.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
              <Textarea
                rows={4}
                value={detailsForm.description}
                onChange={(e) => setDetailsForm({ ...detailsForm, description: e.target.value })}
                placeholder="Tell guests about your property, amenities, arrival instructions..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Photo Gallery (First photo is used as main cover)
              </label>
              <MultiImageDrop
                values={detailsForm.images || []}
                onChange={(urls) => {
                  setDetailsForm({
                    ...detailsForm,
                    images: urls,
                    image: urls[0] || "",
                  });
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-5 mt-6">
            <Button variant="outline" onClick={() => setTab("overview")} disabled={savingDetails}>
              Cancel
            </Button>
            <Button onClick={handleSaveDetails} disabled={savingDetails} className="gap-2">
              <Save className="h-4 w-4" />
              {savingDetails ? "Saving Changes…" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionAdminDashboard;
