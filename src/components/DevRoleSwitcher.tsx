import { useState } from "react";
import { Beaker, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth, DEMO_PRESETS, type DemoPreset } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const DevRoleSwitcher = () => {
  const { user, switchPreset, demoPreset, hasSession, exitDemo } = useAuth();
  const [open, setOpen] = useState(false);
  const current: DemoPreset | "real" = user && !user.isDemo ? "real" : (demoPreset ?? "guest");

  return (
    <div className="fixed bottom-4 right-4 z-[60] font-sans">
      <div className="bg-card border rounded-xl shadow-2xl overflow-hidden w-64">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-primary text-primary-foreground"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Beaker className="h-4 w-4" /> Dev Role Switcher
          </span>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        {open && (
          <div className="p-3 space-y-1.5">
            <p className="text-[11px] text-muted-foreground px-1 mb-1">
              Current: <span className="font-semibold text-foreground">{current === "real" ? `Signed in (${user?.email})` : DEMO_PRESETS[current].label}</span>
            </p>
            {(Object.keys(DEMO_PRESETS) as DemoPreset[]).map(k => (
              <Button
                key={k}
                type="button"
                variant={current === k ? "default" : "outline"}
                size="sm"
                className="w-full justify-start text-xs h-8"
                onClick={() => switchPreset(k)}
              >
                {DEMO_PRESETS[k].label}
              </Button>
            ))}
            {hasSession && current !== "real" && (
              <Button type="button" size="sm" variant="secondary" className="w-full text-xs h-8" onClick={() => void exitDemo()}>
                Back to my signed-in account
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevRoleSwitcher;
