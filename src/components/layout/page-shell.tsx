import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { AuroraBackground } from "@/components/effects/aurora-background";
import { Button } from "@/components/ui/button";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { EquilibraFooter } from "./equilibra-footer";

interface PageShellProps {
  children: ReactNode;
  showAppHeader?: boolean;
  showBottomNav?: boolean;
  showFooter?: boolean;
}

export function PageShell({
  children,
  showAppHeader = true,
  showBottomNav = true,
  showFooter = true,
}: PageShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info("Has cerrado sesión.");
    navigate({ to: "/login", replace: true });
  };

  return (
    <AuroraBackground>
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-40 sm:px-7 sm:pb-44 lg:px-10 lg:pb-40">
        {showAppHeader ? (
          <AppHeader />
        ) : user ? (
          <div className="flex justify-end pt-4 pb-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 rounded-xl border-border/70 bg-card/80 text-xs font-medium text-muted-foreground shadow-sm transition-all hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              title="Cerrar sesión activa"
            >
              <LogOut className="size-3.5" />
              <span>Cerrar sesión</span>
            </Button>
          </div>
        ) : null}
        <main className="flex-1">{children}</main>
        {showFooter && <EquilibraFooter />}
      </div>
      {showBottomNav && <BottomNav />}
    </AuroraBackground>
  );
}
