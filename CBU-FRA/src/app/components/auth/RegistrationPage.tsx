import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowBigLeft, Phone, User } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { apiRequest } from "@/app/lib/api";

interface FarmerRegistrationForm {
  name: string;
  nrc: string;
  phone: string;
  district: string;
  crop: string;
}

export function RegistrationPage() {
  const [biometricStatus] = useState<"pending" | "verified">("verified");
  const [gpsStatus] = useState<"idle" | "capturing" | "captured">("captured");
  const [form, setForm] = useState<FarmerRegistrationForm>({
    name: "",
    nrc: "",
    phone: "",
    district: "",
    crop: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { token } = useAuth();

  const registrationMutation = useMutation({
    mutationFn: (payload: FarmerRegistrationForm) =>
      apiRequest<{ id: string; status: string }>("/farmers", {
        method: "POST",
        token,
        body: {
          name: payload.name,
          nrc: payload.nrc,
          phone: payload.phone,
          district: payload.district,
          village: "",
          crop: payload.crop,
          biometricStatus,
          fingerprintTemplate: "",
          facePhoto: "",
          gps: {
            lat: -12.9587,
            lng: 28.6366,
          },
        },
      }),
    onSuccess: () => {
      navigate("/dashboard/farmers");
    },
  });

  const updateField =
    (field: keyof FarmerRegistrationForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      await registrationMutation.mutateAsync(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register farmer");
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
            <h1 className="text-2xl mb-1">Farmer Registration</h1>
            <p className="text-primary-foreground/80 text-sm">
              Food Reserve Agency - Farmer Input Support Programme
            </p>
          </div>

          <div className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm mb-2 text-card-foreground">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={form.name}
                      onChange={updateField("name")}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-card-foreground">
                    NRC Number
                  </label>
                  <input
                    type="text"
                    placeholder="123456/78/9"
                    value={form.nrc}
                    onChange={updateField("nrc")}
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
                      value={form.phone}
                      onChange={updateField("phone")}
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


                <div>
                  <label className="block text-sm mb-2 text-card-foreground">
                    Primary Crop
                  </label>
                  <select
                    value={form.crop}
                    onChange={updateField("crop")}
                    required
                    className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Crop Type</option>
                    <option>Maize</option>
                    <option>Groundnuts</option>
                    <option>Soya Beans</option>
                    <option>Cotton</option>
                    <option>Sunflower</option>
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
                  disabled={
                    registrationMutation.isPending ||
                    biometricStatus !== "verified" ||
                    gpsStatus !== "captured"
                  }
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
