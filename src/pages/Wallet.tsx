import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Loader2,
  CheckCircle2,
  PlusCircle,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { usePaymentMethods } from "@/contexts/PaymentMethodsContext";
import { typeLabelMap } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PLATFORM_ID = "00000000-0000-0000-0000-000000000000";
const DEMO_WALLETS_KEY = "reservehub_demo_wallets_v2";
const DEMO_TXS_KEY = "reservehub_demo_txs_v2";

const huf = (n: number) => `${Math.round(n).toLocaleString()} HUF`;
type OwnerType = "user" | "institution" | "platform";

interface Tx {
  id: string;
  amount: number;
  direction: "credit" | "debit";
  kind: string;
  note: string | null;
  institution_type: string | null;
  created_at: string;
  wallet_owner_type?: string;
  wallet_owner_id?: string;
}

// Default starting balances for demo accounts
const defaultDemoWallets: Record<string, { balance: number; withdrawn: number }> = {
  "user:demo-user": { balance: 250000, withdrawn: 0 },
  "user:demo-teacher": { balance: 180000, withdrawn: 0 },
  "institution:inst-1": { balance: 145000, withdrawn: 30000 },
  "institution:inst-2": { balance: 320000, withdrawn: 50000 },
  "institution:inst-8": { balance: 95000, withdrawn: 20000 },
  [`platform:${PLATFORM_ID}`]: { balance: 65000, withdrawn: 15000 },
};

const Wallet = () => {
  const { user } = useAuth();
  const { methods } = usePaymentMethods();
  const db = supabase as any;

  const [activeTab, setActiveTab] = useState<"topup" | "withdraw">("withdraw");

  const owner = useMemo<{ type: OwnerType; id: string; label: string } | null>(() => {
    if (!user) return null;
    if (user.role === "super_admin") {
      return { type: "platform", id: PLATFORM_ID, label: "Platform Commission Wallet" };
    }
    if (user.role === "institution_admin" || user.role === "campus_admin") {
      const instId = user.institutionId || "inst-1";
      return { type: "institution", id: instId, label: "Institution Earnings Wallet" };
    }
    return { type: "user", id: user.id, label: "My Personal Wallet" };
  }, [user]);

  // Set default tab based on role
  useEffect(() => {
    if (owner?.type === "user") setActiveTab("topup");
    else setActiveTab("withdraw");
  }, [owner?.type]);

  // Effective payment cards (includes fallback demo card for instant testing)
  const effectiveCards = useMemo(() => {
    if (methods.length > 0) return methods;
    return [
      {
        id: "demo-card-default",
        userId: user?.id || "demo",
        cardholder: user?.name || "Demo User",
        brand: "visa" as const,
        last4: "4242",
        expMonth: "12",
        expYear: "28",
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }, [methods, user]);

  const [balance, setBalance] = useState(0);
  const [withdrawn, setWithdrawn] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  // Withdraw state
  const [amount, setAmount] = useState("");
  const [cardId, setCardId] = useState("");
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");

  // Top-up state
  const [topupAmount, setTopupAmount] = useState("");
  const [topupCardId, setTopupCardId] = useState("");
  const [topupPhase, setTopupPhase] = useState<"idle" | "processing" | "done">("idle");

  const load = useCallback(async () => {
    if (!owner) {
      setLoaded(true);
      return;
    }

    // Demo Mode handling
    if (user?.isDemo) {
      const storedWallets = JSON.parse(localStorage.getItem(DEMO_WALLETS_KEY) || "{}");
      const key = `${owner.type}:${owner.id}`;
      const walletData = storedWallets[key] || defaultDemoWallets[key] || { balance: 100000, withdrawn: 0 };
      
      setBalance(Number(walletData.balance ?? 0));
      setWithdrawn(Number(walletData.withdrawn ?? 0));

      const allTxs: Tx[] = JSON.parse(localStorage.getItem(DEMO_TXS_KEY) || "[]");
      const filtered = allTxs.filter(
        (t) => t.wallet_owner_type === owner.type && t.wallet_owner_id === owner.id
      );
      setTxs(filtered);
      setLoaded(true);
      return;
    }

    // Real Supabase User handling
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

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (effectiveCards.length > 0) {
      const def = effectiveCards[0].id;
      if (!cardId) setCardId(def);
      if (!topupCardId) setTopupCardId(def);
    }
  }, [effectiveCards, cardId, topupCardId]);

  if (!user) return <Navigate to="/auth/login" replace />;

  const breakdown =
    owner?.type === "platform"
      ? Object.entries(
          txs
            .filter((t) => t.kind === "commission")
            .reduce<Record<string, number>>((acc, t) => {
              const k = t.institution_type || "other";
              acc[k] = (acc[k] || 0) + t.amount;
              return acc;
            }, {})
        ).sort((a, b) => b[1] - a[1])
      : [];

  // Withdraw Handler (Works for Demo + Real DB)
  const withdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast({ title: "Enter an amount to withdraw", variant: "destructive" });
      return;
    }
    if (amt > balance) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }
    if (!cardId) {
      toast({ title: "Choose a destination card", variant: "destructive" });
      return;
    }

    setPhase("processing");
    await new Promise((r) => setTimeout(r, 1200));

    if (user.isDemo) {
      const storedWallets = JSON.parse(localStorage.getItem(DEMO_WALLETS_KEY) || "{}");
      const key = `${owner!.type}:${owner!.id}`;
      const current = storedWallets[key] || defaultDemoWallets[key] || { balance, withdrawn };

      storedWallets[key] = {
        balance: Math.max(0, current.balance - amt),
        withdrawn: (current.withdrawn || 0) + amt,
      };
      localStorage.setItem(DEMO_WALLETS_KEY, JSON.stringify(storedWallets));

      const allTxs: Tx[] = JSON.parse(localStorage.getItem(DEMO_TXS_KEY) || "[]");
      const cardObj = effectiveCards.find((c) => c.id === cardId);
      allTxs.unshift({
        id: `tx-${Date.now()}`,
        wallet_owner_type: owner!.type,
        wallet_owner_id: owner!.id,
        amount: amt,
        direction: "debit",
        kind: "withdrawal",
        note: `Transfer to card •••• ${cardObj?.last4 || "4242"}`,
        institution_type: null,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(DEMO_TXS_KEY, JSON.stringify(allTxs));

      setPhase("done");
      setAmount("");
      await load();
      return;
    }

    const { error } = await db.rpc("withdraw_from_wallet", {
      _owner_type: owner!.type,
      _owner_id: owner!.id,
      _amount: amt,
      _card_id: cardId,
    });
    if (error) {
      setPhase("idle");
      toast({ title: "Transfer failed", description: error.message, variant: "destructive" });
      return;
    }
    setPhase("done");
    setAmount("");
    await load();
  };

  // Top-Up Handler (Works for Demo + Real DB)
  const handleTopup = async () => {
    const amt = Number(topupAmount);
    if (!amt || amt <= 0) {
      toast({ title: "Enter a valid top-up amount", variant: "destructive" });
      return;
    }
    if (!topupCardId) {
      toast({ title: "Select a card to charge", variant: "destructive" });
      return;
    }

    setTopupPhase("processing");
    await new Promise((r) => setTimeout(r, 1200));

    if (user.isDemo) {
      const storedWallets = JSON.parse(localStorage.getItem(DEMO_WALLETS_KEY) || "{}");
      const key = `${owner!.type}:${owner!.id}`;
      const current = storedWallets[key] || defaultDemoWallets[key] || { balance, withdrawn };

      storedWallets[key] = {
        balance: current.balance + amt,
        withdrawn: current.withdrawn || 0,
      };
      localStorage.setItem(DEMO_WALLETS_KEY, JSON.stringify(storedWallets));

      const allTxs: Tx[] = JSON.parse(localStorage.getItem(DEMO_TXS_KEY) || "[]");
      const cardObj = effectiveCards.find((c) => c.id === topupCardId);
      allTxs.unshift({
        id: `tx-${Date.now()}`,
        wallet_owner_type: owner!.type,
        wallet_owner_id: owner!.id,
        amount: amt,
        direction: "credit",
        kind: "topup",
        note: `Top-up from card •••• ${cardObj?.last4 || "4242"}`,
        institution_type: null,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(DEMO_TXS_KEY, JSON.stringify(allTxs));

      setTopupPhase("done");
      setTopupAmount("");
      await load();
      return;
    }

    const { error } = await db.rpc("topup_wallet", {
      _amount: amt,
      _card_id: topupCardId,
    });
    if (error) {
      setTopupPhase("idle");
      toast({ title: "Top-up failed", description: error.message, variant: "destructive" });
      return;
    }
    setTopupPhase("done");
    setTopupAmount("");
    await load();
  };

  const withdrawCard = effectiveCards.find((m) => m.id === cardId);
  const topupCard = effectiveCards.find((m) => m.id === topupCardId);

  return (
    <div className="container max-w-4xl py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {owner?.type === "platform" ? (
              <ShieldCheck className="h-7 w-7 text-primary" />
            ) : owner?.type === "institution" ? (
              <Building2 className="h-7 w-7 text-primary" />
            ) : (
              <WalletIcon className="h-7 w-7 text-primary" />
            )}
            {owner?.label}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Simulated wallet system {user.isDemo ? "· Active in Dev/Demo Mode" : "· Live Supabase"}
          </p>
        </div>

        {/* Action Toggle */}
        <div className="flex bg-muted p-1 rounded-lg border">
          <Button
            size="sm"
            variant={activeTab === "topup" ? "default" : "ghost"}
            onClick={() => {
              setActiveTab("topup");
              setTopupPhase("idle");
            }}
            className="gap-1.5"
          >
            <PlusCircle className="h-4 w-4" /> Add Money
          </Button>
          <Button
            size="sm"
            variant={activeTab === "withdraw" ? "default" : "ghost"}
            onClick={() => {
              setActiveTab("withdraw");
              setPhase("idle");
            }}
            className="gap-1.5"
          >
            <CreditCard className="h-4 w-4" /> Withdraw to Card
          </Button>
        </div>
      </div>

      {error && !user.isDemo && (
        <p className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          Could not load wallet from Supabase: {error}
        </p>
      )}

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
          <p className="text-4xl font-bold mt-1 text-primary">{loaded ? huf(balance) : "…"}</p>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Withdrawn to Card</p>
          <p className="text-4xl font-bold mt-1">{huf(withdrawn)}</p>
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="bg-card border rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="font-semibold mb-3">Commission by institution type</h2>
          <div className="space-y-2">
            {breakdown.map(([t, v]) => (
              <div key={t} className="flex justify-between text-sm">
                <span>{(typeLabelMap as any)[t] || "Other"}</span>
                <span className="font-semibold">{huf(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP UP PANEL */}
      {activeTab === "topup" && (
        <div className="bg-card border rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg">
            <PlusCircle className="h-5 w-5 text-primary" /> Top Up Wallet from Card
          </h2>
          {topupPhase === "processing" && (
            <div className="flex flex-col items-center py-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="font-medium">Charging card…</p>
              <p className="text-sm text-muted-foreground">
                Charging {topupCard ? `•••• ${topupCard.last4}` : "your card"} (Simulated)
              </p>
            </div>
          )}
          {topupPhase === "done" && (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-primary mb-3" />
              <p className="font-medium text-lg">Top-up Successful</p>
              <p className="text-sm text-muted-foreground mb-4">
                Funds credited to your wallet from {topupCard ? `•••• ${topupCard.last4}` : "your card"}.
              </p>
              <Button variant="outline" onClick={() => setTopupPhase("idle")}>
                Make Another Top-Up
              </Button>
            </div>
          )}
          {topupPhase === "idle" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">From Card</label>
                  <select
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={topupCardId}
                    onChange={(e) => setTopupCardId(e.target.value)}
                  >
                    {effectiveCards.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.brand.toUpperCase()} •••• {m.last4}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Amount (HUF)</label>
                  <Input
                    type="number"
                    min={100}
                    step={1000}
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="e.g. 15000"
                  />
                </div>
                <Button onClick={handleTopup}>Top Up Now</Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground self-center mr-1">Quick amounts:</span>
                {[5000, 10000, 25000, 50000, 100000].map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setTopupAmount(String(preset))}
                  >
                    +{preset.toLocaleString()} HUF
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WITHDRAW PANEL */}
      {activeTab === "withdraw" && (
        <div className="bg-card border rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" /> Withdraw to Card
          </h2>
          {phase === "processing" && (
            <div className="flex flex-col items-center py-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="font-medium">Processing withdrawal…</p>
              <p className="text-sm text-muted-foreground">
                Sending payout to {withdrawCard ? `•••• ${withdrawCard.last4}` : "your card"} (Simulated)
              </p>
            </div>
          )}
          {phase === "done" && (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-primary mb-3" />
              <p className="font-medium text-lg">Transfer Complete</p>
              <p className="text-sm text-muted-foreground mb-4">
                The money has been transferred to {withdrawCard ? `•••• ${withdrawCard.last4}` : "your card"}.
              </p>
              <Button variant="outline" onClick={() => setPhase("idle")}>
                Make Another Withdrawal
              </Button>
            </div>
          )}
          {phase === "idle" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">To Card</label>
                  <select
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                  >
                    {effectiveCards.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.brand.toUpperCase()} •••• {m.last4}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Amount (HUF)</label>
                  <Input
                    type="number"
                    min={1}
                    max={balance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Up to ${Math.round(balance)}`}
                  />
                </div>
                <Button onClick={withdraw} disabled={balance <= 0}>
                  Withdraw
                </Button>
              </div>

              {balance > 0 && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(Math.round(balance / 2)))}
                  >
                    Withdraw 50%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(Math.round(balance)))}
                  >
                    Withdraw All ({huf(balance)})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Transaction History */}
      <h2 className="text-xl font-semibold mb-3">Transaction History</h2>
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        {txs.length === 0 && (
          <p className="p-8 text-center text-muted-foreground text-sm">No transactions yet.</p>
        )}
        {txs.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-3 p-4 border-b last:border-0 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center ${
                  t.direction === "credit"
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {t.direction === "credit" ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{t.note || t.kind}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(t.created_at).toLocaleString()}
                  {t.institution_type
                    ? ` · ${(typeLabelMap as any)[t.institution_type] || t.institution_type}`
                    : ""}
                </p>
              </div>
            </div>
            <span
              className={`font-semibold text-sm ${
                t.direction === "credit" ? "text-primary" : "text-destructive"
              }`}
            >
              {t.direction === "credit" ? "+" : "−"}
              {huf(t.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wallet;
