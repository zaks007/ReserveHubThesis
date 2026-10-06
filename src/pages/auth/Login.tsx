import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast({ title: "Enter your email", variant: "destructive" }); return; }
    const ok = await login(email, password);
    if (ok) {
      toast({ title: "Check your email", description: `We sent a 6-digit login code to ${email}.` });
      navigate("/auth/verify");
    } else {
      toast({ title: "Could not send code", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="container max-w-md py-12">
      <div className="bg-card border rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-sm text-muted-foreground mb-6">Log in with a one-time code sent to your email.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1" placeholder="you@example.com" />
          </div>
          <Button type="submit" className="w-full">Send login code</Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          No account? <Link to="/auth/signup" className="text-primary font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
