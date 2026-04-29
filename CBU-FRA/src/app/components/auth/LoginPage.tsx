import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { User, Lock, Fingerprint } from "lucide-react";
import backgroundImage from "@/assets/farmbg.jpg";
import { useAuth } from "@/app/auth/AuthContext";

type LoginLocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const [useBiometric, setUseBiometric] = useState(false);
  const [officerIdOrNrc, setOfficerIdOrNrc] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login,
    biometricLogin,
    isAuthenticated,
    isLoading,
    loginPending,
    biometricLoginPending,
  } = useAuth();
  const from =
    (location.state as LoginLocationState | null)?.from?.pathname ||
    "/dashboard";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center text-muted-foreground">
        Loading session...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      await login({ officerIdOrNrc, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    }
  };

  const handleBiometricLogin = async () => {
    setError("");

    try {
      await biometricLogin({
        officerIdOrNrc,
        biometricSample: "browser-biometric-sample",
        deviceId: "web-client",
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to authenticate biometric login",
      );
    }
  };

  const isPasswordPending = loginPending;
  const isBiometricPending = biometricLoginPending;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <img src={backgroundImage} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-100 z-0" />
      <div className="w-full max-w-md backdrop-blur-sm bg-background/70 rounded-lg shadow-lg p-6 relative z-10">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Warehouse className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl text-card-foreground mb-2">FRA System</h1>
            <p className="text-muted-foreground">Food Reserve Agency - Zambia</p>
          </div> 
          
         
          <div className="mb-6">
            <div className="flex gap-2 p-1 bg-muted rounded-lg mb-6">
              <button
                onClick={() => setUseBiometric(false)}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  !useBiometric
                    ? "bg-card shadow-sm text-card-foreground"
                    : "text-muted-foreground hover:text-card-foreground"
                }`}
              >
                Password
              </button>
              <button
                onClick={() => setUseBiometric(true)}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  useBiometric
                    ? "bg-card shadow-sm text-card-foreground"
                    : "text-muted-foreground hover:text-card-foreground"
                }`}
              >
                Biometric
              </button>
            </div>

            {!useBiometric ? (
              <form className="space-y-4" onSubmit={handlePasswordLogin}>
                <div>
                  <label className="block text-sm mb-2 text-card-foreground">
                    Officer ID / NRC
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Enter your ID"
                      value={officerIdOrNrc}
                      onChange={(event) => setOfficerIdOrNrc(event.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-card-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <button
                  // type="submit"
                  // disabled={isPasswordPending}
                  onClick={()=>{navigate('/dashboard')}}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-md hover:bg-primary/90 transition-colors block text-center disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPasswordPending ? "Signing in..." : "Sign In"}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm mb-2 text-card-foreground">
                    Officer ID / NRC
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Enter your ID"
                      value={officerIdOrNrc}
                      onChange={(event) => setOfficerIdOrNrc(event.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-32 h-32 bg-primary/10 rounded-full mb-4 border-4 border-primary/20">
                    <Fingerprint className="w-16 h-16 text-primary animate-pulse" />
                  </div>
                  <p className="text-card-foreground mb-2">Place your finger on the scanner</p>
                  <p className="text-sm text-muted-foreground">
                    Waiting for biometric authentication...
                  </p>
                </div>

                {error && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  // onClick={handleBiometricLogin}
                  onClick={()=>{navigate('/dashboard')}}
                  disabled={isBiometricPending || !officerIdOrNrc}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-md hover:bg-primary/90 transition-colors block text-center disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isBiometricPending ? "Authenticating..." : "Authenticate"}
                </button>
              </div>
            )}
          </div>

          {/* <div className="text-center">
            <Link
              to="/register"
              className="text-sm text-primary hover:underline"
            >
              Register New Farmer
            </Link>
          </div> */}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2026 Food Reserve Agency, Republic of Zambia
        </p>
      </div>
    </div>
  );
}

function Warehouse({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
