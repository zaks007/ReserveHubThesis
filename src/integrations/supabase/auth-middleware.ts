import { createMiddleware } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const requireSupabaseAuth = createMiddleware().server(async ({ next, request }) => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: No authorization header provided");
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error("Unauthorized: Invalid token");
  }

  return next({ context: { supabase, userId: user.id, user } });
});
