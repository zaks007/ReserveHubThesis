import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { GraduationCap, MapPin, Send, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useInstitutions } from "@/contexts/InstitutionsContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DEMO_REQUESTS_KEY = "reservehub_campus_admin_requests_v1";

interface CampusRequest {
  id: string;
  userId: string;
  teacherName: string;
  teacherEmail: string;
  institutionId: string;
  campusId: string;
  campusName: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { institutions } = useInstitutions();
  const navigate = useNavigate();

  const [selectedCampusId, setSelectedCampusId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<CampusRequest[]>([]);

  // Find university institutions and campuses
  const uni = institutions.find((i) => i.type === "university") || institutions[0];
  const campuses = uni?.campuses || [];

  useEffect(() => {
    if (campuses.length > 0 && !selectedCampusId) {
      setSelectedCampusId(campuses[0].id);
    }
  }, [campuses, selectedCampusId]);

  // Load existing requests
  const loadRequests = async () => {
    if (!user) return;
    if (user.isDemo) {
      const stored: CampusRequest[] = JSON.parse(localStorage.getItem(DEMO_REQUESTS_KEY) || "[]");
      setMyRequests(stored.filter((r) => r.userId === user.id || r.teacherEmail === user.email));
      return;
    }

    const { data } = await (supabase as any)
      .from("campus_admin_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setMyRequests(
        data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          teacherName: r.teacher_name,
          teacherEmail: r.teacher_email,
          institutionId: r.institution_id,
          campusId: r.campus_id,
          campusName: r.campus_name,
          status: r.status,
          createdAt: r.created_at,
        }))
      );
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [user]);

  if (!user || (user.role !== "teacher" && user.role !== "campus_admin")) {
    return <Navigate to="/" replace />;
  }

  // Handle application submission
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampusId || !uni) {
      toast({ title: "Please pick a campus", variant: "destructive" });
      return;
    }

    const campus = campuses.find((c) => c.id === selectedCampusId);
    if (!campus) return;

    setSubmitting(true);

    const newReq: CampusRequest = {
      id: "req-" + Date.now(),
      userId: user.id,
      teacherName: user.name || "Dr. Kovács (Teacher)",
      teacherEmail: user.email || "dr.kovacs@unideb.hu",
      institutionId: uni.id,
      campusId: campus.id,
      campusName: campus.name,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Always save to localStorage immediately
    const existing: CampusRequest[] = JSON.parse(localStorage.getItem(DEMO_REQUESTS_KEY) || "[]");
    localStorage.setItem(DEMO_REQUESTS_KEY, JSON.stringify([newReq, ...existing]));
    setMyRequests([newReq, ...myRequests]);

    // Also attempt saving to Supabase if available
    try {
      await (supabase as any)
        .from("campus_admin_requests")
        .insert({
          user_id: user.id,
          teacher_name: newReq.teacherName,
          teacher_email: newReq.teacherEmail,
          institution_id: newReq.institutionId,
          campus_id: newReq.campusId,
          campus_name: newReq.campusName,
          status: "pending",
        });
    } catch {
      // Ignore if table or network is offline
    }

    setSubmitting(false);
    toast({ title: "Application submitted!", description: "Your university admin will review your request." });
  };


  const hasApproved = myRequests.some((r) => r.status === "approved");
  const approvedReq = myRequests.find((r) => r.status === "approved");

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
            <GraduationCap className="h-4 w-4" /> Teacher Portal
          </div>
          <h1 className="text-3xl font-bold">Campus Administrator Access</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Request administrative privileges to manage rooms, labs, and lecture halls for your university campus.
          </p>
        </div>

        {hasApproved && (
          <Button onClick={() => navigate("/admin/campus")} className="gap-2">
            Open Campus Admin Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Application Form */}
        <div className="md:col-span-1 bg-card border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" /> Apply for Campus
          </h2>
          <p className="text-xs text-muted-foreground">
            Select the university campus where you teach or manage academic spaces.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                University
              </label>
              <input
                type="text"
                disabled
                value={uni?.name || "University of Debrecen"}
                className="w-full h-9 rounded-md border bg-muted/40 px-3 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Select Campus *
              </label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedCampusId}
                onChange={(e) => setSelectedCampusId(e.target.value)}
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </form>

          {approvedReq && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Active Campus Admin
              </p>
              <p className="text-emerald-700">
                You are approved for <strong>{approvedReq.campusName}</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Request History */}
        <div className="md:col-span-2 bg-card border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-1">Application History</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Track your requests and approvals from the university administration.
          </p>

          {myRequests.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              No campus admin applications submitted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((r) => (
                <div
                  key={r.id}
                  className="p-4 border rounded-lg flex flex-wrap items-center justify-between gap-3 hover:bg-muted/10 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary" /> {r.campusName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted on {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    {r.status === "approved" && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                      </span>
                    )}
                    {r.status === "pending" && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Under Review
                      </span>
                    )}
                    {r.status === "rejected" && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
