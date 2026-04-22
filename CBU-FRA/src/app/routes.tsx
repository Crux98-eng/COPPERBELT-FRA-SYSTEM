import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layouts/RootLayout";
import { LandingPage } from "./components/home/LandingPage";
import { LoginPage } from "./components/auth/LoginPage";
import { RegistrationPage } from "./components/auth/RegistrationPage";
import { Dashboard } from "./components/dashboard/Dashboard";
import { FarmerManagement } from "./components/farmers/FarmerManagement";
import { FarmerDetail } from "./components/farmers/FarmerDetail";
import { TransportLogistics } from "./components/transport/TransportLogistics";
import { ShedProcurement } from "./components/shed/ShedProcurement";
import { FraudDetection } from "./components/fraud/FraudDetection";
import { LogisticsMap } from "./components/map/LogisticsMap";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
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
    ],
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegistrationPage,
  },
]);
