import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { TransactionForm } from "@/components/finance/TransactionForm";
import { useAddTransaction } from "@/lib/finance-store";
import { formatMoney } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/add")({
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

function AddTransactionPage() {
  const navigate = useNavigate();
  const add = useAddTransaction();
  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-3xl font-semibold">Нова транзакція</h1>
      <p className="mt-1 text-sm text-muted-foreground">Запишіть дохід чи витрату, поки не забули.</p>
      <TransactionForm
        className="panel mt-6 p-6 sm:p-8"
        submitLabel="Зберегти"
        onCancel={() => void navigate({ to: "/transactions" })}
        onSubmit={async (d) => {
          try {
            await add.mutateAsync(d);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Не вдалося зберегти");
            return;
          }
          toast.success(`${d.type === "income" ? "Дохід" : "Витрату"} ${formatMoney(d.amount)} додано`);
          void navigate({ to: "/transactions" });
        }}
      />
    </main>
  );
}
