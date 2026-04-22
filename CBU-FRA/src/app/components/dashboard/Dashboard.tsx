import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import FarmMap from "./mapPlot";

const farmersByRegion = [
  { region: "Lusaka", farmers: 2340, growth: 12 },
  { region: "Chipata", farmers: 3120, growth: 18 },
  { region: "Ndola", farmers: 1890, growth: 8 },
  { region: "Livingstone", farmers: 1560, growth: 15 },
  { region: "Mongu", farmers: 2180, growth: 9 },
  { region: "Kasama", farmers: 1368, growth: 6 },
];

const cropDistribution = [
  { name: "Maize", value: 6890, color: "#43A047" },
  { name: "Groundnuts", value: 2340, color: "#F9A825" },
  { name: "Soya Beans", value: 1890, color: "#1B5E20" },
  { name: "Cotton", value: 890, color: "#0D1B2A" },
  { name: "Other", value: 448, color: "#9E9E9E" },
];

const transportSuccess = [
  { month: "Oct", success: 92, target: 95 },
  { month: "Nov", success: 94, target: 95 },
  { month: "Dec", success: 89, target: 95 },
  { month: "Jan", success: 96, target: 95 },
  { month: "Feb", success: 93, target: 95 },
  { month: "Mar", success: 95, target: 95 },
  { month: "Apr", success: 97, target: 95 },
];

const procurementVolume = [
  { month: "Oct", bags: 45000, revenue: 360 },
  { month: "Nov", bags: 52000, revenue: 416 },
  { month: "Dec", bags: 48000, revenue: 384 },
  { month: "Jan", bags: 61000, revenue: 488 },
  { month: "Feb", bags: 58000, revenue: 464 },
  { month: "Mar", bags: 64000, revenue: 512 },
  { month: "Apr", bags: 71000, revenue: 568 },
];

const recentActivity = [
  {
    id: 1,
    action: "Batch TB127 arrived at Chipata Central Shed",
    time: "8 minutes ago",
    type: "transport",
  },
  {
    id: 2,
    action: "Fraud alert FR008 flagged for review",
    time: "23 minutes ago",
    type: "alert",
  },
  {
    id: 3,
    action: "Payment processed for F001 - ZMW 48,000",
    time: "1 hour ago",
    type: "payment",
  },
  {
    id: 4,
    action: "New farmer registration: Grace Mwale (F342)",
    time: "2 hours ago",
    type: "registration",
  },
  {
    id: 5,
    action: "Batch TB126 dispatched from Mongu",
    time: "3 hours ago",
    type: "transport",
  },
];

export function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-[green]/30">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl text-foreground mb-1">
                Operations Dashboard
              </h1>
              <p className="text-muted-foreground">
                Real-time overview of FRA agricultural operations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Last updated</p>
                <p className="text-sm text-foreground">
                  Today, {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-secondary"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-secondary/10 rounded-md">
                  <ArrowUpRight className="w-3 h-3 text-secondary" />
                  <span className="text-xs text-secondary">+2.8%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Farmers</p>
                <p className="text-3xl text-foreground tracking-tight">12,458</p>
                <p className="text-xs text-muted-foreground">
                  +342 registered this month
                </p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-secondary/20 to-secondary"></div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md">
                  <Activity className="w-3 h-3 text-primary" />
                  <span className="text-xs text-primary">Active</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Transport Batches</p>
                <p className="text-3xl text-foreground tracking-tight">127</p>
                <p className="text-xs text-muted-foreground">
                  18 currently in transit
                </p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-primary/20 to-primary"></div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-accent"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pending Arrivals</p>
                <p className="text-3xl text-foreground tracking-tight">43</p>
                <p className="text-xs text-muted-foreground">
                  Expected within 24 hours
                </p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-accent/20 to-accent"></div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-destructive"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-destructive/10 rounded-md">
                  <ArrowDownRight className="w-3 h-3 text-destructive" />
                  <span className="text-xs text-destructive">-12%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fraud Alerts</p>
                <p className="text-3xl text-foreground tracking-tight">8</p>
                <p className="text-xs text-muted-foreground">
                  2 high priority cases
                </p>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-destructive/20 to-destructive"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg text-card-foreground">
                    Monthly Procurement Volume
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bags procured and revenue generated (in thousands ZMW)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-sm"></div>
                    <span className="text-xs text-muted-foreground">Bags</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-accent rounded-sm"></div>
                    <span className="text-xs text-muted-foreground">Revenue</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={procurementVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
                  <XAxis dataKey="month" stroke="#0D1B2A" fontSize={12} />
                  <YAxis stroke="#0D1B2A" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #E0E0E0",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="bags" fill="#1B5E20" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="revenue" fill="#F9A825" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-transparent  border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border bg-[green]/30">
              <h3 className="text-lg text-card-foreground">Recent Activity</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Latest system events
              </p>
            </div>
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === "alert"
                          ? "bg-destructive"
                          : activity.type === "payment"
                          ? "bg-secondary"
                          : "bg-primary"
                      }`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-card-foreground leading-snug">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg text-card-foreground">
                Farmers by Region
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Registration distribution across provinces
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {farmersByRegion.map((region) => {
                  const maxFarmers = Math.max(...farmersByRegion.map((r) => r.farmers));
                  const percentage = (region.farmers / maxFarmers) * 100;

                  return (
                    <div key={region.region}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-card-foreground">
                          {region.region}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {region.farmers.toLocaleString()} farmers
                          </span>
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary/10 rounded-md">
                            <ArrowUpRight className="w-3 h-3 text-secondary" />
                            <span className="text-xs text-secondary">
                              +{region.growth}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg text-card-foreground">
                Transport Success Rate
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                On-time delivery performance vs. target (95%)
              </p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={transportSuccess}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" vertical={false} />
                  <XAxis dataKey="month" stroke="#0D1B2A" fontSize={12} />
                  <YAxis stroke="#0D1B2A" domain={[85, 100]} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #E0E0E0",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#E0E0E0"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="#43A047"
                    strokeWidth={3}
                    dot={{ fill: "#43A047", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
