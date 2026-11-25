import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthField } from "@/components/finance/AuthCard";
import { authErrorMessage, validateAuthSearch } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: validateAuthSearch,
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ href: search.redirect ?? "/" });
  },
  head: () => ({
    meta: [
      { title: "Вхід — Трекер особистих фінансів" },
      { name: "description", content: "Увійдіть, щоб бачити свої доходи й витрати." },
      { property: "og:title", content: "Вхід — Трекер особистих фінансів" },
      { property: "og:description", content: "Увійдіть, щоб бачити свої доходи й витрати." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Введіть email і пароль");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) {
      setError(authErrorMessage(err.message));
      return;
    }
    void navigate({ href: search.redirect ?? "/", replace: true });
  };

  return (
    <AuthCard title="Вхід" subtitle="Раді бачити знову! Увійдіть до свого трекера.">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <AuthField
          id="password"
          label="Пароль"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-expense">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy} className="h-11 w-full rounded-full font-semibold">
          {busy ? "Вхід…" : "Увійти"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Немає акаунта?{" "}
        <Link to="/signup" search={search} className="font-semibold text-primary hover:underline">
          Зареєструватися
        </Link>
      </p>
    </AuthCard>
  );
}
