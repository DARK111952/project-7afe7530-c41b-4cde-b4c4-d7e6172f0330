import { z } from "zod";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  /** Amount in kopiykas (1/100 UAH), always positive. */
  amount: number;
  category: string;
  /** Local date in YYYY-MM-DD format. */
  date: string;
  description: string;
  createdAt: number;
}

export interface CategoryDef {
  id: string;
  label: string;
  color: string;
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { id: "food", label: "Їжа", color: "var(--chart-1)" },
  { id: "transport", label: "Транспорт", color: "var(--chart-3)" },
  { id: "housing", label: "Житло", color: "var(--chart-4)" },
  { id: "study", label: "Навчання", color: "var(--chart-6)" },
  { id: "fun", label: "Розваги", color: "var(--chart-5)" },
  { id: "health", label: "Здоров'я", color: "var(--chart-7)" },
  { id: "clothes", label: "Одяг", color: "var(--chart-2)" },
  { id: "mobile", label: "Зв'язок", color: "var(--chart-8)" },
  { id: "other-expense", label: "Інше", color: "var(--chart-9)" },
];

export const INCOME_CATEGORIES: CategoryDef[] = [
  { id: "scholarship", label: "Стипендія", color: "var(--chart-1)" },
  { id: "job", label: "Підробіток", color: "var(--chart-3)" },
  { id: "parents", label: "Від батьків", color: "var(--chart-4)" },
  { id: "gift", label: "Подарунок", color: "var(--chart-5)" },
  { id: "other-income", label: "Інше", color: "var(--chart-9)" },
];

export function categoriesFor(type: TransactionType): CategoryDef[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function getCategory(id: string): CategoryDef {
  return (
    [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find((c) => c.id === id) ?? {
      id,
      label: "Інше",
      color: "var(--chart-9)",
    }
  );
}

/** Parses user input like "120", "120,50" or "1 200.5" into kopiykas. Returns null if invalid or not positive. */
export function parseAmount(input: string): number | null {
  const normalized = input.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return cents > 0 ? cents : null;
}

const wholeCurrency = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  maximumFractionDigits: 0,
});
const fractionCurrency = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(cents: number): string {
  return (cents % 100 === 0 ? wholeCurrency : fractionCurrency).format(cents / 100);
}

export function formatSigned(t: Pick<Transaction, "type" | "amount">): string {
  return `${t.type === "income" ? "+" : "−"}${formatMoney(t.amount)}`;
}

export interface Summary {
  income: number;
  expense: number;
  balance: number;
}

export function summarize(transactions: Transaction[]): Summary {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

export interface CategoryTotal {
  category: CategoryDef;
  total: number;
  /** Share of all expenses, 0..1 */
  share: number;
}

export function expensesByCategory(transactions: Transaction[]): CategoryTotal[] {
  const totals = new Map<string, number>();
  let all = 0;
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    all += t.amount;
  }
  return [...totals.entries()]
    .map(([id, total]) => ({ category: getCategory(id), total, share: all ? total / all : 0 }))
    .sort((a, b) => b.total - a.total);
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type Period = "month" | "all";

export function filterByPeriod(transactions: Transaction[], period: Period, now: Date): Transaction[] {
  if (period === "all") return transactions;
  const prefix = toDateKey(now).slice(0, 7);
  return transactions.filter((t) => t.date.startsWith(prefix));
}

export function sortByDateDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) =>
    a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1,
  );
}

export type TypeFilter = "all" | TransactionType;

export interface TransactionFilter {
  /** "all" keeps both incomes and expenses. */
  type: TypeFilter;
  /** "all" keeps every category, otherwise a category id. */
  category: string;
  /** Free text matched against the transaction description. */
  query: string;
}

/** Categories offered by the filter for the chosen type. */
export function categoryOptions(type: TypeFilter): CategoryDef[] {
  if (type === "income") return INCOME_CATEGORIES;
  if (type === "expense") return EXPENSE_CATEGORIES;
  return [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
}

export function filterTransactions(transactions: Transaction[], f: TransactionFilter): Transaction[] {
  const q = f.query.trim().toLowerCase();
  return transactions.filter(
    (t) =>
      (f.type === "all" || t.type === f.type) &&
      (f.category === "all" || t.category === f.category) &&
      (!q || t.description.toLowerCase().includes(q)),
  );
}

export const transactionInputSchema = z
  .object({
    type: z.enum(["income", "expense"]),
    amount: z.string().trim().min(1, "Вкажіть суму"),
    category: z.string().min(1, "Оберіть категорію"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Вкажіть дату"),
    description: z.string().trim().max(120, "Опис до 120 символів"),
  })
  .superRefine((v, ctx) => {
    if (parseAmount(v.amount) === null) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "Сума має бути додатним числом" });
    }
    if (v.category && !categoriesFor(v.type).some((c) => c.id === v.category)) {
      ctx.addIssue({ code: "custom", path: ["category"], message: "Оберіть категорію" });
    }
  });

export type TransactionInput = z.input<typeof transactionInputSchema>;

/** Kopiykas back to the text the amount field accepts, e.g. 12050 -> "120.50". */
export function amountToInput(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}
