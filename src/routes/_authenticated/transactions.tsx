import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { uk } from "date-fns/locale";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionRow } from "@/components/finance/TransactionRow";
import {
  transactionsQuery,
  useDeleteTransaction,
  useRestoreTransaction,
  useTransactions,
  useUpdateTransaction,
} from "@/lib/finance-store";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/finance/TransactionForm";
import {
  categoryOptions,
  filterTransactions,
  formatMoney,
  formatSigned,
  getCategory,
  sortByDateDesc,
  summarize,
  type Transaction,
  type TypeFilter,
} from "@/lib/finance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/transactions")({
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
  loader: ({ context }) => context.queryClient.ensureQueryData(transactionsQuery),
  component: TransactionsPage,
});

const FILTERS: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "Усі" },
  { id: "income", label: "Доходи" },
  { id: "expense", label: "Витрати" },
];

function TransactionsPage() {
  const { transactions, ready } = useTransactions();
  const [type, setType] = useState<TypeFilter>("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const remove = useDeleteTransaction();
  const restore = useRestoreTransaction();
  const update = useUpdateTransaction();

  const visible = useMemo(
    () => sortByDateDesc(filterTransactions(transactions, { type, category, query })),
    [transactions, type, category, query],
  );

  const totals = useMemo(() => summarize(visible), [visible]);
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of visible) map.set(t.date, [...(map.get(t.date) ?? []), t]);
    return [...map.entries()];
  }, [visible]);

  const filtersActive = type !== "all" || category !== "all" || query.trim() !== "";

  const resetFilters = () => {
    setType("all");
    setCategory("all");
    setQuery("");
  };

  const pickType = (next: TypeFilter) => {
    setType(next);
    setCategory("all");
  };

  const confirmDelete = async () => {
    if (!pending) return;
    const removed = pending;
    setPending(null);
    try {
      await remove.mutateAsync(removed.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не вдалося видалити");
      return;
    }
    toast("Транзакцію видалено", {
      action: {
        label: "Повернути",
        onClick: () =>
          restore.mutate(removed, {
            onError: (e) => toast.error(e.message),
          }),
      },
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex rounded-full bg-muted p-1 text-sm">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => pickType(f.id)}
              aria-pressed={type === f.id}
              className={cn(
                "flex-1 rounded-full px-4 py-1.5 font-medium text-muted-foreground transition-colors sm:flex-none",
                type === f.id && "bg-background text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger
            aria-label="Категорія"
            className="h-10 w-full rounded-full sm:w-56 lg:ml-auto lg:w-48"
          >
            <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
            <SelectValue placeholder="Усі категорії" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Усі категорії</SelectItem>
            {categoryOptions(type).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative sm:w-72 lg:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук за описом"
            aria-label="Пошук за описом"
            className="h-10 rounded-full pl-9 pr-9"
          />
          {query !== "" && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Очистити пошук"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
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
          <div className="space-y-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {transactions.length === 0
                ? "Транзакцій ще немає"
                : "Нічого не знайдено за цими фільтрами"}
            </p>
            {filtersActive && transactions.length > 0 && (
              <Button variant="outline" onClick={resetFilters} className="rounded-full">
                Скинути фільтри
              </Button>
            )}
          </div>
        ) : (
          groups.map(([date, items]) => (
            <div key={date} className="py-2">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {format(parseISO(date), "d MMMM, EEEE", { locale: uk })}
              </p>
              <ul>
                {items.map((t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    onDelete={setPending}
                    onEdit={setEditing}
                    showDate={false}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Редагувати транзакцію</DialogTitle>
            <DialogDescription>Змініть потрібні поля й збережіть.</DialogDescription>
          </DialogHeader>
          {editing && (
            <TransactionForm
              key={editing.id}
              initial={editing}
              submitLabel="Зберегти зміни"
              onCancel={() => setEditing(null)}
              onSubmit={async (d) => {
                try {
                  await update.mutateAsync({ id: editing.id, ...d });
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Не вдалося зберегти");
                  return;
                }
                setEditing(null);
                toast.success("Зміни збережено");
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити транзакцію?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending && (
                <>
                  «{pending.description || getCategory(pending.category).label}» ·{" "}
                  {formatSigned(pending)} ·{" "}
                  {format(parseISO(pending.date), "d MMMM yyyy", { locale: uk })}. Цю дію можна
                  скасувати відразу після видалення.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
