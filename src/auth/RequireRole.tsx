import { Navigate } from 'react-router-dom';

interface Props {
  allowed: string[];
  children: JSX.Element;
}

export default function RequireRole({ allowed, children }: Props) {
  const role = sessionStorage.getItem('role') ?? '';
  if (!allowed.includes(role)) return <Navigate to="/books" replace />;
  return children;
}