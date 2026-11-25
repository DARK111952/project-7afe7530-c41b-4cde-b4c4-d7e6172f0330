import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthField } from "@/components/finance/AuthCard";
import { authErrorMessage, validateAuthSearch } from "@/lib/auth";

const MIN_PASSWORD = 6;

export const Route = createFileRoute("/signup")({
  ssr: false,
  validateSearch: validateAuthSearch,
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ href: search.redirect ?? "/" });
  },
  head: () => ({
    meta: [
      { title: "Реєстрація — Трекер особистих фінансів" },
      { name: "description", content: "Створіть акаунт і ведіть облік доходів і витрат." },
      { property: "og:title", content: "Реєстрація — Трекер особистих фінансів" },
      { property: "og:description", content: "Створіть акаунт і ведіть облік доходів і витрат." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const addr = email.trim();
    if (!addr) return setError("Введіть email");
    if (password.length < MIN_PASSWORD) return setError(`Пароль має містити щонайменше ${MIN_PASSWORD} символів`);
    if (password !== confirm) return setError("Паролі не збігаються");

    setBusy(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: addr,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (err) return setError(authErrorMessage(err.message));
    if (data.user && data.user.identities?.length === 0) {
      return setError("Цей email уже зареєстровано. Увійдіть");
    }
    if (data.session) {
      void navigate({ href: search.redirect ?? "/", replace: true });
      return;
    }
    setSentTo(addr);
  };

  if (sentTo) {
    return (
      <AuthCard title="Перевірте пошту" subtitle="Залишився один крок.">
        <div className="space-y-4 text-center">
          <MailCheck className="mx-auto size-10 text-primary" />
          <p className="text-sm">
            Ми надіслали лист на <span className="font-semibold">{sentTo}</span>. Перейдіть за посиланням у ньому, щоб
            підтвердити акаунт, а потім увійдіть.
          </p>
          <p className="text-xs text-muted-foreground">Не бачите листа? Перевірте папку «Спам».</p>
          <Button asChild variant="outline" className="w-full rounded-full">
            <Link to="/login" search={search}>
              До входу
            </Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Реєстрація" subtitle="Створіть акаунт, щоб ваші записи зберігались у хмарі.">
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={`Щонайменше ${MIN_PASSWORD} символів`}
        />
        <AuthField
          id="confirm"
          label="Повторіть пароль"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-expense">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy} className="h-11 w-full rounded-full font-semibold">
          {busy ? "Створюємо акаунт…" : "Зареєструватися"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Уже маєте акаунт?{" "}
        <Link to="/login" search={search} className="font-semibold text-primary hover:underline">
          Увійти
        </Link>
      </p>
    </AuthCard>
  );
}
