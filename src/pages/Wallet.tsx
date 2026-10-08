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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PLATFORM_ID = "00000000-0000-0000-0000-000000000000";
const SUPER_ADMIN_EMAIL = "zakariumar2005@gmail.com";
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

const defaultDemoWallets: Record<string, { balance: number; withdrawn: number }> = {
  "user:demo-user": { balance: 250000, withdrawn: 0 },
  "user:demo-teacher": { balance: 180000, withdrawn: 0 },
  "user:demo-sa": { balance: 500000, withdrawn: 0 },
  "institution:inst-1": { balance: 145000, withdrawn: 30000 },
  "institution:inst-2": { balance: 320000, withdrawn: 50000 },
  "institution:inst-8": { balance: 95000, withdrawn: 20000 },
  [`platform:${PLATFORM_ID}`]: { balance: 84500, withdrawn: 15000 },
};

const Wallet = () => {
  const { user } = useAuth();
  const { methods } = usePaymentMethods();
  const db = supabase as any;

  const isSuperAdmin =
    user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL ||
    user?.role === "super_admin";

  const owner = useMemo<{ type: OwnerType; id: string; label: string } | null>(() => {
    if (!user) return null;
    if (user.role === "institution_admin" || user.role === "campus_admin") {
      const instId = user.institutionId || "inst-1";
      return { type: "institution", id: instId, label: "Institution Earnings Wallet" };
    }
    return { type: "user", id: user.id, label: "My Personal Wallet" };
  }, [user]);

  const [activeTab, setActiveTab] = useState<"topup" | "withdraw">("topup");

  const effectiveCards = useMemo(() => {
    if (methods.length > 0) return methods;
    return [
      {
        id: "demo-card-default",
        userId: user?.id || "demo",
        cardholder: user?.name || "Zakaria",
        brand: "visa" as const,
        last4: "4242",
        expMonth: "12",
        expYear: "28",
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }, [methods, user]);

  // Personal/Institution wallet states
  const [balance, setBalance] = useState(0);
  const [withdrawn, setWithdrawn] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  // Platform Commission states (Super Admin)
  const [platformBalance, setPlatformBalance] = useState(0);
  const [platformTxs, setPlatformTxs] = useState<Tx[]>([]);
  const [commAmount, setCommAmount] = useState("");
  const [commCardId, setCommCardId] = useState("");
  const [commPhase, setCommPhase] = useState<"idle" | "processing" | "done">("idle");

  // Regular action form states
  const [amount, setAmount] = useState("");
  const [cardId, setCardId] = useState("");
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");

  const [topupAmount, setTopupAmount] = useState("");
  const [topupCardId, setTopupCardId] = useState("");
  const [topupPhase, setTopupPhase] = useState<"idle" | "processing" | "done">("idle");

  const load = useCallback(async () => {
    if (!owner) {
      setLoaded(true);
      return;
    }

    if (user?.isDemo) {
      const storedWallets = JSON.parse(localStorage.getItem(DEMO_WALLETS_KEY) || "{}");
      const key = `${owner.type}:${owner.id}`;
      const walletData = storedWallets[key] || defaultDemoWallets[key] || { balance: 100000, withdrawn: 0 };

      setBalance(Number(walletData.balance ?? 0));
      setWithdrawn(Number(walletData.withdrawn ?? 0));

      const allTxs: Tx[] = JSON.parse(localStorage.getItem(DEMO_TXS_KEY) || "[]");
      setTxs(allTxs.filter((t) => t.wallet_owner_type === owner.type && t.wallet_owner_id === owner.id));

      if (isSuperAdmin) {
        const platKey = `platform:${PLATFORM_ID}`;
        const pData = storedWallets[platKey] || defaultDemoWallets[platKey] || { balance: 84500, withdrawn: 15000 };
        setPlatformBalance(Number(pData.balance ?? 0));
        setPlatformTxs(allTxs.filter((t) => t.wallet_owner_type === "platform"));
      }
      setLoaded(true);
      return;
    }

    // Real Supabase accounts
    if (owner.type === "user") await db.rpc("ensure_my_wallet");
    const [w, t] = await Promise.all([
      db.from("wallets").select("balance, withdrawn_total").eq("owner_type", owner.type).eq("owner_id", owner.id).maybeSingle(),
      db.from("wallet_transactions").select("*").eq("wallet_owner_type", owner.type).eq("wallet_owner_id", owner.id).order("created_at", { ascending: false }).limit(100),
    ]);
    if (w.error || t.error) setError((w.error || t.error).message);
    setBalance(Number(w.data?.balance ?? 0));
    setWithdrawn(Number(w.data?.withdrawn_total ?? 0));
    setTxs((t.data ?? []).map((x: any) => ({ ...x, amount: Number(x.amount) })));

    if (isSuperAdmin) {
      const [pw, pt] = await Promise.all([
        db.from("wallets").select("balance, withdrawn_total").eq("owner_type", "platform").eq("owner_id", PLATFORM_ID).maybeSingle(),
        db.from("wallet_transactions").select("*").eq("wallet_owner_type", "platform").order("created_at", { ascending: false }).limit(200),
      ]);
      setPlatformBalance(Number(pw.data?.balance ?? 0));
      setPlatformTxs((pt.data ?? []).map((x: any) => ({ ...x, amount: Number(x.amount) })));
    }
    setLoaded(true);
  }, [owner, user?.isDemo, isSuperAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (effectiveCards.length > 0) {
      const def = effectiveCards[0].id;
      if (!cardId) setCardId(def);
      if (!topupCardId) setTopupCardId(def);
      if (!commCardId) setCommCardId(def);
    }
  }, [effectiveCards, cardId, topupCardId, commCardId]);

  if (!user) return <Navigate to="/auth/login" replace />;

  // Regular Withdraw
  const withdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast({ title: "Enter an amount", variant: "destructive" });
      return;
    }
    if (amt > balance) {
      toast({ title: "Not enough balance", variant: "destructive" });
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

  // Regular Top-Up
  const handleTopup = async () => {
    const amt = Number(topupAmount);
    if (!amt || amt <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
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

  // Withdraw Commission (Super Admin)
  const withdrawCommission = async () => {
    const amt = Number(commAmount);
    if (!amt || amt <= 0) {
      toast({ title: "Enter an amount to withdraw", variant: "destructive" });
      return;
    }
    if (amt > platformBalance) {
      toast({ title: "Insufficient commission balance", variant: "destructive" });
      return;
    }
    setCommPhase("processing");
    await new Promise((r) => setTimeout(r, 1200));

    if (user.isDemo) {
      const storedWallets = JSON.parse(localStorage.getItem(DEMO_WALLETS_KEY) || "{}");
      const platKey = `platform:${PLATFORM_ID}`;
      const current = storedWallets[platKey] || defaultDemoWallets[platKey] || { balance: platformBalance, withdrawn: 0 };

      storedWallets[platKey] = {
        balance: Math.max(0, current.balance - amt),
        withdrawn: (current.withdrawn || 0) + amt,
      };
      localStorage.setItem(DEMO_WALLETS_KEY, JSON.stringify(storedWallets));

      const allTxs: Tx[] = JSON.parse(localStorage.getItem(DEMO_TXS_KEY) || "[]");
      const cardObj = effectiveCards.find((c) => c.id === commCardId);
      allTxs.unshift({
        id: `tx-${Date.now()}`,
        wallet_owner_type: "platform",
        wallet_owner_id: PLATFORM_ID,
        amount: amt,
        direction: "debit",
        kind: "withdrawal",
        note: `Commission payout to card •••• ${cardObj?.last4 || "4242"}`,
        institution_type: null,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(DEMO_TXS_KEY, JSON.stringify(allTxs));
      setCommPhase("done");
      setCommAmount("");
      await load();
      return;
    }

    const { error } = await db.rpc("withdraw_from_wallet", {
      _owner_type: "platform",
      _owner_id: PLATFORM_ID,
      _amount: amt,
      _card_id: commCardId,
    });
    if (error) {
      setCommPhase("idle");
      toast({ title: "Commission transfer failed", description: error.message, variant: "destructive" });
      return;
    }
    setCommPhase("done");
    setCommAmount("");
    await load();
  };

  const withdrawCard = effectiveCards.find((m) => m.id === cardId);
  const topupCard = effectiveCards.find((m) => m.id === topupCardId);
  const commCard = effectiveCards.find((m) => m.id === commCardId);

  return (
    <div className="container max-w-4xl py-10 space-y-10">
      {/* 1. REGULAR WALLET SECTION */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {owner?.type === "institution" ? (
                <Building2 className="h-7 w-7 text-primary" />
              ) : (
                <WalletIcon className="h-7 w-7 text-primary" />
              )}
              {owner?.label}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your personal balance and transaction management.
            </p>
          </div>

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
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
            <p className="text-4xl font-bold mt-1 text-primary">{loaded ? huf(balance) : "…"}</p>
          </div>
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Withdrawn to Card</p>
            <p className="text-4xl font-bold mt-1">{huf(withdrawn)}</p>
          </div>
        </div>

        {/* Regular Top Up Panel */}
        {activeTab === "topup" && (
          <div className="bg-card border rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg">
              <PlusCircle className="h-5 w-5 text-primary" /> Add Money to Wallet
            </h2>
            {topupPhase === "processing" && (
              <div className="flex flex-col items-center py-8 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="font-medium">Charging simulated card…</p>
                <p className="text-sm text-muted-foreground">
                  Charging {topupCard ? `•••• ${topupCard.last4}` : "your card"}
                </p>
              </div>
            )}
            {topupPhase === "done" && (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-primary mb-3" />
                <p className="font-medium text-lg">Top-Up Successful</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Funds credited to your wallet from {topupCard ? `•••• ${topupCard.last4}` : "your card"}.
                </p>
                <Button variant="outline" onClick={() => setTopupPhase("idle")}>
                  Add More Money
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
                  <span className="text-xs text-muted-foreground self-center mr-1">Presets:</span>
                  {[5000, 10000, 25000, 50000].map((preset) => (
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

        {/* Regular Withdraw Panel */}
        {activeTab === "withdraw" && (
          <div className="bg-card border rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" /> Withdraw to Card
            </h2>
            {phase === "processing" && (
              <div className="flex flex-col items-center py-8 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="font-medium">Processing withdrawal…</p>
                <p className="text-sm text-muted-foreground">
                  Sending to {withdrawCard ? `•••• ${withdrawCard.last4}` : "your card"}
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
              </div>
            )}
          </div>
        )}

        {/* Regular Transactions */}
        <h3 className="text-lg font-semibold mb-3">Recent Personal Activity</h3>
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          {txs.length === 0 && (
            <p className="p-6 text-center text-muted-foreground text-sm">No activity recorded yet.</p>
          )}
          {txs.slice(0, 5).map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 p-3.5 border-b last:border-0 hover:bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
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

      {/* 2. DEDICATED SUPER ADMINISTRATOR COMMISSIONS SECTION */}
      {isSuperAdmin && (
        <div className="border-t pt-10 border-primary/20">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Super Administrator Commissions</h2>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Automated revenue cut collected from every booking made on ReserveHub.
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Commissions Balance
                </p>
                <p className="text-3xl font-extrabold text-primary mt-0.5">
                  {huf(platformBalance)}
                </p>
              </div>
            </div>

            {/* Withdraw Commission to Card */}
            <div className="bg-background/80 border rounded-xl p-4 mb-6 shadow-sm">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" /> Withdraw Commission to Card
              </h3>

              {commPhase === "processing" && (
                <div className="flex flex-col items-center py-6 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm font-medium">Sending commission payout to your card…</p>
                </div>
              )}

              {commPhase === "done" && (
                <div className="flex flex-col items-center py-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                  <p className="font-medium text-sm">Commission payout transferred successfully!</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setCommPhase("idle")}
                  >
                    Withdraw More
                  </Button>
                </div>
              )}

              {commPhase === "idle" && (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">To Card</label>
                    <select
                      className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                      value={commCardId}
                      onChange={(e) => setCommCardId(e.target.value)}
                    >
                      {effectiveCards.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.brand.toUpperCase()} •••• {m.last4}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                      Amount (Available: {huf(platformBalance)})
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={platformBalance}
                      value={commAmount}
                      onChange={(e) => setCommAmount(e.target.value)}
                      placeholder="e.g. 20000"
                      className="h-9"
                    />
                  </div>
                  <Button
                    onClick={withdrawCommission}
                    disabled={platformBalance <= 0}
                    className="h-9"
                  >
                    Withdraw Commission
                  </Button>
                </div>
              )}
            </div>

            {/* Commission Ledger */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Commission Ledger (All Institutions)</h3>
              <div className="bg-background/80 border rounded-xl overflow-hidden divide-y max-h-64 overflow-y-auto">
                {platformTxs.length === 0 && (
                  <p className="p-4 text-center text-muted-foreground text-xs">
                    No commission transactions yet.
                  </p>
                )}
                {platformTxs.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <p className="font-medium">{t.note || "Commission payment"}</p>
                      <p className="text-muted-foreground text-[11px]">
                        {new Date(t.created_at).toLocaleString()}{" "}
                        {t.institution_type ? `· ${t.institution_type}` : ""}
                      </p>
                    </div>
                    <span
                      className={`font-semibold ${
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
