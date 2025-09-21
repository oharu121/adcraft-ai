import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/dictionaries";
import AboutClient from "./AboutClient";

interface AboutPageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return <AboutClient locale={locale} dict={dict} />;
}