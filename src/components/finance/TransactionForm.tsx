import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  amountToInput,
  categoriesFor,
  formatMoney,
  parseAmount,
  toDateKey,
  transactionInputSchema,
  type Transaction,
  type TransactionInput,
  type TransactionType,
} from "@/lib/finance";
import type { TransactionDraft } from "@/lib/finance-store";
import { cn } from "@/lib/utils";

type Errors = Partial<Record<keyof TransactionInput, string>>;

export function TransactionForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  className,
}: {
  initial?: Transaction;
  submitLabel: string;
  onSubmit: (draft: TransactionDraft) => Promise<void>;
  onCancel: () => void;
  className?: string;
}) {
  const [form, setForm] = useState<TransactionInput>(
    initial
      ? {
          type: initial.type,
          amount: amountToInput(initial.amount),
          category: initial.category,
          date: initial.date,
          description: initial.description,
        }
      : { type: "expense", amount: "", category: "", date: toDateKey(new Date()), description: "" },
  );
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const setType = (type: TransactionType) => {
    setForm((f) => ({ ...f, type, category: "" }));
    setErrors({});
  };

  const submit = async (e: FormEvent) => {
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
    setBusy(true);
    try {
      await onSubmit({
        type: result.data.type,
        amount: parseAmount(result.data.amount) ?? 0,
        category: result.data.category,
        date: result.data.date,
        description: result.data.description,
      });
    } finally {
      setBusy(false);
    }
  };

  const isIncome = form.type === "income";
  const preview = parseAmount(form.amount);

  return (
    <form onSubmit={submit} noValidate className={cn("space-y-6", className)}>
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
        <Button type="button" variant="ghost" className="h-11 flex-1 rounded-full" onClick={onCancel}>
          Скасувати
        </Button>
        <Button type="submit" disabled={busy} className="h-11 flex-[2] rounded-full text-sm font-semibold">
          {busy ? "Збереження…" : submitLabel}
        </Button>
      </div>
    </form>
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
  children: ReactNode;
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
