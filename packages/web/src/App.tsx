import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "styled-components";
import { AuthProvider } from "./hooks/useAuth";
import { AuthGuard } from "./components/auth/AuthGuard";
import { RoleGuard } from "./components/auth/RoleGuard";
import { LoginPage } from "./components/auth/LoginPage";
import { Permissions, ROUTE_SEGMENTS } from "@hr-attendance-app/types";
import { Layout } from "./components/common/Layout";
import { theme } from "./theme/theme";
import { GlobalStyle } from "./theme/GlobalStyle";
import "./i18n/index";

const DashboardPage = lazy(() => import("./components/dashboard/DashboardPage").then(m => ({ default: m.DashboardPage })));
const AttendancePage = lazy(() => import("./components/attendance/AttendancePage").then(m => ({ default: m.AttendancePage })));
const LeavePage = lazy(() => import("./components/leave/LeavePage").then(m => ({ default: m.LeavePage })));
const ReportsPage = lazy(() => import("./components/reports/ReportsPage").then(m => ({ default: m.ReportsPage })));
const PayrollPage = lazy(() => import("./components/payroll/PayrollPage").then(m => ({ default: m.PayrollPage })));
const TeamPage = lazy(() => import("./components/team/TeamPage").then(m => ({ default: m.TeamPage })));
const AdminPage = lazy(() => import("./components/admin/AdminPage").then(m => ({ default: m.AdminPage })));
const SettingsPage = lazy(() => import("./components/settings/SettingsPage").then(m => ({ default: m.SettingsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path={ROUTE_SEGMENTS.LOGIN} element={<LoginPage />} />
                <Route element={<AuthGuard />}>
                  <Route element={<Layout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path={ROUTE_SEGMENTS.ATTENDANCE} element={<AttendancePage />} />
                    <Route path={ROUTE_SEGMENTS.LEAVE} element={<LeavePage />} />
                    <Route path={ROUTE_SEGMENTS.REPORTS} element={<ReportsPage />} />
                    <Route path={ROUTE_SEGMENTS.PAYROLL} element={<PayrollPage />} />
                    <Route element={<RoleGuard requiredPermission={Permissions.LEAVE_APPROVE} />}>
                      <Route path={ROUTE_SEGMENTS.TEAM} element={<TeamPage />} />
                    </Route>
                    <Route element={<RoleGuard requiredPermission={Permissions.ONBOARD} />}>
                      <Route path={ROUTE_SEGMENTS.ADMIN} element={<AdminPage />} />
                    </Route>
                    <Route path={ROUTE_SEGMENTS.SETTINGS} element={<SettingsPage />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
