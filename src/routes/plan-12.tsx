import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Target, Trophy, Plus, Trash2 } from "lucide-react";
import { BarChart, Bar as RBar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, SectionTitle, Bar, Pill, CheckRow, Input, Button, Stat } from "@/components/os";
import { useStore, uid } from "@/lib/os-store";

export const Route = createFileRoute("/plan-12")({
  head: () => ({
    meta: [
      { title: "12týdenní rok | Život OS" },
      { name: "description", content: "Hlavní cíl, milníky, týdenní scorecards a strategická vize na 12 týdnů." },
      { property: "og:title", content: "12týdenní rok | Život OS" },
      { property: "og:description", content: "Cíl, milníky, týdenní scorecards a kvartální priority." },
    ],
  }),
  component: Plan12,
});

function Plan12() {
  const { state, set, celebrate } = useStore();
  const g = state.goal;
  const [milestoneTitle, setMilestoneTitle] = React.useState("");
  const [quarterName, setQuarterName] = React.useState("");
  const [priorityDraft, setPriorityDraft] = React.useState<Record<string, string>>({});

  const doneMs = g.milestones.filter((m) => m.done).length;
  const progress = g.milestones.length ? Math.round((doneMs / g.milestones.length) * 100) : 0;
  const active = g.weeks.filter((w) => w.done > 0);
  const execution = Math.round(
    (active.reduce((a, w) => a + w.done / w.planned, 0) / Math.max(1, active.length)) * 100,
  );
  const chart = g.weeks.map((w) => ({ name: `T${w.week}`, plneni: Math.round((w.done / w.planned) * 100) }));

  const toggleMilestone = (id: string) =>
    set((s) => ({
      ...s,
      goal: {
        ...s.goal,
        milestones: s.goal.milestones.map((m) => {
          if (m.id !== id) return m;
          if (!m.done) celebrate("Milník splněn! 🏁");
          return { ...m, done: !m.done };
        }),
      },
    }));

  const addMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    set((s) => ({
      ...s,
      goal: { ...s.goal, milestones: [...s.goal.milestones, { id: uid(), title: milestoneTitle.trim(), done: false }] },
    }));
    setMilestoneTitle("");
  };

  const removeMilestone = (id: string) =>
    set((s) => ({ ...s, goal: { ...s.goal, milestones: s.goal.milestones.filter((m) => m.id !== id) } }));

  const setupWeeks = () =>
    set((s) => ({
      ...s,
      goal: {
        ...s.goal,
        weeks: Array.from({ length: 12 }, (_, i) => ({ week: i + 1, planned: 14, done: 0 })),
      },
    }));

  const updateWeek = (week: number, field: "planned" | "done", value: number) =>
    set((s) => ({
      ...s,
      goal: {
        ...s.goal,
        weeks: s.goal.weeks.map((w) => (w.week === week ? { ...w, [field]: Math.max(0, value) } : w)),
      },
    }));

  const addQuarter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quarterName.trim()) return;
    set((s) => ({ ...s, quarters: [...s.quarters, { id: uid(), name: quarterName.trim(), priorities: [] }] }));
    setQuarterName("");
  };

  const removeQuarter = (id: string) => set((s) => ({ ...s, quarters: s.quarters.filter((q) => q.id !== id) }));

  const addPriority = (quarterId: string) => {
    const value = (priorityDraft[quarterId] ?? "").trim();
    if (!value) return;
    set((s) => ({
      ...s,
      quarters: s.quarters.map((q) => (q.id === quarterId ? { ...q, priorities: [...q.priorities, value] } : q)),
    }));
    setPriorityDraft((d) => ({ ...d, [quarterId]: "" }));
  };

  const removePriority = (quarterId: string, priority: string) =>
    set((s) => ({
      ...s,
      quarters: s.quarters.map((q) =>
        q.id === quarterId ? { ...q, priorities: q.priorities.filter((p) => p !== priority) } : q,
      ),
    }));

  return (
    <div className="space-y-6">
      <div>
        <Pill tone="primary">
          <Target className="size-3.5" /> 12týdenní rok
        </Pill>
        <h1 className="mt-2 font-display text-3xl font-bold">Kvartál je tvůj rok</h1>
        <p className="mt-1 text-muted-foreground">Jeden hlavní cíl, milníky, týdenní taktika a čísla, která nelžou.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Hlavní cíl</div>
            <Input
              value={g.title}
              onChange={(e) => set((s) => ({ ...s, goal: { ...s.goal, title: e.target.value } }))}
              className="mt-1 border-0 bg-transparent px-0 font-display text-xl font-semibold"
            />
            <div className="mt-2 text-sm text-muted-foreground">Proč: {g.why}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-4xl font-bold text-primary">{progress} %</div>
            <div className="text-xs text-muted-foreground">cesta ke 100 %</div>
          </div>
        </div>
        <div className="mt-4">
          <Bar value={progress} />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Skóre exekuce" value={`${execution} %`} hint="Průměr týdenních scorecards (cíl 85 %)" />
        <Stat label="Splněné milníky" value={`${doneMs}/${g.milestones.length}`} hint="Rozpad hlavního cíle" />
        <Stat label="Aktivní týden" value={`T${active.length}`} hint={`Zbývá ${12 - active.length} týdnů`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Milníky" subtitle="Rozpad cíle na hmatatelné kroky" right={<Trophy className="size-5 text-accent" />} />
          {g.milestones.map((m) => (
            <CheckRow
              key={m.id}
              checked={m.done}
              onToggle={() => toggleMilestone(m.id)}
              label={m.title}
              right={
                <button
                  type="button"
                  onClick={() => removeMilestone(m.id)}
                  aria-label="Smazat milník"
                  className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              }
            />
          ))}
          {g.milestones.length === 0 && <p className="px-3 text-sm text-muted-foreground">Zatím žádné milníky.</p>}
          <form onSubmit={addMilestone} className="mt-3 flex gap-2">
            <Input value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} placeholder="Nový milník…" />
            <Button type="submit" variant="soft">
              <Plus className="size-4" />
            </Button>
          </form>
        </Card>

        <Card>
          <SectionTitle title="Týdenní scorecard" subtitle="% splnění plánovaných taktik" />
          {g.weeks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">Ještě nemáš rozvržených 12 týdnů.</p>
              <Button variant="soft" onClick={setupWeeks}>
                Založit 12 týdnů
              </Button>
            </div>
          ) : (
            <>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }}
                      formatter={(v: number) => [`${v} %`, "Plnění"]}
                    />
                    <RBar dataKey="plneni" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 max-h-48 space-y-2 overflow-auto pr-1">
                {g.weeks.map((w) => (
                  <div key={w.week} className="flex items-center gap-3 text-sm">
                    <span className="w-10 text-muted-foreground">T{w.week}</span>
                    <input
                      type="number"
                      value={w.done}
                      onChange={(e) => updateWeek(w.week, "done", Number(e.target.value))}
                      className="w-16 rounded-lg border border-input bg-background px-2 py-1 text-sm"
                      aria-label={`Splněno v týdnu ${w.week}`}
                    />
                    <span className="text-muted-foreground">z</span>
                    <input
                      type="number"
                      value={w.planned}
                      onChange={(e) => updateWeek(w.week, "planned", Number(e.target.value))}
                      className="w-16 rounded-lg border border-input bg-background px-2 py-1 text-sm"
                      aria-label={`Plán v týdnu ${w.week}`}
                    />
                    <div className="flex-1">
                      <Bar value={(w.done / Math.max(1, w.planned)) * 100} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Strategická vize" subtitle="Roční horizont rozpadlý do kvartálů" />
          <div className="space-y-3">
            {state.quarters.map((q) => (
              <div key={q.id} className="rounded-xl bg-muted/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-display text-sm font-semibold">{q.name}</div>
                  <button
                    type="button"
                    onClick={() => removeQuarter(q.id)}
                    aria-label="Smazat kvartál"
                    className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                  {q.priorities.map((p) => (
                    <li key={p} className="flex items-center justify-between gap-2">
                      <span>• {p}</span>
                      <button
                        type="button"
                        onClick={() => removePriority(q.id, p)}
                        aria-label="Smazat prioritu"
                        className="rounded p-0.5 hover:text-destructive"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addPriority(q.id);
                  }}
                  className="mt-2 flex gap-2"
                >
                  <Input
                    value={priorityDraft[q.id] ?? ""}
                    onChange={(e) => setPriorityDraft((d) => ({ ...d, [q.id]: e.target.value }))}
                    placeholder="Nová priorita…"
                    className="h-8 text-xs"
                  />
                  <Button type="submit" variant="ghost" className="h-8 px-2">
                    <Plus className="size-3.5" />
                  </Button>
                </form>
              </div>
            ))}
            {state.quarters.length === 0 && <p className="text-sm text-muted-foreground">Zatím žádné kvartály.</p>}
            <form onSubmit={addQuarter} className="flex gap-2">
              <Input value={quarterName} onChange={(e) => setQuarterName(e.target.value)} placeholder="Nový kvartál (např. Q1 – Základy)…" />
              <Button type="submit" variant="soft">
                <Plus className="size-4" />
              </Button>
            </form>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Životní pilíře" subtitle="Rovnováha napříč oblastmi" />
          <div className="space-y-3">
            {state.pillars.map((p) => (
              <div key={p.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>
                    {p.emoji} {p.name}
                  </span>
                  <span className="text-muted-foreground">{p.satisfaction}/10</span>
                </div>
                <Bar value={p.satisfaction * 10} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
