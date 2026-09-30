import { Navigate, Route, Routes } from 'react-router-dom';
import { APP_ROUTES } from '../app/constants';
import AppShell from '../components/layout/AppShell';
import ExamenesPage from '../pages/admin/ExamenesPage';
import ExamenDetallePage from '../pages/admin/ExamenDetallePage';
import ExamenResponderPage from '../pages/public/ExamenResponderPage';

const AppRoutes = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route path={APP_ROUTES.examenes} element={<ExamenesPage />} />
      <Route path={APP_ROUTES.examenDetalle} element={<ExamenDetallePage />} />
    </Route>

    <Route path={APP_ROUTES.examenResponder} element={<ExamenResponderPage />} />

    <Route path="*" element={<Navigate to={APP_ROUTES.examenes} replace />} />
  </Routes>
);

export default AppRoutes;
