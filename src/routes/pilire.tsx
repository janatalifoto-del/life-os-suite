import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Card, SectionTitle, Bar, Pill, CheckRow, Input, Button } from "@/components/os";
import { useStore, uid } from "@/lib/os-store";

export const Route = createFileRoute("/pilire")({
  head: () => ({
    meta: [
      { title: "Životní pilíře | Život OS" },
      { name: "description", content: "Sedm oblastí života: spokojenost, návyky, projekty a poznámky na jednom místě." },
      { property: "og:title", content: "Životní pilíře | Život OS" },
      { property: "og:description", content: "Rovnováha napříč zdravím, byznysem, vztahy, financemi i odpočinkem." },
    ],
  }),
  component: Pillars,
});

function Pillars() {
  const { state, set, celebrate } = useStore();
  const [open, setOpen] = React.useState<string | null>(null);
  const [habit, setHabit] = React.useState("");

  const avg = (state.pillars.reduce((a, p) => a + p.satisfaction, 0) / state.pillars.length).toFixed(1);
  const radar = state.pillars.map((p) => ({ oblast: p.name.split(" ")[0], hodnota: p.satisfaction }));

  const setSatisfaction = (id: string, value: number) =>
    set((s) => ({ ...s, pillars: s.pillars.map((p) => (p.id === id ? { ...p, satisfaction: value } : p)) }));

  const setNote = (id: string, note: string) =>
    set((s) => ({ ...s, pillars: s.pillars.map((p) => (p.id === id ? { ...p, note } : p)) }));

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
    set((s) => ({
      ...s,
      pillars: s.pillars.map((p) =>
        p.id === pid ? { ...p, habits: [...p.habits, { id: uid(), title: habit.trim(), done: false }] } : p,
      ),
    }));
    setHabit("");
  };

  return (
    <div className="space-y-6">
      <div>
        <Pill tone="primary">
          <Compass className="size-3.5" /> Oblasti života
        </Pill>
        <h1 className="mt-2 font-display text-3xl font-bold">Sedm pilířů, jeden život</h1>
        <p className="mt-1 text-muted-foreground">
          Průměrná spokojenost <span className="font-semibold text-foreground">{avg}/10</span>. Nejslabší pilíř určuje
          tempo.
        </p>
      </div>

      <Card>
        <SectionTitle title="Kolo života" subtitle="Vizuální rovnováha oblastí" />
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
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {state.pillars.map((p) => {
          const isOpen = open === p.id;
          const habitsDone = p.habits.filter((h) => h.done).length;
          return (
            <Card key={p.id}>
              <button
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => setOpen(isOpen ? null : p.id)}
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
                  onChange={(e) => setSatisfaction(p.id, Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--primary)]"
                  aria-label={`Spokojenost ${p.name}`}
                />
              </div>

              {isOpen && (
                <div className="pop-in mt-3 space-y-3">
                  <div>
                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Poznámka</div>
                    <Input value={p.note} onChange={(e) => setNote(p.id, e.target.value)} />
                  </div>
                  <div>
                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Návyky</div>
                    {p.habits.map((h) => (
                      <CheckRow key={h.id} checked={h.done} onToggle={() => toggleHabit(p.id, h.id)} label={h.title} />
                    ))}
                    <div className="mt-2 flex gap-2">
                      <Input value={habit} onChange={(e) => setHabit(e.target.value)} placeholder="Nový návyk…" />
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
                        </Pill>
                      ))}
                      {p.projects.length === 0 && <span className="text-sm text-muted-foreground">Zatím žádné.</span>}
                    </div>
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
