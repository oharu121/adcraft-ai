"use client";

import { useState } from "react";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import AgentAvatar from "@/components/ui/AgentAvatar";

interface AgentStep {
  id: string;
  agent: "maya" | "david" | "zara";
  phase: string;
  description: string;
  timestamp?: Date;
  data?: {
    // Maya's product analysis data
    productAnalysis?: {
      keyFeatures?: string[];
      targetAudience?: string;
      keyMessages?: string[];
      confidenceScore?: number;
      category?: string;
      benefits?: string[];
    };
    // David's creative direction data
    creativeDirection?: {
      name?: string;
      description?: string;
      colorPalette?: string[];
      visualKeywords?: string[];
      visualStyle?: string;
      narrativeStyle?: string;
      musicGenre?: string;
      pacing?: string;
    };
    // Zara's production data
    productionMetadata?: {
      videoFormat?: string;
      resolution?: string;
      aspectRatio?: string;
      frameRate?: number;
      duration?: number;
    };
  };
}

interface AgentJourneyTimelineProps {
  dict: Dictionary;
  locale: Locale;
  videoData: {
    productAnalysis?: {
      keyFeatures?: string[];
      targetAudience?: string;
      keyMessages?: string[];
      confidenceScore?: number;
      category?: string;
      benefits?: string[];
    };
    creativeDirection?: {
      name?: string;
      description?: string;
      colorPalette?: string[];
      visualKeywords?: string[];
      visualStyle?: string;
      narrativeStyle?: string;
      musicGenre?: string;
      pacing?: string;
    };
    productionSpecs?: {
      resolution?: string;
      aspectRatio?: string;
      frameRate?: number;
    };
    narrativeStyle?: string;
    musicGenre?: string;
    videoFormat?: string;
    duration?: number;
  };
  className?: string;
}

const agentConfig = {
  maya: {
    name: "Maya",
    role: "Product Intelligence Specialist",
    color: "from-purple-500 to-blue-500",
    bgColor: "bg-purple-50",
    avatar: <AgentAvatar agent="maya" size="md" state="idle" />,
  },
  david: {
    name: "David",
    role: "Creative Director",
    color: "from-indigo-500 to-purple-500",
    bgColor: "bg-indigo-50",
    avatar: <AgentAvatar agent="david" size="md" state="idle" />,
  },
  zara: {
    name: "Zara",
    role: "Video Producer",
    color: "from-pink-500 to-orange-500",
    bgColor: "bg-pink-50",
    iconColor: "text-pink-600",
    avatar: <AgentAvatar agent="zara" size="md" state="idle" />,
  },
};

export default function AgentJourneyTimeline({
  dict,
  locale,
  videoData,
  className = "",
}: AgentJourneyTimelineProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const t = dict.agentJourney;

  // Generate agent journey steps based on available data
  const generateJourneySteps = (): AgentStep[] => {
    const steps: AgentStep[] = [];

    // Maya's product analysis step
    steps.push({
      id: "maya-analysis",
      agent: "maya",
      phase: t.agents.maya.phase,
      description: t.agents.maya.description,
      data: { productAnalysis: videoData.productAnalysis },
    });

    // David's creative direction step
    steps.push({
      id: "david-creative",
      agent: "david",
      phase: t.agents.david.phase,
      description: t.agents.david.description,
      data: { creativeDirection: videoData.creativeDirection },
    });

    // Zara's video production step
    steps.push({
      id: "zara-production",
      agent: "zara",
      phase: t.agents.zara.phase,
      description: t.agents.zara.description,
      data: {
        productionMetadata: {
          videoFormat: videoData.videoFormat,
          resolution: videoData.productionSpecs?.resolution,
          aspectRatio: videoData.productionSpecs?.aspectRatio,
          frameRate: videoData.productionSpecs?.frameRate,
          duration: videoData.duration,
        },
      },
    });

    return steps;
  };

  const steps = generateJourneySteps();

  const toggleExpanded = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "Unknown";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`glass-card rounded-xl p-6 border border-gray-600/30 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">🤖 {t.title}</h2>
          <p className="text-gray-300">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          {t.collaboration}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/60 via-indigo-500/60 to-pink-500/60"></div>

        <div className="space-y-6">
          {steps.map((step, index) => {
            const agent = agentConfig[step.agent];
            const isExpanded = expandedStep === step.id;

            return (
              <div key={step.id} className="relative flex items-start gap-4">
                {/* Agent Avatar */}
                <div className="mr-2">{agent.avatar}</div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`glass-card rounded-lg p-4 cursor-pointer transition-all duration-200 border border-gray-600/30 ${
                      isExpanded
                        ? "shadow-lg scale-105 border-gray-500/50"
                        : "shadow-sm hover:shadow-md hover:border-gray-500/40"
                    }`}
                    onClick={() => toggleExpanded(step.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{agent.name}</h3>
                          <span className="text-xs bg-gray-700/50 px-2 py-1 rounded-full text-gray-300 border border-gray-600/50">
                            {agent.role}
                          </span>
                          <svg
                            className="w-4 h-4 text-green-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-200 mb-1 font-medium">{step.phase}</p>
                        <p className="text-sm text-gray-300">{step.description}</p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && step.data && (
                      <div className="mt-4 pt-4 border-t border-gray-600/50 space-y-3">
                        {/* Maya's Product Analysis */}
                        {step.data.productAnalysis && (
                          <div className="space-y-3">
                            {step.data.productAnalysis.category && (
                              <div>
                                <span className="text-xs font-medium text-purple-300 uppercase">
                                  {t.fields.category}
                                </span>
                                <p className="text-sm text-gray-200">
                                  {step.data.productAnalysis.category}
                                </p>
                              </div>
                            )}
                            {step.data.productAnalysis.targetAudience && (
                              <div>
                                <span className="text-xs font-medium text-purple-300 uppercase">
                                  {t.fields.targetAudience}
                                </span>
                                <p className="text-sm text-gray-200">
                                  {step.data.productAnalysis.targetAudience}
                                </p>
                              </div>
                            )}
                            {step.data.productAnalysis.keyFeatures &&
                              step.data.productAnalysis.keyFeatures.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-purple-300 uppercase">
                                    {t.fields.keyFeatures}
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {step.data.productAnalysis.keyFeatures.map((feature, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs bg-purple-600/80 text-purple-100 px-2 py-1 rounded backdrop-blur-sm"
                                      >
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            {step.data.productAnalysis.keyMessages &&
                              step.data.productAnalysis.keyMessages.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-purple-300 uppercase">
                                    {t.fields.keyMessages}
                                  </span>
                                  <ul className="text-sm text-gray-200 space-y-1">
                                    {step.data.productAnalysis.keyMessages.map((message, idx) => (
                                      <li key={idx} className="flex items-start gap-2">
                                        <span className="text-purple-400 mt-1">•</span>
                                        {message}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            {step.data.productAnalysis.confidenceScore && (
                              <div>
                                <span className="text-xs font-medium text-purple-300 uppercase">
                                  {t.fields.confidenceScore}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-20 h-2 bg-purple-700/50 rounded-full">
                                    <div
                                      className="h-2 bg-purple-400 rounded-full"
                                      style={{
                                        width: `${step.data.productAnalysis.confidenceScore * 100}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-200">
                                    {Math.round(step.data.productAnalysis.confidenceScore * 100)}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* David's Creative Direction */}
                        {step.data.creativeDirection && (
                          <div className="space-y-3">
                            {step.data.creativeDirection.name && (
                              <div>
                                <span className="text-xs font-medium text-indigo-300 uppercase">
                                  {t.fields.creativeStyle}
                                </span>
                                <p className="text-sm text-gray-200">
                                  {step.data.creativeDirection.name}
                                </p>
                              </div>
                            )}
                            {step.data.creativeDirection.description && (
                              <div>
                                <span className="text-xs font-medium text-indigo-300 uppercase">
                                  {t.fields.creativeVision}
                                </span>
                                <p className="text-sm text-gray-200">
                                  {step.data.creativeDirection.description}
                                </p>
                              </div>
                            )}
                            {step.data.creativeDirection.narrativeStyle && (
                              <div>
                                <span className="text-xs font-medium text-indigo-300 uppercase">
                                  {t.fields.narrativeStyle}
                                </span>
                                <p className="text-sm text-gray-200">
                                  {step.data.creativeDirection.narrativeStyle}
                                </p>
                              </div>
                            )}
                            {step.data.creativeDirection.musicGenre && (
                              <div>
                                <span className="text-xs font-medium text-indigo-300 uppercase">
                                  {t.fields.musicGenre}
                                </span>
                                <p className="text-sm text-gray-200">
                                  {step.data.creativeDirection.musicGenre}
                                </p>
                              </div>
                            )}
                            {step.data.creativeDirection.colorPalette &&
                              step.data.creativeDirection.colorPalette.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-indigo-300 uppercase">
                                    {t.fields.colorPalette}
                                  </span>
                                  <div className="flex gap-2 mt-1">
                                    {step.data.creativeDirection.colorPalette.map((color, idx) => (
                                      <div
                                        key={idx}
                                        className="w-8 h-8 rounded border-2 border-gray-500/50 shadow-sm"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            {step.data.creativeDirection.visualKeywords &&
                              step.data.creativeDirection.visualKeywords.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-indigo-300 uppercase">
                                    {t.fields.visualKeywords}
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {step.data.creativeDirection.visualKeywords.map(
                                      (keyword, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs bg-indigo-600/80 text-indigo-100 px-2 py-1 rounded backdrop-blur-sm"
                                        >
                                          {keyword}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {/* Zara's Production Metadata */}
                        {step.data.productionMetadata && (
                          <div className="grid grid-cols-2 gap-3">
                            {step.data.productionMetadata.videoFormat && (
                              <div>
                                <span className="text-xs font-medium text-pink-300 uppercase">
                                  {t.fields.videoFormat}
                                </span>
                                <p className="text-sm text-gray-200">
                                  {step.data.productionMetadata.videoFormat}
                                </p>
                              </div>
                            )}
                            {step.data.productionMetadata.resolution && (
                              <div>
                                <span className="text-xs font-medium text-pink-300 uppercase">
                                  {t.fields.resolution}
                                </span>
                                <p className="text-sm text-gray-200">
                                  {step.data.productionMetadata.resolution}
                                </p>
                              </div>
                            )}
                            {step.data.productionMetadata.aspectRatio && (
                              <div>
                                <span className="text-xs font-medium text-pink-300 uppercase">
                                  {t.fields.aspectRatio}
                                </span>
                                <p className="text-sm text-gray-200">
                                  {step.data.productionMetadata.aspectRatio}
                                </p>
                              </div>
                            )}
                            {step.data.productionMetadata.frameRate && (
                              <div>
                                <span className="text-xs font-medium text-pink-300 uppercase">
                                  Frame Rate
                                </span>
                                <p className="text-sm text-gray-200">
                                  {step.data.productionMetadata.frameRate}fps
                                </p>
                              </div>
                            )}
                            {step.data.productionMetadata.duration && (
                              <div>
                                <span className="text-xs font-medium text-pink-300 uppercase">
                                  {t.fields.duration}
                                </span>
                                <p className="text-sm text-gray-200">
                                  {formatDuration(step.data.productionMetadata.duration)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
