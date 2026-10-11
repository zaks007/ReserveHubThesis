import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type CardBrand = "visa" | "mastercard" | "amex" | "unknown";

export interface PaymentMethod {
  id: string;
  userId: string;
  cardholder: string;
  brand: CardBrand;
  last4: string;
  expMonth: string;
  expYear: string;
  cvc?: string;
  isDefault: boolean;
  createdAt: string;
}

interface Ctx {
  methods: PaymentMethod[];
  addMethod: (m: Omit<PaymentMethod, "id" | "userId" | "createdAt" | "isDefault"> & { isDefault?: boolean }) => Promise<void>;
  removeMethod: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
}

const PaymentCtx = createContext<Ctx | null>(null);

const DEMO_CARDS_KEY = "reservehub_demo_cards_v1";

const isUuid = (val?: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val ?? "");

export const detectBrand = (num: string): CardBrand => {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  return "unknown";
};

function fromRow(r: any): PaymentMethod {
  return {
    id: r.id,
    userId: r.user_id,
    cardholder: r.cardholder,
    brand: (r.brand as CardBrand) ?? "unknown",
    last4: r.last4,
    expMonth: r.exp_month,
    expYear: r.exp_year,
    isDefault: !!r.is_default,
    createdAt: r.created_at,
  };
}

export const PaymentMethodsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  const refresh = useCallback(async () => {
    if (!user) { setMethods([]); return; }

    // If demo account or non-UUID, read from localStorage to avoid HTTP 400
    if (user.isDemo || !isUuid(user.id)) {
      try {
        const raw = localStorage.getItem(`${DEMO_CARDS_KEY}_${user.id}`);
        setMethods(raw ? JSON.parse(raw) : [
          {
            id: "demo-card-1",
            userId: user.id,
            cardholder: user.name || "Demo Cardholder",
            brand: "visa",
            last4: "4242",
            expMonth: "12",
            expYear: "28",
            isDefault: true,
            createdAt: new Date().toISOString(),
          }
        ]);
      } catch {
        setMethods([]);
      }
      return;
    }

    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) { console.error("payment_methods load", error); return; }
    setMethods((data ?? []).map(fromRow));
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const addMethod: Ctx["addMethod"] = async (m) => {
    if (!user) return;
    const hasAny = methods.length > 0;
    const wantDefault = m.isDefault || !hasAny;

    if (user.isDemo || !isUuid(user.id)) {
      const newCard: PaymentMethod = {
        id: `demo-card-${Date.now()}`,
        userId: user.id,
        cardholder: m.cardholder,
        brand: m.brand,
        last4: m.last4,
        expMonth: m.expMonth,
        expYear: m.expYear,
        isDefault: wantDefault,
        createdAt: new Date().toISOString(),
      };
      const updated = wantDefault
        ? [...methods.map(c => ({ ...c, isDefault: false })), newCard]
        : [...methods, newCard];
      localStorage.setItem(`${DEMO_CARDS_KEY}_${user.id}`, JSON.stringify(updated));
      setMethods(updated);
      return;
    }

    if (wantDefault && hasAny) {
      await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", user.id);
    }
    const { error } = await supabase.from("payment_methods").insert({
      user_id: user.id,
      cardholder: m.cardholder,
      brand: m.brand,
      last4: m.last4,
      exp_month: m.expMonth,
      exp_year: m.expYear,
      is_default: wantDefault,
    });
    if (error) { console.error("payment_methods insert", error); return; }
    await refresh();
  };

  const removeMethod: Ctx["removeMethod"] = async (id) => {
    if (!user) return;
    if (user.isDemo || !isUuid(user.id)) {
      const remaining = methods.filter(m => m.id !== id);
      if (remaining.length > 0 && !remaining.some(m => m.isDefault)) {
        remaining[0].isDefault = true;
      }
      localStorage.setItem(`${DEMO_CARDS_KEY}_${user.id}`, JSON.stringify(remaining));
      setMethods(remaining);
      return;
    }

    const target = methods.find(m => m.id === id);
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) { console.error("payment_methods delete", error); return; }
    if (target?.isDefault) {
      const remaining = methods.filter(m => m.id !== id);
      if (remaining[0]) {
        await supabase.from("payment_methods").update({ is_default: true }).eq("id", remaining[0].id);
      }
    }
    await refresh();
  };

  const setDefault: Ctx["setDefault"] = async (id) => {
    if (!user) return;
    if (user.isDemo || !isUuid(user.id)) {
      const updated = methods.map(m => ({ ...m, isDefault: m.id === id }));
      localStorage.setItem(`${DEMO_CARDS_KEY}_${user.id}`, JSON.stringify(updated));
      setMethods(updated);
      return;
    }

    await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("payment_methods").update({ is_default: true }).eq("id", id);
    await refresh();
  };

  return (
    <PaymentCtx.Provider value={{ methods, addMethod, removeMethod, setDefault }}>
      {children}
    </PaymentCtx.Provider>
  );
};

export const usePaymentMethods = () => {
  const ctx = useContext(PaymentCtx);
  if (!ctx) throw new Error("usePaymentMethods must be used within PaymentMethodsProvider");
  return ctx;
};
