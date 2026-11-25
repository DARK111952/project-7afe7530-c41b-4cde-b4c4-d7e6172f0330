import { createFileRoute, Outlet, redirect, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar, TopBar } from "@/components/finance/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  // The session lives in browser storage, so the gate runs only in the browser.
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    return { user: { id: data.user.id, email: data.user.email ?? "" } };
  },
  pendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Завантаження…
    </div>
  ),
  errorComponent: LoadError,
  component: AppShell,
});

function AppShell() {
  const { user } = Route.useRouteContext();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar email={user.email} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}

function LoadError({ error }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "Щось пішло не так"}
      </p>
      <Button className="rounded-full" onClick={() => void router.invalidate()}>
        Спробувати ще
      </Button>
    </div>
  );
}
