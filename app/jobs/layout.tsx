import React from "react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Jobs',
  description: 'Find the latest job openings across various industries and locations.',
  openGraph: {
    title: 'Browse Jobs | NaukriMili',
    description: 'Find the latest job openings across various industries and locations.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Jobs | NaukriMili',
    description: 'Find the latest job openings across various industries and locations.',
  },
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 