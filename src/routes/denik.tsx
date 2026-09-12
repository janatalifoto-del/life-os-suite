import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { NotebookPen, Heart, RefreshCcw } from "lucide-react";
import { Card, SectionTitle, Bar, Pill, CheckRow, Input, Button } from "@/components/os";
import { useStore, uid, today } from "@/lib/os-store";

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

function Journal() {
  const { state, set, celebrate } = useStore();
  const [form, setForm] = React.useState({
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

  const upd = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    set((s) => ({
      ...s,
      journal: [
        {
          id: uid(),
          date: today(),
          mood: form.mood,
          lookingForward: [form.f1, form.f2, form.f3].filter(Boolean),
          topPriority: form.priority,
          wins: [form.w1, form.w2, form.w3].filter(Boolean),
          lesson: form.lesson,
          gratitude: form.gratitude,
        },
        ...s.journal,
      ],
    }));
    celebrate("Zápis uložen do archivu ✍️");
    setForm({ mood: 4, f1: "", f2: "", f3: "", priority: "", w1: "", w2: "", w3: "", lesson: "", gratitude: "" });
  };

  const toggleReset = (id: string) =>
    set((s) => {
      const next = s.reset.map((r) => (r.id === id ? { ...r, done: !r.done } : r));
      if (next.every((r) => r.done)) celebrate("Týdenní reset dokončen! Čistý start 🚀");
      return { ...s, reset: next };
    });

  const resetAll = () => set((s) => ({ ...s, reset: s.reset.map((r) => ({ ...r, done: false })) }));

  const groups = Array.from(new Set(state.reset.map((r) => r.group)));
  const resetDone = state.reset.filter((r) => r.done).length;
  const moodAvg = (state.journal.reduce((a, j) => a + j.mood, 0) / Math.max(1, state.journal.length)).toFixed(1);

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
        <Card>
          <SectionTitle title="Dnešní zápis" subtitle="Ranní záměr i večerní reflexe" />
          <form onSubmit={save} className="space-y-4">
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
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                3 věci, na které se těším
              </div>
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
              <Input value={form.lesson} onChange={(e) => upd("lesson", e.target.value)} placeholder="Co jsem se dnes naučil?" />
            </div>

            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Vděčnost</div>
              <Input value={form.gratitude} onChange={(e) => upd("gratitude", e.target.value)} placeholder="Za co jsem vděčný?" />
            </div>

            <Button type="submit">Uložit zápis</Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle
              title="Týdenní reset"
              subtitle={`${resetDone}/${state.reset.length} kroků hotovo`}
              right={
                <Button variant="ghost" className="px-2 py-1 text-xs" onClick={resetAll}>
                  <RefreshCcw className="size-3.5" /> Vynulovat
                </Button>
              }
            />
            <Bar value={(resetDone / state.reset.length) * 100} />
            <div className="mt-3 space-y-3">
              {groups.map((g) => (
                <div key={g}>
                  <div className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g}</div>
                  {state.reset
                    .filter((r) => r.group === g)
                    .map((r) => (
                      <CheckRow key={r.id} checked={r.done} onToggle={() => toggleReset(r.id)} label={r.label} />
                    ))}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle title="Týdenní review" subtitle="Co fungovalo, co zlepšit" />
            <div className="space-y-3">
              {state.reviews.map((r) => (
                <div key={r.id} className="rounded-xl bg-muted/60 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold">Týden {r.week}</span>
                    <Pill tone={r.score >= 80 ? "success" : "danger"}>{r.score} %</Pill>
                  </div>
                  <p className="mt-1 text-muted-foreground">✅ {r.worked}</p>
                  <p className="text-muted-foreground">🔧 {r.improve}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <SectionTitle title="Archiv zápisů" subtitle="Historie dnů, vítězství a vděčnosti" right={<Heart className="size-5 text-primary" />} />
        <div className="grid gap-3 md:grid-cols-2">
          {state.journal.map((j) => (
            <div key={j.id} className="rounded-xl border border-border p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold">{j.date}</span>
                <span className="text-xl">{MOODS[j.mood - 1]}</span>
              </div>
              <p className="mt-2 text-muted-foreground">
                <strong className="text-foreground">Priorita:</strong> {j.topPriority}
              </p>
              <ul className="mt-1 text-muted-foreground">
                {j.wins.map((w) => (
                  <li key={w}>🏅 {w}</li>
                ))}
              </ul>
              <p className="mt-1 text-muted-foreground">
                <strong className="text-foreground">Ponaučení:</strong> {j.lesson}
              </p>
              <p className="mt-1 text-muted-foreground">🙏 {j.gratitude}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
