import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { uk } from "date-fns/locale";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionRow } from "@/components/finance/TransactionRow";
import { deleteTransaction, restoreTransaction, useTransactions } from "@/lib/finance-store";
import { formatMoney, getCategory, sortByDateDesc, summarize, type Transaction } from "@/lib/finance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Транзакції — Трекер особистих фінансів" },
      { name: "description", content: "Список усіх доходів і витрат з фільтрами та пошуком." },
      { property: "og:title", content: "Транзакції — Трекер особистих фінансів" },
      { property: "og:description", content: "Список усіх доходів і витрат з фільтрами та пошуком." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TransactionsPage,
});

type Filter = "all" | "income" | "expense";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Усі" },
  { id: "income", label: "Доходи" },
  { id: "expense", label: "Витрати" },
];

function TransactionsPage() {
  const { transactions, ready } = useTransactions();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortByDateDesc(transactions).filter(
      (t) =>
        (filter === "all" || t.type === filter) &&
        (!q ||
          t.description.toLowerCase().includes(q) ||
          getCategory(t.category).label.toLowerCase().includes(q)),
    );
  }, [transactions, filter, query]);

  const totals = useMemo(() => summarize(visible), [visible]);
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of visible) map.set(t.date, [...(map.get(t.date) ?? []), t]);
    return [...map.entries()];
  }, [visible]);

  const onDelete = (t: Transaction) => {
    deleteTransaction(t.id);
    toast("Транзакцію видалено", {
      action: { label: "Повернути", onClick: () => restoreTransaction(t) },
    });
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Транзакції</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ready ? `${visible.length} записів` : "Завантаження…"}
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/add">
            <Plus /> Нова транзакція
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Total label="Доходи" value={totals.income} className="text-income" ready={ready} />
        <Total label="Витрати" value={totals.expense} className="text-expense" ready={ready} />
        <Total
          label="Різниця"
          value={totals.balance}
          className={totals.balance < 0 ? "text-expense" : "text-foreground"}
          ready={ready}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-full bg-muted p-1 text-sm">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex-1 rounded-full px-4 py-1.5 font-medium text-muted-foreground transition-colors sm:flex-none",
                filter === f.id && "bg-background text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук за описом чи категорією"
            className="h-10 rounded-full pl-9"
          />
        </div>
      </div>

      <section className="panel p-3 sm:p-4">
        {!ready ? (
          <div className="space-y-3 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {transactions.length === 0 ? "Транзакцій ще немає" : "Нічого не знайдено"}
          </p>
        ) : (
          groups.map(([date, items]) => (
            <div key={date} className="py-2">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {format(parseISO(date), "d MMMM, EEEE", { locale: uk })}
              </p>
              <ul>
                {items.map((t) => (
                  <TransactionRow key={t.id} transaction={t} onDelete={onDelete} showDate={false} />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

function Total({
  label,
  value,
  className,
  ready,
}: {
  label: string;
  value: number;
  className: string;
  ready: boolean;
}) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      {ready ? (
        <p className={cn("num mt-1 font-display text-xl font-semibold", className)}>{formatMoney(value)}</p>
      ) : (
        <Skeleton className="mt-2 h-7 w-28" />
      )}
    </div>
  );
}
