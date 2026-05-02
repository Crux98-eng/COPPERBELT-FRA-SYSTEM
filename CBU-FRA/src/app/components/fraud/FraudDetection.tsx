import { useEffect, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Shield,
  AlertOctagon,
  Calendar,
  MapPin,
  Scale,
  Users,
} from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { apiRequest } from "@/app/lib/api";

interface FarmerSummary {
  farmer_id: string;
  full_name: string;
  nrc_number: string;
  district: string;
}

interface FraudReviewQueueEntry {
  queue_id: string;
  farmer_id: string;
  fraud_flag_id?: string;
  fraud_score_id?: string;
  status: string;
  priority: number;
  created_at: string;
  farmer: FarmerSummary;
}

interface FraudQueueResponse {
  total: number;
  queue_entries: FraudReviewQueueEntry[];
}

interface FraudFlagDetail {
  flag_id: string;
  flag_type: string;
  status: string;
  request_endpoint: string;
  duplicate_farmer_id?: string;
  gps_distance_metres?: number;
  review_notes?: string;
  created_at: string;
  reviewed_at?: string;
  farmer?: FarmerSummary;
}

interface FraudScoreDetail {
  score_id: string;
  farmer_id: string;
  anomaly_score: number;
  is_flagged: boolean;
  scored_at: string;
  features: Record<string, number>;
  review_action?: string;
}

const sampleQueueEntries: FraudReviewQueueEntry[] = [
  {
    queue_id: "990i1803-i62f-85h8-e150-880988884444",
    farmer_id: "660f8500-f39c-52e5-b827-557655551111",
    fraud_flag_id: "550e8400-e29b-41d4-a716-446655440000",
    status: "PENDING",
    priority: 1,
    created_at: "2024-01-16T02:00:00Z",
    farmer: {
      farmer_id: "660f8500-f39c-52e5-b827-557655551111",
      full_name: "John Doe",
      nrc_number: "123456789012",
      district: "Central",
    },
  },
  {
    queue_id: "990i1803-i62f-85h8-e150-880988884445",
    farmer_id: "660f8500-f39c-52e5-b827-557655552222",
    fraud_score_id: "880h0702-h51e-74g7-d049-779877773333",
    status: "PENDING",
    priority: 2,
    created_at: "2024-01-16T03:10:00Z",
    farmer: {
      farmer_id: "660f8500-f39c-52e5-b827-557655552222",
      full_name: "Jane Smith",
      nrc_number: "123456789013",
      district: "Lusaka",
    },
  },
  {
    queue_id: "990i1803-i62f-85h8-e150-880988884446",
    farmer_id: "660f8500-f39c-52e5-b827-557655553333",
    fraud_flag_id: "550e8400-e29b-41d4-a716-446655440001",
    status: "PENDING",
    priority: 0,
    created_at: "2024-01-16T04:30:00Z",
    farmer: {
      farmer_id: "660f8500-f39c-52e5-b827-557655553333",
      full_name: "Patrick Musonda",
      nrc_number: "123456789014",
      district: "Chipata",
    },
  },
];

export function FraudDetection() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [decisionStatus, setDecisionStatus] = useState<"APPROVED" | "REJECTED" | "NEEDS_MORE_INFO">("APPROVED");

  const queueQuery = useQuery({
    queryKey: ["fraud", "review-queue", "pending"],
    queryFn: async () =>
      apiRequest<FraudQueueResponse>(
        "/web/fraud/review-queue?status=PENDING&limit=50",
        { token },
      ),
    enabled: Boolean(token),
    retry: false,
  });

  const queueEntries = queueQuery.data?.queue_entries ?? [];

  useEffect(() => {
    if (!selectedQueueId && queueEntries.length > 0) {
      setSelectedQueueId(queueEntries[0].queue_id);
    }
  }, [queueEntries, selectedQueueId]);

  const selectedEntry = queueEntries.find((entry) => entry.queue_id === selectedQueueId) ?? queueEntries[0] ?? null;

  const flagQuery = useQuery({
    queryKey: ["fraud", "flag", selectedEntry?.fraud_flag_id],
    queryFn: async () =>
      apiRequest<FraudFlagDetail>(
        `/web/fraud/flags/${selectedEntry?.fraud_flag_id}`,
        { token },
      ),
    enabled: Boolean(token && selectedEntry?.fraud_flag_id),
    retry: false,
  });

  const scoreQuery = useQuery({
    queryKey: ["fraud", "score", selectedEntry?.fraud_score_id],
    queryFn: async () =>
      apiRequest<FraudScoreDetail>(
        `/web/fraud/scores/${selectedEntry?.fraud_score_id}`,
        { token },
      ),
    enabled: Boolean(token && selectedEntry?.fraud_score_id),
    retry: false,
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: {
      queueId: string;
      status: "APPROVED" | "REJECTED" | "NEEDS_MORE_INFO";
      review_notes: string;
    }) =>
      apiRequest(`/web/fraud/review-queue/${payload.queueId}/decision`, {
        method: "PUT",
        token,
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraud", "review-queue", "pending"] });
      setReviewNotes("");
    },
  });

  const getPriorityBadge = (priority: number) => {
    if (priority >= 2) {
      return (
        <span className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-xs">
          High Priority
        </span>
      );
    }

    if (priority === 1) {
      return (
        <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs">
          Normal Priority
        </span>
      );
    }

    return (
      <span className="px-3 py-1 bg-muted/10 text-muted-foreground rounded-full text-xs">
        Low Priority
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs">
            Pending
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-xs">
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-xs">
            Rejected
          </span>
        );
      case "NEEDS_MORE_INFO":
        return (
          <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs">
            Needs Info
          </span>
        );
      default:
        return null;
    }
  };

  const selectedFlag = flagQuery.data;
  const selectedScore = scoreQuery.data;

  const handleDecisionSubmit = async () => {
    if (!selectedEntry) return;

    await reviewMutation.mutateAsync({
      queueId: selectedEntry.queue_id,
      status: decisionStatus,
      review_notes: reviewNotes,
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-foreground mb-2">Fraud Detection</h1>
        <p className="text-muted-foreground">
          Monitor and investigate suspicious activities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Pending Reviews</p>
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-3xl text-card-foreground">{queueEntries.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
        </div>

        <div className="bg-card border border-destructive rounded-lg p-4 shadow-sm bg-destructive/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-destructive">High Priority</p>
            <AlertOctagon className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-3xl text-destructive">
            {queueEntries.filter((entry) => entry.priority >= 2).length}
          </p>
          <p className="text-xs text-destructive/70 mt-1">Urgent reviews</p>
        </div>

        <div className="bg-card border border-accent rounded-lg p-4 shadow-sm bg-accent/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-accent">Normal Priority</p>
            <AlertTriangle className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl text-accent">
            {queueEntries.filter((entry) => entry.priority === 1).length}
          </p>
          <p className="text-xs text-accent/70 mt-1">Standard cases</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-secondary">Low Priority</p>
            <Shield className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-3xl text-secondary">
            {queueEntries.filter((entry) => entry.priority === 0).length}
          </p>
          <p className="text-xs text-secondary/70 mt-1">Monitoring only</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg text-card-foreground">Review Queue</h2>
            </div>

            <div className="divide-y divide-border max-h-[calc(100vh-420px)] overflow-y-auto">
              {queueEntries.map((entry) => (
                <div
                  key={entry.queue_id}
                  onClick={() => setSelectedQueueId(entry.queue_id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedEntry?.queue_id === entry.queue_id
                      ? "bg-primary/5 border-l-4 border-l-primary"
                      : "hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-card-foreground mb-1">
                        {entry.farmer.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.farmer.nrc_number}
                      </p>
                    </div>
                    {getPriorityBadge(entry.priority)}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(entry.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
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
                  <h2 className="text-2xl text-card-foreground">
                    {selectedEntry?.farmer.full_name ?? "No review selected"}
                  </h2>
                  <p className="text-muted-foreground">Fraud Investigation</p>
                </div>
                {selectedEntry && getPriorityBadge(selectedEntry.priority)}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {!selectedEntry ? (
                <p className="text-sm text-muted-foreground">
                  No fraud review queue entry is available right now.
                </p>
              ) : (
                <>
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
                            {selectedEntry.farmer.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {selectedEntry.farmer.farmer_id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <Calendar className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Alert Date</p>
                          <p className="text-card-foreground">
                            {new Date(selectedEntry.created_at).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Status: {selectedEntry.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="text-lg text-card-foreground mb-4">
                      Fraud Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-sm text-muted-foreground">Flag Source</p>
                        <p className="text-card-foreground mt-2">
                          {selectedEntry.fraud_flag_id ? "Layer 1: Fraud Flag" : "Layer 2: ML Score"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-sm text-muted-foreground">Review Type</p>
                        <p className="text-card-foreground mt-2">
                          {selectedEntry.fraud_flag_id ? "Flag review" : "Score review"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-sm text-muted-foreground">Associated ID</p>
                        <p className="text-card-foreground mt-2">
                          {selectedEntry.fraud_flag_id ?? selectedEntry.fraud_score_id ?? "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedFlag && (
                    <div className="border-t border-border pt-6">
                      <h3 className="text-lg text-card-foreground mb-4">
                        Flag Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-lg border border-border p-4">
                          <p className="text-sm text-muted-foreground">Flag Type</p>
                          <p className="text-card-foreground mt-2">{selectedFlag.flag_type}</p>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <p className="text-sm text-muted-foreground">Endpoint</p>
                          <p className="text-card-foreground mt-2">{selectedFlag.request_endpoint}</p>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <p className="text-sm text-muted-foreground">GPS Distance</p>
                          <p className="text-card-foreground mt-2">
                            {selectedFlag.gps_distance_metres ?? "N/A"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <p className="text-sm text-muted-foreground">Duplicate Farmer</p>
                          <p className="text-card-foreground mt-2">
                            {selectedFlag.duplicate_farmer_id ?? "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedScore && (
                    <div className="border-t border-border pt-6">
                      <h3 className="text-lg text-card-foreground mb-4">
                        ML Score Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-lg border border-border p-4">
                          <p className="text-sm text-muted-foreground">Anomaly Score</p>
                          <p className="text-card-foreground mt-2">
                            {selectedScore.anomaly_score.toFixed(2)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <p className="text-sm text-muted-foreground">Flagged</p>
                          <p className="text-card-foreground mt-2">
                            {selectedScore.is_flagged ? "Yes" : "No"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <p className="text-sm text-muted-foreground">Scored At</p>
                          <p className="text-card-foreground mt-2">
                            {new Date(selectedScore.scored_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(selectedScore.features).map(([key, value]) => (
                          <div key={key} className="rounded-lg border border-border p-4">
                            <p className="text-sm text-muted-foreground">{key}</p>
                            <p className="text-card-foreground mt-2">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border pt-6">
                    <h3 className="text-lg text-card-foreground mb-4">
                      Investigation Actions
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setDecisionStatus("APPROVED")}
                          className={`px-4 py-3 rounded-lg text-sm transition-colors ${
                            decisionStatus === "APPROVED"
                              ? "bg-secondary text-secondary-foreground"
                              : "border border-border text-card-foreground hover:bg-muted/50"
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionStatus("REJECTED")}
                          className={`px-4 py-3 rounded-lg text-sm transition-colors ${
                            decisionStatus === "REJECTED"
                              ? "bg-destructive text-destructive-foreground"
                              : "border border-border text-card-foreground hover:bg-muted/50"
                          }`}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionStatus("NEEDS_MORE_INFO")}
                          className={`px-4 py-3 rounded-lg text-sm transition-colors ${
                            decisionStatus === "NEEDS_MORE_INFO"
                              ? "bg-accent text-accent-foreground"
                              : "border border-border text-card-foreground hover:bg-muted/50"
                          }`}
                        >
                          Needs Info
                        </button>
                      </div>

                      <textarea
                        value={reviewNotes}
                        onChange={(event) => setReviewNotes(event.target.value)}
                        placeholder="Enter review notes or evidence summary"
                        className="w-full min-h-[120px] rounded-lg border border-border bg-input-background p-4 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={handleDecisionSubmit}
                          disabled={reviewMutation.isPending || !selectedEntry}
                          className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {reviewMutation.isPending ? "Submitting..." : "Submit Decision"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewNotes("")}
                          className="px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-card-foreground"
                        >
                          Clear Notes
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
