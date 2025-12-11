import dynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const ClientMobileTest = dynamic(() => import('./ClientMobileTest'), { ssr: false });

export default function Page() {
  return <ClientMobileTest />;
}
