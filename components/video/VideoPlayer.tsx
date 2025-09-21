"use client";

import React, { useCallback } from "react";
import ReactPlayer from "react-player";
import type { Dictionary, Locale } from "@/lib/dictionaries";

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  jobId?: string;
  locale: Locale;
  dict: Dictionary;

  // Video specifications (optional)
  specifications?: {
    format?: string;
    resolution?: string;
    duration?: string;
    narrative?: string;
    music?: string;
  };

  // Action buttons configuration
  actions?: {
    showViewVideo?: boolean;
    showViewGallery?: boolean;
    showDownload?: boolean;
    showCopyLink?: boolean;
    showStartOver?: boolean;
    customActions?: Array<{
      label: string;
      icon: React.ReactNode;
      onClick: () => void;
      variant?: "primary" | "secondary" | "outline" | "special";
    }>;
  };

  // Callbacks
  onCopySuccess?: (message: string) => void;
  onCopyError?: (message: string) => void;
  onStartOver?: () => void;
}

export default function VideoPlayer({
  videoUrl,
  title = "Commercial Video",
  jobId,
  locale,
  dict,
  specifications,
  actions = {
    showViewVideo: true,
    showViewGallery: true,
    showDownload: true,
    showCopyLink: true,
    showStartOver: false,
  },
  onCopySuccess,
  onCopyError,
  onStartOver,
}: VideoPlayerProps) {
  const t = dict.videoProducer || dict.common;

  // Action handlers (enhanced from VideoDisplay but with VideoProducerCard UI)
  const handleDownload = useCallback(async () => {
    try {
      // Enhanced download with fallback
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `commercial-video-${jobId || Date.now()}.mp4`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  }, [videoUrl, jobId]);

  const handleCopyLink = useCallback(async () => {
    try {
      let linkToCopy;

      if (jobId) {
        // Real mode: Copy video detail page URL
        linkToCopy = `${window.location.origin}/${locale}/video/${jobId}`;
      } else {
        // Demo mode: Copy dummy video URL or current video URL
        linkToCopy = videoUrl;
      }

      await navigator.clipboard.writeText(linkToCopy);
      onCopySuccess?.(t.production?.linkCopied || "Link copied successfully!");
    } catch (error) {
      console.error('Failed to copy link:', error);
      onCopyError?.(t.production?.copyFailed || "Failed to copy link");
    }
  }, [locale, jobId, videoUrl, onCopySuccess, onCopyError, t]);

  const handleViewVideo = useCallback(() => {
    window.open(`/${locale}/video/${jobId}`, '_blank');
  }, [locale, jobId]);

  const handleViewGallery = useCallback(() => {
    window.open(`/${locale}/gallery`, '_blank');
  }, [locale]);

  return (
    <div className="bg-green-900/20 border border-green-500/50 rounded-xl p-8">
      <div className="text-6xl mb-4">🎬</div>
      <h3 className="text-2xl font-bold text-green-300 mb-4">
        {t.production?.complete || "Video Complete!"}
      </h3>
      <p className="text-gray-300 mb-6">
        {t.production?.ready || "Your commercial video is ready!"}
      </p>

      {/* Native ReactPlayer - No custom state management */}
      <div className="mb-6">
        <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl mx-auto max-w-2xl">
          <ReactPlayer
            src={videoUrl}
            width="100%"
            height="400px"
            controls={true}
          />
        </div>
      </div>

      {/* Action Buttons - Clean 2x2 + 1 layout */}
      <div className="space-y-4">
        {/* Main Actions Grid - 2x2 layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
          {actions.showViewVideo && jobId && (
            <button
              onClick={handleViewVideo}
              className="magical-button cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {t.production?.viewVideo || "View Video"}
            </button>
          )}

          {actions.showViewGallery && (
            <button
              onClick={handleViewGallery}
              className="cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              {t.production?.viewGallery || "View Gallery"}
            </button>
          )}

          {actions.showDownload && (
            <button
              onClick={handleDownload}
              className="cursor-pointer bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {t.production?.download || "Download"}
            </button>
          )}

          {actions.showCopyLink && (
            <button
              onClick={handleCopyLink}
              className="cursor-pointer border border-green-500 text-green-400 hover:bg-green-500/10 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {t.production?.copyLink || "Copy Link"}
            </button>
          )}

          {/* Custom Actions - In 2x2 grid */}
          {actions.customActions && actions.customActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`cursor-pointer px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 ${
                action.variant === 'primary'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white'
                  : action.variant === 'special'
                  ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white shadow-purple-500/25 hover:shadow-purple-500/40 border border-purple-400/30 hover:border-purple-300/50'
                  : action.variant === 'outline'
                  ? 'border border-gray-500 text-gray-400 hover:bg-gray-500/10'
                  : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white'
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>

        {/* Start Over Button - Centered below the 2x2 grid */}
        {actions.showStartOver && (
          <div className="flex justify-center">
            <button
              onClick={onStartOver}
              className="cursor-pointer bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 border-2 border-gray-500/50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {t.production?.startOver || "Start Over"}
            </button>
          </div>
        )}

        {/* Video Specifications (if provided) */}
        {specifications && (
          <div className="bg-gray-800/50 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-white mb-2">
              {t.production?.specifications || "Video Specifications"}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
              {specifications.format && (
                <div>
                  <span className="text-green-300">{t.production?.format || "Format"}</span>{" "}
                  {specifications.format}
                </div>
              )}
              {specifications.duration && (
                <div>
                  <span className="text-green-300">{t.production?.duration || "Duration"}</span>{" "}
                  {specifications.duration}
                </div>
              )}
              {specifications.narrative && (
                <div>
                  <span className="text-green-300">{t.production?.narrative || "Narrative"}</span>{" "}
                  {specifications.narrative}
                </div>
              )}
              {specifications.music && (
                <div>
                  <span className="text-green-300">{t.production?.music || "Music"}</span>{" "}
                  {specifications.music}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}