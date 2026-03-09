import { Routes, Route } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TenantsListPage } from './pages/TenantsListPage';
import { TenantCreatePage } from './pages/TenantCreatePage';
import { TenantDetailPage } from './pages/TenantDetailPage';
import { ToolsOverviewPage } from './pages/ToolsOverviewPage';
import { StoresListPage } from './pages/StoresListPage';
import { StoreDetailPage } from './pages/StoreDetailPage';
import { UsersListPage } from './pages/UsersListPage';
import { UserCreatePage } from './pages/UserCreatePage';
import { UserDetailPage } from './pages/UserDetailPage';
import GdprPage from './pages/GdprPage';
import { ReportingPage } from './pages/ReportingPage';
import { StoreExcellenceAuditRoutes } from './tools/store-excellence-audit/index';

export function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Alle authentifizierten User */}
          <Route path="/" element={<DashboardPage />} />

          {/* Nur kore_admin */}
          <Route element={<ProtectedRoute minRole="kore_admin" />}>
            <Route path="/tenants" element={<TenantsListPage />} />
            <Route path="/tenants/new" element={<TenantCreatePage />} />
            <Route path="/tenants/:id" element={<TenantDetailPage />} />
          </Route>

          {/* tenant_admin+ */}
          <Route element={<ProtectedRoute minRole="tenant_admin" />}>
            <Route path="/gdpr" element={<GdprPage />} />
            <Route path="/reporting" element={<ReportingPage />} />
          </Route>

          {/* store_manager+ (Benutzer verwalten, Stores, Tools) */}
          <Route element={<ProtectedRoute minRole="store_manager" />}>
            <Route path="/users" element={<UsersListPage />} />
            <Route path="/users/new" element={<UserCreatePage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
            <Route path="/stores" element={<StoresListPage />} />
            <Route path="/stores/:id" element={<StoreDetailPage />} />
            <Route path="/tools" element={<ToolsOverviewPage />} />
            <Route path="/tools/sea/*" element={<StoreExcellenceAuditRoutes />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
