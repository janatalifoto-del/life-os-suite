import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Plus } from "lucide-react";
import { Card, SectionTitle, Pill, CheckRow, Input, Select, Button } from "@/components/os";
import { useStore, uid, today, toIso, PRIORITY_LABEL, type Priority } from "@/lib/os-store";

export const Route = createFileRoute("/kalendar")({
  head: () => ({
    meta: [
      { title: "Plánovač & Kalendář | Život OS" },
      { name: "description", content: "Měsíční přehled, týdenní grid, denní time-blocking a Eisenhowerova matice." },
      { property: "og:title", content: "Plánovač & Kalendář | Život OS" },
      { property: "og:description", content: "Události, deadliny a priority propojené s cíli." },
    ],
  }),
  component: Planner,
});

const DAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

const iso = toIso;

function Planner() {
  const { state, set, celebrate } = useStore();
  const [view, setView] = React.useState<"mesic" | "tyden" | "den">("tyden");
  const [selected, setSelected] = React.useState(today());
  const [title, setTitle] = React.useState("");
  const [start, setStart] = React.useState("09:00");

  const base = new Date(selected + "T00:00:00");
  const weekStart = new Date(base);
  weekStart.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(weekStart);
    dt.setDate(weekStart.getDate() + i);
    return dt;
  });

  const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
  const offset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();

  const eventsOn = (day: string) => state.events.filter((e) => e.date === day);

  const kindTone: Record<string, "primary" | "danger" | "accent" | "success"> = {
    schuzka: "primary",
    deadline: "danger",
    blok: "accent",
    osobni: "success",
  };

  const addEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const h = Number(start.slice(0, 2));
    const m = start.slice(3, 5);
    const end = `${String(h + 1).padStart(2, "0")}:${m}`;
    set((s) => ({
      ...s,
      events: [...s.events, { id: uid(), title: title.trim(), date: selected, start, end, kind: "blok" }],
    }));
    celebrate("Blok v kalendáři 📅");
    setTitle("");
  };

  const toggleTask = (id: string) =>
    set((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t;
        if (!t.done) celebrate("Úkol odškrtnut ✅");
        return { ...t, done: !t.done };
      }),
    }));

  const matrix: Priority[] = [
    "urgentni-dulezite",
    "neurgentni-dulezite",
    "urgentni-nedulezite",
    "neurgentni-nedulezite",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Pill tone="primary">
            <CalendarDays className="size-3.5" /> Plánovač
          </Pill>
          <h1 className="mt-2 font-display text-3xl font-bold">Kalendář a časové bloky</h1>
        </div>
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {(["mesic", "tyden", "den"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
                view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {v === "mesic" ? "Měsíc" : v === "tyden" ? "Týden" : "Den"}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {view === "mesic" && (
          <div>
            <SectionTitle
              title={base.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" })}
              subtitle="Měsíční přehled událostí a deadlinů"
            />
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {DAYS.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dt = new Date(base.getFullYear(), base.getMonth(), i + 1);
                const key = iso(dt);
                const evs = eventsOn(key);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelected(key);
                      setView("den");
                    }}
                    className={`min-h-[78px] rounded-lg border p-1.5 text-left transition hover:border-primary ${
                      key === today() ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <div className="text-xs font-medium text-foreground">{i + 1}</div>
                    <div className="mt-1 space-y-0.5">
                      {evs.slice(0, 2).map((e) => (
                        <div key={e.id} className="truncate rounded bg-muted px-1 py-0.5 text-[10px]">
                          {e.title}
                        </div>
                      ))}
                      {evs.length > 2 && <div className="text-[10px] text-muted-foreground">+{evs.length - 2}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === "tyden" && (
          <div>
            <SectionTitle title="Týdenní grid" subtitle="Klikni na den pro time-blocking" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {weekDays.map((dt, i) => {
                const key = iso(dt);
                const evs = eventsOn(key);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelected(key);
                      setView("den");
                    }}
                    className={`min-h-[160px] rounded-xl border p-2 text-left transition hover:border-primary ${
                      key === today() ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <div className="text-xs text-muted-foreground">{DAYS[i]}</div>
                    <div className="font-display text-lg font-semibold">{dt.getDate()}</div>
                    <div className="mt-2 space-y-1">
                      {evs.map((e) => (
                        <div key={e.id} className="rounded-lg bg-muted px-1.5 py-1 text-[11px]">
                          <div className="font-medium">{e.start}</div>
                          <div className="truncate text-muted-foreground">{e.title}</div>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === "den" && (
          <div>
            <SectionTitle
              title={base.toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long" })}
              subtitle="Denní time-blocking 7:00–20:00"
            />
            <form onSubmit={addEvent} className="mb-4 flex flex-col gap-2 sm:flex-row">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nový blok…" />
              <Input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="sm:w-32"
                aria-label="Začátek"
              />
              <Button type="submit">
                <Plus className="size-4" /> Přidat
              </Button>
            </form>
            <div className="space-y-1">
              {HOURS.map((h) => {
                const label = `${String(h).padStart(2, "0")}:00`;
                const evs = eventsOn(selected).filter((e) => Number(e.start.slice(0, 2)) === h);
                return (
                  <div key={h} className="flex gap-3 border-t border-border py-1.5">
                    <div className="w-12 pt-1 text-xs text-muted-foreground">{label}</div>
                    <div className="flex-1 space-y-1">
                      {evs.map((e) => (
                        <div key={e.id} className="rounded-lg bg-primary/10 px-3 py-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{e.title}</span>
                            <Pill tone={kindTone[e.kind] ?? "muted"}>{e.kind}</Pill>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {e.start}–{e.end} {e.link && `· ${e.link}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle title="Eisenhowerova matice" subtitle="Priority podle naléhavosti a důležitosti" />
        <div className="grid gap-3 md:grid-cols-2">
          {matrix.map((p) => (
            <div key={p} className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-display text-sm font-semibold">{PRIORITY_LABEL[p]}</span>
                <Pill tone={p === "urgentni-dulezite" ? "danger" : p === "neurgentni-dulezite" ? "primary" : "muted"}>
                  {state.tasks.filter((t) => t.priority === p).length}
                </Pill>
              </div>
              {state.tasks
                .filter((t) => t.priority === p)
                .map((t) => (
                  <CheckRow
                    key={t.id}
                    checked={t.done}
                    onToggle={() => toggleTask(t.id)}
                    label={t.title}
                    meta={[t.pillar, t.due].filter(Boolean).join(" · ")}
                  />
                ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
