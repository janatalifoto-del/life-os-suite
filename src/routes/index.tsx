import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Zap, Gift, Sunrise, MoonStar, Plus, Pencil, Check, Trash2 } from "lucide-react";
import { Card, SectionTitle, Bar, Pill, CheckRow, Ring, Input, Select, Button } from "@/components/os";
import { useStore, useDailyScore, uid, today, czk, type Reward } from "@/lib/os-store";

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

function RewardsCard({ percent }: { percent: number }) {
  const { state, set, celebrate } = useStore();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState({ emoji: "🎁", label: "", at: 50 });

  const rewards = [...state.rewards].sort((a, b) => a.at - b.at);
  const next = rewards.find((r) => percent < r.at);

  const patch = (id: string, change: Partial<Reward>) =>
    set((s) => ({ ...s, rewards: s.rewards.map((r) => (r.id === id ? { ...r, ...change } : r)) }));
  const remove = (id: string) => set((s) => ({ ...s, rewards: s.rewards.filter((r) => r.id !== id) }));
  const clampAt = (v: string) => Math.min(100, Math.max(1, Math.round(Number(v) || 1)));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.label.trim()) return;
    set((s) => ({
      ...s,
      rewards: [
        ...s.rewards,
        { id: uid(), emoji: draft.emoji.trim() || "🎁", label: draft.label.trim(), at: draft.at },
      ],
    }));
    setDraft({ emoji: "🎁", label: "", at: 50 });
  };

  const claim = (r: Reward) => {
    patch(r.id, { claimedOn: today() });
    celebrate(`${r.emoji} ${r.label} – užij si to, zasloužíš!`);
  };

  return (
    <Card>
      <SectionTitle
        title="Dopaminové odměny"
        subtitle="Odemykají se podle skóre dne. Vyber si vlastní."
        right={
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setEditing((v) => !v)}>
            {editing ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
            {editing ? "Hotovo" : "Upravit"}
          </Button>
        }
      />

      {!editing && (
        <div className="grid gap-3 sm:grid-cols-3">
          {rewards.map((r) => {
            const unlocked = percent >= r.at;
            const claimed = r.claimedOn === today();
            return (
              <div
                key={r.id}
                className={`rounded-xl border p-3 text-sm transition ${
                  unlocked ? "pop-in border-success/50 bg-success/10" : "border-dashed border-border opacity-70"
                }`}
              >
                <div className="text-xl">{r.emoji}</div>
                <div className="mt-1 font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">
                  {claimed ? "Užito dnes ✓" : unlocked ? "Odemčeno!" : `Od ${r.at} % dne`}
                </div>
                {unlocked && !claimed && (
                  <Button variant="soft" className="mt-2 px-2 py-1 text-xs" onClick={() => claim(r)}>
                    Užít odměnu
                  </Button>
                )}
              </div>
            );
          })}
          {rewards.length === 0 && (
            <p className="text-sm text-muted-foreground sm:col-span-3">
              Zatím žádné odměny – klikni na Upravit a přidej první.
            </p>
          )}
        </div>
      )}

      {editing && (
        <div className="space-y-2">
          {rewards.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <Input
                value={r.emoji}
                maxLength={8}
                onChange={(e) => patch(r.id, { emoji: e.target.value })}
                className="w-16 text-center"
                aria-label="Emoji"
              />
              <Input value={r.label} onChange={(e) => patch(r.id, { label: e.target.value })} aria-label="Odměna" />
              <Input
                type="number"
                min={1}
                max={100}
                value={r.at}
                onChange={(e) => patch(r.id, { at: clampAt(e.target.value) })}
                className="w-20"
                aria-label="Od kolika % skóre dne"
              />
              <span className="text-xs text-muted-foreground">%</span>
              <Button variant="ghost" className="px-2" onClick={() => remove(r.id)} aria-label="Smazat odměnu">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <form onSubmit={add} className="flex items-center gap-2 border-t border-border pt-3">
            <Input
              value={draft.emoji}
              maxLength={8}
              onChange={(e) => setDraft((v) => ({ ...v, emoji: e.target.value }))}
              className="w-16 text-center"
              aria-label="Emoji nové odměny"
            />
            <Input
              value={draft.label}
              onChange={(e) => setDraft((v) => ({ ...v, label: e.target.value }))}
              placeholder="Nová odměna (např. koupel, hra, procházka s kávou)…"
            />
            <Input
              type="number"
              min={1}
              max={100}
              value={draft.at}
              onChange={(e) => setDraft((v) => ({ ...v, at: clampAt(e.target.value) }))}
              className="w-20"
              aria-label="Od kolika %"
            />
            <span className="text-xs text-muted-foreground">%</span>
            <Button type="submit">
              <Plus className="size-4" /> Přidat
            </Button>
          </form>
        </div>
      )}

      <div className="mt-4">
        <div className="relative">
          <Bar value={percent} />
          {rewards.map((r) => (
            <span
              key={r.id}
              title={`${r.label} – ${r.at} %`}
              className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-foreground/50"
              style={{ left: `${r.at}%` }}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {next
            ? `Do odměny „${next.label}" chybí ${next.at - percent} % skóre dne.`
            : rewards.length > 0
              ? "Všechny dnešní odměny jsou odemčené. 🎉"
              : ""}
        </p>
      </div>
    </Card>
  );
}

function Dashboard() {
  const { state, set, celebrate } = useStore();
  const score = useDailyScore();
  const [text, setText] = React.useState("");
  const [kind, setKind] = React.useState("Myšlenka");

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
                  <span className="truncate">{i.text}</span>
                </div>
              ))}
              {state.inbox.length === 0 && <p className="text-sm text-muted-foreground">Inbox je prázdný. 🎉</p>}
            </div>
          </Card>

          <RewardsCard percent={score.percent} />
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
                <Pill tone={r.streak > 10 ? "success" : "muted"}>
                  <Flame className="size-3" /> {r.streak}
                </Pill>
              }
            />
          ))}
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
                <Pill tone={r.streak > 10 ? "success" : "muted"}>
                  <Flame className="size-3" /> {r.streak}
                </Pill>
              }
            />
          ))}
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
