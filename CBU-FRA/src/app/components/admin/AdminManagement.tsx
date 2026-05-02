import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, Filter, Plus, Edit, Trash2, Users, Shield, Clock, AlertTriangle } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/app/auth/AuthContext";
import { ApiError, apiRequest } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";

interface UserResponse {
  user_id: string;
  username: string;
  email: string;
  role: "ADMIN" | "AGENT" | "VIEWER";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuditLogResponse {
  log_id: string;
  user_id: string;
  username: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface UsersListResponse {
  items: UserResponse[];
  total: number;
  skip: number;
  limit: number;
}

interface AuditLogsListResponse {
  items: AuditLogResponse[];
  total: number;
  skip: number;
  limit: number;
}

interface UserCreate {
  username: string;
  email: string;
  password: string;
  role: "ADMIN" | "AGENT" | "VIEWER";
}

interface UserUpdate {
  username?: string;
  email?: string;
  role?: "ADMIN" | "AGENT" | "VIEWER";
  is_active?: boolean;
}

const roleColors = {
  ADMIN: "bg-destructive/10 text-destructive",
  AGENT: "bg-primary/10 text-primary",
  VIEWER: "bg-muted/10 text-muted-foreground",
};

const actionColors = {
  CREATE: "bg-secondary/10 text-secondary",
  UPDATE: "bg-accent/10 text-accent",
  DELETE: "bg-destructive/10 text-destructive",
  LOGIN: "bg-primary/10 text-primary",
  LOGOUT: "bg-muted/10 text-muted-foreground",
};

export function AdminManagement() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"users" | "audit">("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);

  const limit = 50;
  const skip = (page - 1) * limit;

  const usersQuery = useQuery({
    queryKey: [
      "users",
      "list",
      page,
      searchTerm,
      roleFilter,
    ],
    enabled: Boolean(token) && activeTab === "users",
    queryFn: async () => {
      const params = new URLSearchParams({
        skip: String(skip),
        limit: String(limit),
      });

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      if (roleFilter.trim()) {
        params.set("role", roleFilter.trim());
      }

      return apiRequest<UsersListResponse>(
        `/web/admin/users?${params.toString()}`,
        { token }
      );
    },
  });

  const auditLogsQuery = useQuery({
    queryKey: [
      "audit",
      "list",
      page,
      searchTerm,
      actionFilter,
    ],
    enabled: Boolean(token) && activeTab === "audit",
    queryFn: async () => {
      const params = new URLSearchParams({
        skip: String(skip),
        limit: String(limit),
      });

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      if (actionFilter.trim()) {
        params.set("action", actionFilter.trim());
      }

      return apiRequest<AuditLogsListResponse>(
        `/web/admin/audit-logs?${params.toString()}`,
        { token }
      );
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!token) {
        throw new ApiError(
          "Admin token missing. Please login again.",
          401,
          null
        );
      }

      return apiRequest<void>(`/web/admin/users/${userId}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: (payload: { userId: string; isActive: boolean }) =>
      apiRequest<UserResponse>(`/web/admin/users/${payload.userId}/status`, {
        method: "PATCH",
        token,
        body: { is_active: payload.isActive },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });

  const users = usersQuery.data?.items ?? [];
  const totalUsers = usersQuery.data?.total ?? 0;
  const totalPagesUsers = Math.max(1, Math.ceil(totalUsers / limit));

  const auditLogs = auditLogsQuery.data?.items ?? [];
  const totalAuditLogs = auditLogsQuery.data?.total ?? 0;
  const totalPagesAuditLogs = Math.max(1, Math.ceil(totalAuditLogs / limit));

  const isLoading = (activeTab === "users" ? usersQuery : auditLogsQuery).isLoading;
  const isError = (activeTab === "users" ? usersQuery : auditLogsQuery).isError;

  const handleDelete = (userId: string, username: string) => {
    const confirmed = window.confirm(
      `Delete user "${username}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    deleteUserMutation.mutate(userId);
  };

  const handleToggleStatus = (userId: string, username: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "activate" : "deactivate";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} user "${username}"?`
    );

    if (!confirmed) return;

    toggleUserStatusMutation.mutate({ userId, isActive: newStatus });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionBadge = (action: string) => {
    const actionType = action.toUpperCase().split('_')[0] as keyof typeof actionColors;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
          actionColors[actionType] || "bg-muted/10 text-muted-foreground"
        }`}
      >
        {action}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl text-foreground mb-2">
            Admin Management
          </h1>

          <p className="text-muted-foreground">
            Manage users and monitor system activity.
          </p>
        </div>

        {activeTab === "users" && (
          <Link
            to="/dashboard/admin/users/create"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User
          </Link>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "users"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-card-foreground hover:bg-muted/50"
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Users
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === "audit"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-card-foreground hover:bg-muted/50"
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Audit Logs
        </button>
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
                placeholder={activeTab === "users" ? "Search by username or email..." : "Search by action, user, or resource..."}
                value={searchTerm}
                onChange={(e) => {
                  setPage(1);
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* ROLE/ACTION FILTER */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />

              {activeTab === "users" ? (
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setPage(1);
                    setRoleFilter(e.target.value);
                  }}
                  className="px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="AGENT">Agent</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              ) : (
                <select
                  value={actionFilter}
                  onChange={(e) => {
                    setPage(1);
                    setActionFilter(e.target.value);
                  }}
                  className="px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* ERROR */}
        {isError && (
          <div className="p-6 text-destructive">
            Failed to load {activeTab === "users" ? "users" : "audit logs"}.
          </div>
        )}

        {/* TABLES */}
        {activeTab === "users" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm">
                    Created
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
                  : users.map((user) => (
                      <tr
                        key={user.user_id}
                        className="hover:bg-muted/20"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-card-foreground font-medium">
                              {user.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                              roleColors[user.role]
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                              user.is_active
                                ? "bg-secondary/10 text-secondary"
                                : "bg-muted/10 text-muted-foreground"
                            }`}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm">
                            {formatDate(user.created_at)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link
                              to={`/dashboard/admin/users/${user.user_id}/edit`}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                handleToggleStatus(user.user_id, user.username, user.is_active)
                              }
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded hover:opacity-80 ${
                                user.is_active
                                  ? "bg-muted/10 text-muted-foreground"
                                  : "bg-secondary/10 text-secondary"
                              }`}
                            >
                              {user.is_active ? "Deactivate" : "Activate"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(user.user_id, user.username)
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>

            {!isLoading &&
              users.length === 0 && (
                <div className="p-10 text-center text-muted-foreground">
                  No users found.
                </div>
              )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm">
                    User & Action
                  </th>
                  <th className="px-6 py-4 text-left text-sm">
                    Resource
                  </th>
                  <th className="px-6 py-4 text-left text-sm">
                    IP Address
                  </th>
                  <th className="px-6 py-4 text-left text-sm">
                    Timestamp
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {isLoading
                  ? Array.from({ length: 5 }).map(
                      (_, row) => (
                        <tr key={row}>
                          {Array.from({
                            length: 5,
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
                  : auditLogs.map((log) => (
                      <tr
                        key={log.log_id}
                        className="hover:bg-muted/20"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-card-foreground font-medium">
                              {log.username}
                            </p>
                            <div className="mt-1">
                              {getActionBadge(log.action)}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-card-foreground">
                              {log.resource_type}
                            </p>
                            {log.resource_id && (
                              <p className="text-xs text-muted-foreground">
                                ID: {log.resource_id}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {log.ip_address || "N/A"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm">
                            {formatDate(log.created_at)}
                          </span>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>

            {!isLoading &&
              auditLogs.length === 0 && (
                <div className="p-10 text-center text-muted-foreground">
                  No audit logs found.
                </div>
              )}
          </div>
        )}

        {/* FOOTER */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {activeTab === "users" ? users.length : auditLogs.length} of{" "}
            {activeTab === "users" ? totalUsers : totalAuditLogs}{" "}
            {activeTab === "users" ? "users" : "audit logs"}
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
              {page} / {activeTab === "users" ? totalPagesUsers : totalPagesAuditLogs}
            </span>

            <button
              type="button"
              disabled={page >= (activeTab === "users" ? totalPagesUsers : totalPagesAuditLogs)}
              onClick={() =>
                setPage((prev) =>
                  Math.min(
                    prev + 1,
                    activeTab === "users" ? totalPagesUsers : totalPagesAuditLogs
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
