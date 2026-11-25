import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseChart } from "@/components/finance/ExpenseChart";
import { TransactionRow } from "@/components/finance/TransactionRow";
import { transactionsQuery, useTransactions } from "@/lib/finance-store";
import {
  expensesByCategory,
  filterByPeriod,
  formatMoney,
  sortByDateDesc,
  summarize,
  type Period,
} from "@/lib/finance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Огляд — Трекер особистих фінансів" },
      { name: "description", content: "Баланс, доходи та витрати за категоріями для студентів коледжу." },
      { property: "og:title", content: "Огляд — Трекер особистих фінансів" },
      { property: "og:description", content: "Баланс, доходи та витрати за категоріями для студентів коледжу." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(transactionsQuery),
  component: Dashboard,
});

const MONTHS = [
  "січень", "лютий", "березень", "квітень", "травень", "червень",
  "липень", "серпень", "вересень", "жовтень", "листопад", "грудень",
];

function Dashboard() {
  const { transactions, ready } = useTransactions();
  const [period, setPeriod] = useState<Period>("month");
  const now = useMemo(() => new Date(), []);

  const total = useMemo(() => summarize(transactions), [transactions]);
  const periodTx = useMemo(() => filterByPeriod(transactions, period, now), [transactions, period, now]);
  const periodSummary = useMemo(() => summarize(periodTx), [periodTx]);
  const byCategory = useMemo(() => expensesByCategory(periodTx), [periodTx]);
  const recent = useMemo(() => sortByDateDesc(transactions).slice(0, 5), [transactions]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <section className="panel bg-balance shadow-glow relative overflow-hidden p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">Загальний баланс</p>
        {ready ? (
          <h1
            className={cn(
              "num mt-2 text-4xl font-semibold sm:text-6xl",
              total.balance < 0 && "text-expense",
            )}
          >
            {formatMoney(total.balance)}
          </h1>
        ) : (
          <Skeleton className="mt-3 h-14 w-64" />
        )}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <StatCard label="Доходи за весь час" value={total.income} kind="income" ready={ready} />
          <StatCard label="Витрати за весь час" value={total.expense} kind="expense" ready={ready} />
        </div>
      </section>

      <section className="panel p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Витрати за категоріями</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {period === "month" ? `За ${MONTHS[now.getMonth()]} ${now.getFullYear()}` : "За весь час"}
              {ready && ` · доходи ${formatMoney(periodSummary.income)}`}
            </p>
          </div>
          <div className="flex rounded-full bg-muted p-1 text-sm">
            {(["month", "all"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-full px-4 py-1.5 font-medium text-muted-foreground transition-colors",
                  period === p && "bg-background text-foreground",
                )}
              >
                {p === "month" ? "Цей місяць" : "Весь час"}
              </button>
            ))}
          </div>
        </div>
        {ready ? (
          <ExpenseChart data={byCategory} total={periodSummary.expense} />
        ) : (
          <Skeleton className="h-60 w-full" />
        )}
      </section>

      <section className="panel p-4 sm:p-6">
        <div className="mb-2 flex items-center justify-between px-3">
          <h2 className="text-lg font-semibold">Останні транзакції</h2>
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Усі <ArrowRight className="size-4" />
          </Link>
        </div>
        {ready && recent.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">Тут з'являться ваші доходи та витрати</p>
            <Button asChild className="rounded-full">
              <Link to="/add">
                <Plus /> Додати першу транзакцію
              </Link>
            </Button>
          </div>
        ) : (
          <ul>
            {recent.map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  kind,
  ready,
}: {
  label: string;
  value: number;
  kind: "income" | "expense";
  ready: boolean;
}) {
  const Icon = kind === "income" ? ArrowDownLeft : ArrowUpRight;
  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-background/40 p-4">
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-full",
          kind === "income" ? "bg-income-soft text-income" : "bg-expense-soft text-expense",
        )}
      >
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {ready ? (
          <p className="num font-display text-lg font-semibold">{formatMoney(value)}</p>
        ) : (
          <Skeleton className="mt-1 h-6 w-28" />
        )}
      </div>
    </div>
  );
}
