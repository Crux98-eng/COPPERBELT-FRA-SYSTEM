import { useState } from "react";
import { Link } from "react-router";
import { User, Phone, MapPin, Camera, Fingerprint, CheckCircle } from "lucide-react";

export function RegistrationPage() {
  const [biometricStatus, setBiometricStatus] = useState<"pending" | "verified">("pending");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "capturing" | "captured">("idle");

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="bg-primary text-primary-foreground p-6">
            <h1 className="text-2xl mb-1">Farmer Registration</h1>
            <p className="text-primary-foreground/80 text-sm">
              Food Reserve Agency - Farmer Input Support Programme
            </p>
          </div>

          <div className="p-6">
            <form className="space-y-6">
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
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-card-foreground">
                    District
                  </label>
                  <select className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Select District</option>
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
                    Village
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Enter village name"
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-card-foreground">
                    Primary Crop
                  </label>
                  <select className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Select Crop Type</option>
                    <option>Maize</option>
                    <option>Groundnuts</option>
                    <option>Soya Beans</option>
                    <option>Cotton</option>
                    <option>Sunflower</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg text-card-foreground mb-4">Biometric Capture</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-border rounded-lg p-6 bg-muted/30">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-card-foreground">Fingerprint Scan</h4>
                      {biometricStatus === "verified" && (
                        <CheckCircle className="w-5 h-5 text-secondary" />
                      )}
                    </div>

                    <div className="flex flex-col items-center py-6">
                      <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-4 border-4 border-primary/20">
                        <Fingerprint
                          className={`w-16 h-16 ${
                            biometricStatus === "verified"
                              ? "text-secondary"
                              : "text-primary"
                          }`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setBiometricStatus("verified")}
                        className={`px-6 py-2 rounded-md ${
                          biometricStatus === "verified"
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        {biometricStatus === "verified" ? "Verified" : "Capture Fingerprint"}
                      </button>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-6 bg-muted/30">
                    <h4 className="text-card-foreground mb-4">Face Capture</h4>

                    <div className="flex flex-col items-center py-6">
                      <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center mb-4 border-2 border-dashed border-border">
                        <Camera className="w-12 h-12 text-muted-foreground" />
                      </div>

                      <button
                        type="button"
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      >
                        Capture Photo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg text-card-foreground mb-4">GPS Location</h3>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setGpsStatus("capturing");
                      setTimeout(() => setGpsStatus("captured"), 1500);
                    }}
                    disabled={gpsStatus === "capturing"}
                    className={`px-6 py-3 rounded-md ${
                      gpsStatus === "captured"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {gpsStatus === "idle" && "Capture GPS Location"}
                      {gpsStatus === "capturing" && "Capturing..."}
                      {gpsStatus === "captured" && "Location Captured"}
                    </div>
                  </button>

                  {gpsStatus === "captured" && (
                    <div className="text-sm text-muted-foreground">
                      Coordinates: -15.4167° S, 28.2833° E
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-border">
                <Link
                  to="/login"
                  className="px-6 py-3 border border-border rounded-md text-card-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={biometricStatus !== "verified" || gpsStatus !== "captured"}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Registration
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
  );
}
