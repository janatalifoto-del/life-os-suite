import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Compass, Plus, Trash2, X } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Card, SectionTitle, Bar, Pill, CheckRow, Input, Button } from "@/components/os";
import { useStore, uid, type Pillar } from "@/lib/os-store";

export const Route = createFileRoute("/pilire")({
  head: () => ({
    meta: [
      { title: "Životní pilíře | Život OS" },
      { name: "description", content: "Oblasti života: spokojenost, návyky, projekty a poznámky na jednom místě." },
      { property: "og:title", content: "Životní pilíře | Život OS" },
      { property: "og:description", content: "Rovnováha napříč zdravím, byznysem, vztahy, financemi i odpočinkem." },
    ],
  }),
  component: Pillars,
});

const plural = (n: number) => (n === 1 ? "oblast" : n >= 2 && n <= 4 ? "oblasti" : "oblastí");

function Pillars() {
  const { state, set, celebrate } = useStore();
  const [open, setOpen] = React.useState<string | null>(null);
  const [habit, setHabit] = React.useState("");
  const [project, setProject] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState({ emoji: "⭐", name: "" });

  const count = state.pillars.length;
  const avg = count ? (state.pillars.reduce((a, p) => a + p.satisfaction, 0) / count).toFixed(1) : "–";
  const radar = state.pillars.map((p) => ({ oblast: p.name.split(" ")[0], hodnota: p.satisfaction }));

  const patch = (id: string, change: Partial<Pillar>) =>
    set((s) => ({ ...s, pillars: s.pillars.map((p) => (p.id === id ? { ...p, ...change } : p)) }));

  const addPillar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    const id = uid();
    set((s) => ({
      ...s,
      pillars: [
        ...s.pillars,
        { id, name: draft.name.trim(), emoji: draft.emoji.trim() || "⭐", satisfaction: 5, note: "", habits: [], projects: [] },
      ],
    }));
    celebrate("Nový pilíř přidán 🧭");
    setDraft({ emoji: "⭐", name: "" });
    setAdding(false);
    setOpen(id);
  };

  const removePillar = (p: Pillar) => {
    if (!window.confirm(`Smazat pilíř „${p.name}" včetně návyků a projektů?`)) return;
    set((s) => ({ ...s, pillars: s.pillars.filter((x) => x.id !== p.id) }));
    setOpen(null);
  };

  const toggleHabit = (pid: string, hid: string) =>
    set((s) => ({
      ...s,
      pillars: s.pillars.map((p) =>
        p.id !== pid
          ? p
          : {
              ...p,
              habits: p.habits.map((h) => {
                if (h.id !== hid) return h;
                if (!h.done) celebrate("Návyk splněn 💪");
                return { ...h, done: !h.done };
              }),
            },
      ),
    }));

  const addHabit = (pid: string) => {
    if (!habit.trim()) return;
    const title = habit.trim();
    set((s) => ({
      ...s,
      pillars: s.pillars.map((p) =>
        p.id === pid ? { ...p, habits: [...p.habits, { id: uid(), title, done: false }] } : p,
      ),
    }));
    setHabit("");
  };

  const removeHabit = (pid: string, hid: string) =>
    set((s) => ({
      ...s,
      pillars: s.pillars.map((p) => (p.id === pid ? { ...p, habits: p.habits.filter((h) => h.id !== hid) } : p)),
    }));

  const addProject = (pid: string) => {
    const name = project.trim();
    if (!name) return;
    set((s) => ({
      ...s,
      pillars: s.pillars.map((p) =>
        p.id === pid && !p.projects.includes(name) ? { ...p, projects: [...p.projects, name] } : p,
      ),
    }));
    setProject("");
  };

  const removeProject = (pid: string, name: string) =>
    set((s) => ({
      ...s,
      pillars: s.pillars.map((p) => (p.id === pid ? { ...p, projects: p.projects.filter((x) => x !== name) } : p)),
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Pill tone="primary">
            <Compass className="size-3.5" /> Oblasti života
          </Pill>
          <h1 className="mt-2 font-display text-3xl font-bold">Tvoje pilíře, jeden život</h1>
          <p className="mt-1 text-muted-foreground">
            {count} {plural(count)} · průměrná spokojenost{" "}
            <span className="font-semibold text-foreground">{avg}/10</span>. Nejslabší pilíř určuje tempo.
          </p>
        </div>
        <Button variant="soft" onClick={() => setAdding((v) => !v)}>
          {adding ? <X className="size-4" /> : <Plus className="size-4" />}
          {adding ? "Zavřít" : "Nový pilíř"}
        </Button>
      </div>

      {adding && (
        <Card className="pop-in">
          <form onSubmit={addPillar} className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={draft.emoji}
              maxLength={8}
              onChange={(e) => setDraft((d) => ({ ...d, emoji: e.target.value }))}
              className="sm:w-20 sm:text-center"
              aria-label="Emoji"
            />
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Název pilíře (např. Kreativita, Duchovno, Komunita…)"
              autoFocus
            />
            <Button type="submit" disabled={!draft.name.trim()}>
              <Plus className="size-4" /> Přidat
            </Button>
          </form>
        </Card>
      )}

      <Card>
        <SectionTitle title="Kolo života" subtitle="Vizuální rovnováha oblastí" />
        {count >= 3 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="75%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="oblast" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Radar dataKey="hodnota" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.35} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }}
                  formatter={(v: number) => [`${v}/10`, "Spokojenost"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Kolo života se vykreslí od tří pilířů.</p>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {state.pillars.map((p) => {
          const isOpen = open === p.id;
          const habitsDone = p.habits.filter((h) => h.done).length;
          return (
            <Card key={p.id}>
              <button
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => {
                  setOpen(isOpen ? null : p.id);
                  setHabit("");
                  setProject("");
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.emoji}</span>
                  <div>
                    <div className="font-display font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {habitsDone}/{p.habits.length} návyků · {p.projects.length} projektů
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-semibold text-primary">{p.satisfaction}/10</div>
                  <div className="text-xs text-muted-foreground">{isOpen ? "skrýt" : "detail"}</div>
                </div>
              </button>

              <div className="mt-3">
                <Bar value={p.satisfaction * 10} />
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={p.satisfaction}
                  onChange={(e) => patch(p.id, { satisfaction: Number(e.target.value) })}
                  className="mt-2 w-full accent-[var(--primary)]"
                  aria-label={`Spokojenost ${p.name}`}
                />
              </div>

              {isOpen && (
                <div className="pop-in mt-3 space-y-3">
                  <div>
                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Název a emoji</div>
                    <div className="flex gap-2">
                      <Input
                        value={p.emoji}
                        maxLength={8}
                        onChange={(e) => patch(p.id, { emoji: e.target.value })}
                        className="w-16 text-center"
                        aria-label="Emoji"
                      />
                      <Input value={p.name} onChange={(e) => patch(p.id, { name: e.target.value })} aria-label="Název pilíře" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Poznámka</div>
                    <Input
                      value={p.note}
                      onChange={(e) => patch(p.id, { note: e.target.value })}
                      placeholder="Jak vypadá tvůj ideál v téhle oblasti?"
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Návyky</div>
                    {p.habits.map((h) => (
                      <CheckRow
                        key={h.id}
                        checked={h.done}
                        onToggle={() => toggleHabit(p.id, h.id)}
                        label={h.title}
                        right={
                          <Button variant="ghost" className="px-2 py-1" onClick={() => removeHabit(p.id, h.id)} aria-label="Smazat návyk">
                            <X className="size-3.5" />
                          </Button>
                        }
                      />
                    ))}
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={habit}
                        onChange={(e) => setHabit(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addHabit(p.id);
                          }
                        }}
                        placeholder="Nový návyk…"
                      />
                      <Button variant="soft" onClick={() => addHabit(p.id)}>
                        Přidat
                      </Button>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Aktivní projekty</div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.projects.map((pr) => (
                        <Pill key={pr} tone="accent">
                          {pr}
                          <button
                            type="button"
                            onClick={() => removeProject(p.id, pr)}
                            aria-label={`Odebrat projekt ${pr}`}
                            className="rounded-full hover:text-destructive"
                          >
                            <X className="size-3" />
                          </button>
                        </Pill>
                      ))}
                      {p.projects.length === 0 && <span className="text-sm text-muted-foreground">Zatím žádné.</span>}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={project}
                        onChange={(e) => setProject(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addProject(p.id);
                          }
                        }}
                        placeholder="Nový projekt…"
                      />
                      <Button variant="soft" onClick={() => addProject(p.id)}>
                        Přidat
                      </Button>
                    </div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <Button variant="ghost" className="text-xs text-destructive" onClick={() => removePillar(p)}>
                      <Trash2 className="size-3.5" /> Smazat pilíř
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
