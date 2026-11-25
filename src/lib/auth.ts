/** Keeps only same-site paths so a sign-in link can't send users to another site. */
export function safeRedirect(value: unknown): string | undefined {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : undefined;
}

export function validateAuthSearch(search: Record<string, unknown>): { redirect?: string } {
  const redirect = safeRedirect(search["redirect"]);
  return redirect ? { redirect } : {};
}

/** Turns sign-in errors into plain Ukrainian. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Неправильний email або пароль";
  if (m.includes("email not confirmed")) return "Спочатку підтвердьте email: перейдіть за посиланням з листа";
  if (m.includes("already registered") || m.includes("already exists")) return "Цей email уже зареєстровано. Увійдіть";
  if (m.includes("password") && (m.includes("weak") || m.includes("at least") || m.includes("short")))
    return "Пароль надто простий. Використайте щонайменше 6 символів";
  if (m.includes("rate limit") || m.includes("too many")) return "Забагато спроб. Зачекайте хвилину й спробуйте ще";
  if (m.includes("invalid") && m.includes("email")) return "Перевірте адресу email";
  return "Не вдалося виконати дію. Спробуйте ще раз";
}
