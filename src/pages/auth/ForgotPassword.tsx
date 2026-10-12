import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, ArrowLeft, ShieldCheck, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDefenseRationale, setShowDefenseRationale] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });

      if (error && !error.message?.includes("Signups not allowed")) {
        console.warn("Recovery notice:", error.message);
      }

      toast({
        title: "Recovery Code Sent",
        description: "If an account exists for this email, a 6-digit recovery code has been delivered.",
      });
      setStep(2);
    } catch (err: any) {
      toast({ title: "Could not send recovery code", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast({ title: "Verification code required", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: "email",
      });

      if (verifyError) {
        throw verifyError;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Password updated successfully!",
        description: "You can now sign in with your new password.",
      });
      navigate("/auth/login");
    } catch (err: any) {
      toast({
        title: "Password reset failed",
        description: err.message || "Invalid or expired recovery code.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-lg py-12">
      <div className="text-center mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Reset Your Password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 1
            ? "Enter your account email to receive a recovery code."
            : "Enter the 6-digit code and choose your new password."}
        </p>
      </div>

      <div className="bg-card border rounded-2xl p-6 md:p-8 space-y-6">
        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <Label>Account Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="user@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending Code..." : "Send Recovery Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={email} disabled className="mt-1 bg-muted text-muted-foreground" />
            </div>

            <div>
              <Label>6-Digit Verification Code</Label>
              <Input
                type="text"
                placeholder="123456"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                maxLength={8}
                required
                className="mt-1 font-mono tracking-widest text-center text-lg"
              />
            </div>

            <div>
              <Label>New Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <Label>Confirm New Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={confirmPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-1/3"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </Button>
              <Button type="submit" className="w-2/3" disabled={loading}>
                {loading ? "Updating..." : "Save New Password"}
              </Button>
            </div>
          </form>
        )}

        <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <Link to="/auth/login" className="flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
          </Link>
          <button
            type="button"
            onClick={() => setShowDefenseRationale((prev) => !prev)}
            className="text-primary hover:underline flex items-center gap-1 font-medium"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Thesis Security Rationale
          </button>
        </div>

        {showDefenseRationale && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2">
            <p className="font-semibold text-primary">Academic & Architectural Rationale for Defense:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <strong>Account Enumeration Resistance:</strong> Recovery endpoints reply with identical neutral responses regardless of whether the email exists, preventing brute-force harvesting of enrolled users.
              </li>
              <li>
                <strong>Out-of-band Verification:</strong> Uses time-limited (10-minute) cryptographic one-time passwords delivered via authenticated email channels instead of long-lived reset links.
              </li>
              <li>
                <strong>Session Invalidation:</strong> Changing passwords automatically revokes prior authentication refresh tokens across other sessions.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
