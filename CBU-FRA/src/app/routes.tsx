import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layouts/RootLayout";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { LandingPage } from "./components/home/LandingPage";
import { LoginPage } from "./components/auth/LoginPage";
import { RegistrationPage } from "./components/auth/RegistrationPage";
import { Dashboard } from "./components/dashboard/Dashboard";
import { FarmerManagement } from "./components/farmers/FarmerManagement";
import { FarmerDetail } from "./components/farmers/FarmerDetail";
import { TransportLogistics } from "./components/transport/TransportLogistics";
import { ShedProcurement } from "./components/shed/ShedProcurement";
import { FraudDetection } from "./components/fraud/FraudDetection";
import  LogisticsMap  from "./components/map/LogisticsMap";
import Settings from "./components/settings/Settings";
export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/dashboard",
        Component: RootLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: "farmers", Component: FarmerManagement },
          { path: "farmers/:id", Component: FarmerDetail },
          { path: "transport", Component: TransportLogistics },
          { path: "shed", Component: ShedProcurement },
          { path: "fraud", Component: FraudDetection },
          { path: "map", Component: LogisticsMap },
          { path: "settings", Component: Settings },
          { path: "register", Component: RegistrationPage },
        ],
      },
    ],
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  
]);
