import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, ListOrdered, LogOut, Plus, Wallet } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const items = [
  { title: "Огляд", url: "/", icon: LayoutDashboard },
  { title: "Транзакції", url: "/transactions", icon: ListOrdered },
] as const;

export function AppSidebar({ email }: { email: string }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { setOpenMobile } = useSidebar();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    setOpenMobile(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/login", replace: true });
  };
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2.5 px-1 py-2" onClick={() => setOpenMobile(false)}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="size-4" />
          </span>
          <span className="truncate text-sm font-bold group-data-[collapsible=icon]:hidden">Трекер фінансів</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={path === item.url} tooltip={item.title}>
                    <Link to={item.url} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Додати транзакцію" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground">
              <Link to="/add" onClick={() => setOpenMobile(false)}>
                <Plus />
                <span>Додати транзакцію</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <p className="truncate px-2 pt-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden" title={email}>
              {email}
            </p>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Вийти" onClick={() => void signOut()}>
              <LogOut />
              <span>Вийти</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-xl">
      <SidebarTrigger aria-label="Показати або сховати меню" />
      <span className="text-sm font-semibold md:hidden">Трекер фінансів</span>
      <Button asChild size="sm" className="ml-auto rounded-full">
        <Link to="/add" aria-label="Додати транзакцію">
          <Plus />
          <span className="hidden sm:inline">Додати</span>
        </Link>
      </Button>
    </header>
  );
}
