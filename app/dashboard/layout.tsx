import { RouteLayoutStyles } from '@/components/RouteLayoutStyles';
import './dashboard-tw.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RouteLayoutStyles layoutId="dashboard">{children}</RouteLayoutStyles>;
}
