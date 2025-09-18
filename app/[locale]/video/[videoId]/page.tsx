import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/dictionaries";
import VideoDetailPage from "@/components/video/VideoDetailPage";
import { notFound } from "next/navigation";

interface VideoPageProps {
  params: Promise<{
    locale: Locale;
    videoId: string;
  }>;
}

async function getVideoData(videoId: string) {
  try {
    // This will be handled by our API route
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/video/${videoId}/details`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Error fetching video data:', error);
    return null;
  }
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { locale, videoId } = await params;
  const dict = await getDictionary(locale);
  const videoData = await getVideoData(videoId);

  if (!videoData) {
    notFound();
  }

  return (
    <VideoDetailPage
      dict={dict}
      locale={locale}
      videoData={videoData}
      videoId={videoId}
    />
  );
}

export async function generateMetadata({ params }: VideoPageProps) {
  const { videoId } = await params;
  const videoData = await getVideoData(videoId);

  if (!videoData) {
    return {
      title: 'Video Not Found',
    };
  }

  return {
    title: `${videoData.title} | AdCraft AI`,
    description: videoData.description || `Commercial video for ${videoData.productName}`,
    openGraph: {
      title: videoData.title,
      description: videoData.description || `Commercial video for ${videoData.productName}`,
      images: videoData.thumbnailUrl ? [videoData.thumbnailUrl] : [],
      type: 'video.other',
    },
    twitter: {
      card: 'player',
      title: videoData.title,
      description: videoData.description || `Commercial video for ${videoData.productName}`,
      images: videoData.thumbnailUrl ? [videoData.thumbnailUrl] : [],
    },
  };
}