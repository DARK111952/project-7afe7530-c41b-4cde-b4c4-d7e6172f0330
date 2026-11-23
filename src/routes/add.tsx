import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addTransaction } from "@/lib/finance-store";
import {
  categoriesFor,
  formatMoney,
  parseAmount,
  toDateKey,
  transactionInputSchema,
  type TransactionInput,
  type TransactionType,
} from "@/lib/finance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [
      { title: "Нова транзакція — Трекер особистих фінансів" },
      { name: "description", content: "Додайте дохід або витрату: сума, категорія, дата та опис." },
      { property: "og:title", content: "Нова транзакція — Трекер особистих фінансів" },
      { property: "og:description", content: "Додайте дохід або витрату: сума, категорія, дата та опис." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddTransactionPage,
});

type Errors = Partial<Record<keyof TransactionInput, string>>;

function AddTransactionPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<TransactionInput>({
    type: "expense",
    amount: "",
    category: "",
    date: toDateKey(new Date()),
    description: "",
  });
  const [errors, setErrors] = useState<Errors>({});

  const set = <K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const setType = (type: TransactionType) => {
    setForm((f) => ({ ...f, type, category: "" }));
    setErrors({});
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = transactionInputSchema.safeParse(form);
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof TransactionInput;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    const amount = parseAmount(result.data.amount) ?? 0;
    addTransaction({
      type: result.data.type,
      amount,
      category: result.data.category,
      date: result.data.date,
      description: result.data.description,
    });
    toast.success(`${result.data.type === "income" ? "Дохід" : "Витрату"} ${formatMoney(amount)} додано`);
    void navigate({ to: "/transactions" });
  };

  const isIncome = form.type === "income";
  const preview = parseAmount(form.amount);

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-3xl font-semibold">Нова транзакція</h1>
      <p className="mt-1 text-sm text-muted-foreground">Запишіть дохід чи витрату, поки не забули.</p>

      <form onSubmit={onSubmit} noValidate className="panel mt-6 space-y-6 p-6 sm:p-8">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5" role="radiogroup" aria-label="Тип">
          {(
            [
              { id: "expense", label: "Витрата", Icon: ArrowUpRight },
              { id: "income", label: "Дохід", Icon: ArrowDownLeft },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={form.type === id}
              onClick={() => setType(id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-muted-foreground transition-colors",
                form.type === id && id === "expense" && "bg-expense-soft text-expense",
                form.type === id && id === "income" && "bg-income-soft text-income",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        <Field label="Сума, ₴" htmlFor="amount" error={errors.amount}>
          <Input
            id="amount"
            inputMode="decimal"
            autoFocus
            placeholder="0"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            className={cn(
              "num h-16 rounded-xl font-display text-3xl font-semibold md:text-3xl",
              isIncome ? "text-income" : "text-expense",
            )}
          />
          {preview !== null && (
            <p className="text-xs text-muted-foreground">
              {isIncome ? "+" : "−"}
              {formatMoney(preview)}
            </p>
          )}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Категорія" htmlFor="category" error={errors.category}>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger id="category" className="h-11 rounded-xl">
                <SelectValue placeholder="Оберіть" />
              </SelectTrigger>
              <SelectContent>
                {categoriesFor(form.type).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Дата" htmlFor="date" error={errors.date}>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="h-11 rounded-xl"
            />
          </Field>
        </div>

        <Field label="Опис" htmlFor="description" error={errors.description}>
          <Textarea
            id="description"
            placeholder="Наприклад: обід у їдальні"
            value={form.description}
            maxLength={120}
            onChange={(e) => set("description", e.target.value)}
            className="min-h-20 rounded-xl"
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="h-11 flex-1 rounded-full"
            onClick={() => void navigate({ to: "/transactions" })}
          >
            Скасувати
          </Button>
          <Button type="submit" className="h-11 flex-[2] rounded-full text-sm font-semibold">
            Зберегти
          </Button>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs font-medium text-expense">{error}</p>}
    </div>
  );
}
