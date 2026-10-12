import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { typeLabelMap, InstitutionType } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

// University of Debrecen is the sole university; additional universities cannot be registered
const types: InstitutionType[] = ["hotel", "sports", "garden", "airbnb"];

const SignupInstitution = () => {
  const { signupInstitution } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "hotel" as InstitutionType,
    city: "Debrecen",
    contactEmail: "",
    description: "",
    website: "",
    adminName: "",
    password: "",
    confirmPassword: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contactEmail.trim() || !form.description.trim() || !form.adminName.trim()) {
      toast({ title: "Fill in all required fields", variant: "destructive" });
      return;
    }

    if (!form.password) {
      toast({
        title: "Password required",
        description: "Please enter an administrator password.",
        variant: "destructive",
      });
      return;
    }

    if (form.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    if ((form.type as string) === "university") {
      toast({
        title: "Registration blocked",
        description: "The University of Debrecen is the sole institutional university on ReserveHub.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await signupInstitution(
        {
          name: form.name.trim(),
          type: form.type,
          city: form.city.trim(),
          contactEmail: form.contactEmail.trim(),
          description: form.description.trim(),
          website: form.website.trim() || undefined,
        },
        form.password,
        form.adminName.trim(),
      );
      toast({
        title: "Request submitted",
        description: `Check ${form.contactEmail} for your 6-digit verification code.`,
      });
      navigate(`/auth/verify?email=${encodeURIComponent(form.contactEmail.trim())}&type=institution`);
    } catch (err: any) {
      toast({
        title: "Could not complete signup",
        description: err?.message ?? "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-12">
      <div className="bg-card border rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-1">Register your Institution</h1>
        <p className="text-sm text-muted-foreground mb-6">
          After submitting, your account stays in{" "}
          <span className="font-medium text-amber-700 dark:text-amber-400">Pending Approval</span> until the Super Admin reviews it.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Institution name *</Label>
              <Input
                value={form.name}
                onChange={e => set("name", e.target.value)}
                className="mt-1"
                placeholder="e.g. Grand Arena Sports Complex"
                required
              />
            </div>
            <div>
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={v => set("type", v as InstitutionType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map(t => (
                    <SelectItem key={t} value={t}>
                      {typeLabelMap[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>City *</Label>
              <Input value={form.city} onChange={e => set("city", e.target.value)} className="mt-1" required />
            </div>
            <div>
              <Label>Contact email *</Label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={e => set("contactEmail", e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label>Website (optional)</Label>
              <Input
                value={form.website}
                onChange={e => set("website", e.target.value)}
                className="mt-1"
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description *</Label>
              <Textarea
                value={form.description}
                onChange={e => set("description", e.target.value)}
                className="mt-1"
                rows={3}
                placeholder="Tell us about your institution..."
                required
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-2 space-y-4">
            <p className="text-sm font-semibold">Administrator Account</p>
            <div>
              <Label>Your name *</Label>
              <Input
                value={form.adminName}
                onChange={e => set("adminName", e.target.value)}
                className="mt-1"
                placeholder="e.g. Dr. Kovács János"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Admin password *</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  className="mt-1"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Minimum 6 characters.
                </p>
              </div>
              <div>
                <Label>Confirm password *</Label>
                <Input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => set("confirmPassword", e.target.value)}
                  className="mt-1"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full mt-4" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit request & verify email"}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignupInstitution;
