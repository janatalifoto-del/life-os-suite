import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Card, Input, Button } from "@/components/os";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Přihlášení – Život OS" },
      { name: "description", content: "Přihlas se do Život OS a měj svá data bezpečně uložená v účtu." },
      { property: "og:title", content: "Přihlášení – Život OS" },
      { property: "og:description", content: "Přihlas se do Život OS a měj svá data bezpečně uložená v účtu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && user) void navigate({ to: "/", replace: true });
  }, [user, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) setMsg("Hotovo! Potvrď prosím registraci v e-mailu, který jsme ti poslali.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Něco se nepovedlo, zkus to prosím znovu.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setErr(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setErr("Přihlášení přes Google se nepovedlo.");
      return;
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <Card className="p-6">
        <h1 className="font-display text-2xl font-semibold">
          {mode === "login" ? "Přihlášení" : "Vytvoření účtu"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tvoje rituály, cíle, finance i deník se uloží do účtu a najdeš je na každém zařízení.
        </p>

        <button
          type="button"
          onClick={google}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-muted"
        >
          Pokračovat přes Google
        </button>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> nebo e-mailem <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <Input placeholder="Jméno" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <Input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            required
            minLength={6}
            placeholder="Heslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
          {msg && <div className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">{msg}</div>}
          <Button type="submit" disabled={busy}>
            {busy ? "Pracuji…" : mode === "login" ? "Přihlásit se" : "Založit účet"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setErr(null);
            setMsg(null);
          }}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "login" ? "Nemáš účet? Zaregistruj se" : "Už máš účet? Přihlas se"}
        </button>

        <div className="mt-2 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            Pokračovat bez přihlášení
          </Link>
        </div>
      </Card>
    </div>
  );
}
