import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const Verify = () => {
  const { pendingCode, verifyCode } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  if (!pendingCode) {
    return (
      <div className="container max-w-md py-12 text-center">
        <p className="text-muted-foreground">No pending verification.</p>
        <Button className="mt-4" onClick={() => navigate("/auth/signup")}>Go to sign up</Button>
      </div>
    );
  }

  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { toast({ title: "Enter the 6-digit code", variant: "destructive" }); return; }
    setSubmitting(true);
    const ok = await verifyCode(code);
    setSubmitting(false);
    if (ok) {
      toast({ title: "Verified!", description: pendingCode.flow === "institution" ? "Your request is now pending Super Admin approval." : "Welcome to ReserveHub!" });
      navigate("/");
    } else {
      toast({ title: "Invalid or expired code", variant: "destructive" });
    }
  };

  return (
    <div className="container max-w-md py-12">
      <div className="bg-card border rounded-xl p-8 text-center">
        <div className="h-14 w-14 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <Mail className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold mb-1">Check your email</h1>
        <p className="text-sm text-muted-foreground mb-6">
          We sent a 6-digit code to <span className="font-medium text-foreground">{pendingCode.email}</span>
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Type the 6-digit code here — it works even if the link in the email doesn’t open.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button type="submit" className="w-full" disabled={code.length !== 6 || submitting}>{submitting ? "Verifying…" : "Verify"}</Button>
        </form>
      </div>
    </div>
  );
};

export default Verify;
