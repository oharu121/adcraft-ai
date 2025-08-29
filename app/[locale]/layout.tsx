import { notFound } from 'next/navigation';
import { getDictionary, type Locale } from '@/lib/dictionaries';
import { Header, Footer } from '@/components/layout';
import ErrorBoundary from '../ErrorBoundary';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

const locales = ['en', 'ja'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * Locale-specific layout that provides internationalization context
 */
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  // Validate that the locale parameter is valid
  if (!locales.includes(locale)) {
    notFound();
  }

  // Get dictionary for this locale
  const dict = await getDictionary(locale as Locale);

  return (
    <>
      <ErrorBoundary>
        <Header dict={dict} locale={locale as Locale} />
        <main className="flex-1">{children}</main>
        <Footer dict={dict} />
      </ErrorBoundary>
    </>
  );
}
