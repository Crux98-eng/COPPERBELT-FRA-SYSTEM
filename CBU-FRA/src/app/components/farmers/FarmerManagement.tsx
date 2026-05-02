// import { useState } from "react";
// import { Link } from "react-router";
// import { Search, Filter, CheckCircle, Trash2 } from "lucide-react";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { useAuth } from "@/app/auth/AuthContext";
// import { ApiError, apiRequest } from "@/app/lib/api";
// import { Skeleton } from "@/app/components/ui/skeleton";

// interface FarmerResponse {
//   farmer_id: string;
//   nrc_number: string;
//   phone_number: string;
//   full_name: string;
//   date_of_birth?: string | null;
//   district?: string | null;
//   user_id?: string | null;
//   registered_by?: string | null;
//   trust_score?: number | null;
//   created_at: string;
//   updated_at: string;
// }

// export function FarmerManagement() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [districtFilter, setDistrictFilter] = useState("");
//   const { token } = useAuth();
//   const queryClient = useQueryClient();


//   const farmersQuery = useQuery({

//     queryKey: ["farmers", "list", searchTerm, districtFilter],
//     enabled: Boolean(token),
//     queryFn: () => {
//       if (!token) {
//         throw new ApiError("Admin token is missing. Please log in again.", 401, null);
//       }

//       const params = new URLSearchParams({ limit: "50" });
//       if (searchTerm.trim()) params.set("search", searchTerm.trim());
//       if (districtFilter.trim()) params.set("district", districtFilter.trim());

//       return apiRequest<FarmerResponse[]>(`/web/farmers/?${params}`, {
//         token,
//       });
//     },
//   });

//   const deleteFarmerMutation = useMutation({
//     mutationFn: (farmerId: string) => {
//       if (!token) {
//         throw new ApiError("Admin token is missing. Please log in again.", 401, null);
//       }

//       return apiRequest<void>(`/web/farmers/${farmerId}`, {
//         method: "DELETE",
//         token,
//       });
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["farmers", "list"] });
//     },
//   });

//   const farmers = farmersQuery.data ?? [];
//   console.log("Fetched farmers:", farmers);
//   const isLoading = farmersQuery.isLoading;
//   const districts = Array.from(
//     new Set(farmers.map((farmer) => farmer.district).filter(Boolean)),
//   ) as string[];

//   return (
//     <div className="p-6">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-3xl text-foreground mb-2">Farmer Management</h1>
//           <p className="text-muted-foreground">
//             Manage registered farmers from the web portal API.
//           </p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 gap-6">
//         <div className="bg-card border border-border rounded-lg shadow-sm">
//           <div className="p-6 border-b border-border">
//             <div className="flex flex-col md:flex-row gap-4">
//               <div className="flex-1 relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
//                 <input
//                   type="text"
//                   placeholder="Search by name, NRC, or phone..."
//                   value={searchTerm}
//                   onChange={(event) => setSearchTerm(event.target.value)}
//                   className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
//                 />
//               </div>

//               <div className="flex items-center gap-2">
//                 <Filter className="w-5 h-5 text-muted-foreground" />
//                 <select
//                   value={districtFilter}
//                   onChange={(event) => setDistrictFilter(event.target.value)}
//                   className="px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
//                 >
//                   <option value="">All Districts</option>
//                   {districts.map((district) => (
//                     <option key={district} value={district}>
//                       {district}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-muted/50">
//                 <tr>
//                   <th className="px-6 py-4 text-left text-sm text-muted-foreground">
//                     Name
//                   </th>
//                   <th className="px-6 py-4 text-left text-sm text-muted-foreground">
//                     NRC
//                   </th>
//                   <th className="px-6 py-4 text-left text-sm text-muted-foreground">
//                     Phone
//                   </th>
//                   <th className="px-6 py-4 text-left text-sm text-muted-foreground">
//                     District
//                   </th>
//                   <th className="px-6 py-4 text-left text-sm text-muted-foreground">
//                     Trust
//                   </th>
//                   <th className="px-6 py-4 text-left text-sm text-muted-foreground">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-border">
//                 {isLoading
//                   ? Array.from({ length: 5 }).map((_, index) => (
//                       <tr key={index}>
//                         {Array.from({ length: 6 }).map((__, cellIndex) => (
//                           <td key={cellIndex} className="px-6 py-4">
//                             <Skeleton className="h-4 w-28" />
//                           </td>
//                         ))}
//                       </tr>
//                     ))
//                   : farmers.map((farmer) => (
//                       <tr
//                         key={farmer.farmer_id}
//                         className="hover:bg-muted/20 transition-colors"
//                       >
//                         <td className="px-6 py-4 text-sm text-card-foreground">
//                           {farmer.full_name}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-muted-foreground">
//                           {farmer.nrc_number}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-muted-foreground">
//                           {farmer.phone_number}
//                         </td>
//                         <td className="px-6 py-4 text-sm text-muted-foreground">
//                           {farmer.district || "Unassigned"}
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
//                             <CheckCircle className="w-4 h-4" />
//                             {farmer.trust_score ?? "New"}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex items-center gap-3">
//                             <Link
//                               to={`/dashboard/farmers/${farmer.farmer_id}`}
//                               className="text-sm text-primary hover:underline"
//                             >
//                               View Details
//                             </Link>
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 deleteFarmerMutation.mutate(farmer.farmer_id)
//                               }
//                               className="inline-flex items-center gap-1 text-sm text-destructive hover:underline"
//                             >
//                               <Trash2 className="w-4 h-4" />
//                               Delete
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//               </tbody>
//             </table>

//             {!isLoading && farmers.length === 0 && (
//               <div className="p-12 text-center text-muted-foreground">
//                 No farmers found matching your criteria
//               </div>
//             )}
//           </div>

//           <div className="p-4 border-t border-border text-sm text-muted-foreground">
//             Showing {farmers.length} farmer{farmers.length === 1 ? "" : "s"}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }+

import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Search, Filter, CheckCircle, Trash2 } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/app/auth/AuthContext";
import { ApiError, apiRequest } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";

/* =========================
   TYPES
========================= */

interface FarmerResponse {
  farmer_id: string;
  nrc_number: string;
  phone_number: string;
  full_name: string;
  date_of_birth?: string | null;
  district?: string | null;
  user_id?: string | null;
  registered_by?: string | null;
  trust_score?: number | null;
  created_at: string;
  updated_at: string;
}

interface FarmersListResponse {
  items: FarmerResponse[];
  total: number;
  skip: number;
  limit: number;
}

/* =========================
   COMPONENT
========================= */

export function FarmerManagement() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [page, setPage] = useState(1);

  const limit = 50;
  const skip = (page - 1) * limit;

  /* =========================
     FETCH FARMERS
  ========================= */

  const farmersQuery = useQuery({
    queryKey: [
      "farmers",
      "list",
      page,
      searchTerm,
      districtFilter,
    ],
    enabled: Boolean(token),
    queryFn: async () => {


      const params = new URLSearchParams({
        skip: String(skip),
        limit: String(limit),
      });

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      if (districtFilter.trim()) {
        params.set("district", districtFilter.trim());
      }

      return apiRequest<FarmersListResponse>(
        `/farmers?${params.toString()}`,
        { token }
      );
    },
    
  });

  /* =========================
     DELETE FARMER
  ========================= */

  const deleteFarmerMutation = useMutation({
    mutationFn: async (farmerId: string) => {
      if (!token) {
        throw new ApiError(
          "Admin token missing. Please login again.",
          401,
          null
        );
      }

      return apiRequest<void>(`/web/farmers/${farmerId}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["farmers"],
      });
    },
  });

  /* =========================
     DATA
  ========================= */

  const farmers = farmersQuery.data?.items ?? [];
  const total = farmersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const districts = useMemo(() => {
    return Array.from(
      new Set(
        farmers
          .map((farmer) => farmer.district)
          .filter(Boolean)
      )
    ) as string[];
  }, [farmers]);

  /* =========================
     STATES
  ========================= */

  const isLoading = farmersQuery.isLoading;
  const isError = farmersQuery.isError;

  /* =========================
     DELETE HANDLER
  ========================= */

  function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(
      `Delete farmer "${name}"?`
    );

    if (!confirmed) return;

    deleteFarmerMutation.mutate(id);
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl text-foreground mb-2">
            Farmer Management
          </h1>

          <p className="text-muted-foreground">
            Manage registered farmers.
          </p>
        </div>
      </div>

      {/* CARD */}
      <div className="bg-card border border-border rounded-lg shadow-sm">
        {/* FILTERS */}
        <div className="p-6 border-b border-border">
          <div className="flex flex-col md:flex-row gap-4">
            {/* SEARCH */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

              <input
                type="text"
                placeholder="Search by name, NRC or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setPage(1);
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* DISTRICT */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />

              <select
                value={districtFilter}
                onChange={(e) => {
                  setPage(1);
                  setDistrictFilter(e.target.value);
                }}
                className="px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Districts</option>

                {districts.map((district) => (
                  <option
                    key={district}
                    value={district}
                  >
                    {district}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {isError && (
          <div className="p-6 text-destructive">
            Failed to load farmers.
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  NRC
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  District
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Trust
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 5 }).map(
                    (_, row) => (
                      <tr key={row}>
                        {Array.from({
                          length: 6,
                        }).map((__, cell) => (
                          <td
                            key={cell}
                            className="px-6 py-4"
                          >
                            <Skeleton className="h-4 w-24" />
                          </td>
                        ))}
                      </tr>
                    )
                  )
                : farmers.map((farmer) => (
                    <tr
                      key={farmer.farmer_id}
                      className="hover:bg-muted/20"
                    >
                      <td className="px-6 py-4">
                        {farmer.full_name}
                      </td>

                      <td className="px-6 py-4">
                        {farmer.nrc_number}
                      </td>

                      <td className="px-6 py-4">
                        {farmer.phone_number}
                      </td>

                      <td className="px-6 py-4">
                        {farmer.district ||
                          "Unassigned"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm">
                          <CheckCircle className="w-4 h-4" />
                          {farmer.trust_score ??
                            "New"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <Link
                            to={`/dashboard/farmers/${farmer.farmer_id}`}
                            className="text-primary hover:underline text-sm"
                          >
                            View
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                farmer.farmer_id,
                                farmer.full_name
                              )
                            }
                            className="inline-flex items-center gap-1 text-destructive hover:underline text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!isLoading &&
            farmers.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">
                No farmers found.
              </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {farmers.length} of {total} farmers
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() =>
                setPage((prev) =>
                  Math.max(prev - 1, 1)
                )
              }
              className="px-3 py-2 border rounded disabled:opacity-50"
            >
              Prev
            </button>

            <span className="px-3 py-2 text-sm">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((prev) =>
                  Math.min(
                    prev + 1,
                    totalPages
                  )
                )
              }
              className="px-3 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
