import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@/components/ClientOnly";
import { AppShell } from "@/app-shell";

export const Route = createFileRoute("/$")({
  component: () => (
    <ClientOnly>
      <AppShell />
    </ClientOnly>
  ),
});
