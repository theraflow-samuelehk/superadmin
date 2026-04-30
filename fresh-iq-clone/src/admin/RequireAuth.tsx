import { Navigate } from 'react-router-dom';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const ok = sessionStorage.getItem('admin_auth') === '1';
  if (!ok) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
