import { describe, expect, it } from "vitest";
import {
  expensesByCategory,
  filterByPeriod,
  parseAmount,
  summarize,
  transactionInputSchema,
  type Transaction,
} from "./finance";

const tx = (over: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(),
  type: "expense",
  amount: 100,
  category: "food",
  date: "2026-11-10",
  description: "",
  createdAt: 0,
  ...over,
});

describe("finance rules", () => {
  it("balance is total income minus total expenses", () => {
    const s = summarize([
      tx({ type: "income", amount: 200000, category: "scholarship" }),
      tx({ type: "expense", amount: 18500 }),
      tx({ type: "expense", amount: 1500 }),
    ]);
    expect(s).toEqual({ income: 200000, expense: 20000, balance: 180000 });
  });

  it("expense chart groups only expenses by category, largest first", () => {
    const data = expensesByCategory([
      tx({ category: "food", amount: 300 }),
      tx({ category: "transport", amount: 100 }),
      tx({ category: "food", amount: 100 }),
      tx({ type: "income", category: "job", amount: 99999 }),
    ]);
    expect(data.map((d) => [d.category.id, d.total, d.share])).toEqual([
      ["food", 400, 0.8],
      ["transport", 100, 0.2],
    ]);
  });

  it("'this month' keeps only transactions from the current month", () => {
    const list = [tx({ date: "2026-11-01" }), tx({ date: "2026-10-31" }), tx({ date: "2026-11-23" })];
    expect(filterByPeriod(list, "month", new Date(2026, 10, 23))).toHaveLength(2);
  });

  it("amount accepts comma decimals and rejects zero or negatives", () => {
    expect(parseAmount("120,50")).toBe(12050);
    expect(parseAmount("1 200")).toBe(120000);
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });

  it("category must belong to the chosen type", () => {
    const base = { amount: "100", date: "2026-11-23", description: "" };
    expect(transactionInputSchema.safeParse({ ...base, type: "income", category: "food" }).success).toBe(false);
    expect(transactionInputSchema.safeParse({ ...base, type: "expense", category: "food" }).success).toBe(true);
  });
});
