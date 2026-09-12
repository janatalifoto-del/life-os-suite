import * as React from "react";

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

const seed: State = {
  rituals: [
    { id: uid(), title: "Sklenice vody + protažení", part: "rano", done: true, streak: 23 },
    { id: uid(), title: "10 minut meditace", part: "rano", done: true, streak: 14 },
    { id: uid(), title: "Ranní záměr do deníku", part: "rano", done: false, streak: 9 },
    { id: uid(), title: "Deep work blok 90 minut", part: "rano", done: false, streak: 6 },
    { id: uid(), title: "Procházka 30 minut", part: "vecer", done: false, streak: 11 },
    { id: uid(), title: "Večerní reflexe – 3 vítězství", part: "vecer", done: false, streak: 18 },
    { id: uid(), title: "Žádné obrazovky po 22:00", part: "vecer", done: false, streak: 4 },
  ],
  tasks: [
    { id: uid(), title: "Dokončit nabídku pro klienta Nova", done: false, priority: "urgentni-dulezite", due: d(0), pillar: "Byznys", project: "Nova – web" },
    { id: uid(), title: "Natočit 2 videa na YouTube", done: false, priority: "neurgentni-dulezite", due: d(2), pillar: "Byznys" },
    { id: uid(), title: "Rezervovat trenéra na říjen", done: false, priority: "neurgentni-dulezite", due: d(4), pillar: "Zdraví" },
    { id: uid(), title: "Odpovědět na e-maily", done: true, priority: "urgentni-nedulezite", due: d(0), pillar: "Byznys" },
    { id: uid(), title: "Projít newslettery", done: false, priority: "neurgentni-nedulezite", pillar: "Seberozvoj" },
    { id: uid(), title: "Naplánovat víkend s rodinou", done: false, priority: "neurgentni-dulezite", due: d(3), pillar: "Vztahy" },
    { id: uid(), title: "Refinancovat kreditku", done: false, priority: "urgentni-dulezite", due: d(1), pillar: "Finance" },
  ],
  goal: {
    title: "Spustit produkt a udělat 450 000 Kč obratu za 12 týdnů",
    why: "Finanční svoboda a čas na rodinu bez kompromisu ve zdraví.",
    milestones: [
      { id: uid(), title: "Validace nápadu s 20 zákazníky", done: true },
      { id: uid(), title: "MVP hotové a otestované", done: true },
      { id: uid(), title: "Landing page + platební brána", done: true },
      { id: uid(), title: "Prvních 50 platících uživatelů", done: false },
      { id: uid(), title: "Partnerství se 3 tvůrci", done: false },
      { id: uid(), title: "Obrat 450 000 Kč", done: false },
    ],
    weeks: [
      { week: 1, planned: 14, done: 13 },
      { week: 2, planned: 14, done: 12 },
      { week: 3, planned: 15, done: 15 },
      { week: 4, planned: 15, done: 11 },
      { week: 5, planned: 16, done: 14 },
      { week: 6, planned: 16, done: 15 },
      { week: 7, planned: 16, done: 9 },
      { week: 8, planned: 16, done: 0 },
      { week: 9, planned: 16, done: 0 },
      { week: 10, planned: 16, done: 0 },
      { week: 11, planned: 16, done: 0 },
      { week: 12, planned: 16, done: 0 },
    ],
  },
  pillars: [
    {
      id: uid(),
      name: "Zdraví & Tělo",
      emoji: "\u{1F9D8}",
      satisfaction: 7,
      note: "Kondice, spánek 7,5 h, bílkoviny v každém jídle.",
      habits: [
        { id: uid(), title: "3× silový trénink týdně", done: true },
        { id: uid(), title: "10 000 kroků denně", done: false },
        { id: uid(), title: "Spánek do 22:30", done: false },
      ],
      projects: ["Půlmaraton na jaře"],
    },
    {
      id: uid(),
      name: "Kariéra & Byznys",
      emoji: "\u{1F680}",
      satisfaction: 8,
      note: "Produkt v betě, dva klienti na retaineru.",
      habits: [
        { id: uid(), title: "Deep work blok 90 minut", done: true },
        { id: uid(), title: "Denně 1 prodejní aktivita", done: false },
      ],
      projects: ["Nova – web a brand", "Spuštění produktu v2"],
    },
    {
      id: uid(),
      name: "Osobní růst & Mindset",
      emoji: "\u{1F4DA}",
      satisfaction: 8,
      note: "2 knihy měsíčně, kurz vyjednávání, výpisky do Druhé hlavy.",
      habits: [
        { id: uid(), title: "20 stran denně", done: true },
        { id: uid(), title: "Ranní meditace", done: true },
      ],
      projects: ["Kurz vyjednávání"],
    },
    {
      id: uid(),
      name: "Vztahy & Rodina",
      emoji: "\u{2764}\u{FE0F}",
      satisfaction: 6,
      note: "Páteční večery bez telefonu, měsíčně výlet.",
      habits: [
        { id: uid(), title: "Večer bez mobilu s rodinou", done: false },
        { id: uid(), title: "Zavolat rodičům (týdně)", done: true },
      ],
      projects: ["Víkend s rodinou"],
    },
    {
      id: uid(),
      name: "Finance & Majetek",
      emoji: "\u{1F4B0}",
      satisfaction: 5,
      note: "Splatit kreditku, rezerva na 6 měsíců, pravidelné investice.",
      habits: [
        { id: uid(), title: "Týdenní revize výdajů", done: false },
        { id: uid(), title: "Automatická investice", done: true },
      ],
      projects: ["Splacení kreditky", "Investice ETF"],
    },
    {
      id: uid(),
      name: "Domov & Prostředí",
      emoji: "\u{1F3E1}",
      satisfaction: 6,
      note: "Uklizený stůl = uklizená hlava. Údržba jednou měsíčně.",
      habits: [
        { id: uid(), title: "15 minut úklidu denně", done: false },
        { id: uid(), title: "Neděle: reset pracovny", done: false },
      ],
      projects: ["Rekonstrukce pracovny"],
    },
    {
      id: uid(),
      name: "Relaxace & Zážitky",
      emoji: "\u{1F30D}",
      satisfaction: 7,
      note: "Jeden zážitek měsíčně, koníčky bez výkonu.",
      habits: [
        { id: uid(), title: "Digitální detox v neděli", done: false },
        { id: uid(), title: "Týdně hodina na koníček", done: true },
      ],
      projects: ["Dovolená Japonsko"],
    },
  ],
  quarters: [
    { id: uid(), name: "Q1 – Základy", priorities: ["Denní rituály na 90 %", "Rezerva 100 000 Kč", "Beta produktu"] },
    { id: uid(), name: "Q2 – Růst", priorities: ["450 000 Kč obratu", "Splacená kreditka", "Půlmaraton"] },
    { id: uid(), name: "Q3 – Systém", priorities: ["První zaměstnanec", "Automatizace onboardingu", "Rodinná dovolená"] },
    { id: uid(), name: "Q4 – Konsolidace", priorities: ["Roční review", "Investiční plán", "Digitální detox týden"] },
  ],
  events: [
    { id: uid(), title: "Deep work: produkt", date: d(0), start: "08:00", end: "10:00", kind: "blok", link: "Nova – web" },
    { id: uid(), title: "Call s investorem", date: d(0), start: "11:00", end: "11:45", kind: "schuzka" },
    { id: uid(), title: "Posilovna", date: d(0), start: "17:30", end: "18:45", kind: "osobni" },
    { id: uid(), title: "Deadline: nabídka Nova", date: d(1), start: "12:00", end: "12:30", kind: "deadline" },
    { id: uid(), title: "Týdenní review", date: d(2), start: "19:00", end: "20:00", kind: "blok" },
    { id: uid(), title: "Oběd s Terkou", date: d(3), start: "12:30", end: "14:00", kind: "osobni" },
    { id: uid(), title: "Workshop vyjednávání", date: d(5), start: "09:00", end: "16:00", kind: "schuzka" },
  ],
  accounts: [
    { id: uid(), name: "Běžný účet ČS", kind: "bezny", balance: 84300 },
    { id: uid(), name: "Spořicí – rezerva", kind: "sporici", balance: 152000 },
    { id: uid(), name: "Kreditka Visa", kind: "kreditka", balance: -38400 },
    { id: uid(), name: "Hotovost", kind: "hotovost", balance: 6200 },
  ],
  txs: [
    { id: uid(), title: "Fakturace – klient Nova", amount: 96000, date: d(-2), category: "Příjem", fixed: false, recurring: false },
    { id: uid(), title: "Předplatné produktu", amount: 24500, date: d(-6), category: "Příjem", fixed: false, recurring: true },
    { id: uid(), title: "Nájem", amount: -21000, date: d(-8), category: "Bydlení", fixed: true, recurring: true },
    { id: uid(), title: "Energie", amount: -4300, date: d(-8), category: "Bydlení", fixed: true, recurring: true },
    { id: uid(), title: "Potraviny", amount: -8600, date: d(-4), category: "Jídlo", fixed: false, recurring: true },
    { id: uid(), title: "Software a nástroje", amount: -3200, date: d(-5), category: "Byznys", fixed: true, recurring: true },
    { id: uid(), title: "Servis auta (nečekané)", amount: -12400, date: d(-3), category: "Náhodné", fixed: false, recurring: false },
    { id: uid(), title: "Restaurace a kavárny", amount: -2900, date: d(-1), category: "Volný čas", fixed: false, recurring: false },
    { id: uid(), title: "Splátka kreditky", amount: -6000, date: d(-7), category: "Dluhy", fixed: true, recurring: true },
  ],
  debts: [
    { id: uid(), name: "Kreditka Visa", total: 58000, paid: 19600, rate: 21.9, minPayment: 3000 },
    { id: uid(), name: "Půjčka na auto", total: 180000, paid: 96000, rate: 7.4, minPayment: 4800 },
    { id: uid(), name: "Splátka notebooku", total: 42000, paid: 35000, rate: 0, minPayment: 1750 },
  ],
  envelopes: [
    { id: uid(), name: "Nouzová rezerva (6 měsíců)", target: 300000, saved: 152000, emoji: "🛟" },
    { id: uid(), name: "Dovolená Japonsko", target: 90000, saved: 41000, emoji: "🗾" },
    { id: uid(), name: "Nový notebook", target: 60000, saved: 18000, emoji: "💻" },
    { id: uid(), name: "Investice ETF", target: 240000, saved: 108000, emoji: "📈" },
  ],
  para: [
    { id: uid(), title: "Nova – web a brand", type: "projekt", domain: "Byznys", note: "Redesign, copy a spuštění do 3 týdnů.", progress: 65, tags: ["klient", "deadline"] },
    { id: uid(), title: "Spuštění produktu v2", type: "projekt", domain: "Byznys", note: "Onboarding, platby, e-maily.", progress: 40, tags: ["produkt"] },
    { id: uid(), title: "Půlmaraton na jaře", type: "projekt", domain: "Zdraví", note: "16týdenní tréninkový plán.", progress: 25, tags: ["běh"] },
    { id: uid(), title: "Zdraví a kondice", type: "oblast", domain: "Zdraví", note: "Trénink, spánek, strava – dlouhodobý standard.", tags: ["standard"] },
    { id: uid(), title: "Finance domácnosti", type: "oblast", domain: "Finance", note: "Rozpočet, rezerva, investice.", tags: ["rozpočet"] },
    { id: uid(), title: "Vztahy a rodina", type: "oblast", domain: "Vztahy", note: "Pravidelné rituály a kvalitní čas.", tags: ["rodina"] },
    { id: uid(), title: "Poznámky: 12 Week Year", type: "zdroj", domain: "Seberozvoj", note: "Kvartál = rok. Týdenní scorecard nad 85 %.", tags: ["kniha"] },
    { id: uid(), title: "Swipe file – landing pages", type: "zdroj", domain: "Byznys", note: "Sbírka copy a layoutů, které fungují.", tags: ["inspirace"] },
    { id: uid(), title: "Recepty s vysokým obsahem bílkovin", type: "zdroj", domain: "Zdraví", note: "12 jídel do 20 minut.", tags: ["strava"] },
    { id: uid(), title: "Projekt: e-shop 2024", type: "archiv", domain: "Byznys", note: "Uzavřeno, ponaučení v týdenním review.", tags: ["hotovo"] },
  ],
  journal: [
    {
      id: uid(),
      date: d(-1),
      mood: 4,
      lookingForward: ["Ranní běh", "Call s investorem", "Večeře s Terkou"],
      topPriority: "Dokončit nabídku pro Nova",
      wins: ["Odeslal jsem nabídku", "Trénink odmakaný", "Žádný scrolling do 12:00"],
      lesson: "Když si blok naplánuju večer předem, ráno neztrácím čas.",
      gratitude: "Za zdraví a klidné ráno.",
    },
    {
      id: uid(),
      date: d(-2),
      mood: 3,
      lookingForward: ["Deep work", "Nová kniha", "Sauna"],
      topPriority: "MVP onboarding",
      wins: ["Opravil jsem 3 bugy", "Uvařil doma", "Šel spát v 22:30"],
      lesson: "Odpoledne mám nižší energii – náročné úkoly patří do rána.",
      gratitude: "Za tým, který táhne za jeden provaz.",
    },
  ],
  reviews: [
    { id: uid(), week: 6, worked: "Ranní bloky bez telefonu, rychlý feedback od uživatelů.", improve: "Méně schůzek ve středu, víc času na produkt.", score: 88 },
    { id: uid(), week: 7, worked: "Dva nové platící zákazníci.", improve: "Večerní rutina se rozpadla, vracím procházku.", score: 61 },
  ],
  reset: [
    { id: uid(), label: "Vyprázdnit inbox na nulu", group: "Inbox zero", done: false },
    { id: uid(), label: "Zatřídit poznámky do PARA", group: "Inbox zero", done: false },
    { id: uid(), label: "Vyhodnotit týdenní scorecard", group: "12týdenní cíl", done: false },
    { id: uid(), label: "Zkontrolovat milníky a posun k 100 %", group: "12týdenní cíl", done: false },
    { id: uid(), label: "Projít transakce za uplynulý týden", group: "Finance", done: false },
    { id: uid(), label: "Aktualizovat obálky a splátky dluhů", group: "Finance", done: false },
    { id: uid(), label: "Vybrat 3 priority na další týden", group: "Plán týdne", done: false },
    { id: uid(), label: "Naplánovat časové bloky do kalendáře", group: "Plán týdne", done: false },
    { id: uid(), label: "Zkontrolovat spokojenost v 7 oblastech", group: "Plán týdne", done: false },
  ],
  inbox: [
    { id: uid(), text: "Nápad: newsletter o produktivitě po česku", kind: "Nápad", at: d(-1) },
    { id: uid(), text: "Vděčnost: skvělá káva a klid v parku", kind: "Vděčnost", at: d(-1) },
  ],
};

/* ---------------- Context ---------------- */

type Ctx = {
  state: State;
  set: React.Dispatch<React.SetStateAction<State>>;
  celebrate: (msg: string) => void;
  celebration: string | null;
};

const StoreContext = React.createContext<Ctx | null>(null);
const KEY = "zivot-os-v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, set] = React.useState<State>(seed);
  const [celebration, setCelebration] = React.useState<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) set(JSON.parse(raw) as State);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const celebrate = React.useCallback((msg: string) => {
    setCelebration(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCelebration(null), 2200);
  }, []);

  return (
    <StoreContext.Provider value={{ state, set, celebrate, celebration }}>{children}</StoreContext.Provider>
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
