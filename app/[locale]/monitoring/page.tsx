import { Metadata } from 'next';
import { getDictionary } from '@/lib/dictionaries';
import { MonitoringDashboard } from '@/components/monitoring';

interface MonitoringPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: MonitoringPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as 'en' | 'ja');

  return {
    title: `${dictionary.monitoring.title} - ${dictionary.header.title}`,
    description: dictionary.monitoring.subtitle,
    robots: {
      index: false, // Don't index monitoring page for security
      follow: false,
    },
  };
}

export default async function MonitoringPage({ params }: MonitoringPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as 'en' | 'ja');

  return (
    <div className="container mx-auto px-4 py-8">
      <MonitoringDashboard
        dictionary={dictionary}
        autoRefresh={true}
        refreshInterval={30000} // 30 seconds
        className="max-w-7xl mx-auto"
      />
    </div>
  );
}