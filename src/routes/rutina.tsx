import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, ChevronLeft, ChevronRight, Clock, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { Card, SectionTitle, Bar, Pill, CheckRow, Input, Select, Button } from "@/components/os";
import {
  useStore,
  uid,
  today,
  PLAN_CATS,
  PLAN_DAYS,
  type MonthlyRoutine,
  type PlanBlock,
  type PlanCat,
} from "@/lib/os-store";

export const Route = createFileRoute("/rutina")({
  head: () => ({
    meta: [
      { title: "Rutina & týdenní plán | Život OS" },
      {
        name: "description",
        content: "Vlastní týdenní plán po hodinách na celých 24 hodin každého dne a rutina, která se opakuje jednou měsíčně.",
      },
      { property: "og:title", content: "Rutina & týdenní plán | Život OS" },
      { property: "og:description", content: "Týden po hodinách a měsíční rutina podle tvých pravidel." },
    ],
  }),
  component: RoutinePage,
});

const pad = (n: number) => String(n).padStart(2, "0");
const CAT_KEYS = Object.keys(PLAN_CATS) as PlanCat[];

function RoutinePage() {
  const [tab, setTab] = React.useState<"tyden" | "mesic">("tyden");
  return (
    <div className="space-y-6">
      <div>
        <Pill tone="primary">
          <CalendarClock className="size-3.5" /> Rutina
        </Pill>
        <h1 className="mt-2 font-display text-3xl font-bold">Týden po hodinách a měsíční rutina</h1>
        <p className="mt-1 text-muted-foreground">
          Každý den na 24 hodin podle tebe a věci, které se vracejí jednou za měsíc.
        </p>
      </div>

      <div className="flex w-fit gap-1 rounded-xl bg-muted p-1">
        {(
          [
            { key: "tyden", label: "Týden po hodinách", icon: Clock },
            { key: "mesic", label: "Měsíční rutina", icon: Repeat },
          ] as const
        ).map((t) => (
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

      {tab === "tyden" ? <WeekPlan /> : <MonthlyPlan />}
    </div>
  );
}

/* ------------------------- Týdenní plán 24 h ------------------------- */

type Editor = { title: string; cat: PlanCat; days: boolean[]; from: number; to: number };
const same = (a?: PlanBlock, b?: PlanBlock) => !!a && !!b && a.title === b.title && a.cat === b.cat;

function WeekPlan() {
  const { state, set, celebrate } = useStore();
  const [sel, setSel] = React.useState<{ day: number; hour: number } | null>(null);
  const [ed, setEd] = React.useState<Editor | null>(null);
  const [now, setNow] = React.useState<{ day: number; hour: number } | null>(null);

  React.useEffect(() => {
    const tick = () => {
      const t = new Date();
      setNow({ day: (t.getDay() + 6) % 7, hour: t.getHours() });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const map = React.useMemo(() => {
    const m = new Map<string, PlanBlock>();
    state.weekPlan.forEach((b) => m.set(`${b.day}-${b.hour}`, b));
    return m;
  }, [state.weekPlan]);

  const totals = React.useMemo(() => {
    const t = Object.fromEntries(CAT_KEYS.map((k) => [k, 0])) as Record<PlanCat, number>;
    map.forEach((b) => {
      t[b.cat] += 1;
    });
    return t;
  }, [map]);

  const titles = Array.from(new Set(state.weekPlan.map((b) => b.title)));

  const pick = (day: number, hour: number) => {
    const b = map.get(`${day}-${hour}`);
    let from = hour;
    let to = hour + 1;
    if (b) {
      while (from > 0 && same(map.get(`${day}-${from - 1}`), b)) from--;
      while (to < 24 && same(map.get(`${day}-${to}`), b)) to++;
    }
    setSel({ day, hour });
    setEd({
      title: b?.title ?? "",
      cat: b?.cat ?? "prace",
      days: PLAN_DAYS.map((_, i) => i === day),
      from,
      to,
    });
  };

  const upd = (change: Partial<Editor>) => setEd((e) => (e ? { ...e, ...change } : e));
  const toggleDay = (i: number) => setEd((e) => (e ? { ...e, days: e.days.map((v, j) => (j === i ? !v : v)) } : e));

  const inRange = (day: number, hour: number) => !!ed && !!sel && ed.days[day] && hour >= ed.from && hour < ed.to;

  const save = () => {
    if (!ed || !ed.title.trim()) return;
    const title = ed.title.trim();
    set((s) => {
      const kept = s.weekPlan.filter((b) => !(ed.days[b.day] && b.hour >= ed.from && b.hour < ed.to));
      const added: PlanBlock[] = [];
      ed.days.forEach((on, day) => {
        if (!on) return;
        for (let h = ed.from; h < ed.to; h++) added.push({ id: uid(), day, hour: h, title, cat: ed.cat });
      });
      return { ...s, weekPlan: [...kept, ...added] };
    });
    celebrate("Plán uložen 🗓️");
  };

  const clearRange = () => {
    if (!ed) return;
    set((s) => ({
      ...s,
      weekPlan: s.weekPlan.filter((b) => !(ed.days[b.day] && b.hour >= ed.from && b.hour < ed.to)),
    }));
  };

  const copyDay = () => {
    if (!ed || !sel) return;
    const src = sel.day;
    const targets = ed.days.map((on, i) => (on && i !== src ? i : -1)).filter((i) => i >= 0);
    if (targets.length === 0) return;
    const names = targets.map((i) => PLAN_DAYS[i]).join(", ");
    if (!window.confirm(`Přepsat plán dnů ${names} plánem dne ${PLAN_DAYS[src]}?`)) return;
    set((s) => {
      const source = s.weekPlan.filter((b) => b.day === src);
      const kept = s.weekPlan.filter((b) => !targets.includes(b.day));
      const copies = targets.flatMap((day) => source.map((b) => ({ ...b, id: uid(), day })));
      return { ...s, weekPlan: [...kept, ...copies] };
    });
    celebrate(`Den ${PLAN_DAYS[src]} zkopírován 📋`);
  };

  const clearAll = () => {
    if (!window.confirm("Vymazat celý týdenní plán? Půjde ho vyplnit znovu od nuly.")) return;
    set((s) => ({ ...s, weekPlan: [] }));
    setSel(null);
    setEd(null);
  };

  const copyTargets = ed && sel ? ed.days.filter((on, i) => on && i !== sel.day).length : 0;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          title="Můj týden – 24 hodin každý den"
          subtitle="Klikni na hodinu, vyplň blok a použij ho na libovolné dny. Spánek a odpočinek jsou taky plán."
          right={
            <Button variant="ghost" className="px-2 py-1 text-xs" onClick={clearAll}>
              <Trash2 className="size-3.5" /> Vymazat vše
            </Button>
          }
        />

        <div className="mb-3 flex flex-wrap gap-2">
          {CAT_KEYS.map((k) => (
            <span key={k} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${PLAN_CATS[k].cell}`}>
              {PLAN_CATS[k].label}
              <span className="font-semibold">{totals[k]} h</span>
            </span>
          ))}
          <Pill tone={map.size === 168 ? "success" : "muted"}>
            {map.size === 168 ? "Všech 168 h vyplněno" : `Nevyplněno ${168 - map.size} h z 168`}
          </Pill>
        </div>

        <div className="overflow-x-auto">
          <div className="grid min-w-[720px]" style={{ gridTemplateColumns: "48px repeat(7, minmax(84px, 1fr))" }}>
            <div />
            {PLAN_DAYS.map((label, i) => (
              <div
                key={label}
                className={`px-1 pb-1 text-center text-xs font-medium ${
                  now?.day === i ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </div>
            ))}
            {Array.from({ length: 24 }, (_, h) => (
              <React.Fragment key={h}>
                <div
                  className={`sticky left-0 border-t border-border bg-surface pr-2 pt-1.5 text-right text-[11px] ${
                    now?.hour === h ? "font-semibold text-primary" : "text-muted-foreground"
                  }`}
                >
                  {pad(h)}:00
                </div>
                {PLAN_DAYS.map((_, day) => {
                  const b = map.get(`${day}-${h}`);
                  const start = b && !same(map.get(`${day}-${h - 1}`), b);
                  const picked = inRange(day, h);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => pick(day, h)}
                      title={b ? `${PLAN_DAYS[day]} ${pad(h)}:00 – ${b.title}` : `${PLAN_DAYS[day]} ${pad(h)}:00 – volné`}
                      className={`h-8 truncate border-t border-border px-1.5 text-left text-[11px] transition hover:brightness-110 ${
                        b ? PLAN_CATS[b.cat].cell : "bg-transparent"
                      } ${picked ? "relative z-10 ring-2 ring-primary" : ""} ${
                        now?.day === day && now.hour === h ? "shadow-[inset_3px_0_0_var(--primary)]" : ""
                      }`}
                    >
                      {b && start ? b.title : ""}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        {!ed && (
          <p className="text-sm text-muted-foreground">
            Vyber hodinu v tabulce – tady se objeví editor bloku (název, kategorie, dny a od–do).
          </p>
        )}
        {ed && (
          <div className="space-y-4">
            <SectionTitle title="Blok" subtitle="Změny se uplatní na všechny vybrané dny a hodiny." />
            <div className="grid gap-3 md:grid-cols-[1fr_200px]">
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Co budeš dělat</div>
                <Input
                  list="plan-titles"
                  value={ed.title}
                  onChange={(e) => upd({ title: e.target.value })}
                  placeholder="Např. Deep work, spánek, vaření, čas s dětmi…"
                />
                <datalist id="plan-titles">
                  {titles.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Kategorie</div>
                <Select value={ed.cat} onChange={(e) => upd({ cat: e.target.value as PlanCat })} className="w-full">
                  {CAT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {PLAN_CATS[k].label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Dny</div>
                <div className="flex gap-1">
                  {PLAN_DAYS.map((label, i) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={ed.days[i]}
                      onClick={() => toggleDay(i)}
                      className={`rounded-lg border px-2.5 py-1.5 text-sm transition ${
                        ed.days[i] ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                  <button type="button" className="hover:underline" onClick={() => upd({ days: PLAN_DAYS.map(() => true) })}>
                    všechny
                  </button>
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() => upd({ days: PLAN_DAYS.map((_, i) => i < 5) })}
                  >
                    pracovní
                  </button>
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() => upd({ days: PLAN_DAYS.map((_, i) => i >= 5) })}
                  >
                    víkend
                  </button>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div>
                  <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Od</div>
                  <Select
                    value={ed.from}
                    onChange={(e) => {
                      const from = Number(e.target.value);
                      upd({ from, to: Math.max(ed.to, from + 1) });
                    }}
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>
                        {pad(h)}:00
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Do</div>
                  <Select value={ed.to} onChange={(e) => upd({ to: Math.max(Number(e.target.value), ed.from + 1) })}>
                    {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={h}>
                        {pad(h)}:00
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={!ed.title.trim()}>
                Uložit blok
              </Button>
              <Button variant="soft" onClick={clearRange}>
                Vymazat vybrané hodiny
              </Button>
              <Button variant="ghost" onClick={copyDay} disabled={copyTargets === 0}>
                Zkopírovat celý den {sel ? PLAN_DAYS[sel.day] : ""} na vybrané dny
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------- Měsíční rutina ------------------------- */

const monthOf = (iso: string) => iso.slice(0, 7);
const daysIn = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
};
const shiftMonth = (key: string, delta: number) => {
  const [y, m] = key.split("-").map(Number);
  const dt = new Date(y, m - 1 + delta, 1);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`;
};
const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });
};

function MonthlyPlan() {
  const { state, set, celebrate } = useStore();
  const [month, setMonth] = React.useState(() => monthOf(today()));
  const [title, setTitle] = React.useState("");
  const [day, setDay] = React.useState(1);
  const [pillar, setPillar] = React.useState("");

  const isCurrent = month === monthOf(today());
  const todayDay = Number(today().slice(8, 10));
  const eff = (r: MonthlyRoutine) => Math.min(r.day, daysIn(month));
  const items = [...state.monthly].sort((a, b) => eff(a) - eff(b) || a.title.localeCompare(b.title, "cs"));
  const done = items.filter((r) => r.doneMonths.includes(month)).length;

  const patch = (id: string, change: Partial<MonthlyRoutine>) =>
    set((s) => ({ ...s, monthly: s.monthly.map((r) => (r.id === id ? { ...r, ...change } : r)) }));

  const toggle = (r: MonthlyRoutine) => {
    const isDone = r.doneMonths.includes(month);
    set((s) => {
      const monthly = s.monthly.map((x) =>
        x.id !== r.id
          ? x
          : { ...x, doneMonths: isDone ? x.doneMonths.filter((m) => m !== month) : [...x.doneMonths, month] },
      );
      return { ...s, monthly };
    });
    if (!isDone) celebrate(done + 1 === items.length ? "Měsíční rutina hotová! 🎉" : "Rutina odškrtnuta ✅");
  };

  const remove = (r: MonthlyRoutine) => {
    if (window.confirm(`Smazat rutinu „${r.title}"?`)) set((s) => ({ ...s, monthly: s.monthly.filter((x) => x.id !== r.id) }));
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    set((s) => ({
      ...s,
      monthly: [
        ...s.monthly,
        { id: uid(), title: title.trim(), day: Math.min(31, Math.max(1, day)), pillar: pillar || undefined, doneMonths: [] },
      ],
    }));
    setTitle("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          title="Měsíční rutina"
          subtitle="Věci, které se vracejí jednou za měsíc. Každý měsíc se odškrtává znovu."
          right={
            <div className="flex items-center gap-1">
              <Button variant="ghost" className="px-2" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Předchozí měsíc">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-[130px] text-center text-sm font-medium capitalize">{monthLabel(month)}</span>
              <Button variant="ghost" className="px-2" onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="Další měsíc">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          }
        />
        <div className="mb-3 flex items-center gap-3">
          <Bar value={items.length ? (done / items.length) * 100 : 0} />
          <span className="shrink-0 text-xs text-muted-foreground">
            {done}/{items.length}
          </span>
        </div>

        <div className="space-y-1">
          {items.map((r) => (
            <RoutineRow
              key={r.id}
              r={r}
              day={eff(r)}
              checked={r.doneMonths.includes(month)}
              overdue={isCurrent && eff(r) < todayDay && !r.doneMonths.includes(month)}
              isToday={isCurrent && eff(r) === todayDay}
              pillars={state.pillars.map((p) => p.name)}
              onToggle={() => toggle(r)}
              onPatch={(c) => patch(r.id, c)}
              onRemove={() => remove(r)}
            />
          ))}
          {items.length === 0 && <p className="px-3 text-sm text-muted-foreground">Zatím žádná rutina – přidej první níže.</p>}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Nová měsíční rutina" subtitle="Den v měsíci, kdy se to má stát (31. se v kratších měsících posune na poslední den)." />
        <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Co se má dít každý měsíc?" />
          <Input
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(Number(e.target.value) || 1)}
            className="sm:w-24"
            aria-label="Den v měsíci"
          />
          <Select value={pillar} onChange={(e) => setPillar(e.target.value)} aria-label="Pilíř">
            <option value="">Bez pilíře</option>
            {state.pillars.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </Select>
          <Button type="submit">
            <Plus className="size-4" /> Přidat
          </Button>
        </form>
      </Card>
    </div>
  );
}

function RoutineRow({
  r,
  day,
  checked,
  overdue,
  isToday,
  pillars,
  onToggle,
  onPatch,
  onRemove,
}: {
  r: MonthlyRoutine;
  day: number;
  checked: boolean;
  overdue: boolean;
  isToday: boolean;
  pillars: string[];
  onToggle: () => void;
  onPatch: (c: Partial<MonthlyRoutine>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = React.useState(false);

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3 sm:flex-row sm:items-center">
        <Input value={r.title} onChange={(e) => onPatch({ title: e.target.value })} aria-label="Název" />
        <Input
          type="number"
          min={1}
          max={31}
          value={r.day}
          onChange={(e) => onPatch({ day: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
          className="sm:w-24"
          aria-label="Den v měsíci"
        />
        <Select value={r.pillar ?? ""} onChange={(e) => onPatch({ pillar: e.target.value || undefined })} aria-label="Pilíř">
          <option value="">Bez pilíře</option>
          {pillars.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Button onClick={() => setEditing(false)}>Hotovo</Button>
      </div>
    );
  }

  return (
    <CheckRow
      checked={checked}
      onToggle={onToggle}
      label={r.title}
      meta={[`${day}. v měsíci`, r.pillar].filter(Boolean).join(" · ")}
      right={
        <div className="flex items-center gap-1">
          {overdue && <Pill tone="danger">Po termínu</Pill>}
          {isToday && !checked && <Pill tone="primary">Dnes</Pill>}
          <Button variant="ghost" className="px-2" onClick={() => setEditing(true)} aria-label="Upravit">
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" className="px-2" onClick={onRemove} aria-label="Smazat">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      }
    />
  );
}
