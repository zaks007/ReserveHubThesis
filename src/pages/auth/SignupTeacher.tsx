import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { GraduationCap } from "lucide-react";

const SignupTeacher = () => {
  const { signupUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");

  const isAdult = (d: string) => {
    const b = new Date(d);
    if (isNaN(b.getTime())) return false;
    const t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    if (
      t.getMonth() < b.getMonth() ||
      (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())
    ) {
      age--;
    }
    return age >= 18;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !dob) {
      toast({
        title: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    if (!isAdult(dob)) {
      toast({
        title: "You must be 18 or older to register",
        description: "You can keep browsing as a guest.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    // Enforce university email domain
    const isUni = /@(mailbox\.)?unideb\.hu$/i.test(email.trim());
    if (!isUni) {
      toast({
        title: "Official university email required",
        description: "Please sign up with an @unideb.hu or @mailbox.unideb.hu email, or register as a Normal User.",
        variant: "destructive",
      });
      return;
    }

    try {
      await signupUser(email, name, password);
      toast({
        title: "Check your university inbox",
        description: `We sent a 6-digit verification code to ${email}.`,
      });
      navigate("/auth/verify");
    } catch (err: any) {
      toast({
        title: "Could not send verification code",
        description: err?.message ?? "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-md py-12">
      <div className="bg-card border rounded-xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">University Teacher / Official</h1>
            <p className="text-xs text-muted-foreground">University of Debrecen Faculty & Staff</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground my-4">
          Register with your institutional email for faculty room reservation privileges.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name & Title</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">University Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must end with @unideb.hu or @mailbox.unideb.hu
            </p>
          </div>
          <div>
            <Label htmlFor="dob">Date of birth (18+ only)</Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDob(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full">
            Send verification code
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SignupTeacher;
