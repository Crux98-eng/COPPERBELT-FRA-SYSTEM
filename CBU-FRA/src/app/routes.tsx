import { createBrowserRouter } from "react-router";

import { RootLayout } from "./components/layouts/RootLayout";

import { ProtectedRoute } from "./auth/ProtectedRoute";

import { LandingPage } from "./components/home/LandingPage";

import { LoginPage } from "./components/auth/LoginPage";

import { RegistrationPage } from "./components/auth/RegistrationPage";

import { Dashboard } from "./components/dashboard/Dashboard";

import { FarmerManagement } from "./components/farmers/FarmerManagement";

import { FarmerDetail } from "./components/farmers/FarmerDetail";

import { FarmManagement } from "./components/farms/FarmManagement";

import { FarmDetail } from "./components/farms/FarmDetail";

import { FarmCreate } from "./components/farms/FarmCreate";

import { SeasonManagement } from "./components/seasons/SeasonManagement";

import { SeasonForm } from "./components/seasons/SeasonForm";

import { BeneficiaryManagement } from "./components/beneficiaries/BeneficiaryManagement";

import { BeneficiaryForm } from "./components/beneficiaries/BeneficiaryForm";

import { BatchManagement } from "./components/batches/BatchManagement";

import { BatchForm } from "./components/batches/BatchForm";

import { PaymentManagement } from "./components/payments/PaymentManagement";

import { PaymentForm } from "./components/payments/PaymentForm";

import { AdminManagement } from "./components/admin/AdminManagement";

import { TransactionManagement } from "./components/transactions/TransactionManagement";

import { TransportLogistics } from "./components/transport/TransportLogistics";

import { SalesProcurement } from "./components/sales/SalesProcurement";

import { ShedProcurement } from "./components/shed/ShedProcurement";

import { FraudDetection } from "./components/fraud/FraudDetection";

import  LogisticsMap  from "./components/map/LogisticsMap";

import { AgentsList } from "./components/agents/AgentsList";

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

              { path: "farms", Component: FarmManagement },

              { path: "farms/create", Component: FarmCreate },

              { path: "farms/:id/edit", Component: FarmDetail },

              { path: "seasons", Component: SeasonManagement },

              { path: "seasons/create", Component: SeasonForm },

              { path: "seasons/:id/edit", Component: SeasonForm },

              { path: "beneficiaries", Component: BeneficiaryManagement },

              { path: "beneficiaries/create", Component: BeneficiaryForm },

              { path: "beneficiaries/:id/edit", Component: BeneficiaryForm },

              { path: "batches", Component: BatchManagement },

              { path: "batches/create", Component: BatchForm },

              { path: "batches/:id/edit", Component: BatchForm },

              { path: "payments", Component: PaymentManagement },

              { path: "payments/create", Component: PaymentForm },

              { path: "payments/:id/edit", Component: PaymentForm },

              { path: "admin", Component: AdminManagement },

              { path: "transactions", Component: TransactionManagement },

              { path: "transport", Component: TransportLogistics },

              { path: "shed", Component: ShedProcurement },

              { path: "fraud", Component: FraudDetection },

              { path: "map", Component: LogisticsMap },

              { path: "agents", Component: AgentsList },

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

