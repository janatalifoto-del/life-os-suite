import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Zap, Gift, Sunrise, MoonStar, Plus, Trash2 } from "lucide-react";
import { Card, SectionTitle, Bar, Pill, CheckRow, Ring, Input, Select, Button } from "@/components/os";
import { useStore, useDailyScore, uid, today, czk } from "@/lib/os-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dopamin & Denní mise | Život OS" },
      { name: "description", content: "Denní rituály, streaky, skóre dne a rychlý záchyt myšlenek na jednom místě." },
      { property: "og:title", content: "Dopamin & Denní mise | Život OS" },
      { property: "og:description", content: "Denní rituály, streaky, skóre dne a rychlý záchyt myšlenek." },
    ],
  }),
  component: Dashboard,
});

const REWARDS = [
  { at: 40, label: "Oblíbená káva", emoji: "☕" },
  { at: 70, label: "Epizoda seriálu", emoji: "🎬" },
  { at: 100, label: "Volný večer bez výčitek", emoji: "🏆" },
];

function Dashboard() {
  const { state, set, celebrate } = useStore();
  const score = useDailyScore();
  const [text, setText] = React.useState("");
  const [kind, setKind] = React.useState("Myšlenka");
  const [newMorning, setNewMorning] = React.useState("");
  const [newEvening, setNewEvening] = React.useState("");

  const addRitual = (part: "rano" | "vecer", title: string) => {
    if (!title.trim()) return;
    set((s) => ({
      ...s,
      rituals: [...s.rituals, { id: uid(), title: title.trim(), part, done: false, streak: 0 }],
    }));
    part === "rano" ? setNewMorning("") : setNewEvening("");
  };

  const removeRitual = (id: string) =>
    set((s) => ({ ...s, rituals: s.rituals.filter((r) => r.id !== id) }));

  const removeTask = (id: string) =>
    set((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));

  const removeInboxItem = (id: string) =>
    set((s) => ({ ...s, inbox: s.inbox.filter((i) => i.id !== id) }));

  const toggleRitual = (id: string) =>
    set((s) => ({
      ...s,
      rituals: s.rituals.map((r) => {
        if (r.id !== id) return r;
        const done = !r.done;
        if (done) celebrate(`${r.title} hotovo! Streak ${r.streak + 1} dní 🔥`);
        return { ...r, done, streak: done ? r.streak + 1 : Math.max(0, r.streak - 1) };
      }),
    }));

  const toggleTask = (id: string) =>
    set((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t;
        if (!t.done) celebrate("Úkol splněn! +10 bodů dne ⚡");
        return { ...t, done: !t.done };
      }),
    }));

  const capture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (kind === "Úkol") {
      set((s) => ({
        ...s,
        tasks: [
          { id: uid(), title: text.trim(), done: false, priority: "neurgentni-dulezite", due: today() },
          ...s.tasks,
        ],
      }));
    } else {
      set((s) => ({ ...s, inbox: [{ id: uid(), text: text.trim(), kind, at: today() }, ...s.inbox] }));
    }
    celebrate("Zachyceno do Druhé hlavy ✨");
    setText("");
  };

  const morning = state.rituals.filter((r) => r.part === "rano");
  const evening = state.rituals.filter((r) => r.part === "vecer");
  const bestStreak = Math.max(...state.rituals.map((r) => r.streak), 0);
  const weekAvg = Math.round(
    (state.goal.weeks.filter((w) => w.done > 0).reduce((a, w) => a + w.done / w.planned, 0) /
      Math.max(1, state.goal.weeks.filter((w) => w.done > 0).length)) *
      100,
  );
  const balance = state.accounts.reduce((a, b) => a + b.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Pill tone="primary">
            <Flame className="size-3.5" /> Dnešní mise
          </Pill>
          <h1 className="mt-2 font-display text-3xl font-bold">Dobrý den. Dnes hraješ o {100 - score.percent} %.</h1>
          <p className="mt-1 text-muted-foreground">
            Rituály, priority a rychlý záchyt – všechno, co potřebuješ pro dopaminový den.
          </p>
        </div>
        <Link to="/plan-12" className="text-sm font-medium text-primary hover:underline">
          Zobrazit 12týdenní cíl →
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="flex flex-col items-center justify-center text-center">
          <div className="relative">
            <Ring value={score.percent} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-3xl font-bold">{score.percent} %</div>
              <div className="text-xs text-muted-foreground">skóre dne</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            {score.done} z {score.total} splněno
          </div>
          <div className="mt-4 grid w-full grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl bg-muted p-2">
              <div className="font-display text-base font-semibold">{bestStreak}</div>
              <div className="text-muted-foreground">nejdelší streak</div>
            </div>
            <div className="rounded-xl bg-muted p-2">
              <div className="font-display text-base font-semibold">{weekAvg} %</div>
              <div className="text-muted-foreground">plán týdnů</div>
            </div>
            <div className="rounded-xl bg-muted p-2">
              <div className="font-display text-base font-semibold">{state.inbox.length}</div>
              <div className="text-muted-foreground">v inboxu</div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle title="Rychlý záznam" subtitle="Myšlenka, úkol, výdaj nebo vděčnost – jedním řádkem." />
            <form onSubmit={capture} className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Co máš na mysli?"
                aria-label="Rychlý záznam"
              />
              <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Typ záznamu">
                <option>Myšlenka</option>
                <option>Úkol</option>
                <option>Nápad</option>
                <option>Výdaj</option>
                <option>Vděčnost</option>
              </Select>
              <Button type="submit">
                <Plus className="size-4" /> Zachytit
              </Button>
            </form>
            <div className="mt-4 space-y-2">
              {state.inbox.slice(0, 4).map((i) => (
                <div key={i.id} className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm">
                  <Pill tone="accent">{i.kind}</Pill>
                  <span className="flex-1 truncate">{i.text}</span>
                  <button
                    type="button"
                    onClick={() => removeInboxItem(i.id)}
                    aria-label="Smazat záznam"
                    className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
              {state.inbox.length === 0 && <p className="text-sm text-muted-foreground">Inbox je prázdný. 🎉</p>}
            </div>
          </Card>

          <Card>
            <SectionTitle title="Dopaminové odměny" subtitle="Odemykají se podle skóre dne." />
            <div className="grid gap-3 sm:grid-cols-3">
              {REWARDS.map((r) => {
                const unlocked = score.percent >= r.at;
                return (
                  <div
                    key={r.label}
                    className={`rounded-xl border p-3 text-sm transition ${
                      unlocked ? "pop-in border-success/50 bg-success/10" : "border-dashed border-border opacity-70"
                    }`}
                  >
                    <div className="text-xl">{r.emoji}</div>
                    <div className="mt-1 font-medium">{r.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {unlocked ? "Odemčeno!" : `Od ${r.at} % dne`}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Bar value={score.percent} />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <SectionTitle title="Ranní rituál" subtitle="Start dne" right={<Sunrise className="size-5 text-accent" />} />
          {morning.map((r) => (
            <CheckRow
              key={r.id}
              checked={r.done}
              onToggle={() => toggleRitual(r.id)}
              label={r.title}
              right={
                <div className="flex items-center gap-1">
                  <Pill tone={r.streak > 10 ? "success" : "muted"}>
                    <Flame className="size-3" /> {r.streak}
                  </Pill>
                  <button
                    type="button"
                    onClick={() => removeRitual(r.id)}
                    aria-label="Smazat rituál"
                    className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              }
            />
          ))}
          {morning.length === 0 && <p className="px-3 text-sm text-muted-foreground">Zatím žádný ranní rituál.</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addRitual("rano", newMorning);
            }}
            className="mt-3 flex gap-2"
          >
            <Input
              value={newMorning}
              onChange={(e) => setNewMorning(e.target.value)}
              placeholder="Nový ranní rituál…"
              aria-label="Nový ranní rituál"
            />
            <Button type="submit" variant="soft">
              <Plus className="size-4" />
            </Button>
          </form>
        </Card>

        <Card>
          <SectionTitle title="Večerní zklidnění" subtitle="Uzavření dne" right={<MoonStar className="size-5 text-accent" />} />
          {evening.map((r) => (
            <CheckRow
              key={r.id}
              checked={r.done}
              onToggle={() => toggleRitual(r.id)}
              label={r.title}
              right={
                <div className="flex items-center gap-1">
                  <Pill tone={r.streak > 10 ? "success" : "muted"}>
                    <Flame className="size-3" /> {r.streak}
                  </Pill>
                  <button
                    type="button"
                    onClick={() => removeRitual(r.id)}
                    aria-label="Smazat rituál"
                    className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              }
            />
          ))}
          {evening.length === 0 && <p className="px-3 text-sm text-muted-foreground">Zatím žádný večerní rituál.</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addRitual("vecer", newEvening);
            }}
            className="mt-3 flex gap-2"
          >
            <Input
              value={newEvening}
              onChange={(e) => setNewEvening(e.target.value)}
              placeholder="Nový večerní rituál…"
              aria-label="Nový večerní rituál"
            />
            <Button type="submit" variant="soft">
              <Plus className="size-4" />
            </Button>
          </form>
        </Card>

        <Card>
          <SectionTitle title="Priority dne" subtitle="Co posune cíl" right={<Zap className="size-5 text-primary" />} />
          {score.todayTasks.map((t) => (
            <CheckRow
              key={t.id}
              checked={t.done}
              onToggle={() => toggleTask(t.id)}
              label={t.title}
              meta={t.pillar}
              right={
                <button
                  type="button"
                  onClick={() => removeTask(t.id)}
                  aria-label="Smazat úkol"
                  className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              }
            />
          ))}
          {score.todayTasks.length === 0 && (
            <p className="px-3 text-sm text-muted-foreground">Na dnešek nic naplánovaného.</p>
          )}
          <div className="mt-4 rounded-xl bg-muted/60 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Gift className="size-4 text-primary" /> Zůstatek napříč účty
            </div>
            <div className="mt-1 font-display text-xl font-semibold">{czk(balance)}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
