import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, Input, Button, SectionTitle } from "@/components/os";
import { useStore } from "@/lib/os-store";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Můj účet – Život OS" },
      { name: "description", content: "Nastav si jméno a avatar a spravuj ukládání dat do účtu Život OS." },
      { property: "og:title", content: "Můj účet – Život OS" },
      { property: "og:description", content: "Nastav si jméno a avatar a spravuj ukládání dat do účtu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const { syncing, cloud, clearAll } = useStore();
  const navigate = useNavigate();
  const [name, setName] = React.useState("");
  const [avatar, setAvatar] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);

  const handleClearAll = async () => {
    const ok = window.confirm(
      "Opravdu smazat všechna data? Rituály, úkoly, finance, deník i vše ostatní se nenávratně vymažou z tvého účtu.",
    );
    if (!ok) return;
    setClearing(true);
    await clearAll();
    setClearing(false);
  };

  React.useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  React.useEffect(() => {
    setName(profile?.display_name ?? "");
    setAvatar(profile?.avatar_url ?? "");
  }, [profile]);

  if (!user) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: name || null, avatar_url: avatar || null });
    await refreshProfile();
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle title="Můj účet" subtitle="Jméno, avatar a ukládání dat" />
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-primary/15 font-display text-lg font-semibold text-primary">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="size-full object-cover" />
            ) : (
              (name || user.email || "?").slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="font-medium">{name || "Bez jména"}</div>
            <div className="truncate text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>

        <form onSubmit={save} className="mt-6 flex flex-col gap-3">
          <label className="text-xs text-muted-foreground">Jméno</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jak ti máme říkat?" />
          <label className="mt-2 text-xs text-muted-foreground">Odkaz na avatar (URL)</label>
          <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
          <div className="mt-3 flex items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Ukládám…" : "Uložit"}
            </Button>
            {saved && <span className="text-xs text-primary">Uloženo ✓</span>}
          </div>
        </form>
      </Card>

      <Card className="mt-4 p-6">
        <div className="text-sm font-medium">Ukládání dat</div>
        <p className="mt-1 text-sm text-muted-foreground">
          {cloud
            ? syncing
              ? "Ukládám tvoje data do účtu…"
              : "Všechna data jsou uložená v tvém účtu a načtou se na každém zařízení."
            : "Data jsou zatím jen v tomto prohlížeči."}
        </p>
        <Button
          variant="soft"
          className="mt-4"
          onClick={async () => {
            await signOut();
            void navigate({ to: "/auth", replace: true });
          }}
        >
          Odhlásit se
        </Button>
      </Card>

      <Card className="mt-4 border-destructive/30 p-6">
        <div className="text-sm font-medium text-destructive">Nebezpečná zóna</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Smaže veškerý obsah účtu — rituály, úkoly, 12týdenní cíl, kalendář, finance, druhou hlavu, pilíře i deník.
          Nedá se vrátit zpět.
        </p>
        <Button
          variant="soft"
          className="mt-4 bg-destructive/10 text-destructive hover:bg-destructive/20"
          onClick={handleClearAll}
          disabled={clearing}
        >
          {clearing ? "Mažu…" : "Smazat všechna data"}
        </Button>
      </Card>
    </div>
  );
}
