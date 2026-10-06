import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles the link people click in their email.
 * Supports both the newer `?token_hash=...&type=...` links and the older
 * `#access_token=...` hash links, then sends the user to the homepage.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const tokenHash = url.searchParams.get("token_hash");
        const type = (url.searchParams.get("type") ?? "email") as any;
        const code = url.searchParams.get("code");
        const errDesc = url.searchParams.get("error_description");

        if (errDesc) throw new Error(errDesc);

        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Hash-style link: the client picks the session up automatically.
          const { data } = await supabase.auth.getSession();
          if (!data.session) throw new Error("This link is invalid or has expired.");
        }

        if (!cancelled) navigate("/", { replace: true });
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "This link is invalid or has expired.");
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="container max-w-md py-16 text-center">
      {error ? (
        <div className="bg-card border rounded-xl p-8">
          <h1 className="text-xl font-bold mb-2">Sign-in link didn’t work</h1>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate("/auth/login")}>Back to log in</Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Signing you in…</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallback;
