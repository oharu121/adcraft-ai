"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// Using inline SVG icons instead of heroicons
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
    try {
      setLoading(true);
      const response = await fetch("/api/gallery/videos");

      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }

      const result = await response.json();
      if (result.success) {
        setVideos(result.data || []);
      } else {
        throw new Error(result.error?.message || "Unknown error");
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-300 rounded-lg aspect-video mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 font-medium mb-2">{t.error.title}</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchVideos}
            className="bg-red-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-red-700 transition-colors"
          >
            {t.error.retry}
          </button>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t.empty.title}
          </h3>
          <p className="text-gray-600 mb-6">{t.empty.description}</p>
          <Link
            href={`/${locale}`}
            className="bg-blue-600 text-white px-6 py-2 rounded cursor-pointer hover:bg-blue-700 transition-colors inline-block"
          >
            {t.empty.createVideo}
          </Link>
        </div>
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
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            {/* Video Thumbnail */}
            <div className="relative aspect-video rounded-t-lg overflow-hidden">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300">
                <div className="bg-white bg-opacity-90 rounded-full p-3 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                  <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>

              {/* Duration Badge */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDuration(video.duration)}
              </div>
            </div>

            {/* Video Info */}
            <div className="p-4">
              <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                {video.title}
              </h3>

              <div className="text-sm text-gray-600 space-y-1">
                <p className="line-clamp-1">{video.productName}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {video.viewCount.toLocaleString()} {t.views}
                  </span>
                  <span>{formatDate(video.createdAt)}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-2 mt-3">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {video.narrativeStyle}
                </span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  {video.musicGenre}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}