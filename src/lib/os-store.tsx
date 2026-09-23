import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

/* ---------------- Types ---------------- */

export type Ritual = { id: string; title: string; part: "rano" | "vecer"; done: boolean; streak: number };
export type Priority = "urgentni-dulezite" | "neurgentni-dulezite" | "urgentni-nedulezite" | "neurgentni-nedulezite";
export type Task = {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  due?: string;
  pillar?: string;
  project?: string;
};
export type Milestone = { id: string; title: string; done: boolean };
export type WeekScore = { week: number; planned: number; done: number };
export type Goal12 = { title: string; why: string; milestones: Milestone[]; weeks: WeekScore[] };
export type Pillar = {
  id: string;
  name: string;
  emoji: string;
  satisfaction: number; // 1-10
  note: string;
  habits: { id: string; title: string; done: boolean }[];
  projects: string[];
};
export type ResetStep = { id: string; label: string; group: string; done: boolean };
export type Quarter = { id: string; name: string; priorities: string[] };
export type EventItem = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start: string;
  end: string;
  kind: "schuzka" | "deadline" | "blok" | "osobni";
  link?: string;
};
export type Account = { id: string; name: string; kind: "bezny" | "sporici" | "kreditka" | "hotovost"; balance: number };
export type Tx = {
  id: string;
  title: string;
  amount: number; // + příjem, - výdaj
  date: string;
  category: string;
  fixed: boolean;
  recurring: boolean;
};
export type Debt = { id: string; name: string; total: number; paid: number; rate: number; minPayment: number };
export type Envelope = { id: string; name: string; target: number; saved: number; emoji: string };
export type ParaItem = {
  id: string;
  title: string;
  type: "projekt" | "oblast" | "zdroj" | "archiv";
  domain: string;
  note: string;
  progress?: number;
  tags: string[];
};
export type JournalEntry = {
  id: string;
  date: string;
  mood: number; // 1-5
  lookingForward: string[];
  topPriority: string;
  wins: string[];
  lesson: string;
  gratitude: string;
};
export type WeeklyReview = { id: string; week: number; worked: string; improve: string; score: number };

export type State = {
  rituals: Ritual[];
  tasks: Task[];
  goal: Goal12;
  pillars: Pillar[];
  quarters: Quarter[];
  events: EventItem[];
  accounts: Account[];
  txs: Tx[];
  debts: Debt[];
  envelopes: Envelope[];
  para: ParaItem[];
  journal: JournalEntry[];
  reviews: WeeklyReview[];
  reset: ResetStep[];
  inbox: { id: string; text: string; kind: string; at: string; area?: string; filed?: string }[];
};

/* ---------------- Helpers ---------------- */

export const uid = () => Math.random().toString(36).slice(2, 10);
const d = (offset: number) => {
  const t = new Date();
  t.setDate(t.getDate() + offset);
  return t.toISOString().slice(0, 10);
};
export const czk = (n: number) =>
  new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(n);

export const PRIORITY_LABEL: Record<Priority, string> = {
  "urgentni-dulezite": "Udělej hned",
  "neurgentni-dulezite": "Naplánuj",
  "urgentni-nedulezite": "Deleguj",
  "neurgentni-nedulezite": "Zruš",
};

/* ---------------- Seed ---------------- */
// Slouží jako výchozí obsah pro NOVÉHO uživatele (první přihlášení, kdy
// v tabulce os_state ještě neexistuje jeho řádek). Odhlášený návštěvník
// tato data už nikdy neuvidí — appka je cloud-only, viz StoreProvider níže.

const seed: State = {
  rituals: [],
  tasks: [],
  goal: { title: "", why: "", milestones: [], weeks: [] },
  pillars: [],
  quarters: [],
  events: [],
  accounts: [],
  txs: [],
  debts: [],
  envelopes: [],
  para: [],
  journal: [],
  reviews: [],
  reset: [],
  inbox: [],
};

/* ---------------- Context ---------------- */

type Ctx = {
  state: State;
  set: React.Dispatch<React.SetStateAction<State>>;
  celebrate: (msg: string) => void;
  celebration: string | null;
  syncing: boolean;
  saveError: string | null;
  loading: boolean;
  cloud: true;
};

const StoreContext = React.createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, set] = React.useState<State>(seed);
  const [celebration, setCelebration] = React.useState<string | null>(null);
  const [syncing, setSyncing] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const ready = React.useRef(false);

  // Cloud-only: appka nemá lokální fallback. Bez přihlášeného uživatele
  // zůstává `loading = true` navždy — komponenta, která StoreProvider obaluje
  // (viz router guard níže), má v tu chvíli přesměrovat na /auth místo
  // renderování children.
  React.useEffect(() => {
    ready.current = false;
    if (!userId) {
      setLoading(true);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("os_state")
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setSaveError("Nepodařilo se načíst data z účtu. Zkus obnovit stránku.");
        setLoading(false);
        return;
      }

      const remote = (data as { data?: State } | null)?.data;
      if (remote && typeof remote === "object" && Array.isArray(remote.rituals)) {
        set({ ...seed, ...remote });
      } else {
        // Nový uživatel — založ mu řádek se seed daty jako startovní obsah.
        set(seed);
        await supabase.from("os_state").upsert({ user_id: userId, data: seed as unknown as never });
      }
      ready.current = true;
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Průběžné ukládání do účtu (debounced), s viditelnou chybou při selhání.
  React.useEffect(() => {
    if (!userId || !ready.current) return;
    setSyncing(true);
    const t = setTimeout(async () => {
      const { error } = await supabase
        .from("os_state")
        .upsert({ user_id: userId, data: state as unknown as never });
      setSyncing(false);
      setSaveError(error ? "Uložení se nezdařilo — zkontroluj připojení." : null);
    }, 900);
    return () => clearTimeout(t);
  }, [state, userId]);

  const celebrate = React.useCallback((msg: string) => {
    setCelebration(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCelebration(null), 2200);
  }, []);

  return (
    <StoreContext.Provider
      value={{ state, set, celebrate, celebration, syncing, saveError, loading, cloud: true }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore musí být uvnitř StoreProvider");
  return ctx;
}

/* ---------------- Derived ---------------- */

export function useDailyScore() {
  const { state } = useStore();
  const ritualsDone = state.rituals.filter((r) => r.done).length;
  const todayTasks = state.tasks.filter((t) => t.due === d(0));
  const tasksDone = todayTasks.filter((t) => t.done).length;
  const total = state.rituals.length + todayTasks.length;
  const done = ritualsDone + tasksDone;
  return {
    ritualsDone,
    tasksDone,
    todayTasks,
    percent: total ? Math.round((done / total) * 100) : 0,
    done,
    total,
  };
}

export const today = () => d(0);
export const dayOffset = d;
