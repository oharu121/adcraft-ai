"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
// Using inline SVG icons instead of heroicons
import type { Dictionary, Locale } from "@/lib/dictionaries";

interface VideoData {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  createdAt: string;
  viewCount: number;
  productName: string;
  narrativeStyle: string;
  musicGenre: string;
  videoFormat: string;
  // Maya analysis data
  productAnalysis?: {
    category: string;
    targetAudience: string;
    keyMessages: string[];
    benefits: string[];
  };
  // David creative data
  creativeDirection?: {
    name: string;
    description: string;
    colorPalette: string[];
    visualKeywords: string[];
  };
  // Production specs
  productionSpecs?: {
    resolution: string;
    aspectRatio: string;
    frameRate: number;
  };
}

interface VideoDetailPageProps {
  dict: Dictionary;
  locale: Locale;
  videoData: VideoData;
  videoId: string;
}

export default function VideoDetailPage({
  dict,
  locale,
  videoData,
  videoId
}: VideoDetailPageProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [viewCount, setViewCount] = useState(videoData.viewCount);

  const t = dict.videoDetail;

  // Track video view
  useEffect(() => {
    trackVideoView();
  }, [videoId]);

  const trackVideoView = async () => {
    try {
      const response = await fetch(`/api/video/${videoId}/view`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.viewCount) {
          setViewCount(result.data.viewCount);
        }
      }
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  const copyVideoLink = useCallback(() => {
    const fullUrl = `${window.location.origin}/${locale}/video/${videoId}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
  }, [locale, videoId]);

  const shareOnTwitter = useCallback(() => {
    const fullUrl = `${window.location.origin}/${locale}/video/${videoId}`;
    const text = `Check out this amazing commercial video created with AdCraft AI: ${videoData.title}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullUrl)}`;
    window.open(twitterUrl, '_blank');
  }, [locale, videoId, videoData.title]);

  const shareOnFacebook = useCallback(() => {
    const fullUrl = `${window.location.origin}/${locale}/video/${videoId}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
    window.open(facebookUrl, '_blank');
  }, [locale, videoId]);

  const downloadVideo = useCallback(async () => {
    try {
      // Fetch the video blob
      const response = await fetch(videoData.videoUrl);
      const blob = await response.blob();

      // Create a temporary download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${videoData.title || 'commercial-video'}.mp4`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading video:', error);
      // Fallback: open video in new tab
      window.open(videoData.videoUrl, '_blank');
    }
  }, [videoData.videoUrl, videoData.title]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/${locale}/gallery`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t.backToGallery}
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Section */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-6">
              <video
                src={videoData.videoUrl}
                poster={videoData.thumbnailUrl}
                controls
                className="w-full h-full"
                preload="metadata"
              >
                {t.videoNotSupported}
              </video>
            </div>

            {/* Video Info */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {videoData.title}
              </h1>

              {/* Stats and Actions */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b">
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {viewCount.toLocaleString()} {t.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(videoData.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    {formatDuration(videoData.duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`flex items-center gap-1 px-3 py-2 rounded cursor-pointer transition-colors ${
                      isLiked
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isLiked ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                    {t.like}
                  </button>

                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`flex items-center gap-1 px-3 py-2 rounded cursor-pointer transition-colors ${
                      isSaved
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isSaved ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 3v18l-5-3-5 3V3a2 2 0 012-2h6a2 2 0 012 2z" />
                      </svg>
                    )}
                    {t.save}
                  </button>

                  <button
                    onClick={downloadVideo}
                    className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t.download}
                  </button>

                  <div className="relative">
                    <button
                      onClick={copyVideoLink}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {t.copyLink}
                    </button>

                    {showCopied && (
                      <div className="absolute top-full left-0 mt-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {t.linkCopied}
                      </div>
                    )}
                  </div>

                  <div className="relative group">
                    <button className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded cursor-pointer hover:bg-gray-200 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      {t.share}
                    </button>

                    <div className="absolute top-full right-0 mt-2 bg-white border rounded-lg shadow-lg py-2 min-w-48 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={shareOnTwitter}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer"
                      >
                        {t.shareOnTwitter}
                      </button>
                      <button
                        onClick={shareOnFacebook}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer"
                      >
                        {t.shareOnFacebook}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {videoData.description && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">{t.description}</h3>
                  <p className="text-gray-600 leading-relaxed">{videoData.description}</p>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {videoData.narrativeStyle}
                </span>
                <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                  {videoData.musicGenre}
                </span>
                <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full">
                  {videoData.videoFormat}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">{t.productInfo}</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">{t.productName}</span>
                  <p className="text-gray-900">{videoData.productName}</p>
                </div>

                {videoData.productAnalysis?.category && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">{t.category}</span>
                    <p className="text-gray-900">{videoData.productAnalysis.category}</p>
                  </div>
                )}

                {videoData.productAnalysis?.targetAudience && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">{t.targetAudience}</span>
                    <p className="text-gray-900">{videoData.productAnalysis.targetAudience}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Specs */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">{t.technicalSpecs}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.duration}</span>
                  <span className="text-gray-900">{formatDuration(videoData.duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.aspectRatio}</span>
                  <span className="text-gray-900">{videoData.productionSpecs?.aspectRatio || "16:9"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.resolution}</span>
                  <span className="text-gray-900">{videoData.productionSpecs?.resolution || "720p"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.frameRate}</span>
                  <span className="text-gray-900">{videoData.productionSpecs?.frameRate || 24}fps</span>
                </div>
              </div>
            </div>

            {/* Creative Details */}
            {videoData.creativeDirection && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">{t.creativeDirection}</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">{t.style}</span>
                    <p className="text-gray-900">{videoData.creativeDirection.name}</p>
                  </div>

                  {videoData.creativeDirection.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">{t.mood}</span>
                      <p className="text-gray-900 text-sm">{videoData.creativeDirection.description}</p>
                    </div>
                  )}

                  {videoData.creativeDirection.colorPalette?.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">{t.colorPalette}</span>
                      <div className="flex gap-1 mt-1">
                        {videoData.creativeDirection.colorPalette.map((color, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Report Button */}
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              {t.reportVideo}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}