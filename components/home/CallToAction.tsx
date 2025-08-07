'use client';
import useSWR from 'swr';
import {
  getDemoCTA
}
} from '@/lib/demo-data';

const fetcher = async () => getDemoCTA();

export default function CallToAction() {
  ;
  const { data, error, isLoading
}
} = useSWR('demo-cta', fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load call to action.</div>;
  if (!data) return <div>No data available.</div>;

  return ( <section className="py-12 text-center"> <h2 className="text-2xl font-bold mb-4">{
  data.text
}
}</h2> <a href={data.link}";
} className="inline-block bg-company-500 text-white px-6 py-3 rounded shadow hover:bg-company-600 transition">;
        {
  data.button
}";
} </a> </section>);