import NexusAuthGuard from '@/components/NexusAuthGuard';
import NexusAuthCTA from '@/components/NexusAuthCTA';

export default function NexusDashboardPage() {
  return (
    <NexusAuthGuard requireProfileCompletion={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <NexusAuthCTA variant="dashboard" />
        </div>
      </div>
    </NexusAuthGuard>
  );
} 