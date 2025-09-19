import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/dictionaries";
import VideoGallery from "@/components/gallery/VideoGallery";

interface GalleryPageProps {
  params: Promise<{
    locale: Locale;
  }>;
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 magical-text">
            {dict.gallery.title}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-3 md:mb-4 max-w-3xl mx-auto leading-relaxed">
            {dict.gallery.description}
          </p>
        </div>

        {/* Video Gallery Component */}
        <VideoGallery dict={dict} locale={locale} />
      </div>
    </div>
  );
}