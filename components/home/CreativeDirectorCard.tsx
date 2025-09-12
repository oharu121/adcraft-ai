/**
 * Creative Director Card - David's Main Interface
 *
 * Main card component for Creative Director (David) agent featuring:
 * - Maya → David handoff UI transition
 * - Visual assets review interface with expandable sections
 * - David's chat interface toggle (similar to Maya's strategy/chat toggle)
 * - Generated asset gallery with preview and management capabilities
 * - David → Alex handoff preparation UI
 */

"use client";

import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui";
import { useCreativeDirectorStore } from "@/lib/stores/creative-director-store";
import AgentAvatar from "@/components/ui/AgentAvatar";
import CreativeChatContainer from "@/components/creative-director/CreativeChatContainer";
import type { Dictionary } from "@/lib/dictionaries";
import {
  CreativePhase,
  SessionStatus,
  AssetType,
  AssetStatus,
} from "@/lib/agents/creative-director/enums";

interface CreativeDirectorCardProps {
  dict: Dictionary;
  locale?: "en" | "ja";
  onScrollToChatSection?: () => void;
}

// Helper function to map AssetType to display names
const getAssetTypeDisplayName = (type: AssetType): string => {
  const typeMap: Record<AssetType, string> = {
    [AssetType.BACKGROUND]: "Backgrounds",
    [AssetType.PRODUCT_HERO]: "Product Hero Shots",
    [AssetType.LIFESTYLE_SCENE]: "Lifestyle Scenes",
    [AssetType.OVERLAY]: "Overlays & Graphics",
    [AssetType.MOOD_BOARD]: "Mood Boards",
    [AssetType.STYLE_FRAME]: "Style Frames",
    [AssetType.COLOR_PALETTE]: "Color Palettes",
    [AssetType.COMPOSITION_GUIDE]: "Composition Guides",
    [AssetType.TEXTURE]: "Textures",
    [AssetType.PATTERN]: "Patterns",
    [AssetType.LIGHTING_REFERENCE]: "Lighting References",
    [AssetType.TYPOGRAPHY_TREATMENT]: "Typography Treatments",
  };
  return typeMap[type] || type;
};

export default function CreativeDirectorCard({
  dict,
  locale = "en",
  onScrollToChatSection,
}: CreativeDirectorCardProps) {
  const {
    sessionId,
    sessionStatus,
    isConnected,
    isAgentTyping,
    mayaHandoffData,
    currentPhase,
    showCreativeChat,
    showAssetGallery,
    messages,
    assets,
    assetGenerationProgress,
    visualDecisions,
    creativeDirection,
    expandedSections,
    costTracking,
    handoffPreparation,
    chatInputMessage,
    
    // Actions
    setShowCreativeChat,
    setShowAssetGallery,
    setChatInputMessage,
    toggleSection,
    addMessage,
    setIsAgentTyping,
  } = useCreativeDirectorStore();

  const [activeView, setActiveView] = useState<"overview" | "chat" | "assets">("overview");
  
  // Use dictionary for localized text
  const t = dict.creativeDirector;

  // Don't show card if no handoff data from Maya
  if (!mayaHandoffData?.productAnalysis) {
    return null;
  }

  // Handle chat message sending
  const handleSendMessage = useCallback(async (message: string) => {
    try {
      setIsAgentTyping(true);
      
      // Add user message to store
      const userMessage = {
        id: crypto.randomUUID(),
        type: "user" as const,
        content: message,
        timestamp: Date.now(),
        sessionId,
        locale: locale || "en",
      };
      addMessage(userMessage);

      // TODO: Call actual API endpoint
      const response = await fetch(`/api/agents/creative-director/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message,
          locale,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Add agent response to store
      const agentMessage = {
        id: crypto.randomUUID(),
        type: "agent" as const,
        content: data.message || "I'm working on your creative direction!",
        timestamp: Date.now(),
        sessionId,
        locale: locale || "en",
        processingTime: data.metadata?.processingTime,
        cost: data.metadata?.cost,
        confidence: data.metadata?.confidence,
        quickActions: data.metadata?.quickActions,
      };
      addMessage(agentMessage);

    } catch (error) {
      console.error("Failed to send message:", error);
      // TODO: Add proper error handling with user feedback
    } finally {
      setIsAgentTyping(false);
    }
  }, [sessionId, locale, addMessage, setIsAgentTyping]);

  // Handle quick actions
  const handleQuickAction = useCallback((action: string) => {
    setChatInputMessage(action);
    if (activeView !== "chat") {
      setActiveView("chat");
      setShowCreativeChat(true);
    }
  }, [setChatInputMessage, activeView, setShowCreativeChat]);

  // Render Maya handoff summary
  const renderMayaHandoff = () => (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4 border border-blue-200">
      <div className="flex items-center gap-3 mb-3">
        <AgentAvatar agent="maya" size="sm" state="idle" />
        <div>
          <h4 className="font-semibold text-gray-800">{t.handoff.fromMaya.title}</h4>
          <p className="text-sm text-gray-600">{t.handoff.fromMaya.complete}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-white/70 rounded p-2">
          <div className="font-medium text-gray-700 mb-1">Product Analysis</div>
          <div className="text-gray-600">
            {mayaHandoffData.productAnalysis?.product?.name || "Analyzed"}
          </div>
        </div>
        <div className="bg-white/70 rounded p-2">
          <div className="font-medium text-gray-700 mb-1">Strategic Insights</div>
          <div className="text-gray-600">
            {mayaHandoffData.strategicInsights ? "Received" : "Processing..."}
          </div>
        </div>
        <div className="bg-white/70 rounded p-2">
          <div className="font-medium text-gray-700 mb-1">Visual Opportunities</div>
          <div className="text-gray-600">
            {mayaHandoffData.visualOpportunities ? "Identified" : "Analyzing..."}
          </div>
        </div>
      </div>
    </div>
  );

  // Render phase indicator
  const renderPhaseIndicator = () => (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-1">
        {Object.values(CreativePhase).map((phase, index) => (
          <div
            key={phase}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              currentPhase === phase
                ? "bg-purple-600 text-white"
                : index < Object.values(CreativePhase).indexOf(currentPhase)
                  ? "bg-purple-200 text-purple-800"
                  : "bg-gray-200 text-gray-600"
            }`}
          >
            {t.phases[phase as keyof typeof t.phases]}
          </div>
        ))}
      </div>
      <div className="ml-auto text-xs text-gray-500">
        {sessionId && `#${sessionId.slice(-6)}`}
      </div>
    </div>
  );

  // Render view toggle buttons
  const renderViewToggle = () => (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => setActiveView("overview")}
        className={`cursor-pointer flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
          activeView === "overview"
            ? "bg-purple-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        📋 Overview
      </button>
      <button
        onClick={() => {
          setActiveView("chat");
          setShowCreativeChat(true);
        }}
        className={`cursor-pointer flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
          activeView === "chat"
            ? "bg-purple-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        {t.chat.toggleChat}
      </button>
      <button
        onClick={() => {
          setActiveView("assets");
          setShowAssetGallery(true);
        }}
        className={`cursor-pointer flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
          activeView === "assets"
            ? "bg-purple-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        {t.chat.toggleAssets}
      </button>
    </div>
  );

  // Render quick actions
  const renderQuickActions = () => (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{t.chat.quickActionsTitle}</h4>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(t.quickActions).map(([key, action]) => (
          <button
            key={key}
            onClick={() => handleQuickAction(action)}
            className="cursor-pointer px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );

  // Render expandable sections for overview
  const renderExpandableSection = (
    sectionKey: keyof typeof expandedSections,
    title: string,
    content: React.ReactNode
  ) => (
    <div className="border border-gray-200 rounded-lg mb-3">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="cursor-pointer w-full px-4 py-3 text-left font-medium text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-between"
      >
        <span>{title}</span>
        <svg
          className={`w-5 h-5 transition-transform ${
            expandedSections[sectionKey] ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {expandedSections[sectionKey] && (
        <div className="px-4 pb-3 border-t border-gray-100">
          {content}
        </div>
      )}
    </div>
  );

  // Render asset gallery
  const renderAssetGallery = () => (
    <div className="space-y-4">
      {Object.values(AssetType).map((type) => {
        const typeAssets = assets.generated.filter((asset) => asset.type === type);
        if (typeAssets.length === 0) return null;

        return (
          <div key={type} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">
              {getAssetTypeDisplayName(type)}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {typeAssets.map((asset) => (
                <div key={asset.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="aspect-square bg-gray-200 rounded mb-2 flex items-center justify-center">
                    {asset.metadata?.preview ? (
                      <img
                        src={asset.metadata.preview}
                        alt={asset.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="text-gray-400 text-xs text-center">Preview</div>
                    )}
                  </div>
                  <div className="text-xs">
                    <div className="font-medium text-gray-800 truncate">{asset.name}</div>
                    <div className="text-gray-500">
                      {t.assetGallery.status[asset.status as keyof typeof t.assetGallery.status]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {assets.generated.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg mb-2">{t.assetGallery.empty.title}</div>
          <div className="text-sm">{t.assetGallery.empty.description}</div>
        </div>
      )}
    </div>
  );

  // Render overview content
  const renderOverviewContent = () => (
    <div className="space-y-4">
      {renderQuickActions()}
      
      {renderExpandableSection(
        "visualDirection",
        t.sections.visualDirection,
        <div className="text-sm text-gray-600 py-2">
          {visualDecisions.styleDirection 
            ? `Style: ${visualDecisions.styleDirection}` 
            : "Visual direction being developed..."}
        </div>
      )}

      {renderExpandableSection(
        "colorPalette",
        t.sections.colorPalette,
        <div className="text-sm text-gray-600 py-2">
          {visualDecisions.colorMood
            ? `Color Mood: ${visualDecisions.colorMood}`
            : "Color palette being designed..."}
        </div>
      )}

      {renderExpandableSection(
        "assetGeneration",
        t.sections.assetGeneration,
        <div className="text-sm text-gray-600 py-2">
          Generated: {assets.generated.length} assets
          <br />
          In Progress: {assets.inProgress.length} assets
          <br />
          Approved: {assets.approved.length} assets
        </div>
      )}

      {renderExpandableSection(
        "handoffPreparation",
        t.sections.handoffPreparation,
        <div className="text-sm text-gray-600 py-2">
          {handoffPreparation.readyForAlex 
            ? t.handoff.toAlex.complete
            : t.handoff.toAlex.preparing}
        </div>
      )}
    </div>
  );

  return (
    <Card variant="magical" className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <AgentAvatar agent="david" size="md" state="idle" />
          <div>
            <h3 className="text-xl font-semibold text-white">{t.title}</h3>
            <p className="text-gray-300 text-sm">{t.subtitle}</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm">{t.description}</p>
      </div>

      {renderMayaHandoff()}
      {renderPhaseIndicator()}
      {renderViewToggle()}

      <div className="min-h-[400px]">
        {activeView === "overview" && renderOverviewContent()}
        
        {activeView === "chat" && (
          <div className="h-96">
            <CreativeChatContainer
              sessionId={sessionId}
              messages={messages}
              isConnected={isConnected}
              isAgentTyping={isAgentTyping}
              onSendMessage={handleSendMessage}
              dict={dict}
              locale={locale}
              inputMessage={chatInputMessage}
              onInputMessageChange={setChatInputMessage}
              onScrollRequest={onScrollToChatSection}
            />
          </div>
        )}
        
        {activeView === "assets" && renderAssetGallery()}
      </div>

      {/* Cost tracking footer */}
      <div className="mt-6 pt-4 border-t border-gray-600 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>{t.costTracking.assetGeneration}: ${costTracking.assetGenerationCosts.toFixed(2)}</span>
          <span>{t.costTracking.totalSpent}: ${costTracking.current.toFixed(2)}</span>
          <span>{t.costTracking.estimatedRemaining}: ${costTracking.remaining.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}