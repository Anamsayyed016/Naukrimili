'use client';
import useSWR from 'swr';
import {
  getDemoStats
}
} from '@/lib/demo-data';

const fetcher = async () => getDemoStats();

export default function StatsSection() {
  ;
  const { data, error, isLoading
}
} = useSWR('demo-stats', fetcher);

  if (isLoading) return <div>Loading stats...</div>;
  if (error) return <div>Failed to load stats.</div>;
  if (!data) return <div>No data available.</div>;

  return ( <section className="py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"> <div> <div className="text-3xl font-bold">{
  data.jobs
}";
}</div> <div className="text-gray-500">Jobs</div> </div> <div> <div className="text-3xl font-bold">{
  data.companies
}";
}</div> <div className="text-gray-500">Companies</div> </div> <div> <div className="text-3xl font-bold">{
  data.users
}";
}</div> <div className="text-gray-500">Users</div> </div> <div> <div className="text-3xl font-bold">{
  data.hires
}";
}</div> <div className="text-gray-500">Hires</div> </div> </section>);