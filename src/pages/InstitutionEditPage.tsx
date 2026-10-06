import { useEffect, useState } from "react";
import { Navigate, Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageDrop from "@/components/ImageDrop";
import InstitutionStructureEditor from "@/components/InstitutionStructureEditor";
import { useAuth } from "@/contexts/AuthContext";
import { useInstitutions } from "@/contexts/InstitutionsContext";
import { typeLabelMap } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
    {children}
  </div>
);

const empty = { name: "", type: "hotel", city: "Debrecen", address: "", description: "", image: "", rating: 0 };

const InstitutionEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { getById, updateInstitution, createInstitution } = useInstitutions();
  const institution = id ? getById(id) : undefined;
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (institution) {
      setForm({
        name: institution.name, type: institution.type, city: institution.city,
        address: institution.address || "", description: institution.description,
        image: institution.image, rating: institution.rating,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institution?.id]);

  if (loading) return <div className="container py-16 text-center text-muted-foreground">Checking your account…</div>;
  if (!user || user.role !== "super_admin") return <Navigate to="/" replace />;
  if (!isNew && !institution) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground mb-4">Institution not found.</p>
        <Button asChild variant="outline"><Link to="/admin/super">Back to dashboard</Link></Button>
      </div>
    );
  }

  const set = (k: keyof typeof empty, v: any) => setForm((f) => ({ ...f, [k]: v }));
  // University institutions can't be created from this page; existing ones keep their type.
  const typeOptions = Object.entries(typeLabelMap).filter(([k]) => k !== "university" || institution?.type === "university");

  const save = async () => {
    if (!form.name.trim() || !form.city.trim()) { toast({ title: "Name and city are required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const data = { ...form, rating: Number(form.rating) || 0 };
      const mode = isNew ? await createInstitution(data) : await updateInstitution(id!, data);
      toast({
        title: isNew ? "Institution added" : "Changes saved",
        description: mode === "local" ? "Saved in this browser only (the database refused or this is demo data)." : form.name,
      });
      navigate("/admin/super");
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <Link to="/admin/super" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Super Admin
      </Link>
      <h1 className="text-3xl font-bold mb-6">{isNew ? "Add institution" : `Edit ${institution!.name}`}</h1>

      <section className="bg-card border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name *"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Type">
            <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.type} onChange={(e) => set("type", e.target.value)}>
              {typeOptions.map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}
            </select>
          </Field>
          <Field label="City *"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
          <Field label="Address"><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="Rating (0–5)"><Input type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(e) => set("rating", e.target.value)} /></Field>
          <div className="md:col-span-2"><Field label="Description"><Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field></div>
          <div className="md:col-span-2"><Field label="Main photo"><ImageDrop value={form.image} onChange={(v) => set("image", v)} /></Field></div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => navigate("/admin/super")} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </section>

      {institution && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Campuses, buildings & rooms</h2>
          <InstitutionStructureEditor institution={institution} />
        </section>
      )}
      {isNew && <p className="text-sm text-muted-foreground">Save first — you can add buildings and rooms by editing the institution afterwards.</p>}
    </div>
  );
};

export default InstitutionEditPage;
