import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowBigLeft, Phone, User } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { apiRequest } from "@/app/lib/api";

interface AgentRegistrationForm {
  username: string;
  password: string;
  district: string;
  phone_number: string;
}

export function RegistrationPage() {
  const [form, setForm] = useState<AgentRegistrationForm>({
    username: "",
    password: "",
    district: "",
    phone_number: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { token } = useAuth();

  const registrationMutation = useMutation({
    mutationFn: (payload: AgentRegistrationForm) =>
      apiRequest<{ id: string; status: string }>("/auth/agents", {
        method: "POST",
        token,
        body: {
          username: payload.username,
          password: payload.password,
          district: payload.district,
          phone_number: payload.phone_number,
        },
      }),
    onSuccess: () => {
      navigate("/dashboard");
    },
  });

  const updateField =
    (field: keyof AgentRegistrationForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Admin token is required to register an auth agent.");
      return;
    }

    try {
      await registrationMutation.mutateAsync(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register auth agent");
    }
  };


  return (
    <>
    <div className="min-h-screen bg-background p-4 py-8">
      <Link to="/dashboard" className="w-max flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6 ">
      <ArrowBigLeft className="w-5 h-5 text-muted-foreground" />  Back to Dashboard
      </Link>
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-primary text-primary-foreground p-6">
            <h1 className="text-2xl mb-1">Auth Agent Registration</h1>
            <p className="text-primary-foreground/80 text-sm">
              Food Reserve Agency - Admin agent onboarding
            </p>
          </div>

          <div className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm mb-2 text-card-foreground">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Enter username"
                      value={form.username}
                      onChange={updateField("username")}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-card-foreground">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={updateField("password")}
                    required
                    className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-card-foreground">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      placeholder="+260 xxx xxx xxx"
                      value={form.phone_number}
                      onChange={updateField("phone_number")}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-card-foreground">
                    District
                  </label>
                  <select
                    value={form.district}
                    onChange={updateField("district")}
                    required
                    className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select District</option>
                    <option>Lusaka</option>
                    <option>Chipata</option>
                    <option>Ndola</option>
                    <option>Livingstone</option>
                    <option>Mongu</option>
                    <option>Kasama</option>
                  </select>
                </div>
              </div>

              

              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="flex gap-4 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/farmers")}
                  className="px-6 py-3 border border-border rounded-md text-card-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registrationMutation.isPending}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registrationMutation.isPending
                    ? "Submitting..."
                    : "Submit Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2026 Food Reserve Agency, Republic of Zambia
        </p>
      </div>
    </div>

    </>
  );
}
