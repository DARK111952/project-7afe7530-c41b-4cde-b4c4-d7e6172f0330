import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { Transaction } from "./finance";

/** Everything the user edits; id, owner and created time are set by the database. */
export type TransactionDraft = Omit<Transaction, "id" | "createdAt">;

type Row = Tables<"transactions">;
const PAGE = 1000;

function fromRow(r: Row): Transaction {
  return {
    id: r.id,
    type: r.type === "income" ? "income" : "expense",
    amount: Number(r.amount),
    category: r.category,
    date: r.date,
    description: r.description,
    createdAt: Date.parse(r.created_at),
  };
}

async function fetchAll(): Promise<Transaction[]> {
  const all: Transaction[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw new Error("Не вдалося завантажити транзакції");
    all.push(...data.map(fromRow));
    if (data.length < PAGE) return all;
  }
}

/** RLS limits rows to the signed-in user; the cache is cleared on sign-out. */
export const transactionsQuery = queryOptions({
  queryKey: ["transactions"],
  queryFn: fetchAll,
});

export function useTransactions() {
  const { data } = useSuspenseQuery(transactionsQuery);
  return { transactions: data, ready: true };
}

function useTxMutation<V>(fn: (v: V) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => qc.invalidateQueries({ queryKey: transactionsQuery.queryKey }),
  });
}

export function useAddTransaction() {
  return useTxMutation(async (d: TransactionDraft) => {
    const { error } = await supabase.from("transactions").insert(d);
    if (error) throw new Error("Не вдалося зберегти транзакцію");
  });
}

export function useUpdateTransaction() {
  return useTxMutation(async ({ id, ...d }: TransactionDraft & { id: string }) => {
    const { error } = await supabase.from("transactions").update(d).eq("id", id);
    if (error) throw new Error("Не вдалося зберегти зміни");
  });
}

export function useDeleteTransaction() {
  return useTxMutation(async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw new Error("Не вдалося видалити транзакцію");
  });
}

/** Puts a just-deleted transaction back with its original id and time. */
export function useRestoreTransaction() {
  return useTxMutation(async (t: Transaction) => {
    const { error } = await supabase.from("transactions").insert({
      id: t.id,
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date,
      description: t.description,
      created_at: new Date(t.createdAt).toISOString(),
    });
    if (error) throw new Error("Не вдалося повернути транзакцію");
  });
}
