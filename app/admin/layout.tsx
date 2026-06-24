import { RouteLayoutStyles } from '@/components/RouteLayoutStyles';
import './admin-tw.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RouteLayoutStyles layoutId="admin">{children}</RouteLayoutStyles>;
}
