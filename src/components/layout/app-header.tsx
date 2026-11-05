import { LogOut, User } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EquilibraBrand } from "@/components/ui/equilibra-brand";
import { NotificationsCenter } from "@/components/notifications/notifications-center";
import { ThemeToggle } from "./theme-toggle";

function getInitials(name?: string) {
  if (!name) return "EQ";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const second = parts[1]?.charAt(0) ?? "";
  if (first && second) return `${first}${second}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "EQ";
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info("Has cerrado sesión.");
    navigate({ to: "/login", replace: true });
  };

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-5 sm:py-7">
      <div className="flex min-w-0 items-center">
        <EquilibraBrand />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <NotificationsCenter role={user?.role || "estudiante"} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Menú de usuario"
            >
              <Avatar className="size-11 border-2 border-card shadow-soft">
                <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl">
            <DropdownMenuLabel className="space-y-1 p-2">
              <p className="truncate text-sm font-bold text-foreground">
                {user?.name || "Usuario"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              <div className="pt-1">
                <Badge
                  variant="outline"
                  className="rounded-lg border-accent/40 bg-accent/10 text-[10px] font-semibold text-accent capitalize"
                >
                  {user?.role === "psicologo" ? "Psicólogo/a" : "Estudiante"}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.role === "estudiante" && (
              <DropdownMenuItem
                onClick={() => navigate({ to: "/perfil" })}
                className="cursor-pointer gap-2 rounded-xl text-xs font-semibold text-foreground focus:bg-accent/10 focus:text-accent"
              >
                <User className="size-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer gap-2 rounded-xl text-xs font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="size-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
