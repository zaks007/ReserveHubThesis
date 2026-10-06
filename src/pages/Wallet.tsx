import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { usePaymentMethods } from "@/contexts/PaymentMethodsContext";
import { typeLabelMap } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PLATFORM_ID = "00000000-0000-0000-0000-000000000000";
const huf = (n: number) => `${Math.round(n).toLocaleString()} HUF`;
type OwnerType = "user" | "institution" | "platform";
interface Tx { id: string; amount: number; direction: "credit" | "debit"; kind: string; note: string | null; institution_type: string | null; created_at: string }

const Wallet = () => {
  const { user } = useAuth();
  const { methods } = usePaymentMethods();
  const db = supabase as any;

  const owner = useMemo<{ type: OwnerType; id: string; label: string } | null>(() => {
    if (!user) return null;
    if (user.role === "super_admin") return { type: "platform", id: PLATFORM_ID, label: "Platform wallet" };
    if (user.role === "institution_admin" && user.institutionId) return { type: "institution", id: user.institutionId, label: "Institution wallet" };
    return { type: "user", id: user.id, label: "My wallet" };
  }, [user]);

  const [balance, setBalance] = useState(0);
  const [withdrawn, setWithdrawn] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [cardId, setCardId] = useState("");
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");

  const load = useCallback(async () => {
    if (!owner || user?.isDemo) { setLoaded(true); return; }
    if (owner.type === "user") await db.rpc("ensure_my_wallet");
    const [w, t] = await Promise.all([
      db.from("wallets").select("balance, withdrawn_total").eq("owner_type", owner.type).eq("owner_id", owner.id).maybeSingle(),
      db.from("wallet_transactions").select("*").eq("wallet_owner_type", owner.type).eq("wallet_owner_id", owner.id).order("created_at", { ascending: false }).limit(200),
    ]);
    if (w.error || t.error) setError((w.error || t.error).message);
    setBalance(Number(w.data?.balance ?? 0));
    setWithdrawn(Number(w.data?.withdrawn_total ?? 0));
    setTxs((t.data ?? []).map((x: any) => ({ ...x, amount: Number(x.amount) })));
    setLoaded(true);
  }, [owner, user?.isDemo]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!cardId && methods[0]) setCardId((methods.find((m) => m.isDefault) || methods[0]).id); }, [methods, cardId]);

  if (!user) return <Navigate to="/auth/login" replace />;

  const breakdown = owner?.type === "platform"
    ? Object.entries(txs.filter((t) => t.kind === "commission").reduce<Record<string, number>>((acc, t) => {
        const k = t.institution_type || "other"; acc[k] = (acc[k] || 0) + t.amount; return acc;
      }, {})).sort((a, b) => b[1] - a[1])
    : [];

  const withdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast({ title: "Enter an amount", variant: "destructive" }); return; }
    if (amt > balance) { toast({ title: "Not enough balance", variant: "destructive" }); return; }
    if (!cardId) { toast({ title: "Choose a card", variant: "destructive" }); return; }
    setPhase("processing");
    await new Promise((r) => setTimeout(r, 1800));
    const { error } = await db.rpc("withdraw_from_wallet", { _owner_type: owner!.type, _owner_id: owner!.id, _amount: amt, _card_id: cardId });
    if (error) { setPhase("idle"); toast({ title: "Transfer failed", description: error.message, variant: "destructive" }); return; }
    setPhase("done"); setAmount("");
    await load();
  };

  const canWithdraw = owner?.type === "institution" || owner?.type === "platform";
  const card = methods.find((m) => m.id === cardId);

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-1 flex items-center gap-2"><WalletIcon className="h-7 w-7 text-primary" /> {owner?.label}</h1>
      <p className="text-sm text-muted-foreground mb-8">Simulated money — no real payments are made.</p>

      {user.isDemo && (
        <p className="mb-6 p-4 rounded-lg bg-amber-500/10 text-amber-700 text-sm">Wallets need a real signed-in account. Demo roles can't read or move wallet money.</p>
      )}
      {error && (
        <p className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">Could not load wallet: {error}. If this mentions a missing table, run supabase/0005_wallets.sql in Supabase.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-card border rounded-xl p-6">
          <p className="text-sm text-muted-foreground">Balance</p>
          <p className="text-4xl font-bold mt-1">{loaded ? huf(balance) : "…"}</p>
        </div>
        {canWithdraw && (
          <div className="bg-card border rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Withdrawn to card</p>
            <p className="text-4xl font-bold mt-1">{huf(withdrawn)}</p>
          </div>
        )}
      </div>

      {breakdown.length > 0 && (
        <div className="bg-card border rounded-xl p-6 mb-8">
          <h2 className="font-semibold mb-3">Commission by institution type</h2>
          <div className="space-y-2">
            {breakdown.map(([t, v]) => (
              <div key={t} className="flex justify-between text-sm"><span>{(typeLabelMap as any)[t] || "Other"}</span><span className="font-semibold">{huf(v)}</span></div>
            ))}
          </div>
        </div>
      )}

      {canWithdraw && !user.isDemo && (
        <div className="bg-card border rounded-xl p-6 mb-8">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5" /> Transfer to card</h2>
          {phase === "processing" && (
            <div className="flex flex-col items-center py-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="font-medium">Processing transfer…</p>
              <p className="text-sm text-muted-foreground">Sending to {card ? `•••• ${card.last4}` : "your card"}</p>
            </div>
          )}
          {phase === "done" && (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-primary mb-3" />
              <p className="font-medium">Transfer complete</p>
              <p className="text-sm text-muted-foreground mb-4">The money is on its way to {card ? `•••• ${card.last4}` : "your card"} (simulated).</p>
              <Button variant="outline" onClick={() => setPhase("idle")}>Make another transfer</Button>
            </div>
          )}
          {phase === "idle" && (methods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved cards. <Link to="/account/cards/new" className="text-primary font-medium">Add a card</Link> first.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Card</label>
                <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={cardId} onChange={(e) => setCardId(e.target.value)}>
                  {methods.map((m) => <option key={m.id} value={m.id}>{m.brand.toUpperCase()} •••• {m.last4}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Amount (HUF)</label>
                <Input type="number" min={1} max={balance} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Up to ${Math.round(balance)}`} />
              </div>
              <Button onClick={withdraw}>Withdraw</Button>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-3">Transaction history</h2>
      <div className="bg-card border rounded-xl overflow-hidden">
        {txs.length === 0 && <p className="p-8 text-center text-muted-foreground text-sm">No transactions yet.</p>}
        {txs.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 p-4 border-b last:border-0">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center ${t.direction === "credit" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                {t.direction === "credit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-medium">{t.note || t.kind}</p>
                <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}{t.institution_type ? ` · ${(typeLabelMap as any)[t.institution_type] || t.institution_type}` : ""}</p>
              </div>
            </div>
            <span className={`font-semibold text-sm ${t.direction === "credit" ? "text-primary" : "text-destructive"}`}>
              {t.direction === "credit" ? "+" : "−"}{huf(t.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wallet;
