import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Trash2, Star, Plus, User as UserIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { usePaymentMethods, CardBrand } from "@/contexts/PaymentMethodsContext";
import { toast } from "@/hooks/use-toast";

const brandLabel: Record<CardBrand, string> = {
  visa: "Visa", mastercard: "Mastercard", amex: "American Express", unknown: "Card",
};

const AccountSettings = () => {
  const { user, updateProfile, logout } = useAuth();
  const { methods, addMethod, removeMethod, setDefault } = usePaymentMethods();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  if (!user) {
    return (
      <div className="container max-w-md py-16 text-center">
        <p className="text-muted-foreground mb-4">You need to be logged in to view account settings.</p>
        <Button onClick={() => navigate("/auth/login")}>Log in</Button>
      </div>
    );
  }

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { toast({ title: "Name and email are required", variant: "destructive" }); return; }
    updateProfile({ name: name.trim(), email: email.trim() });
    toast({ title: "Profile updated" });
  };

  const savePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" }); return; }
    if (pw !== pw2) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    setPw(""); setPw2("");
    toast({ title: "Password updated", description: "Demo only — not stored in this prototype." });
  };

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-1">Account settings</h1>
      <p className="text-sm text-muted-foreground mb-8">Manage your profile and saved payment methods.</p>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile"><UserIcon className="h-4 w-4 mr-1.5" />Profile</TabsTrigger>
          <TabsTrigger value="payment"><CreditCard className="h-4 w-4 mr-1.5" />Payment methods</TabsTrigger>
          <TabsTrigger value="security"><Lock className="h-4 w-4 mr-1.5" />Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <form onSubmit={saveProfile} className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Your details</h2>
            <div><Label>Full name</Label><Input value={name} onChange={e => setName(e.target.value)} className="mt-1" /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1" /></div>
            <div className="flex gap-3 pt-2">
              <Button type="submit">Save changes</Button>
              <Button type="button" variant="outline" onClick={() => { logout(); navigate("/"); }}>Log out</Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Saved cards</h2>
            <Button size="sm" onClick={() => navigate("/account/cards/new")}><Plus className="h-4 w-4 mr-1" />Add card</Button>
          </div>

          {methods.length === 0 ? (
            <div className="bg-card border border-dashed rounded-xl p-10 text-center">
              <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No saved payment methods yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {methods.map(m => (
                <div key={m.id} className="bg-card border rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-14 rounded-md bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-[10px] font-bold flex items-center justify-center uppercase tracking-wider">
                      {brandLabel[m.brand].slice(0, 4)}
                    </div>
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2">
                        {brandLabel[m.brand]} •••• {m.last4}
                        {m.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.cardholder} · exp {m.expMonth}/{m.expYear}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!m.isDefault && (
                      <Button size="sm" variant="ghost" onClick={() => setDefault(m.id)}>
                        <Star className="h-4 w-4 mr-1" />Make default
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeMethod(m.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="security">
          <form onSubmit={savePassword} className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Change password</h2>
            <div><Label>New password</Label><Input type="password" value={pw} onChange={e => setPw(e.target.value)} className="mt-1" /></div>
            <div><Label>Confirm new password</Label><Input type="password" value={pw2} onChange={e => setPw2(e.target.value)} className="mt-1" /></div>
            <Button type="submit">Update password</Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountSettings;
