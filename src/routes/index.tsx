import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@/components/ClientOnly";
import { AppShell } from "@/app-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReserveHub — Book campus spaces" },
      { name: "description", content: "Browse institutions and reserve rooms, halls, and sports facilities." },
      { property: "og:title", content: "ReserveHub" },
      { property: "og:description", content: "Browse institutions and reserve rooms, halls, and sports facilities." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <ClientOnly>
      <AppShell />
    </ClientOnly>
  ),
});
