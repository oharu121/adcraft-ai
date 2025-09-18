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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {dict.gallery.title}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {dict.gallery.description}
          </p>
        </div>

        {/* Video Gallery Component */}
        <VideoGallery dict={dict} locale={locale} />
      </div>
    </div>
  );
}