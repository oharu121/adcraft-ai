"use client";

import React, { useState, useRef, useCallback } from "react";
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
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [showControls, setShowControls] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const t = dict.videoProducer || dict.common;

  // Video event handlers
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoError(null);
    }
  }, []);

  const handleError = useCallback(() => {
    setVideoError("Failed to load video. Please try downloading instead.");
  }, []);

  // Click to play/pause functionality (key feature from VideoProducerCard)
  const handleVideoClick = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  // Enhanced controls
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

      {/* Enhanced Video Player with VideoProducerCard styling */}
      <div className="mb-6">
        <div
          className="relative bg-black rounded-lg overflow-hidden shadow-2xl mx-auto max-w-2xl cursor-pointer"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
            ref={videoRef}
            className="w-full h-auto"
            style={{ maxHeight: "400px" }}
            poster={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23000'/%3E%3Ctext x='400' y='225' text-anchor='middle' fill='%23fff' font-size='24' font-family='Arial'%3E${encodeURIComponent(title)}%3C/text%3E%3C/svg%3E`}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleError}
            onClick={handleVideoClick}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Video Error Overlay */}
          {videoError && (
            <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
              <div className="text-center text-white space-y-2">
                <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm">{videoError}</p>
              </div>
            </div>
          )}

          {/* Play/Pause Overlay (only when not playing or on hover) */}
          {(!isPlaying || showControls) && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
              <div className="w-16 h-16 bg-green-500/80 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg
                  className="w-6 h-6 text-white ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isPlaying ? (
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  ) : (
                    <path d="M8 5v14l11-7z" />
                  )}
                </svg>
              </div>
            </div>
          )}

          {/* Enhanced Controls Overlay */}
          {showControls && duration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 space-y-2">
              {/* Progress Bar */}
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
                }}
              />

              {/* Controls Row */}
              <div className="flex items-center justify-between text-white text-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoClick();
                    }}
                    className="hover:text-green-300 transition-colors"
                  >
                    {isPlaying ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                    </svg>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <span className="text-xs">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          )}
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