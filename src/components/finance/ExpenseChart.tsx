import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney, type CategoryTotal } from "@/lib/finance";

export function ExpenseChart({ data, total }: { data: CategoryTotal[]; total: number }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Витрат за цей період ще немає
      </div>
    );
  }
  return (
    <div className="grid items-center gap-6 md:grid-cols-[240px_1fr]">
      <div className="relative mx-auto h-60 w-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.map((d) => ({ name: d.category.label, value: d.total, color: d.category.color }))}
              dataKey="value"
              nameKey="name"
              innerRadius={78}
              outerRadius={110}
              paddingAngle={2}
              stroke="none"
              cornerRadius={6}
            >
              {data.map((d) => (
                <Cell key={d.category.id} fill={d.category.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => formatMoney(Number(v))}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--popover-foreground)",
              }}
              itemStyle={{ color: "var(--popover-foreground)" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Усього</span>
          <span className="num font-display text-lg font-semibold">{formatMoney(total)}</span>
        </div>
      </div>
      <ul className="space-y-3">
        {data.map((d) => (
          <li key={d.category.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: d.category.color }} />
                {d.category.label}
              </span>
              <span className="num text-muted-foreground">
                <span className="font-semibold text-foreground">{formatMoney(d.total)}</span>
                {"  "}
                {Math.round(d.share * 100)}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(d.share * 100, 2)}%`, backgroundColor: d.category.color }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
