import React from 'react';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkerProvider } from './context/WorkerContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { MaterialsProvider } from './context/MaterialsContext';
import { ProductsProvider } from './context/ProductsContext';
import { ProductionProvider } from './context/ProductionContext';
import { QualityProvider } from './context/QualityContext';
import { PayrollProvider } from './context/PayrollContext';
import { FactoryCalendarProvider } from './context/FactoryCalendarContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FactoryCalendarPage } from './pages/FactoryCalendarPage';
import { WorkersPage } from './pages/WorkersPage';
import { WorkerAddPage } from './pages/WorkerAddPage';
import { WorkerDetailPage } from './pages/WorkerDetailPage';
import { DailyAttendanceDetailPage } from './pages/DailyAttendanceDetailPage';
import { WorkerAttendanceCalendarPage } from './pages/WorkerAttendanceCalendarPage';
import { LeaveManagementPage } from './pages/LeaveManagementPage';
import { getTodayDateString } from './context/AttendanceContext';
import { MaterialsPage } from './pages/MaterialsPage';
import { MaterialAddPage } from './pages/MaterialAddPage';
import { MaterialDetailPage } from './pages/MaterialDetailPage';
import { MaterialInwardPage } from './pages/MaterialInwardPage';
import { MaterialOutwardPage } from './pages/MaterialOutwardPage';
import { MaterialStockPage } from './pages/MaterialStockPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductAddPage } from './pages/ProductAddPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductionPage } from './pages/ProductionPage';
import { ProductionJobsPage } from './pages/ProductionJobsPage';
import { ProductionJobAddPage } from './pages/ProductionJobAddPage';
import { ProductionJobDetailPage } from './pages/ProductionJobDetailPage';
import { QualityPage } from './pages/QualityPage';
import { ReportsPage } from './pages/ReportsPage';
import { PayrollReportPage } from './pages/PayrollReportPage';
import { SettingsPage } from './pages/SettingsPage';

const AppRouter: React.FC = () => {
  const { currentPath } = useNavigation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-slate-400">Connecting to Plant Server...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderContent = () => {
    // 1. Dashboard
    if (currentPath === '/' || currentPath === '/dashboard') {
      return <DashboardPage />;
    }

    // 2. Factory Calendar route
    if (currentPath === '/calendar' || currentPath === '/factory-calendar' || currentPath === '/attendance/calendar') {
      return <FactoryCalendarPage />;
    }

    // 3. Workers routes
    if (currentPath === '/workers') {
      return <WorkersPage />;
    }
    if (currentPath === '/workers/add') {
      return <WorkerAddPage />;
    }
    if (currentPath.startsWith('/workers/')) {
      const id = currentPath.split('/')[2];
      return <WorkerDetailPage id={id} />;
    }

    // 3. Attendance routes
    if (currentPath === '/attendance/leaves' || currentPath === '/leaves') {
      return <LeaveManagementPage />;
    }
    if (currentPath === '/attendance') {
      return <DailyAttendanceDetailPage date={getTodayDateString()} />;
    }
    if (currentPath.startsWith('/attendance/day/')) {
      const date = currentPath.split('/')[3]; // YYYY-MM-DD
      return <DailyAttendanceDetailPage date={date} />;
    }
    if (currentPath.startsWith('/attendance/')) {
      const id = currentPath.split('/')[2];
      return <WorkerAttendanceCalendarPage workerId={id} />;
    }

    // 4. Materials routes
    if (currentPath === '/materials') {
      return <MaterialsPage />;
    }
    if (currentPath === '/materials/add') {
      return <MaterialAddPage />;
    }
    if (currentPath === '/materials/inward') {
      return <MaterialInwardPage />;
    }
    if (currentPath === '/materials/outward') {
      return <MaterialOutwardPage />;
    }
    if (currentPath === '/materials/stock') {
      return <MaterialStockPage />;
    }
    if (currentPath.startsWith('/materials/')) {
      const id = currentPath.split('/')[2];
      return <MaterialDetailPage id={id} />;
    }

    // 5. Products routes
    if (currentPath === '/products') {
      return <ProductsPage />;
    }
    if (currentPath === '/products/add') {
      return <ProductAddPage />;
    }
    if (currentPath.startsWith('/products/')) {
      const id = currentPath.split('/')[2];
      return <ProductDetailPage id={id} />;
    }

    // 6. Production routes
    if (currentPath === '/production') {
      return <ProductionPage />;
    }
    if (currentPath === '/production/jobs') {
      return <ProductionJobsPage />;
    }
    if (currentPath === '/production/jobs/add') {
      return <ProductionJobAddPage />;
    }
    if (currentPath.startsWith('/production/jobs/')) {
      const id = currentPath.split('/')[3];
      return <ProductionJobDetailPage id={id} />;
    }

    // 7. Quality
    if (currentPath === '/quality') {
      return <QualityPage />;
    }

    // 8. Reports & Payroll routes
    if (currentPath === '/reports/payroll' || currentPath === '/payroll') {
      return <PayrollReportPage />;
    }
    if (currentPath === '/reports') {
      return <ReportsPage />;
    }

    // 9. Settings
    if (currentPath === '/settings') {
      return <SettingsPage />;
    }

    // Fallback default
    return <DashboardPage />;
  };

  return <AppLayout>{renderContent()}</AppLayout>;
};

export function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <WorkerProvider>
          <AttendanceProvider>
            <FactoryCalendarProvider>
              <MaterialsProvider>
                <ProductsProvider>
                  <ProductionProvider>
                    <QualityProvider>
                      <PayrollProvider>
                        <ToastProvider>
                          <AppRouter />
                        </ToastProvider>
                      </PayrollProvider>
                    </QualityProvider>
                  </ProductionProvider>
                </ProductsProvider>
              </MaterialsProvider>
            </FactoryCalendarProvider>
          </AttendanceProvider>
        </WorkerProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
