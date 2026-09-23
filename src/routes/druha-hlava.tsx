import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { NotebookPen, Heart, RefreshCcw, Plus, Trash2, Pencil, X } from "lucide-react";
import { Card, SectionTitle, Bar, Pill, CheckRow, Input, Textarea, Button } from "@/components/os";
import { useStore, uid, today, type JournalEntry } from "@/lib/os-store";

export const Route = createFileRoute("/denik")({
  head: () => ({
    meta: [
      { title: "Deník & Týdenní reset | Život OS" },
      { name: "description", content: "Ranní záměr, večerní reflexe, vděčnost, náladometr a nedělní reset." },
      { property: "og:title", content: "Deník & Týdenní reset | Život OS" },
      { property: "og:description", content: "Reflexe dne i týdne s jasnou strukturou." },
    ],
  }),
  component: Journal,
});

const MOODS = ["😞", "😕", "😐", "🙂", "🤩"];

type Form = {
  date: string;
  mood: number;
  f1: string;
  f2: string;
  f3: string;
  priority: string;
  w1: string;
  w2: string;
  w3: string;
  lesson: string;
  gratitude: string;
};

const emptyForm = (date: string): Form => ({
  date,
  mood: 4,
  f1: "",
  f2: "",
  f3: "",
  priority: "",
  w1: "",
  w2: "",
  w3: "",
  lesson: "",
  gratitude: "",
});

const fromEntry = (j: JournalEntry): Form => ({
  date: j.date,
  mood: j.mood,
  f1: j.lookingForward[0] ?? "",
  f2: j.lookingForward[1] ?? "",
  f3: j.lookingForward[2] ?? "",
  priority: j.topPriority,
  w1: j.wins[0] ?? "",
  w2: j.wins[1] ?? "",
  w3: j.wins[2] ?? "",
  lesson: j.lesson,
  gratitude: j.gratitude,
});

function Journal() {
  const { state, set, celebrate } = useStore();
  const [form, setForm] = React.useState<Form>(() => emptyForm(today()));
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLDivElement>(null);

  const [addingStep, setAddingStep] = React.useState(false);
  const [step, setStep] = React.useState({ label: "", group: "" });

  const [addingReview, setAddingReview] = React.useState(false);
  const nextWeek = Math.max(0, ...state.reviews.map((r) => r.week)) + 1;
  const [rv, setRv] = React.useState({ week: nextWeek, worked: "", improve: "", score: 80 });

  const upd = (k: keyof Form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const existing = editingId ? undefined : state.journal.find((j) => j.date === form.date);

  const startEdit = (j: JournalEntry) => {
    setForm(fromEntry(j));
    setEditingId(j.id);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm(today()));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: JournalEntry = {
      id: editingId ?? uid(),
      date: form.date,
      mood: form.mood,
      lookingForward: [form.f1, form.f2, form.f3].map((x) => x.trim()).filter(Boolean),
      topPriority: form.priority.trim(),
      wins: [form.w1, form.w2, form.w3].map((x) => x.trim()).filter(Boolean),
      lesson: form.lesson.trim(),
      gratitude: form.gratitude.trim(),
    };
    set((s) => ({
      ...s,
      journal: editingId ? s.journal.map((j) => (j.id === editingId ? entry : j)) : [entry, ...s.journal],
    }));
    celebrate(editingId ? "Zápis upraven ✍️" : "Zápis uložen do archivu ✍️");
    setEditingId(null);
    setForm(emptyForm(today()));
  };

  const removeEntry = (j: JournalEntry) => {
    if (!window.confirm(`Smazat zápis z ${j.date}?`)) return;
    set((s) => ({ ...s, journal: s.journal.filter((x) => x.id !== j.id) }));
    if (editingId === j.id) cancelEdit();
  };

  const toggleReset = (id: string) =>
    set((s) => {
      const next = s.reset.map((r) => (r.id === id ? { ...r, done: !r.done } : r));
      if (next.length > 0 && next.every((r) => r.done)) celebrate("Týdenní reset dokončen! Čistý start 🚀");
      return { ...s, reset: next };
    });

  const resetAll = () => set((s) => ({ ...s, reset: s.reset.map((r) => ({ ...r, done: false })) }));

  const addStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!step.label.trim()) return;
    const group = step.group.trim() || state.reset[state.reset.length - 1]?.group || "Vlastní kroky";
    set((s) => ({ ...s, reset: [...s.reset, { id: uid(), label: step.label.trim(), group, done: false }] }));
    setStep({ label: "", group: step.group });
  };

  const removeStep = (id: string) => set((s) => ({ ...s, reset: s.reset.filter((r) => r.id !== id) }));

  const addReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rv.worked.trim() && !rv.improve.trim()) return;
    set((s) => ({
      ...s,
      reviews: [
        ...s.reviews,
        { id: uid(), week: rv.week, worked: rv.worked.trim(), improve: rv.improve.trim(), score: rv.score },
      ],
    }));
    celebrate("Týdenní review uloženo 📈");
    setRv({ week: rv.week + 1, worked: "", improve: "", score: 80 });
    setAddingReview(false);
  };

  const removeReview = (id: string) => set((s) => ({ ...s, reviews: s.reviews.filter((r) => r.id !== id) }));

  const planScore = (week: number) => {
    const w = state.goal.weeks.find((x) => x.week === week);
    return w && w.planned > 0 ? Math.round((w.done / w.planned) * 100) : null;
  };

  const groups = Array.from(new Set(state.reset.map((r) => r.group)));
  const resetDone = state.reset.filter((r) => r.done).length;
  const moodAvg = (state.journal.reduce((a, j) => a + j.mood, 0) / Math.max(1, state.journal.length)).toFixed(1);
  const journal = [...state.journal].sort((a, b) => b.date.localeCompare(a.date));
  const reviews = [...state.reviews].sort((a, b) => b.week - a.week);
  const suggested = planScore(rv.week);

  return (
    <div className="space-y-6">
      <div>
        <Pill tone="primary">
          <NotebookPen className="size-3.5" /> Journaling
        </Pill>
        <h1 className="mt-2 font-display text-3xl font-bold">Deník, reflexe a týdenní reset</h1>
        <p className="mt-1 text-muted-foreground">
          Průměrná nálada {moodAvg}/5 · {state.journal.length} zápisů v archivu
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div ref={formRef} className="scroll-mt-20">
          <Card>
            <SectionTitle
              title={editingId ? "Úprava zápisu" : "Dnešní zápis"}
              subtitle="Ranní záměr i večerní reflexe – vyplň, co dává smysl."
              right={
                editingId ? (
                  <Button variant="ghost" className="px-2 py-1 text-xs" onClick={cancelEdit}>
                    <X className="size-3.5" /> Zrušit úpravu
                  </Button>
                ) : undefined
              }
            />
            <form onSubmit={save} className="space-y-4">
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Datum</div>
                <Input type="date" value={form.date} onChange={(e) => upd("date", e.target.value)} className="sm:w-48" />
                {existing && (
                  <p className="mt-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    Na tenhle den už zápis existuje.{" "}
                    <button type="button" className="font-medium text-primary hover:underline" onClick={() => startEdit(existing)}>
                      Doplnit večerní reflexi / upravit
                    </button>
                  </p>
                )}
              </div>

              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Náladoměr</div>
                <div className="flex gap-2">
                  {MOODS.map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => upd("mood", i + 1)}
                      className={`rounded-xl border px-3 py-1.5 text-xl transition ${
                        form.mood === i + 1 ? "border-primary bg-primary/10 scale-110" : "border-border"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">3 věci, na které se těším</div>
                <div className="space-y-2">
                  <Input value={form.f1} onChange={(e) => upd("f1", e.target.value)} placeholder="1." />
                  <Input value={form.f2} onChange={(e) => upd("f2", e.target.value)} placeholder="2." />
                  <Input value={form.f3} onChange={(e) => upd("f3", e.target.value)} placeholder="3." />
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Priorita dne</div>
                <Input value={form.priority} onChange={(e) => upd("priority", e.target.value)} placeholder="Jedna věc, která dnes rozhoduje" />
              </div>

              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">3 vítězství dne</div>
                <div className="space-y-2">
                  <Input value={form.w1} onChange={(e) => upd("w1", e.target.value)} placeholder="1." />
                  <Input value={form.w2} onChange={(e) => upd("w2", e.target.value)} placeholder="2." />
                  <Input value={form.w3} onChange={(e) => upd("w3", e.target.value)} placeholder="3." />
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Ponaučení</div>
                <Textarea value={form.lesson} onChange={(e) => upd("lesson", e.target.value)} placeholder="Co jsem se dnes naučil?" />
              </div>

              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Vděčnost</div>
                <Textarea value={form.gratitude} onChange={(e) => upd("gratitude", e.target.value)} placeholder="Za co jsem vděčný?" />
              </div>

              <Button type="submit" disabled={!form.date}>
                {editingId ? "Uložit změny" : "Uložit zápis"}
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionTitle
              title="Týdenní reset"
              subtitle={`${resetDone}/${state.reset.length} kroků hotovo`}
              right={
                <div className="flex gap-1">
                  <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setAddingStep((v) => !v)}>
                    <Plus className="size-3.5" /> Krok
                  </Button>
                  <Button variant="ghost" className="px-2 py-1 text-xs" onClick={resetAll}>
                    <RefreshCcw className="size-3.5" /> Vynulovat
                  </Button>
                </div>
              }
            />
            <Bar value={state.reset.length ? (resetDone / state.reset.length) * 100 : 0} />

            {addingStep && (
              <form onSubmit={addStep} className="pop-in mt-3 flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row">
                <Input value={step.label} onChange={(e) => setStep((v) => ({ ...v, label: e.target.value }))} placeholder="Nový krok resetu…" autoFocus />
                <Input
                  list="reset-groups"
                  value={step.group}
                  onChange={(e) => setStep((v) => ({ ...v, group: e.target.value }))}
                  placeholder="Skupina"
                  className="sm:w-40"
                />
                <datalist id="reset-groups">
                  {groups.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
                <Button type="submit" disabled={!step.label.trim()}>
                  Přidat
                </Button>
              </form>
            )}

            <div className="mt-3 space-y-3">
              {groups.map((g) => (
                <div key={g}>
                  <div className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g}</div>
                  {state.reset
                    .filter((r) => r.group === g)
                    .map((r) => (
                      <CheckRow
                        key={r.id}
                        checked={r.done}
                        onToggle={() => toggleReset(r.id)}
                        label={r.label}
                        right={
                          <Button variant="ghost" className="px-2 py-1" onClick={() => removeStep(r.id)} aria-label="Smazat krok">
                            <X className="size-3.5" />
                          </Button>
                        }
                      />
                    ))}
                </div>
              ))}
              {state.reset.length === 0 && <p className="text-sm text-muted-foreground">Žádné kroky – přidej si vlastní reset.</p>}
            </div>
          </Card>

          <Card>
            <SectionTitle
              title="Týdenní review"
              subtitle="Co fungovalo, co zlepšit"
              right={
                <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setAddingReview((v) => !v)}>
                  {addingReview ? <X className="size-3.5" /> : <Plus className="size-3.5" />} Review
                </Button>
              }
            />

            {addingReview && (
              <form onSubmit={addReview} className="pop-in mb-3 space-y-2 rounded-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Týden</span>
                  <Input
                    type="number"
                    min={1}
                    value={rv.week}
                    onChange={(e) => setRv((v) => ({ ...v, week: Math.max(1, Number(e.target.value) || 1) }))}
                    className="w-20"
                    aria-label="Číslo týdne"
                  />
                  <span className="ml-auto text-sm font-medium">{rv.score} %</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={rv.score}
                  onChange={(e) => setRv((v) => ({ ...v, score: Number(e.target.value) }))}
                  className="w-full accent-[var(--primary)]"
                  aria-label="Skóre týdne"
                />
                {suggested !== null && suggested !== rv.score && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setRv((v) => ({ ...v, score: suggested }))}
                  >
                    Převzít skóre z 12týdenního plánu ({suggested} %)
                  </button>
                )}
                <Textarea value={rv.worked} onChange={(e) => setRv((v) => ({ ...v, worked: e.target.value }))} placeholder="✅ Co fungovalo" />
                <Textarea value={rv.improve} onChange={(e) => setRv((v) => ({ ...v, improve: e.target.value }))} placeholder="🔧 Co zlepšit" />
                <Button type="submit" disabled={!rv.worked.trim() && !rv.improve.trim()}>
                  Uložit review
                </Button>
              </form>
            )}

            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl bg-muted/60 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-semibold">Týden {r.week}</span>
                    <div className="flex items-center gap-1">
                      <Pill tone={r.score >= 80 ? "success" : "danger"}>{r.score} %</Pill>
                      <Button variant="ghost" className="px-2 py-1" onClick={() => removeReview(r.id)} aria-label="Smazat review">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  {r.worked && <p className="mt-1 text-muted-foreground">✅ {r.worked}</p>}
                  {r.improve && <p className="text-muted-foreground">🔧 {r.improve}</p>}
                </div>
              ))}
              {reviews.length === 0 && <p className="text-sm text-muted-foreground">Zatím žádné review.</p>}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <SectionTitle
          title="Archiv zápisů"
          subtitle="Historie dnů, vítězství a vděčnosti"
          right={<Heart className="size-5 text-primary" />}
        />
        <div className="grid gap-3 md:grid-cols-2">
          {journal.map((j) => (
            <div key={j.id} className="rounded-xl border border-border p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display font-semibold">{j.date}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xl">{MOODS[j.mood - 1]}</span>
                  <Button variant="ghost" className="px-2 py-1" onClick={() => startEdit(j)} aria-label="Upravit zápis">
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" className="px-2 py-1" onClick={() => removeEntry(j)} aria-label="Smazat zápis">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              {j.lookingForward.length > 0 && (
                <p className="mt-2 text-muted-foreground">
                  <strong className="text-foreground">Těším se:</strong> {j.lookingForward.join(" · ")}
                </p>
              )}
              {j.topPriority && (
                <p className="mt-1 text-muted-foreground">
                  <strong className="text-foreground">Priorita:</strong> {j.topPriority}
                </p>
              )}
              <ul className="mt-1 text-muted-foreground">
                {j.wins.map((w, i) => (
                  <li key={i}>🏅 {w}</li>
                ))}
              </ul>
              {j.lesson && (
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  <strong className="text-foreground">Ponaučení:</strong> {j.lesson}
                </p>
              )}
              {j.gratitude && <p className="mt-1 whitespace-pre-wrap text-muted-foreground">🙏 {j.gratitude}</p>}
            </div>
          ))}
          {journal.length === 0 && <p className="text-sm text-muted-foreground">Archiv je zatím prázdný – první zápis čeká nahoře.</p>}
        </div>
      </Card>
    </div>
  );
}
