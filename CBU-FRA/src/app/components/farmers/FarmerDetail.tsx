import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Fingerprint,
  CheckCircle,
  Clock,
  Flag,
  Edit,
} from "lucide-react";

export function FarmerDetail() {
  const { id } = useParams();

  const farmerData = {
    id: id || "F001",
    name: "Joseph Mwansa",
    nrc: "123456/78/1",
    phone: "+260 977 123 456",
    district: "Chipata",
    province: "Eastern",
    village: "Kamoto Village",
    crop: "Maize",
    status: "active",
    registered: "2026-01-15",
    biometricStatus: "verified",
    gpsCoordinates: "-13.6334° S, 32.6503° E",
    transportHistory: [
      {
        id: "TB001",
        date: "2026-04-10",
        bags: 120,
        status: "completed",
        shed: "Chipata Central Shed",
      },
      {
        id: "TB002",
        date: "2026-03-15",
        bags: 95,
        status: "completed",
        shed: "Chipata Central Shed",
      },
      {
        id: "TB003",
        date: "2026-02-20",
        bags: 110,
        status: "completed",
        shed: "Chipata Central Shed",
      },
    ],
    procurementHistory: [
      {
        date: "2026-04-10",
        declaredBags: 120,
        actualWeight: "6,000 kg",
        variance: "+2.3%",
        payment: "ZMW 48,000",
        status: "paid",
      },
      {
        date: "2026-03-15",
        declaredBags: 95,
        actualWeight: "4,750 kg",
        variance: "0%",
        payment: "ZMW 38,000",
        status: "paid",
      },
    ],
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to="/dashboard/farmers"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Farmers
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl text-foreground mb-2">{farmerData.name}</h1>
            <p className="text-muted-foreground">Farmer ID: {farmerData.id}</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <Edit className="w-4 h-4" />
              Edit Details
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
              <Flag className="w-4 h-4" />
              Flag Farmer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-lg shadow-sm p-6">
            <h2 className="text-xl text-card-foreground mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="text-card-foreground">{farmerData.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NRC Number</p>
                  <p className="text-card-foreground">{farmerData.nrc}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="text-card-foreground">{farmerData.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-card-foreground">
                    {farmerData.village}, {farmerData.district}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {farmerData.province} Province
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Primary Crop</p>
                  <p className="text-card-foreground">{farmerData.crop}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Clock className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Registration Date
                  </p>
                  <p className="text-card-foreground">{farmerData.registered}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm p-6">
            <h2 className="text-xl text-card-foreground mb-4">
              Transport History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                      Batch ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                      Bags
                    </th>
                    <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                      Shed
                    </th>
                    <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {farmerData.transportHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-sm text-card-foreground">
                        {record.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {record.date}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {record.bags}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {record.shed}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary rounded-full text-xs">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm p-6">
            <h2 className="text-xl text-card-foreground mb-4">
              Procurement History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                      Declared
                    </th>
                    <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                      Actual Weight
                    </th>
                    <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                      Variance
                    </th>
                    <th className="px-4 py-3 text-left text-sm text-muted-foreground">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {farmerData.procurementHistory.map((record, idx) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {record.date}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {record.declaredBags} bags
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {record.actualWeight}
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary">
                        {record.variance}
                      </td>
                      <td className="px-4 py-3 text-sm text-card-foreground">
                        {record.payment}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg shadow-sm p-6">
            <h2 className="text-lg text-card-foreground mb-4">Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                <span className="text-sm text-card-foreground">
                  Account Status
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                <span className="text-sm text-card-foreground">
                  Biometric Status
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                  <Fingerprint className="w-4 h-4" />
                  Verified
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm p-6">
            <h2 className="text-lg text-card-foreground mb-4">
              GPS Coordinates
            </h2>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-card-foreground">
                    {farmerData.gpsCoordinates}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Captured: {farmerData.registered}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-32 bg-muted rounded border border-border flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Map Preview</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm p-6">
            <h2 className="text-lg text-card-foreground mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <button className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                Approve Application
              </button>
              <button className="w-full px-4 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-sm text-card-foreground">
                Request Re-verification
              </button>
              <button className="w-full px-4 py-3 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors text-sm">
                Suspend Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
