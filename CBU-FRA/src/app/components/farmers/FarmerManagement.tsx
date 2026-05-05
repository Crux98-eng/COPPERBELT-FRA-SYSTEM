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
   TYPES (MATCH API)
========================= */

interface Farmer {
  id: string;
  name: string;
  nrc: string;
  location: string;
  crop?: string;
}

interface ApiResponse {
  status: string;
  message: string;
  data: {
    farmers: Farmer[];
    total: number;
  };
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
    queryKey: ["farmers", page, searchTerm, districtFilter],
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

      return apiRequest<ApiResponse>(
        `/mobile/farmers?${params.toString()}`,
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
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
    },
  });

  /* =========================
     DATA (FIXED ACCESS)
  ========================= */

  const farmers = farmersQuery.data?.data.farmers ?? [];
  const total = farmersQuery.data?.data.total ?? 0;
  console.log("total==",farmers.length)

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const districts = useMemo(() => {
    return Array.from(
      new Set(farmers.map((f) => f.location).filter(Boolean))
    );
  }, [farmers]);

  const isLoading = farmersQuery.isLoading;
  const isError = farmersQuery.isError;

  /* =========================
     DELETE HANDLER
  ========================= */

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete farmer "${name}"?`)) return;
    deleteFarmerMutation.mutate(id);
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="p-6 h-screen bg-[green]/30">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl mb-2">Farmer Management</h1>
          <p className="text-muted-foreground">
            Manage registered farmers.
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-lg shadow-sm">
        {/* FILTERS */}
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            {/* SEARCH */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />

              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setPage(1);
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 border rounded-md"
              />
            </div>

            {/* DISTRICT */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />

              <select
                value={districtFilter}
                onChange={(e) => {
                  setPage(1);
                  setDistrictFilter(e.target.value);
                }}
                className="px-4 py-3 border rounded-md"
              >
                <option value="">All Locations</option>

                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {isError && (
          <div className="p-6 text-red-500">
            Failed to load farmers.
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto bg-[green]/6">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">NRC</th>
                <th className="px-6 py-4 text-left">Location</th>
                <th className="px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    </tr>
                  ))
                : farmers.map((farmer) => (
                    <tr key={farmer.id}>
                      <td className="px-6 py-4">
                        {farmer.name}
                      </td>

                      <td className="px-6 py-4">
                        {farmer.nrc}
                      </td>

                      <td className="px-6 py-4">
                        {farmer.location}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <Link
                            to={`/dashboard/farmers/${farmer.id}`}
                            className="text-primary"
                          >
                            View
                          </Link>

                          <button
                            onClick={() =>
                              handleDelete(
                                farmer.id,
                                farmer.name
                              )
                            }
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!isLoading && farmers.length === 0 && (
            <div className="p-10 text-center">
              No farmers found.
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex justify-between">
          <p>
            Showing {farmers.length} of {total}
          </p>

          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/70"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>

            <span>
              {page} / {totalPages}
            </span>

            <button
             className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/70"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}