import { RouteLayoutStyles } from '@/components/RouteLayoutStyles';
import './auth-tw.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RouteLayoutStyles layoutId="auth">{children}</RouteLayoutStyles>;
}
