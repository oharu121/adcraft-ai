'use client';

import { useState, useRef, forwardRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils/cn';

export interface VideoDisplayProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  prompt?: string;
  jobId?: string;
  isLoading?: boolean;
  error?: string;
  onDownload?: (url: string) => void;
  onRegenerate?: () => void;
  onShare?: (url: string) => void;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
}

/**
 * Video player component with download and sharing capabilities
 * Handles loading states, errors, and video controls
 */
export const VideoDisplay = forwardRef<HTMLDivElement, VideoDisplayProps>(
  (
    {
      videoUrl,
      thumbnailUrl,
      title = 'Generated Video',
      prompt,
      jobId,
      isLoading = false,
      error,
      onDownload,
      onRegenerate,
      onShare,
      className,
      autoPlay = false,
      controls = true,
      muted = true,
    },
    ref
  ) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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

    const handleError = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      console.error('Video error:', e);
      setVideoError('Failed to load video. Please try downloading instead.');
    }, []);

    const togglePlayPause = useCallback(() => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
      }
    }, [isPlaying]);

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

    const toggleFullscreen = useCallback(() => {
      if (containerRef.current) {
        if (!isFullscreen) {
          containerRef.current.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
        setIsFullscreen(!isFullscreen);
      }
    }, [isFullscreen]);

    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDownload = useCallback(async () => {
      if (videoUrl && onDownload) {
        onDownload(videoUrl);
      } else if (videoUrl) {
        // Fallback download
        try {
          const response = await fetch(videoUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `video-${jobId || Date.now()}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Download failed:', error);
        }
      }
    }, [videoUrl, onDownload, jobId]);

    const handleShare = useCallback(async () => {
      if (videoUrl && onShare) {
        onShare(videoUrl);
      } else if (videoUrl && navigator.share) {
        try {
          await navigator.share({
            title: title,
            text: prompt ? `Check out this AI-generated video: "${prompt}"` : 'Check out this AI-generated video!',
            url: videoUrl,
          });
        } catch (error) {
          console.log('Sharing failed or cancelled:', error);
        }
      } else if (videoUrl) {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(videoUrl);
          // You could add a toast notification here
        } catch (error) {
          console.error('Copy to clipboard failed:', error);
        }
      }
    }, [videoUrl, onShare, title, prompt]);

    if (isLoading) {
      return (
        <Card ref={ref} className={cn('w-full', className)}>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" variant="primary" />
              <p className="text-sm text-gray-600">Loading your video...</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (error || (!videoUrl && !isLoading)) {
      return (
        <Card ref={ref} className={cn('w-full', className)}>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <svg className="h-12 w-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Video Unavailable</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {error || 'The video could not be loaded.'}
                </p>
              </div>
              {onRegenerate && (
                <Button onClick={onRegenerate} variant="outline">
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card ref={ref} className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{title}</span>
            </div>
            
            {jobId && (
              <span className="text-sm font-mono text-gray-500">
                ID: {jobId.slice(0, 8)}...
              </span>
            )}
          </CardTitle>

          {prompt && (
            <p className="text-sm text-gray-600 italic">
              "{prompt}"
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Video Player */}
          <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-auto"
              poster={thumbnailUrl}
              autoPlay={autoPlay}
              muted={muted}
              onPlay={handlePlay}
              onPause={handlePause}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleError}
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

            {/* Play Button Overlay */}
            {!isPlaying && !videoError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={togglePlayPause}
                  className="bg-black/50 hover:bg-black/75 text-white rounded-full p-4 transition-colors"
                  aria-label="Play video"
                >
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Custom Controls */}
          {controls && videoUrl && (
            <div className="space-y-2">
              {/* Progress Bar */}
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlayPause}
                    className="p-2 hover:bg-gray-100 rounded"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
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
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <span className="text-sm text-gray-600">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-gray-100 rounded"
                  aria-label="Toggle fullscreen"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleDownload}
              variant="primary"
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            >
              Download
            </Button>

            <Button
              onClick={handleShare}
              variant="outline"
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              }
            >
              Share
            </Button>

            {onRegenerate && (
              <Button
                onClick={onRegenerate}
                variant="ghost"
                leftIcon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
              >
                Regenerate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

VideoDisplay.displayName = 'VideoDisplay';