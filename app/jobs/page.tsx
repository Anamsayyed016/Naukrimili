"use client";
import { useSearchParams } from 'next/navigation';
import IndianJobPortal from "@/components/IndianJobPortal";

export default function JobsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const location = searchParams.get('location') || 'Mumbai';

  return <IndianJobPortal initialQuery={query} initialLocation={location} />;
}
