import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const SignupSuperAdmin = () => {
  const { signupSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signupSuperAdmin(email, name, password);
    if (typeof result === "object" && result !== null && "error" in result) {
      toast({ title: "Not authorized", description: String((result as { error: string }).error), variant: "destructive" });
      return;
    }
    toast({ title: "Verification code sent", description: `Check ${email} for your 6-digit code.` });
    navigate("/auth/verify");
  };

  return (
    <div className="container max-w-md py-12">
      <div className="bg-card border rounded-xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Super Admin Sign-up</h1>
            <p className="text-xs text-muted-foreground">Restricted to pre-authorized emails.</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Full name</Label><Input value={name} onChange={e => setName(e.target.value)} className="mt-1" /></div>
          <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1" /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1" /></div>
          <Button type="submit" className="w-full">Verify & create account</Button>
        </form>
      </div>
    </div>
  );
};

export default SignupSuperAdmin;
