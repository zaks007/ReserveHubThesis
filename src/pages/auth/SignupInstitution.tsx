import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { typeLabelMap, InstitutionType } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const types: InstitutionType[] = ["university", "hotel", "sports", "garden", "airbnb"];

const SignupInstitution = () => {
  const { signupInstitution } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", type: "hotel" as InstitutionType, city: "Debrecen",
    contactEmail: "", description: "", website: "",
    adminName: "", password: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.contactEmail || !form.description || !form.adminName) {
      toast({ title: "Fill in all required fields", variant: "destructive" }); return;
    }
    try {
      await signupInstitution(
        { name: form.name, type: form.type, city: form.city, contactEmail: form.contactEmail, description: form.description, website: form.website || undefined },
        form.password,
        form.adminName,
      );
      toast({ title: "Request submitted", description: `Check ${form.contactEmail} for your 6-digit verification code.` });
      navigate("/auth/verify");
    } catch (err: any) {
      toast({ title: "Could not send code", description: err?.message ?? "Try again", variant: "destructive" });
    }
  };

  return (
    <div className="container max-w-2xl py-12">
      <div className="bg-card border rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-1">Register your Institution</h1>
        <p className="text-sm text-muted-foreground mb-6">
          After submitting, your account stays in <span className="font-medium text-amber-700">Pending Approval</span> until the Super Admin reviews it.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Institution name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={v => set("type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {types.map(t => <SelectItem key={t} value={t}>{typeLabelMap[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>City *</Label><Input value={form.city} onChange={e => set("city", e.target.value)} className="mt-1" /></div>
            <div><Label>Contact email *</Label><Input type="email" value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} className="mt-1" /></div>
            <div className="md:col-span-2"><Label>Website (optional)</Label><Input value={form.website} onChange={e => set("website", e.target.value)} className="mt-1" placeholder="https://..." /></div>
            <div className="md:col-span-2">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} className="mt-1" rows={3} placeholder="Tell us about your institution..." />
            </div>
          </div>
          <div className="border-t pt-4 mt-2">
            <p className="text-sm font-semibold mb-3">Your admin account</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Your name *</Label><Input value={form.adminName} onChange={e => set("adminName", e.target.value)} className="mt-1" /></div>
              <div><Label>Password *</Label><Input type="password" value={form.password} onChange={e => set("password", e.target.value)} className="mt-1" /></div>
            </div>
          </div>
          <Button type="submit" className="w-full">Submit request & verify email</Button>
        </form>
      </div>
    </div>
  );
};

export default SignupInstitution;
