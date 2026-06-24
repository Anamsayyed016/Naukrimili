import React from 'react';
import { RouteLayoutStyles } from '@/components/RouteLayoutStyles';
import './jobs-scope.css';
import './jobs-tw.css';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RouteLayoutStyles layoutId="jobs">{children}</RouteLayoutStyles>;
}
