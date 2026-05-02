import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  MessageSquare as Notification,
  Warehouse,
  AlertTriangle,
  Map,
  LogOut,
  Settings,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import logo from '@/assets/fra-cbu-logo.png';
export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") return true;
    if (path !== "/dashboard" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/farmers", label: "Farmer Management", icon: Users },
    { path: "/dashboard/transport", label: "Send Request to Farmers", icon: Notification },
    { path: "/dashboard/shed", label: "Shed Procurement", icon: Warehouse },
    { path: "/dashboard/fraud", label: "Fraud Detection", icon: AlertTriangle },
    { path: "/dashboard/map", label: "Logistics Map", icon: Map },
    { path: "/dashboard/agents", label: "Agents", icon: UserCheck },
    { path: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-72 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border/30 px-6 py-6 overflow-y-auto">
        <div className="pb-6 border-b border-sidebar-border/30">
          <div className="w-11 h-11 rounded-xl bg-sidebar-accent/15 border border-sidebar-border/40 text-sidebar-foreground/35 grid place-items-center text-s font-semibold">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <p className="mt-5 text-[9px] tracking-[0.28em] uppercase text-sidebar-foreground/60">
            COPPERBELT FRA
          </p>
          <h1 className="mt-1 text-s font-semibold leading-tight text-sidebar-foreground">
            Admin Console
          </h1>
        </div>

        <nav className="flex-1 pt-6 space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3 rounded-2xl border px-4 py-4 transition-colors ${
                isActive(item.path)
                  ? "border-sidebar-border bg-sidebar-accent/25 text-sidebar-accent-foreground"
                  : "border-sidebar-border/40 bg-sidebar-accent/5 text-sidebar-foreground/80 hover:border-sidebar-border/70 hover:bg-sidebar-accent/15 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 text-sidebar-ring" />
              <span className="flex-1 text-[0.85rem] font-medium">{item.label}</span>
              <span
                className={`w-2.5 h-2.5 rounded-full transition-opacity ${
                  isActive(item.path)
                    ? "bg-sidebar-ring opacity-100"
                    : "bg-sidebar-ring/80 opacity-70 group-hover:opacity-100"
                }`}
              />
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-sidebar-border/30">
          {user && (
            <div className="mb-4 px-5 py-4 rounded-2xl border border-sidebar-border/40 bg-sidebar-accent/10">
              <p className="text-xs tracking-[0.22em] uppercase text-sidebar-foreground/65">
                Signed in
              </p>
              <p className="mt-2 text-sm font-medium text-sidebar-foreground">
                {user.name}
              </p>
              <p className="mt-1 text-xs text-sidebar-foreground/65">
                {user.role}
              </p>
            </div>
          )}
          <div className="px-5 py-6 rounded-3xl border border-sidebar-border/40 bg-sidebar-accent/10">
            <p className="text-xs tracking-[0.26em] uppercase text-sidebar-foreground/65">
              System Status
            </p>
            <p className="mt-3 text-[0.5rem] leading-tight text-sidebar-foreground">
              All services operational
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sidebar-ring text-[1.02rem]">
              <span className="w-2.5 h-2.5 rounded-full bg-sidebar-ring" />
              Real-time sync
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl border border-sidebar-border/50 px-4 py-3 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent/15 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
         
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
