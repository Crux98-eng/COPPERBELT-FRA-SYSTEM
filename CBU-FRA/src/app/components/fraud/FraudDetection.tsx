import { useState } from "react";
import {
  AlertTriangle,
  Shield,
  AlertOctagon,
  TrendingUp,
  Calendar,
  MapPin,
  Scale,
  Users,
} from "lucide-react";

const fraudAlerts = [
  {
    id: "FR008",
    farmerId: "F012",
    farmerName: "Simon Hachileka",
    riskLevel: "high",
    flags: [
      "Weight variance > 15%",
      "Duplicate NRC detected",
      "Location mismatch",
    ],
    date: "2026-04-21",
    status: "under-review",
  },
  {
    id: "FR007",
    farmerId: "F019",
    farmerName: "Catherine Mwape",
    riskLevel: "high",
    flags: ["Multiple registrations from same location", "Suspicious pattern"],
    date: "2026-04-20",
    status: "under-review",
  },
  {
    id: "FR006",
    farmerId: "F015",
    farmerName: "Patrick Musonda",
    riskLevel: "medium",
    flags: ["Unusual transport delay (>48hrs)", "Weight variance 8%"],
    date: "2026-04-19",
    status: "pending",
  },
  {
    id: "FR005",
    farmerId: "F023",
    farmerName: "Elizabeth Banda",
    riskLevel: "medium",
    flags: ["GPS inconsistency", "Late registration"],
    date: "2026-04-18",
    status: "pending",
  },
  {
    id: "FR004",
    farmerId: "F007",
    farmerName: "David Lungu",
    riskLevel: "low",
    flags: ["Minor weight discrepancy (3%)"],
    date: "2026-04-17",
    status: "resolved",
  },
];

const riskStats = {
  high: 8,
  medium: 15,
  low: 23,
  total: 46,
};

export function FraudDetection() {
  const [selectedAlert, setSelectedAlert] = useState(fraudAlerts[0]);
  const [filterRisk, setFilterRisk] = useState<string>("all");

  const filteredAlerts = fraudAlerts.filter(
    (alert) => filterRisk === "all" || alert.riskLevel === filterRisk
  );

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-sm">
            <AlertOctagon className="w-4 h-4" />
            High Risk
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm">
            <AlertTriangle className="w-4 h-4" />
            Medium Risk
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/20 text-secondary rounded-full text-sm">
            <Shield className="w-4 h-4" />
            Low Risk
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "under-review":
        return (
          <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-xs">
            Under Review
          </span>
        );
      case "pending":
        return (
          <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs">
            Pending
          </span>
        );
      case "resolved":
        return (
          <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-xs">
            Resolved
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-foreground mb-2">Fraud Detection</h1>
        <p className="text-muted-foreground">
          Monitor and investigate suspicious activities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Alerts</p>
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-3xl text-card-foreground">{riskStats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Active cases</p>
        </div>

        <div className="bg-card border border-destructive rounded-lg p-4 shadow-sm bg-destructive/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-destructive">High Risk</p>
            <AlertOctagon className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-3xl text-destructive">{riskStats.high}</p>
          <p className="text-xs text-destructive/70 mt-1">Requires attention</p>
        </div>

        <div className="bg-card border border-accent rounded-lg p-4 shadow-sm bg-accent/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-accent">Medium Risk</p>
            <AlertTriangle className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl text-accent">{riskStats.medium}</p>
          <p className="text-xs text-accent/70 mt-1">Under monitoring</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-secondary">Low Risk</p>
            <Shield className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-3xl text-secondary">{riskStats.low}</p>
          <p className="text-xs text-secondary/70 mt-1">Minor issues</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg text-card-foreground">Fraud Alerts</h2>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Risks</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>

            <div className="divide-y divide-border max-h-[calc(100vh-420px)] overflow-y-auto">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedAlert.id === alert.id
                      ? "bg-primary/5 border-l-4 border-l-primary"
                      : "hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-card-foreground mb-1">
                        {alert.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.farmerName}
                      </p>
                    </div>
                    {getRiskBadge(alert.riskLevel)}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(alert.status)}
                    <span className="text-xs text-muted-foreground">
                      {alert.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl text-card-foreground mb-1">
                    {selectedAlert.id}
                  </h2>
                  <p className="text-muted-foreground">Fraud Investigation</p>
                </div>
                {getRiskBadge(selectedAlert.riskLevel)}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg text-card-foreground mb-4">
                  Farmer Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Farmer Name</p>
                      <p className="text-card-foreground">
                        {selectedAlert.farmerName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ID: {selectedAlert.farmerId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Alert Date</p>
                      <p className="text-card-foreground">{selectedAlert.date}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {selectedAlert.status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-lg text-card-foreground mb-4">
                  Fraud Indicators
                </h3>

                <div className="space-y-3">
                  {selectedAlert.flags.map((flag, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${
                        selectedAlert.riskLevel === "high"
                          ? "bg-destructive/5 border-destructive"
                          : selectedAlert.riskLevel === "medium"
                          ? "bg-accent/5 border-accent"
                          : "bg-muted border-muted-foreground"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={`w-5 h-5 mt-0.5 ${
                            selectedAlert.riskLevel === "high"
                              ? "text-destructive"
                              : selectedAlert.riskLevel === "medium"
                              ? "text-accent"
                              : "text-muted-foreground"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-card-foreground">{flag}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-lg text-card-foreground mb-4">
                  Evidence Timeline
                </h3>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
                        <Scale className="w-4 h-4 text-white" />
                      </div>
                      <div className="w-0.5 h-12 bg-destructive/30"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm text-card-foreground mb-1">
                        Weight Discrepancy Detected
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {selectedAlert.date} 14:23
                      </p>
                      <p className="text-sm text-destructive">
                        Variance of 15.7% detected during weighing process
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div className="w-0.5 h-12 bg-accent/30"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm text-card-foreground mb-1">
                        GPS Location Mismatch
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {selectedAlert.date} 14:25
                      </p>
                      <p className="text-sm text-accent">
                        Registered location differs from collection point by 45km
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-card-foreground mb-1">
                        Duplicate NRC Found
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {selectedAlert.date} 14:30
                      </p>
                      <p className="text-sm text-destructive">
                        Same NRC registered under different name in Chipata district
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-lg text-card-foreground mb-4">
                  Investigation Actions
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                    Escalate to Investigation Team
                  </button>
                  <button className="px-4 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-sm text-card-foreground">
                    Request Additional Documentation
                  </button>
                  <button className="px-4 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-sm text-card-foreground">
                    Schedule Field Verification
                  </button>
                  <button className="px-4 py-3 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors text-sm">
                    Suspend Account
                  </button>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <div className="flex gap-4">
                  <button className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors">
                    Mark as Resolved
                  </button>
                  <button className="px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-card-foreground">
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
