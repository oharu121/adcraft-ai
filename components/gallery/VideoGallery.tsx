"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import type { Dictionary, Locale } from "@/lib/dictionaries";

interface VideoItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  createdAt: Date;
  viewCount: number;
  productName: string;
  narrativeStyle: string;
  musicGenre: string;
}

interface VideoGalleryProps {
  dict: Dictionary;
  locale: Locale;
}

export default function VideoGallery({ dict, locale }: VideoGalleryProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = dict.gallery;

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    console.log("[VIDEO GALLERY] Starting video fetch...");
    try {
      setLoading(true);
      console.log("[VIDEO GALLERY] Making API request to /api/gallery/videos");

      const response = await fetch("/api/gallery/videos");
      console.log("[VIDEO GALLERY] API response status:", response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log("[VIDEO GALLERY] API response data:", {
        success: result.success,
        dataLength: result.data?.length,
        pagination: result.pagination,
        firstVideo: result.data?.[0] ? {
          id: result.data[0].id,
          title: result.data[0].title,
          hasVideoUrl: !!result.data[0].videoUrl,
          createdAt: result.data[0].createdAt,
          createdAtType: typeof result.data[0].createdAt
        } : null
      });

      if (result.success) {
        const videos = result.data || [];
        console.log("[VIDEO GALLERY] Processing videos:", videos.length);

        // Validate each video object
        const validatedVideos = videos.map((video: any, index: number) => {
          const createdAtDate = new Date(video.createdAt);
          const isValidDate = !isNaN(createdAtDate.getTime());

          console.log(`[VIDEO GALLERY] Video ${index + 1} (${video.id}):`, {
            hasVideoUrl: !!video.videoUrl,
            hasTitle: !!video.title,
            createdAtRaw: video.createdAt,
            createdAtParsed: createdAtDate,
            dateIsValid: isValidDate
          });

          return {
            ...video,
            createdAt: isValidDate ? createdAtDate : new Date()
          };
        });

        setVideos(validatedVideos);
        console.log("[VIDEO GALLERY] Videos set successfully:", validatedVideos.length);
      } else {
        throw new Error(result.error?.message || "Unknown error");
      }
    } catch (err) {
      console.error("[VIDEO GALLERY] Error fetching videos:", err);
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
      console.log("[VIDEO GALLERY] Fetch completed");
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date | null | undefined): string => {
    console.log("[VIDEO GALLERY] formatDate called with:", { date, type: typeof date, isDate: date instanceof Date });

    // Handle invalid or missing dates
    if (!date || isNaN(date.getTime())) {
      console.log("[VIDEO GALLERY] Using fallback date");
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date()); // Use current date as fallback
    }

    const formatted = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);

    console.log("[VIDEO GALLERY] Formatted date:", { original: date, formatted });
    return formatted;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} variant="magical" className="animate-pulse p-0">
            <div className="bg-gray-700 rounded-t-lg aspect-video mb-3"></div>
            <div className="space-y-2 p-4">
              <div className="h-4 bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-600 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Card variant="magical" className="p-6 max-w-md mx-auto">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-300 font-medium mb-2">{t.error.title}</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchVideos}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg cursor-pointer font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {t.error.retry}
          </button>
        </Card>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <Card variant="magical" className="p-8 max-w-md mx-auto">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-bold text-white mb-2">
            {t.empty.title}
          </h3>
          <p className="text-gray-300 mb-6">{t.empty.description}</p>
          <Link
            href={`/${locale}`}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg cursor-pointer font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 inline-block"
          >
            {t.empty.createVideo}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/${locale}/video/${video.id}`}
          className="group cursor-pointer"
        >
          <Card variant="magical" hover={true} className="p-0 overflow-hidden transition-all duration-300 hover:scale-105">
            {/* Video Thumbnail */}
            <div className="relative aspect-video overflow-hidden">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />

              {/* Glass Play Button Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all duration-300">
                <div className="glass-card rounded-full p-4 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>

              {/* Duration Badge */}
              <div className="absolute bottom-3 right-3 glass-card text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDuration(video.duration)}
              </div>
            </div>

            {/* Video Info */}
            <div className="p-4">
              <h3 className="font-semibold text-white line-clamp-2 mb-3 group-hover:text-red-300 transition-colors">
                {video.title}
              </h3>

              <div className="text-sm text-gray-300 space-y-2">
                <p className="line-clamp-1 text-gray-400">{video.productName}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-gray-400">{video.viewCount.toLocaleString()} {t.views}</span>
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(video.createdAt)}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-2 mt-3">
                <span className="bg-red-600/80 text-red-100 text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {video.narrativeStyle}
                </span>
                <span className="bg-orange-600/80 text-orange-100 text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {video.musicGenre}
                </span>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}