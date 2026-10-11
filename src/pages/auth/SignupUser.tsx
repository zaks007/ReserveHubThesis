import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const calculateAge = (birthDateString: string): number => {
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const SignupUser = () => {
  const { signupUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    if (!dob) {
      toast({ title: "Date of birth required", description: "You must enter your date of birth to sign up.", variant: "destructive" });
      return;
    }

    const age = calculateAge(dob);
    if (age < 18) {
      toast({
        title: "Registration restricted (18+ only)",
        description: "You must be at least 18 years old to create a registered account. You can continue exploring ReserveHub as a guest.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    if (!password || password.length < 6) {
      toast({ title: "Password required", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await signupUser(email.trim(), name.trim(), password);
      toast({
        title: "Code sent",
        description: `We sent a 6-digit verification code to ${email}.`,
      });
      navigate("/auth/verify");
    } catch (err: any) {
      toast({
        title: "Signup failed",
        description: err?.message || "Could not start registration.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-md py-12">
      <div className="bg-card border rounded-xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">Create user account</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Sign up with your credentials. We'll send a 6-digit confirmation code to verify your email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div className="space-y-1.5">
            <Label htmlFor="signup-name">Full name</Label>
            <Input
              id="signup-name"
              required
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              required
              autoComplete="off"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signup-dob">Date of birth (18+ only)</Label>
            <Input
              id="signup-dob"
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={submitting}>
            {submitting ? "Sending verification code…" : "Sign Up & Send Code"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupUser;
