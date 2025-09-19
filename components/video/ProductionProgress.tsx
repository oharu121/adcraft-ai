"use client";

import React from "react";
import type { Dictionary } from "@/lib/dictionaries";

interface ProductionProgressProps {
  progress: number; // 0-100
  jobId?: string;
  dict: Dictionary;

  // Optional customization
  title?: string;
  description?: string;
  showTimeEstimate?: boolean;
  showJobId?: boolean;

  // Optional styling variant
  variant?: "default" | "compact";
}

export default function ProductionProgress({
  progress,
  jobId,
  dict,
  title,
  description,
  showTimeEstimate = true,
  showJobId = true,
  variant = "default",
}: ProductionProgressProps) {
  const t = dict.videoProducer || dict.common;

  // Calculate estimated time remaining (20% progress per minute)
  const estimatedMinutesRemaining = Math.max(1, Math.round((100 - progress) / 20));

  if (variant === "compact") {
    return (
      <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-medium text-red-300">
            {title || t.production?.producing || "Generating Your Video..."}
          </span>
        </div>
        <div className="w-full bg-red-900/30 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(progress, 10)}%` }}
          ></div>
        </div>
        <div className="text-sm text-red-300">
          {showJobId && jobId && `Job ID: ${jobId.slice(0, 16)}...`}
          {showJobId && jobId && " • "}
          {Math.round(progress)}% complete
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-8">
        {/* Animated Movie Icon */}
        <div className="text-6xl mb-4 animate-pulse">🎬</div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-red-300 mb-2">
          {title || t.production?.producing || "Creating Your Video"}
        </h3>

        {/* Description with spinner */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-spin border-2 border-red-200 border-t-red-500"></div>
          <p className="text-gray-300">
            {description || t.production?.crafting || "Crafting your commercial masterpiece..."}
          </p>
        </div>

        <div className="space-y-4">
          {/* Enhanced Progress Bar with your favorite spinner */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-4 rounded-full transition-all duration-300 relative overflow-hidden"
                  style={{ width: `${Math.max(progress, 5)}%` }}
                >
                  {/* Animated shimmer effect */}
                  <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Percentage */}
          <p className="text-lg font-semibold text-red-300">
            {Math.round(progress)}
            {t.production?.progress || "% Complete"}
          </p>

          {/* Time Estimate */}
          {showTimeEstimate && (
            <p className="text-sm text-gray-400">
              {t.production?.timeRemaining || "Estimated time remaining"}{" "}
              {estimatedMinutesRemaining} {estimatedMinutesRemaining === 1 ? "minute" : "minutes"}
            </p>
          )}

          {/* Job ID */}
          {showJobId && jobId && <p className="text-xs text-gray-500 font-mono">Job ID: {jobId}</p>}

          {/* Production Stages Indicator */}
          <div className="bg-gray-800/50 rounded-lg p-3 text-left">
            <h4 className="text-xs font-medium text-gray-400 mb-2">Production Stage</h4>
            <div className="space-y-1 text-xs">
              {progress < 25 && (
                <div className="flex items-center gap-2 text-red-300">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Analyzing creative direction...
                </div>
              )}
              {progress >= 25 && progress < 50 && (
                <div className="flex items-center gap-2 text-red-300">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Generating video scenes...
                </div>
              )}
              {progress >= 50 && progress < 75 && (
                <div className="flex items-center gap-2 text-red-300">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Adding music and effects...
                </div>
              )}
              {progress >= 75 && progress < 95 && (
                <div className="flex items-center gap-2 text-red-300">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Finalizing commercial video...
                </div>
              )}
              {progress >= 95 && (
                <div className="flex items-center gap-2 text-green-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Almost ready!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
