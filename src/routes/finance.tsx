import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Wallet, TrendingUp, CreditCard, PiggyBank, Plus } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, SectionTitle, Bar, Pill, Stat, Input, Select, Button } from "@/components/os";
import { useStore, czk, uid, today } from "@/lib/os-store";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Finanční hub | Život OS" },
      { name: "description", content: "Cashflow, účty, dluhy, spořicí obálky a rozpočty podle horizontů." },
      { property: "og:title", content: "Finanční hub | Život OS" },
      { property: "og:description", content: "Příjmy, výdaje, dluhy a obálky přehledně na jednom místě." },
    ],
  }),
  component: Finance,
});

const HORIZONS = { tyden: 7, mesic: 30, kvartal: 90, rok: 365 } as const;
type Horizon = keyof typeof HORIZONS;

function Finance() {
  const { state, set, celebrate } = useStore();
  const [horizon, setHorizon] = React.useState<Horizon>("mesic");
  const [filter, setFilter] = React.useState<"vse" | "fixni" | "variabilni" | "pravidelne">("vse");
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");

  const limit = HORIZONS[horizon];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - limit);

  const inRange = state.txs.filter((t) => new Date(t.date) >= cutoff);
  const filtered = inRange.filter((t) =>
    filter === "vse" ? true : filter === "fixni" ? t.fixed : filter === "variabilni" ? !t.fixed : t.recurring,
  );

  const income = inRange.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const expense = inRange.filter((t) => t.amount < 0).reduce((a, t) => a + t.amount, 0);
  const net = income + expense;
  const netWorth = state.accounts.reduce((a, b) => a + b.balance, 0);

  const byCategory = Object.entries(
    inRange
      .filter((t) => t.amount < 0)
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + Math.abs(t.amount);
        return acc;
      }, {}),
  ).map(([name, value]) => ({ name, value }));

  const cashflow = [...inRange]
    .sort((a, b) => a.date.localeCompare(b.date))
    .reduce<{ date: string; zustatek: number }[]>((acc, t) => {
      const prev = acc.length ? acc[acc.length - 1].zustatek : netWorth - net;
      acc.push({ date: t.date.slice(5), zustatek: prev + t.amount });
      return acc;
    }, []);

  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  const addTx = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!title.trim() || !value) return;
    set((s) => ({
      ...s,
      txs: [
        { id: uid(), title: title.trim(), amount: value, date: today(), category: value > 0 ? "Příjem" : "Ostatní", fixed: false, recurring: false },
        ...s.txs,
      ],
    }));
    celebrate("Transakce zapsána 💸");
    setTitle("");
    setAmount("");
  };

  const payDebt = (id: string, amount: number) => {
    set((s) => ({
      ...s,
      debts: s.debts.map((d) => (d.id === id ? { ...d, paid: Math.min(d.total, d.paid + amount) } : d)),
    }));
    celebrate("Splátka zaznamenána, dluh se krátí 📉");
  };

  const addToEnvelope = (id: string, amount: number) => {
    set((s) => ({
      ...s,
      envelopes: s.envelopes.map((e) => (e.id === id ? { ...e, saved: Math.min(e.target, e.saved + amount) } : e)),
    }));
    celebrate("Obálka posílena 🎯");
  };

  const snowball = [...state.debts].sort((a, b) => a.total - a.paid - (b.total - b.paid));
  const avalanche = [...state.debts].sort((a, b) => b.rate - a.rate);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Pill tone="primary">
            <Wallet className="size-3.5" /> Finance OS
          </Pill>
          <h1 className="mt-2 font-display text-3xl font-bold">Peníze pod kontrolou</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={horizon} onChange={(e) => setHorizon(e.target.value as Horizon)} aria-label="Horizont">
            <option value="tyden">Týden</option>
            <option value="mesic">Měsíc</option>
            <option value="kvartal">Kvartál / sezóna</option>
            <option value="rok">Rok</option>
          </Select>
          <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filtr">
            <option value="vse">Vše</option>
            <option value="fixni">Jen fixní</option>
            <option value="variabilni">Jen variabilní</option>
            <option value="pravidelne">Jen pravidelné</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Příjmy" value={czk(income)} tone="text-success" hint={`Za ${horizon}`} />
        <Stat label="Výdaje" value={czk(Math.abs(expense))} tone="text-destructive" hint="Fixní i variabilní" />
        <Stat label="Cashflow" value={czk(net)} tone={net >= 0 ? "text-success" : "text-destructive"} hint="Příjmy minus výdaje" />
        <Stat label="Čisté jmění" value={czk(netWorth)} hint="Součet všech účtů" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <SectionTitle title="Vývoj zůstatku" subtitle="Cashflow ve zvoleném horizontu" right={<TrendingUp className="size-5 text-primary" />} />
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflow}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={70} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }}
                  formatter={(v: number) => czk(v)}
                />
                <Area type="monotone" dataKey="zustatek" stroke="var(--chart-1)" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Struktura výdajů" subtitle="Podle kategorií" />
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }}
                  formatter={(v: number) => czk(v)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Účty, karty a pohledávky" subtitle="Aktuální zůstatky" right={<CreditCard className="size-5 text-accent" />} />
          <div className="space-y-2">
            {state.accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5 text-sm">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs capitalize text-muted-foreground">{a.kind}</div>
                </div>
                <div className={`font-display font-semibold ${a.balance < 0 ? "text-destructive" : ""}`}>
                  {czk(a.balance)}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={addTx} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nová transakce" />
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="-1200"
              type="number"
              className="sm:w-32"
              aria-label="Částka"
            />
            <Button type="submit">
              <Plus className="size-4" /> Zapsat
            </Button>
          </form>
        </Card>

        <Card>
          <SectionTitle title="Transakce" subtitle={`${filtered.length} záznamů ve výběru`} />
          <div className="max-h-[320px] space-y-1 overflow-auto pr-1">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted/60">
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.title}</div>
                  <div className="flex gap-1 pt-0.5">
                    <Pill>{t.category}</Pill>
                    <Pill tone={t.fixed ? "primary" : "muted"}>{t.fixed ? "fixní" : "variabilní"}</Pill>
                    {t.recurring && <Pill tone="accent">pravidelné</Pill>}
                  </div>
                </div>
                <div className={`shrink-0 font-display font-semibold ${t.amount > 0 ? "text-success" : ""}`}>
                  {czk(t.amount)}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground">Žádné transakce ve výběru.</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Splácení dluhů"
            subtitle={`Snowball: ${snowball[0]?.name} · Avalanche: ${avalanche[0]?.name}`}
          />
          <div className="space-y-4">
            {state.debts.map((d) => {
              const pct = Math.round((d.paid / d.total) * 100);
              return (
                <div key={d.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{d.name}</span>
                    <span className="text-muted-foreground">
                      {czk(d.paid)} / {czk(d.total)} · {d.rate} %
                    </span>
                  </div>
                  <Bar value={pct} />
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Zbývá {czk(d.total - d.paid)} · min. splátka {czk(d.minPayment)}</span>
                    <Button variant="soft" className="px-2 py-1 text-xs" onClick={() => payDebt(d.id, d.minPayment)}>
                      Zaplatit splátku
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Spořicí obálky" subtitle="Budgety na konkrétní cíle" right={<PiggyBank className="size-5 text-accent" />} />
          <div className="space-y-4">
            {state.envelopes.map((e) => {
              const pct = Math.round((e.saved / e.target) * 100);
              return (
                <div key={e.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {e.emoji} {e.name}
                    </span>
                    <span className="text-muted-foreground">{pct} %</span>
                  </div>
                  <Bar value={pct} />
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {czk(e.saved)} z {czk(e.target)}
                    </span>
                    <Button variant="soft" className="px-2 py-1 text-xs" onClick={() => addToEnvelope(e.id, 2000)}>
                      + 2 000 Kč
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
