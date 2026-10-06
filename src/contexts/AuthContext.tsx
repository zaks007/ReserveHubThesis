import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type UserRole = "guest" | "user" | "teacher" | "institution_pending" | "institution_admin" | "campus_admin" | "super_admin";

/** Email domains treated as internal university affiliates */
export const UNIVERSITY_DOMAINS = ["unideb.hu", "mailbox.unideb.hu"];
export const isUniversityEmail = (email: string) =>
  UNIVERSITY_DOMAINS.some(d => email.toLowerCase().endsWith("@" + d));
/** Roles considered internal university users (free + instant booking on uni spaces) */
export const isUniversityUserRole = (r: UserRole) => r === "teacher";

export interface SimUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId?: string;
  campusId?: string;
  /** Owner/allowlisted email that may switch between Super Admin and normal user */
  canSuperAdmin?: boolean;
  /** Dev role-switcher account (not a real signed-in user) */
  isDemo?: boolean;
  institutionType?: string;
}

export interface InstitutionRequest {
  id: string;
  name: string;
  type: string;
  city: string;
  contactEmail: string;
  description: string;
  website?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  submittedAt: string;
  submittedBy: string;
}

type PendingFlow = "user" | "institution" | "super_admin";
interface PendingCode {
  email: string;
  code: string; // sentinel "EMAIL" – real code lives in Supabase
  flow: PendingFlow;
  payload?: any;
}

interface AuthContextValue {
  user: SimUser | null;
  loading: boolean;
  superAdminEmails: string[];
  pendingCode: PendingCode | null;
  signupUser: (email: string, name: string, password: string) => Promise<string>;
  signupInstitution: (req: Omit<InstitutionRequest, "id" | "status" | "submittedAt" | "submittedBy">, password: string, name: string) => Promise<string>;
  signupSuperAdmin: (email: string, name: string, password: string) => Promise<string | { error: string }>;
  verifyCode: (code: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  switchPreset: (p: DemoPreset) => void;
  exitDemo: () => Promise<void>;
  demoPreset: DemoPreset | null;
  hasSession: boolean;
  setOwnerMode: (mode: "super_admin" | "user") => void;
  addSuperAdminEmail: (email: string) => void;
  removeSuperAdminEmail: (email: string) => void;
  requests: InstitutionRequest[];
  approveRequest: (id: string) => void;
  rejectRequest: (id: string, reason?: string) => void;
  updateProfile: (patch: Partial<Pick<SimUser, "name" | "email">>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SUPER_ADMIN_KEY = "reservehub_super_admins_v1";
const PENDING_KEY = "reservehub_pending_v1";

const DEFAULT_SUPER_ADMINS = ["zakariumar2005@gmail.com"];

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function reqFromRow(r: any): InstitutionRequest {
  return {
    id: r.id,
    name: r.institution_name,
    type: r.institution_type,
    city: r.city ?? "",
    contactEmail: r.requester_email,
    description: r.description ?? "",
    status: r.status,
    rejectionReason: r.rejection_reason ?? undefined,
    submittedAt: r.created_at,
    submittedBy: r.requester_email,
  };
}

const MODE_KEY = "reservehub_owner_mode_v1"; // "super_admin" | "user"
const DEMO_KEY = "reservehub_demo_preset_v1";
const SUPER_ADMIN_DEMO_EMAIL = "zakariumar2005@gmail.com";

export type DemoPreset = "guest" | "user" | "teacher" | "institution_pending" | "institution_admin" | "institution_admin_regular" | "campus_admin" | "super_admin";

export const DEMO_PRESETS: Record<DemoPreset, { label: string; user: SimUser | null }> = {
  guest: { label: "Guest", user: null },
  user: { label: "User", user: { id: "demo-user", email: "user@demo.hu", name: "Demo User", role: "user", isDemo: true } },
  teacher: { label: "University Teacher", user: { id: "demo-teacher", email: "dr.kovacs@unideb.hu", name: "Dr. Kovács (Teacher)", role: "teacher", institutionId: "inst-2", isDemo: true } },
  institution_pending: { label: "Institution (Pending)", user: { id: "demo-inst-p", email: "pending@demo.hu", name: "Pending Institution", role: "institution_pending", institutionId: "req-1", isDemo: true } },
  institution_admin: { label: "University Institution", user: { id: "demo-inst-a", email: "admin@unideb.hu", name: "University Admin", role: "institution_admin", institutionId: "inst-2", institutionType: "university", isDemo: true } },
  institution_admin_regular: { label: "Regular Institution (Airbnb)", user: { id: "demo-inst-r", email: "host@debrecenstays.hu", name: "Airbnb Host", role: "institution_admin", institutionId: "inst-8", institutionType: "airbnb", isDemo: true } },
  campus_admin: { label: "Campus Admin", user: { id: "demo-campus", email: "kassai@unideb.hu", name: "Kassai Receptionist", role: "campus_admin", institutionId: "inst-2", campusId: "c1", isDemo: true } },
  super_admin: { label: "Super Admin", user: { id: "demo-sa", email: SUPER_ADMIN_DEMO_EMAIL, name: "Zakaria (Super Admin)", role: "super_admin", canSuperAdmin: true, isDemo: true } },
};

async function loadUserFromSession(session: Session, superAdminEmails: string[]): Promise<SimUser> {
  const email = session.user.email ?? "";
  const meta = (session.user.user_metadata ?? {}) as { name?: string };
  // Try to read role from DB
  let role: UserRole = "user";
  try {
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);
    const roles = (roleRows ?? []).map(r => r.role);
    if (roles.includes("super_admin")) role = "super_admin";
    else if (roles.includes("institution_admin")) role = "institution_admin";
  } catch { /* ignore */ }
  // Allowlisted owner emails: Super Admin or normal user (never university official)
  const allowlisted = superAdminEmails.map(e => e.toLowerCase()).includes(email.toLowerCase());
  if (allowlisted) {
    const mode = typeof window !== "undefined" ? localStorage.getItem(MODE_KEY) : null;
    role = mode === "user" ? "user" : "super_admin";
  } else if (isUniversityEmail(email) && role === "user") {
    role = "teacher";
  }
  let name = meta.name || email.split("@")[0];
  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", session.user.id)
      .maybeSingle();
    if (prof?.name) name = prof.name;
  } catch { /* ignore */ }
  return { id: session.user.id, email, name, role, canSuperAdmin: allowlisted };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const initialDemo = (() => {
    try { const v = localStorage.getItem(DEMO_KEY) as DemoPreset | null; return v && DEMO_PRESETS[v] ? v : null; } catch { return null; }
  })();
  const [user, setUser] = useState<SimUser | null>(initialDemo ? DEMO_PRESETS[initialDemo].user : null);
  const [loading, setLoading] = useState(!initialDemo);
  const [demoPreset, setDemoPreset] = useState<DemoPreset | null>(initialDemo);
  const [hasSession, setHasSession] = useState(false);
  const demoRef = useRef<DemoPreset | null>(initialDemo);
  const [superAdminEmails, setSuperAdminEmails] = useState<string[]>(() =>
    loadJSON<string[]>(SUPER_ADMIN_KEY, DEFAULT_SUPER_ADMINS)
  );
  const [requests, setRequests] = useState<InstitutionRequest[]>([]);
  const [pendingCode, setPendingCode] = useState<PendingCode | null>(() =>
    loadJSON<PendingCode | null>(PENDING_KEY, null)
  );

  useEffect(() => { localStorage.setItem(SUPER_ADMIN_KEY, JSON.stringify(superAdminEmails)); }, [superAdminEmails]);
  useEffect(() => { localStorage.setItem(PENDING_KEY, JSON.stringify(pendingCode)); }, [pendingCode]);

  // Load institution requests from Supabase (RLS scopes by role)
  const refreshRequests = async () => {
    const { data, error } = await supabase
      .from("institution_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("requests load", error); return; }
    setRequests((data ?? []).map(reqFromRow));
  };
  useEffect(() => {
    void refreshRequests();
    const ch = supabase
      .channel("institution-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "institution_requests" }, () => { void refreshRequests(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user?.id]);

  // Subscribe to real Supabase auth changes (ignored while a demo role is active)
  useEffect(() => {
    const stored = localStorage.getItem(DEMO_KEY) as DemoPreset | null;
    if (stored && DEMO_PRESETS[stored]) {
      demoRef.current = stored;
      setDemoPreset(stored);
      setUser(DEMO_PRESETS[stored].user);
    }
    const { data: sub } = supabase.auth.onAuthStateChange((evt, session) => {
      if (demoRef.current && evt !== "SIGNED_IN") return;
      if (evt === "SIGNED_IN" && demoRef.current) {
        demoRef.current = null; setDemoPreset(null); localStorage.removeItem(DEMO_KEY);
      }
      if (session) {
        setTimeout(async () => {
          const u = await loadUserFromSession(session, superAdminEmails);
          if (!demoRef.current) setUser(u);
        }, 0);
      } else {
        setUser(null);
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setHasSession(!!data.session);
      if (data.session && !demoRef.current) {
        const u = await loadUserFromSession(data.session, superAdminEmails);
        if (!demoRef.current) setUser(u);
      }
      setLoading(false);
    });
    return () => { sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendOtp = async (email: string, name?: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: name ? { name } : undefined,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signupUser: AuthContextValue["signupUser"] = async (email, name, _password) => {
    await sendOtp(email, name);
    setPendingCode({ email, code: "EMAIL", flow: "user", payload: { name } });
    return "EMAIL";
  };

  const signupInstitution: AuthContextValue["signupInstitution"] = async (req, _password, name) => {
    await sendOtp(req.contactEmail, name);
    setPendingCode({ email: req.contactEmail, code: "EMAIL", flow: "institution", payload: { req, name } });
    return "EMAIL";
  };

  const signupSuperAdmin: AuthContextValue["signupSuperAdmin"] = async (email, name, _password) => {
    if (!superAdminEmails.map(e => e.toLowerCase()).includes(email.toLowerCase())) {
      return { error: "This email is not authorized for Super Admin access." };
    }
    await sendOtp(email, name);
    setPendingCode({ email, code: "EMAIL", flow: "super_admin", payload: { name } });
    return "EMAIL";
  };

  const verifyCode: AuthContextValue["verifyCode"] = async (code) => {
    if (!pendingCode) return false;
    const { email, flow, payload } = pendingCode;
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    if (error || !data.session) return false;

    // Ensure profile is up to date with name from payload
    if (payload?.name) {
      try {
        await supabase.from("profiles").update({ name: payload.name }).eq("id", data.session.user.id);
      } catch { /* ignore */ }
    }

    if (flow === "institution") {
      const r = payload.req;
      try {
        await supabase.from("institution_requests").insert({
          requester_user_id: data.session.user.id,
          requester_email: email,
          requester_name: payload?.name || email,
          institution_name: r.name,
          institution_type: r.type,
          city: r.city ?? null,
          description: r.description ?? null,
          status: "pending",
        });
        await refreshRequests();
      } catch (err) { console.error("institution_requests insert", err); }
    } else if (flow === "super_admin") {
      try {
        await supabase.from("user_roles").insert({ user_id: data.session.user.id, role: "super_admin" as any });
      } catch { /* ignore */ }
    }

    const u = await loadUserFromSession(data.session, superAdminEmails);
    setUser(u);
    setPendingCode(null);
    return true;
  };

  // Passwordless login via OTP (real email)
  const login: AuthContextValue["login"] = async (email, _password) => {
    try {
      await sendOtp(email);
      const flow: PendingFlow = superAdminEmails.map(e => e.toLowerCase()).includes(email.toLowerCase())
        ? "super_admin" : "user";
      setPendingCode({ email, code: "EMAIL", flow, payload: {} });
      return true;
    } catch {
      return false;
    }
  };

  const logout: AuthContextValue["logout"] = async () => {
    demoRef.current = null; setDemoPreset(null); localStorage.removeItem(DEMO_KEY);
    await supabase.auth.signOut();
    setUser(null);
  };

  const switchPreset = (p: DemoPreset) => {
    demoRef.current = p;
    setDemoPreset(p);
    localStorage.setItem(DEMO_KEY, p);
    setUser(DEMO_PRESETS[p].user);
  };

  const exitDemo = async () => {
    demoRef.current = null;
    setDemoPreset(null);
    localStorage.removeItem(DEMO_KEY);
    const { data } = await supabase.auth.getSession();
    setUser(data.session ? await loadUserFromSession(data.session, superAdminEmails) : null);
  };

  const switchRole: AuthContextValue["switchRole"] = (role) => {
    const map: Record<UserRole, DemoPreset> = {
      guest: "guest", user: "user", teacher: "teacher", institution_pending: "institution_pending",
      institution_admin: "institution_admin", campus_admin: "campus_admin", super_admin: "super_admin",
    };
    switchPreset(map[role]);
  };

  const setOwnerMode: AuthContextValue["setOwnerMode"] = (mode) => {
    localStorage.setItem(MODE_KEY, mode);
    setUser(prev => prev && prev.canSuperAdmin ? { ...prev, role: mode } : prev);
  };

  const addSuperAdminEmail = (email: string) => {
    const e = email.trim().toLowerCase();
    if (!e || superAdminEmails.map(x => x.toLowerCase()).includes(e)) return;
    setSuperAdminEmails(prev => [...prev, email.trim()]);
  };

  const removeSuperAdminEmail = (email: string) => {
    setSuperAdminEmails(prev => prev.filter(e => e.toLowerCase() !== email.toLowerCase()));
  };

  const approveRequest = async (id: string) => {
    const reviewer = user?.id ?? null;
    const { data: req } = await supabase
      .from("institution_requests")
      .select("requester_user_id")
      .eq("id", id)
      .maybeSingle();
    await supabase
      .from("institution_requests")
      .update({ status: "approved", reviewed_by: reviewer, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (req?.requester_user_id) {
      try {
        await supabase.from("user_roles").insert({ user_id: req.requester_user_id, role: "institution_admin" as any });
      } catch { /* ignore duplicate */ }
    }
    await refreshRequests();
  };

  const rejectRequest = async (id: string, reason?: string) => {
    const reviewer = user?.id ?? null;
    await supabase
      .from("institution_requests")
      .update({ status: "rejected", rejection_reason: reason ?? null, reviewed_by: reviewer, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    await refreshRequests();
  };

  const updateProfile: AuthContextValue["updateProfile"] = async (patch) => {
    setUser(prev => prev ? { ...prev, ...patch } : prev);
    if (!user) return;
    try {
      if (patch.name) await supabase.from("profiles").update({ name: patch.name }).eq("id", user.id);
    } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, superAdminEmails, pendingCode,
      signupUser, signupInstitution, signupSuperAdmin, verifyCode, login, logout, switchRole, setOwnerMode,
      switchPreset, exitDemo, demoPreset, hasSession,
      addSuperAdminEmail, removeSuperAdminEmail,
      requests, approveRequest, rejectRequest,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const roleLabel: Record<UserRole, string> = {
  guest: "Guest",
  user: "User",
  teacher: "University Teacher",
  institution_pending: "Institution (Pending)",
  institution_admin: "Institution Admin",
  campus_admin: "Campus Admin",
  super_admin: "Super Admin",
};

export const roleBadgeClass: Record<UserRole, string> = {
  guest: "bg-muted text-muted-foreground",
  user: "bg-secondary text-secondary-foreground",
  teacher: "bg-indigo-500/15 text-indigo-700",
  institution_pending: "bg-amber-500/15 text-amber-700",
  institution_admin: "bg-emerald-500/15 text-emerald-700",
  campus_admin: "bg-teal-500/15 text-teal-700",
  super_admin: "bg-primary/15 text-primary",
};
