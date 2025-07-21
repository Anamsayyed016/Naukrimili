import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-company-400">
      <div className="mb-4 text-4xl">{icon || '[Icon]'}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
} 