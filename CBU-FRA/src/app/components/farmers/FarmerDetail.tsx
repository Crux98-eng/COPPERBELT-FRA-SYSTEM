import React, { useEffect } from "react";
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
import { useQuery } from "@tanstack/react-query";
import FarmMap from "../dashboard/mapPlot";
import { useAuth } from "@/app/auth/AuthContext";
import { ApiError, apiRequest } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";
// import { o } from "node_modules/react-router/dist/development/index-react-server-client-MKTlCGL3.mjs";

/* =========================
   TYPES (MATCH API)
========================= */


interface Farmer {
  farmer_id: string;
  full_name: string;
  nrc_number: string;
  phone_number: string;
  date_of_birth?: string | null;
  district?: string | null;
  trust_score?: number | null;
  created_at: string;
  updated_at: string;
}

interface Farm {
  id: string;
  farmer_id: string;
  hectorage?: number;
  gps_coordinates?: string;
  farm_boundary_coordinates?: Array<{ lat: number; lng: number }>;
  crop?: string;
  status?: string;
}

interface FarmerApiResponse {
  status: string;
  message: string;
  data: Farmer[];
}

interface Farm {
  id: string;
  hectorage?: number;
  crop?: string;
  farmBoundaryCoordinates?: Array<{ lat: number; lng: number }>;
}

interface FarmApiResponse {
  status: string;
  message: string;
  data: Farm;
}

interface TransportRecord {
  id: string;
  date: string;
  bags: number;
  status: string;
  shed: string;
}

interface ProcurementRecord {
  date: string;
  declaredBags: number;
  actualWeight: string;
  variance: string;
  payment: string;
  status: string;
}
interface FarmerApiDeleteResponse {
  status: string;
  message: string;
  
}

export function FarmerDetail() {
  const { id } = useParams();
  const { token } = useAuth();

  /* =========================
     FETCH FARMER DATA
  ========================= */

  const farmerQuery = useQuery({
    queryKey: ["farmer", id],
    enabled: Boolean(id && token),
    queryFn: async () => {
      return apiRequest<FarmerApiResponse>(`/mobile/farmers/${id}`, {
        token
      });
    },
  });

  /* =========================
     FETCH FARM DATA
  ========================= */

  const farmsQuery = useQuery({
    queryKey: ["farms", id],
    enabled: Boolean(id && token),
    queryFn: async () => {
      return apiRequest<FarmApiResponse>(`/mobile/farmers/${id}/farms`, {
        token
      });
    },
  });
  /* =========================
     delete farmer data
  ========================= */

  const farmsQueryDelete = useQuery({
    queryKey: ["farmer", id],
    enabled: Boolean(id && token),
    queryFn: async () => {
      return apiRequest<FarmerApiDeleteResponse>(`/web/farmers/${id}`, {
        method: "DELETE",
        token
      });
      
    },
    
   
  });
  
 
  /* =========================
     MOCK DATA FOR HISTORY
  ========================= */

  const mockTransportHistory: TransportRecord[] = [
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
  ];

  const mockProcurementHistory: ProcurementRecord[] = [
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
  ];

  /* =========================
     DATA ACCESS
  ========================= */


  const farmer = farmerQuery.data;
  // console.log("data length==",farmer?.data?.length)
  // console.log(farmer?.data?.[0]?.phone_number);
  const farms = farmsQuery.data?.data || [];
  const primaryFarm = farms[0]; // Use first farm as primary

  const isLoading = farmerQuery.isLoading || farmsQuery.isLoading;
  const isError = farmerQuery.isError || farmsQuery.isError;
  const error = farmerQuery.error || farmsQuery.error;
  /* =========================
     LOADING STATE
  ========================= */

  if (isLoading) {
    return (
      <div className="p-6 h-screen bg-[green]/30">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-64 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     ERROR STATE
  ========================= */

  if (isError) {
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
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Error Loading Farmer Data
          </h2>
          <p className="text-muted-foreground">
            {error instanceof ApiError ? error.message : "Failed to load farmer details. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  /* =========================
     NO DATA STATE
  ========================= */

  if (!farmer) {
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
        </div>
        <div className="bg-muted/10 border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Farmer Not Found</h2>
          <p className="text-muted-foreground">
            The farmer you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl text-foreground mb-2">{farmer.full_name || "Unknown Farmer"}</h1>
            <p className="text-muted-foreground">Farmer ID: {farmer.farmer_id || "N/A"}</p>
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
          <div className="bg-card  border border-border rounded-lg shadow-sm p-6">
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
                  <p className="text-card-foreground">{farmer.full_name || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NRC Number</p>
                  <p className="text-card-foreground">{farmer.nrc_number || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="text-card-foreground">{farmer.phone_number || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-card-foreground">
                    {farmer.district || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Primary Crop</p>
                  <p className="text-card-foreground">{primaryFarm?.crop || "N/A"}</p>
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
                  <p className="text-card-foreground">{farmer.created_at || "N/A"}</p>
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
                  {mockTransportHistory.map((record) => (
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
                  {mockProcurementHistory.map((record, idx) => (
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
                  {"Active"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                <span className="text-sm text-card-foreground">
                  Biometric Status
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                  <Fingerprint className="w-4 h-4" />
                  {"Not Verified"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm p-6 ">
            <h2 className="text-lg text-card-foreground mb-4">
              GPS Coordinates
            </h2>
            <div className="p-4 bg-muted/30 rounded-lg ">
              {primaryFarm?.farm_boundary_coordinates ? (
                <>
                  <FarmMap coordinates={primaryFarm.farm_boundary_coordinates} />
                  <span className="text-sm text-muted-foreground mt-2 block">
                    Hectorage: {primaryFarm.hectorage || "N/A"}
                  </span>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No GPS data available</p>
                  {primaryFarm?.gps_coordinates && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {primaryFarm.gps_coordinates}
                    </p>
                  )}
                </div>
              )}
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
