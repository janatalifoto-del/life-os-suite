import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Brain, Inbox, Search, Plus, FolderKanban, Library, Archive } from "lucide-react";
import { Card, SectionTitle, Bar, Pill, Input, Select, Button } from "@/components/os";
import { useStore, uid, today, type ParaItem } from "@/lib/os-store";

export const Route = createFileRoute("/druha-hlava")({
  head: () => ({
    meta: [
      { title: "Druhá hlava | Život OS" },
      { name: "description", content: "PARA: inbox, projekty, knihovna zdrojů a archiv s tagy a vyhledáváním." },
      { property: "og:title", content: "Druhá hlava | Život OS" },
      { property: "og:description", content: "Second brain podle PARA – zachyť, zatřiď, najdi." },
    ],
  }),
  component: SecondBrain,
});

const TABS = [
  { key: "projekt", label: "Projekty", icon: FolderKanban },
  { key: "oblast", label: "Oblasti", icon: Brain },
  { key: "zdroj", label: "Zdroje", icon: Library },
  { key: "archiv", label: "Archiv", icon: Archive },
] as const;

function SecondBrain() {
  const { state, set, celebrate } = useStore();
  const [tab, setTab] = React.useState<ParaItem["type"]>("projekt");
  const [q, setQ] = React.useState("");
  const [domain, setDomain] = React.useState("vse");
  const [capture, setCapture] = React.useState("");

  const domains = ["vse", ...Array.from(new Set(state.para.map((p) => p.domain)))];

  const items = state.para.filter(
    (p) =>
      p.type === tab &&
      (domain === "vse" || p.domain === domain) &&
      (q.trim() === "" ||
        (p.title + p.note + p.tags.join(" ")).toLowerCase().includes(q.toLowerCase())),
  );

  const addCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capture.trim()) return;
    set((s) => ({ ...s, inbox: [{ id: uid(), text: capture.trim(), kind: "Myšlenka", at: today() }, ...s.inbox] }));
    celebrate("Zachyceno do inboxu 🧠");
    setCapture("");
  };

  const fileItem = (id: string, type: ParaItem["type"], domainName: string) => {
    const item = state.inbox.find((i) => i.id === id);
    if (!item) return;
    set((s) => ({
      ...s,
      inbox: s.inbox.filter((i) => i.id !== id),
      para: [
        {
          id: uid(),
          title: item.text,
          type,
          domain: domainName,
          note: `Zatříděno z inboxu ${item.at}`,
          ...(type === "projekt" ? { progress: 0 } : {}),
          tags: [item.kind.toLowerCase()],
        },
        ...s.para,
      ],
    }));
    celebrate("Zatříděno do PARA 📂");
  };

  const setProgress = (id: string, value: number) =>
    set((s) => ({ ...s, para: s.para.map((p) => (p.id === id ? { ...p, progress: value } : p)) }));

  const archive = (id: string) => {
    set((s) => ({ ...s, para: s.para.map((p) => (p.id === id ? { ...p, type: "archiv" } : p)) }));
    celebrate("Přesunuto do archivu 🗄️");
  };

  return (
    <div className="space-y-6">
      <div>
        <Pill tone="primary">
          <Brain className="size-3.5" /> Second brain
        </Pill>
        <h1 className="mt-2 font-display text-3xl font-bold">Druhá hlava podle PARA</h1>
        <p className="mt-1 text-muted-foreground">Zachyť všechno, zatřiď jednou týdně, najdi během vteřiny.</p>
      </div>

      <Card>
        <SectionTitle title="Quick capture / Inbox" subtitle={`${state.inbox.length} položek čeká na zatřídění`} right={<Inbox className="size-5 text-accent" />} />
        <form onSubmit={addCapture} className="flex flex-col gap-2 sm:flex-row">
          <Input value={capture} onChange={(e) => setCapture(e.target.value)} placeholder="Myšlenka, nápad, odkaz…" />
          <Button type="submit">
            <Plus className="size-4" /> Zachytit
          </Button>
        </form>
        <div className="mt-4 space-y-2">
          {state.inbox.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm">
              <Pill tone="accent">{i.kind}</Pill>
              <span className="min-w-0 flex-1 truncate">{i.text}</span>
              <Select
                defaultValue=""
                aria-label="Zatřídit"
                onChange={(e) => {
                  const [type, dom] = e.target.value.split("|");
                  if (type) fileItem(i.id, type as ParaItem["type"], dom || "Obecné");
                }}
                className="text-xs"
              >
                <option value="">Zatřídit…</option>
                <option value="projekt|Byznys">Projekt · Byznys</option>
                <option value="projekt|Zdraví">Projekt · Zdraví</option>
                <option value="oblast|Vztahy">Oblast · Vztahy</option>
                <option value="zdroj|Seberozvoj">Zdroj · Seberozvoj</option>
                <option value="archiv|Byznys">Archiv</option>
              </Select>
            </div>
          ))}
          {state.inbox.length === 0 && (
            <p className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success">Inbox zero. Čistá hlava. 🎉</p>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${
                  tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <t.icon className="size-3.5" />
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-1 flex-wrap justify-end gap-2">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hledat v Druhé hlavě…" className="pl-9" />
            </div>
            <Select value={domain} onChange={(e) => setDomain(e.target.value)} aria-label="Oblast">
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d === "vse" ? "Všechny oblasti" : d}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((p) => (
            <div key={p.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-display font-semibold">{p.title}</div>
                <Pill>{p.domain}</Pill>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.note}</p>
              {typeof p.progress === "number" && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Postup</span>
                    <span>{p.progress} %</span>
                  </div>
                  <Bar value={p.progress} />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={p.progress}
                    onChange={(e) => setProgress(p.id, Number(e.target.value))}
                    className="mt-2 w-full accent-[var(--primary)]"
                    aria-label={`Postup ${p.title}`}
                  />
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {p.tags.map((t) => (
                  <Pill key={t} tone="accent">
                    #{t}
                  </Pill>
                ))}
                {p.type !== "archiv" && (
                  <Button variant="ghost" className="ml-auto px-2 py-1 text-xs" onClick={() => archive(p.id)}>
                    Archivovat
                  </Button>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">Nic nenalezeno.</p>}
        </div>
      </Card>
    </div>
  );
}
