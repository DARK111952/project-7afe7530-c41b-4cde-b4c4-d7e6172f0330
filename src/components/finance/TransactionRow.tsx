import { format, parseISO } from "date-fns";
import { uk } from "date-fns/locale";
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSigned, getCategory, type Transaction } from "@/lib/finance";

export function TransactionRow({
  transaction,
  onDelete,
  onEdit,
  showDate = true,
}: {
  transaction: Transaction;
  onDelete?: (t: Transaction) => void;
  onEdit?: (t: Transaction) => void;
  showDate?: boolean;
}) {
  const cat = getCategory(transaction.category);
  const isIncome = transaction.type === "income";
  return (
    <li className="group flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-accent/60">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          isIncome ? "bg-income-soft text-income" : "bg-expense-soft text-expense",
        )}
      >
        {isIncome ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{transaction.description || cat.label}</p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
          {cat.label}
          {showDate && (
            <>
              <span aria-hidden>·</span>
              {format(parseISO(transaction.date), "d MMM", { locale: uk })}
            </>
          )}
        </p>
      </div>
      <span className={cn("num text-sm font-bold", isIncome ? "text-income" : "text-foreground")}>
        {formatSigned(transaction)}
      </span>
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(transaction)}
          aria-label="Редагувати транзакцію"
          className="rounded-md p-2 text-muted-foreground opacity-60 transition hover:bg-accent hover:text-foreground group-hover:opacity-100"
        >
          <Pencil className="size-4" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(transaction)}
          aria-label="Видалити транзакцію"
          className="rounded-md p-2 text-muted-foreground opacity-60 transition hover:bg-expense-soft hover:text-expense group-hover:opacity-100"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </li>
  );
}
