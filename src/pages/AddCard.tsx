import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { usePaymentMethods, detectBrand, type CardBrand } from "@/contexts/PaymentMethodsContext";
import { toast } from "@/hooks/use-toast";

const brandLabel: Record<CardBrand, string> = { visa: "VISA", mastercard: "Mastercard", amex: "AMEX", unknown: "" };

const formatNumber = (v: string, brand: CardBrand) => {
  const d = v.replace(/\D/g, "").slice(0, brand === "amex" ? 15 : 19);
  if (brand === "amex") return d.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "));
  return d.replace(/(.{4})/g, "$1 ").trim();
};
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const AddCard = () => {
  const { user } = useAuth();
  const { addMethod } = usePaymentMethods();
  const navigate = useNavigate();
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [makeDefault, setMakeDefault] = useState(true);
  const [saving, setSaving] = useState(false);

  if (!user) return <Navigate to="/auth/login" replace />;

  const brand = detectBrand(number);
  const digits = number.replace(/\s/g, "");
  const display = (number || "•••• •••• •••• ••••");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const [mm = "", yy = ""] = expiry.split("/");
    if (digits.length < 12) { toast({ title: "Enter the card number", variant: "destructive" }); return; }
    if (!holder.trim()) { toast({ title: "Enter the cardholder name", variant: "destructive" }); return; }
    if (mm.length !== 2 || yy.length !== 2) { toast({ title: "Enter expiry as MM/YY", variant: "destructive" }); return; }
    setSaving(true);
    await addMethod({ cardholder: holder.trim(), brand, last4: digits.slice(-4), expMonth: mm, expYear: yy, isDefault: makeDefault });
    setSaving(false);
    toast({ title: "Card saved", description: "Simulated card — only the last 4 digits are stored." });
    navigate("/account");
  };

  return (
    <div className="container max-w-xl py-10">
      <Link to="/account" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to account
      </Link>
      <h1 className="text-3xl font-bold mb-6">Add a card</h1>

      <div className="relative mb-8 aspect-[1.586] w-full max-w-sm rounded-2xl bg-gradient-to-br from-primary to-primary/60 p-6 text-primary-foreground shadow-xl">
        <div className="flex justify-between items-start">
          <div className="h-8 w-11 rounded-md bg-primary-foreground/30" />
          <span className="text-lg font-bold italic tracking-wide">{brandLabel[brand]}</span>
        </div>
        <p className="mt-8 font-mono text-xl tracking-widest">{display}</p>
        <div className="mt-6 flex justify-between text-xs uppercase">
          <div><p className="opacity-70">Cardholder</p><p className="text-sm font-semibold truncate max-w-[180px]">{holder || "Your name"}</p></div>
          <div><p className="opacity-70">Expires</p><p className="text-sm font-semibold">{expiry || "MM/YY"}</p></div>
        </div>
      </div>

      <form onSubmit={submit} className="bg-card border rounded-xl p-6 space-y-4">
        <div>
          <Label>Card number</Label>
          <div className="relative mt-1">
            <Input inputMode="numeric" autoComplete="cc-number" value={number}
              onChange={(e) => setNumber(formatNumber(e.target.value, detectBrand(e.target.value)))}
              placeholder="1234 5678 9012 3456" className="font-mono pr-24" />
            {brand !== "unknown" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">{brandLabel[brand]}</span>}
          </div>
        </div>
        <div>
          <Label>Cardholder name</Label>
          <Input autoComplete="cc-name" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="As shown on card" className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Expiry</Label><Input inputMode="numeric" autoComplete="cc-exp" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" className="mt-1 font-mono" /></div>
          <div><Label>CVC</Label><Input inputMode="numeric" autoComplete="cc-csc" type="password" value={cvc} maxLength={brand === "amex" ? 4 : 3} onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))} placeholder="•••" className="mt-1 font-mono" /></div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} /> Set as default
        </label>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Simulation — no real charge. The full number and CVC are never stored.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/account")}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save card"}</Button>
        </div>
      </form>
    </div>
  );
};

export default AddCard;
