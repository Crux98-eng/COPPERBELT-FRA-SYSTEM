import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Users,
  Truck,
  Warehouse,
  AlertTriangle,
  Map,
  LogOut
} from "lucide-react";

export function RootLayout() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") return true;
    if (path !== "/dashboard" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/farmers", label: "Farmer Management", icon: Users },
    { path: "/dashboard/transport", label: "Transport Logistics", icon: Truck },
    { path: "/dashboard/shed", label: "Shed Procurement", icon: Warehouse },
    { path: "/dashboard/fraud", label: "Fraud Detection", icon: AlertTriangle },
    { path: "/dashboard/map", label: "Logistics Map", icon: Map },
  ];

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl text-white">FRA System</h1>
          <p className="text-sm text-sidebar-foreground/70 mt-1">Agricultural Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                isActive(item.path)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="px-4 py-3 mb-2 bg-sidebar-accent/30 rounded-md">
            <p className="text-sm text-sidebar-foreground/90">Admin Officer</p>
            <p className="text-xs text-sidebar-foreground/60">officer@fra.gov.zm</p>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-3 px-4 py-3 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
