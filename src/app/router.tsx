// 集中路由 - 阶段 G: 把 <Routes> 从 App.tsx 抽出,便于 PR3 添加更多路由
import { lazy, Suspense, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';

import ErrorBoundary from '../shared/components/ErrorBoundary.tsx';
import type { RootState } from '../shared/types/index.ts';

// 懒加载页面,降低首屏体积
const Dashboard = lazy(() => import('../features/dashboard/pages/DashboardPage.tsx'));
const RecordList = lazy(() => import('../features/records/pages/RecordsPage.tsx'));
const Goals = lazy(() => import('../features/goals/pages/GoalsPage.tsx'));
const Reminders = lazy(() => import('../features/reminders/pages/RemindersPage.tsx'));
const GrowthTree = lazy(() => import('../features/growth-tree/pages/GrowthTreePage.tsx'));
const Analytics = lazy(() => import('../features/analytics/pages/AnalyticsPage.tsx'));
const Auth = lazy(() => import('../features/auth/pages/LoginPage.tsx'));

// 经验管理系统页面
const ExperiencesPage = lazy(() => import('../features/experiences/pages/ExperiencesPage.tsx'));
const NewExperiencePage = lazy(() => import('../features/experiences/pages/NewExperiencePage.tsx'));
const CapabilitiesPage = lazy(() => import('../features/capabilities/pages/CapabilitiesPage.tsx'));

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

const PageFallback = () => (
  <div className="loading-container">
    <div className="loading"></div>
    <span>加载中...</span>
  </div>
);

const wrap = (Page: React.ComponentType) => (
  <ErrorBoundary>
    <Page />
  </ErrorBoundary>
);

export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<ProtectedRoute>{wrap(Dashboard)}</ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute>{wrap(RecordList)}</ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute>{wrap(Goals)}</ProtectedRoute>} />
        <Route path="/reminders" element={<ProtectedRoute>{wrap(Reminders)}</ProtectedRoute>} />
        <Route path="/growth-tree" element={<ProtectedRoute>{wrap(GrowthTree)}</ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute>{wrap(Analytics)}</ProtectedRoute>} />
        <Route
          path="/experiences"
          element={<ProtectedRoute>{wrap(ExperiencesPage)}</ProtectedRoute>}
        />
        <Route
          path="/experiences/new"
          element={<ProtectedRoute>{wrap(NewExperiencePage)}</ProtectedRoute>}
        />
        <Route
          path="/capabilities"
          element={<ProtectedRoute>{wrap(CapabilitiesPage)}</ProtectedRoute>}
        />
        <Route path="/auth" element={wrap(Auth)} />
      </Routes>
    </Suspense>
  );
}
