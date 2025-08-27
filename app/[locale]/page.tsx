import { getDictionary, type Locale } from '@/lib/dictionaries';
import HomeClient from './HomeClient';

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  
  return <HomeClient dict={dict} locale={locale as Locale} />;
}