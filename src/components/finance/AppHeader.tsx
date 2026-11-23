import { Link } from "@tanstack/react-router";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const navClass =
  "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";
const activeClass = "bg-secondary text-foreground";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="size-4" />
          </span>
          <span className="hidden font-display text-sm font-semibold leading-tight sm:block">
            Трекер фінансів
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 sm:ml-6">
          <Link to="/" className={navClass} activeProps={{ className: activeClass }} activeOptions={{ exact: true }}>
            Огляд
          </Link>
          <Link to="/transactions" className={navClass} activeProps={{ className: activeClass }}>
            Транзакції
          </Link>
        </nav>
        <Button asChild size="sm" className="rounded-full sm:ml-auto">
          <Link to="/add" aria-label="Додати транзакцію">
            <Plus />
            <span className="hidden sm:inline">Додати</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
