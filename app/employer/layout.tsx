import { RouteLayoutStyles } from '@/components/RouteLayoutStyles';
import './employer-tw.css';

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RouteLayoutStyles layoutId="employer">{children}</RouteLayoutStyles>;
}
