/**
 * Zara Handoff Manager
 *
 * Handles seamless context transfer from David (Creative Director) to Zara (Video Producer),
 * organizing creative direction into comprehensive video production packages with asset mapping,
 * scene planning, and production specifications.
 */

import type { CreativeStrategy, VisualDecision } from "../types/api-types";
import type { VisualAsset, CreativeDirection, StylePalette } from "../types/asset-types";
import { VisualStyle, ColorMood, AssetType } from "../enums";
import { CreativeDirectorSessionManager } from "./session-manager";
import { CreativeDirectorCostTracker } from "./cost-tracker";

// Zara handoff data structure
export interface ZaraHandoffData {
  // Core creative direction from David
  creativeDirection: CreativeDirection;
  finalizedVisualDecisions: VisualDecision[];
  approvedStylePalette: StylePalette;

  // Asset package for video production
  assetPackage: {
    heroAssets: VisualAsset[];
    backgroundAssets: VisualAsset[];
    lifestyleAssets: VisualAsset[];
    overlayAssets: VisualAsset[];
    supportingAssets: VisualAsset[];
    moodReferences: VisualAsset[];
  };

  // Video production specifications
  productionSpecs: {
    videoFormat: {
      resolution: string;
      aspectRatio: string;
      frameRate: number;
      duration: number;
    };
    sceneStructure: VideoScene[];
    transitionPlanning: TransitionPlan[];
    audioRequirements: AudioRequirement[];
  };

  // Creative constraints and guidelines
  creativeGuidelines: {
    brandCompliance: BrandCompliance;
    styleConsistency: StyleConsistency;
    colorPaletteUsage: ColorPaletteUsage;
    compositionGuidelines: CompositionGuideline[];
  };

  // Budget and timeline
  productionBudget: {
    totalAllocated: number;
    videoProductionCost: number;
    postProductionCost: number;
    deliveryCost: number;
    contingency: number;
  };

  // Handoff metadata
  davidSessionId: string;
  handoffTimestamp: string;
  locale: "en" | "ja";
  completionStatus: HandoffCompletionStatus;

  // Zara workflow preparation
  zaraWorkflow: {
    prioritizedTasks: ProductionTask[];
    assetOrganization: AssetOrganizationMap;
    sceneMapping: SceneAssetMapping;
    qualityCheckpoints: QualityCheckpoint[];
  };
}

// Video scene structure for Zara
export interface VideoScene {
  id: string;
  sequenceNumber: number;
  title: string;
  description: string;
  duration: number;

  sceneType:
    | "intro"
    | "product-hero"
    | "lifestyle"
    | "feature-highlight"
    | "emotional-moment"
    | "call-to-action"
    | "outro";

  visualElements: {
    primaryAssets: string[]; // Asset IDs
    backgroundAssets: string[];
    overlayAssets: string[];
    textElements: TextElement[];
  };

  audioElements: {
    narration?: string;
    musicTrack?: string;
    soundEffects: string[];
  };

  cameraMovement: {
    type: "static" | "pan" | "zoom" | "dolly" | "tracking" | "handheld";
    direction?: string;
    speed: "slow" | "medium" | "fast";
  };

  emotionalArc: {
    startEmotion: string;
    endEmotion: string;
    intensity: number; // 1-10
  };
}

// Transition planning between scenes
export interface TransitionPlan {
  id: string;
  fromSceneId: string;
  toSceneId: string;
  transitionType: "cut" | "fade" | "dissolve" | "slide" | "zoom" | "creative";
  duration: number;
  reasoning: string;
}

// Audio requirements for video production
export interface AudioRequirement {
  id: string;
  type: "narration" | "music" | "sound-effects" | "ambient";
  description: string;
  mood: string;
  volume: number; // 0-100
  timing: {
    startTime: number;
    endTime: number;
  };
  culturalConsiderations?: string[];
}

// Brand compliance guidelines
export interface BrandCompliance {
  logoUsage: {
    placement: string[];
    sizing: string[];
    clearSpace: string;
  };
  colorUsage: {
    primaryColors: string[];
    accentColors: string[];
    restrictions: string[];
  };
  fontUsage: {
    primaryFont: string;
    secondaryFont: string;
    sizing: string[];
  };
  messagingTone: {
    primary: string;
    avoid: string[];
    culturalAdaptations: Record<string, string>;
  };
}

// Style consistency requirements
export interface StyleConsistency {
  visualStyle: VisualStyle;
  colorMood: ColorMood;
  compositionPrinciples: string[];
  lightingStyle: string;
  qualityStandards: {
    resolution: string;
    compression: string;
    colorSpace: string;
  };
}

// Color palette usage guidelines
export interface ColorPaletteUsage {
  primaryColorUsage: string;
  secondaryColorUsage: string;
  accentColorUsage: string;
  backgroundColorUsage: string;
  textColorUsage: string;
  restrictions: string[];
}

// Composition guidelines
export interface CompositionGuideline {
  principle: string;
  description: string;
  application: string[];
  examples: string[];
}

// Text elements for scenes
export interface TextElement {
  id: string;
  content: string;
  type: "headline" | "subheading" | "body" | "cta" | "label";
  styling: {
    font: string;
    size: number;
    color: string;
    position: { x: number; y: number };
  };
  animation?: {
    type: string;
    duration: number;
    easing: string;
  };
}

// Production tasks for Zara
export interface ProductionTask {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedTime: number; // in minutes
  dependencies: string[]; // Other task IDs
  assets: string[]; // Required asset IDs
  deliverable: string;
}

// Asset organization for video production
export interface AssetOrganizationMap {
  byScene: Record<string, string[]>; // Scene ID -> Asset IDs
  byType: Record<AssetType, string[]>; // Asset Type -> Asset IDs
  byPriority: {
    critical: string[];
    important: string[];
    supporting: string[];
  };
  byQuality: Record<string, string[]>; // Quality level -> Asset IDs
}

// Scene to asset mapping
export interface SceneAssetMapping {
  sceneAssetMatrix: Record<string, Record<string, boolean>>; // Scene ID -> Asset ID -> Used
  assetUsageFrequency: Record<string, number>; // Asset ID -> Usage count
  criticalAssets: string[]; // Assets used in multiple key scenes
  redundantAssets: string[]; // Assets with low usage
  missingAssets: string[]; // Required but not available
}

// Quality checkpoints for production
export interface QualityCheckpoint {
  id: string;
  phase: "pre-production" | "production" | "post-production" | "delivery";
  checkType: "asset-quality" | "brand-compliance" | "technical-specs" | "creative-alignment";
  criteria: string[];
  threshold: number;
  automated: boolean;
}

// Handoff completion status
export interface HandoffCompletionStatus {
  overall: number; // 0-1 completion percentage
  sections: {
    assetPackage: number;
    productionSpecs: number;
    creativeGuidelines: number;
    zaraWorkflow: number;
  };
  missingElements: string[];
  warnings: string[];
  readyForProduction: boolean;
}

/**
 * Zara Handoff Manager
 * Orchestrates the creative direction to video production transition
 */
export class ZaraHandoffManager {
  private static instance: ZaraHandoffManager;
  private sessionManager: CreativeDirectorSessionManager;
  private costTracker: CreativeDirectorCostTracker;

  private constructor() {
    this.sessionManager = CreativeDirectorSessionManager.getInstance();
    this.costTracker = CreativeDirectorCostTracker.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ZaraHandoffManager {
    if (!ZaraHandoffManager.instance) {
      ZaraHandoffManager.instance = new ZaraHandoffManager();
    }
    return ZaraHandoffManager.instance;
  }

  /**
   * Prepare comprehensive David → Zara handoff package
   */
  public async prepareZaraHandoff(
    sessionId: string,
    creativeDirection: CreativeDirection,
    visualDecisions: VisualDecision[],
    generatedAssets: VisualAsset[],
    stylePalette: StylePalette,
    locale: "en" | "ja" = "en"
  ): Promise<{
    success: boolean;
    zaraHandoffData: ZaraHandoffData;
    validationResults: {
      isValid: boolean;
      completeness: number;
      issues: string[];
      recommendations: string[];
    };
  }> {
    console.log(`[ALEX HANDOFF] Preparing David → Zara handoff for session: ${sessionId}`);

    try {
      // Create asset package for video production
      const assetPackage = this.organizeAssetsForVideoProduction(generatedAssets);

      // Generate video production specifications
      const productionSpecs = this.createVideoProductionSpecs(
        creativeDirection,
        visualDecisions,
        assetPackage,
        locale
      );

      // Create comprehensive creative guidelines
      const creativeGuidelines = this.buildCreativeGuidelines(
        creativeDirection,
        stylePalette,
        visualDecisions
      );

      // Calculate production budget allocation
      const productionBudget = await this.calculateProductionBudget(
        sessionId,
        productionSpecs,
        assetPackage
      );

      // Prepare Zara workflow and organization
      const zaraWorkflow = this.prepareZaraWorkflow(
        productionSpecs,
        assetPackage,
        creativeGuidelines
      );

      // Create completion status assessment
      const completionStatus = this.assessHandoffCompleteness(
        assetPackage,
        productionSpecs,
        creativeGuidelines,
        zaraWorkflow
      );

      // Build comprehensive handoff data
      const zaraHandoffData: ZaraHandoffData = {
        creativeDirection,
        finalizedVisualDecisions: visualDecisions.filter((d) => d.userApproved === true),
        approvedStylePalette: stylePalette,
        assetPackage,
        productionSpecs,
        creativeGuidelines,
        productionBudget,
        davidSessionId: sessionId,
        handoffTimestamp: new Date().toISOString(),
        locale,
        completionStatus,
        zaraWorkflow,
      };

      // Validate handoff package
      const validationResults = this.validateHandoffPackage(zaraHandoffData);

      // Track handoff preparation cost
      await this.costTracker.trackCost(
        sessionId,
        { service: "other", operation: "zara_handoff_preparation" },
        0.1, // Handoff processing cost
        "David → Zara handoff package preparation",
        {
          assetCount: generatedAssets.length,
          sceneCount: productionSpecs.sceneStructure.length,
          taskCount: zaraWorkflow.prioritizedTasks.length,
        }
      );

      console.log(`[ALEX HANDOFF] Successfully prepared handoff package for session: ${sessionId}`);

      return {
        success: true,
        zaraHandoffData,
        validationResults,
      };
    } catch (error) {
      console.error(`[ALEX HANDOFF] Failed to prepare handoff for session ${sessionId}:`, error);

      return {
        success: false,
        zaraHandoffData: this.createEmptyHandoffData(sessionId, locale),
        validationResults: {
          isValid: false,
          completeness: 0,
          issues: [error instanceof Error ? error.message : "Unknown handoff preparation error"],
          recommendations: [
            "Review creative direction completeness",
            "Ensure all assets are approved",
          ],
        },
      };
    }
  }

  /**
   * Organize assets into video production package
   */
  private organizeAssetsForVideoProduction(generatedAssets: VisualAsset[]) {
    const assetPackage = {
      heroAssets: [] as VisualAsset[],
      backgroundAssets: [] as VisualAsset[],
      lifestyleAssets: [] as VisualAsset[],
      overlayAssets: [] as VisualAsset[],
      supportingAssets: [] as VisualAsset[],
      moodReferences: [] as VisualAsset[],
    };

    generatedAssets.forEach((asset) => {
      switch (asset.type) {
        case "product-hero":
          assetPackage.heroAssets.push(asset);
          break;
        case "background":
          assetPackage.backgroundAssets.push(asset);
          break;
        case "lifestyle-scene":
          assetPackage.lifestyleAssets.push(asset);
          break;
        case "overlay":
          assetPackage.overlayAssets.push(asset);
          break;
        case "mood-board":
          assetPackage.moodReferences.push(asset);
          break;
        default:
          assetPackage.supportingAssets.push(asset);
      }
    });

    return assetPackage;
  }

  /**
   * Create comprehensive video production specifications
   */
  private createVideoProductionSpecs(
    creativeDirection: CreativeDirection,
    visualDecisions: VisualDecision[],
    assetPackage: any,
    locale: "en" | "ja"
  ) {
    // Generate scene structure based on creative direction
    const sceneStructure = this.generateSceneStructure(creativeDirection, assetPackage, locale);

    // Create transition planning between scenes
    const transitionPlanning = this.planSceneTransitions(sceneStructure);

    // Define audio requirements
    const audioRequirements = this.defineAudioRequirements(
      sceneStructure,
      creativeDirection,
      locale
    );

    return {
      videoFormat: {
        resolution: "1920x1080", // HD default
        aspectRatio: "16:9",
        frameRate: 30,
        duration: this.calculateOptimalVideoDuration(sceneStructure),
      },
      sceneStructure,
      transitionPlanning,
      audioRequirements,
    };
  }

  /**
   * Generate optimal scene structure for video production
   */
  private generateSceneStructure(
    creativeDirection: CreativeDirection,
    assetPackage: any,
    locale: "en" | "ja"
  ): VideoScene[] {
    const scenes: VideoScene[] = [];
    const totalDuration = 60; // 60 seconds default commercial length

    // Scene 1: Intro/Hook (5-8 seconds)
    scenes.push({
      id: crypto.randomUUID(),
      sequenceNumber: 1,
      title: locale === "ja" ? "オープニング" : "Opening Hook",
      description:
        locale === "ja"
          ? "視聴者の注意を引く強力な導入シーン"
          : "Compelling opening to capture viewer attention",
      duration: 6,
      sceneType: "intro",
      visualElements: {
        primaryAssets: assetPackage.heroAssets.slice(0, 1).map((a: any) => a.id),
        backgroundAssets: assetPackage.backgroundAssets.slice(0, 1).map((a: any) => a.id),
        overlayAssets: [],
        textElements: [
          {
            id: crypto.randomUUID(),
            content: creativeDirection.strategy?.brandMessage || "Discover Innovation",
            type: "headline",
            styling: {
              font: "primary",
              size: 48,
              color: "#FFFFFF",
              position: { x: 50, y: 20 },
            },
            animation: {
              type: "fade-up",
              duration: 1.5,
              easing: "ease-out",
            },
          },
        ],
      },
      audioElements: {
        musicTrack: "upbeat-intro",
        soundEffects: ["whoosh", "impact"],
      },
      cameraMovement: {
        type: "zoom",
        direction: "in",
        speed: "medium",
      },
      emotionalArc: {
        startEmotion: "curiosity",
        endEmotion: "intrigue",
        intensity: 7,
      },
    });

    // Scene 2: Product Hero (12-15 seconds)
    scenes.push({
      id: crypto.randomUUID(),
      sequenceNumber: 2,
      title: locale === "ja" ? "プロダクトヒーロー" : "Product Hero",
      description:
        locale === "ja"
          ? "製品の主要機能と利点を強調する中心シーン"
          : "Central scene highlighting key product features and benefits",
      duration: 14,
      sceneType: "product-hero",
      visualElements: {
        primaryAssets: assetPackage.heroAssets.map((a: any) => a.id),
        backgroundAssets: assetPackage.backgroundAssets.slice(0, 2).map((a: any) => a.id),
        overlayAssets: assetPackage.overlayAssets.slice(0, 1).map((a: any) => a.id),
        textElements: [
          {
            id: crypto.randomUUID(),
            content: creativeDirection.strategy?.visualTheme || "Advanced Features",
            type: "subheading",
            styling: {
              font: "secondary",
              size: 32,
              color: "#333333",
              position: { x: 20, y: 60 },
            },
          },
        ],
      },
      audioElements: {
        narration:
          locale === "ja"
            ? "製品の革新的機能をご紹介します"
            : "Introducing breakthrough innovation",
        musicTrack: "product-showcase",
        soundEffects: ["product-highlight"],
      },
      cameraMovement: {
        type: "dolly",
        direction: "around",
        speed: "slow",
      },
      emotionalArc: {
        startEmotion: "interest",
        endEmotion: "desire",
        intensity: 8,
      },
    });

    // Scene 3: Lifestyle Context (15-20 seconds)
    if (assetPackage.lifestyleAssets.length > 0) {
      scenes.push({
        id: crypto.randomUUID(),
        sequenceNumber: 3,
        title: locale === "ja" ? "ライフスタイル" : "Lifestyle Context",
        description:
          locale === "ja"
            ? "実際の使用環境での製品体験を表現"
            : "Product experience in real-world usage contexts",
        duration: 18,
        sceneType: "lifestyle",
        visualElements: {
          primaryAssets: assetPackage.lifestyleAssets.map((a: any) => a.id),
          backgroundAssets: assetPackage.backgroundAssets.slice(1, 3).map((a: any) => a.id),
          overlayAssets: assetPackage.overlayAssets.slice(1, 2).map((a: any) => a.id),
          textElements: [
            {
              id: crypto.randomUUID(),
              content:
                creativeDirection.strategy?.targetAudienceAlignment || "Perfect for Your Life",
              type: "body",
              styling: {
                font: "secondary",
                size: 24,
                color: "#555555",
                position: { x: 25, y: 70 },
              },
            },
          ],
        },
        audioElements: {
          narration:
            locale === "ja"
              ? "あなたのライフスタイルに完全にフィット"
              : "Seamlessly fits your lifestyle",
          musicTrack: "emotional-connection",
          soundEffects: ["ambient-life"],
        },
        cameraMovement: {
          type: "tracking",
          speed: "medium",
        },
        emotionalArc: {
          startEmotion: "connection",
          endEmotion: "satisfaction",
          intensity: 9,
        },
      });
    }

    // Scene 4: Call to Action (8-12 seconds)
    scenes.push({
      id: crypto.randomUUID(),
      sequenceNumber: scenes.length + 1,
      title: locale === "ja" ? "行動喚起" : "Call to Action",
      description:
        locale === "ja"
          ? "視聴者に具体的な行動を促す決定的シーン"
          : "Decisive scene prompting specific viewer action",
      duration: 10,
      sceneType: "call-to-action",
      visualElements: {
        primaryAssets: assetPackage.heroAssets.slice(0, 1).map((a: any) => a.id),
        backgroundAssets: assetPackage.backgroundAssets.slice(-1).map((a: any) => a.id),
        overlayAssets: assetPackage.overlayAssets.map((a: any) => a.id),
        textElements: [
          {
            id: crypto.randomUUID(),
            content: creativeDirection.strategy?.brandMessage || "Experience the Difference",
            type: "cta",
            styling: {
              font: "primary",
              size: 36,
              color: "#FF6B35",
              position: { x: 50, y: 50 },
            },
            animation: {
              type: "pulse",
              duration: 2,
              easing: "ease-in-out",
            },
          },
        ],
      },
      audioElements: {
        narration: locale === "ja" ? "今すぐお試しください" : "Try it today",
        musicTrack: "call-to-action",
        soundEffects: ["action-prompt", "final-impact"],
      },
      cameraMovement: {
        type: "zoom",
        direction: "out",
        speed: "slow",
      },
      emotionalArc: {
        startEmotion: "motivation",
        endEmotion: "action",
        intensity: 10,
      },
    });

    return scenes;
  }

  /**
   * Plan transitions between scenes
   */
  private planSceneTransitions(scenes: VideoScene[]): TransitionPlan[] {
    const transitions: TransitionPlan[] = [];

    for (let i = 0; i < scenes.length - 1; i++) {
      const currentScene = scenes[i];
      const nextScene = scenes[i + 1];

      // Determine optimal transition type based on scene types and emotional flow
      let transitionType: TransitionPlan["transitionType"] = "fade";
      let duration = 0.5;
      let reasoning = "Standard transition";

      if (currentScene.sceneType === "intro" && nextScene.sceneType === "product-hero") {
        transitionType = "zoom";
        duration = 0.8;
        reasoning = "Dynamic zoom to focus attention on product";
      } else if (currentScene.sceneType === "product-hero" && nextScene.sceneType === "lifestyle") {
        transitionType = "dissolve";
        duration = 1.0;
        reasoning = "Smooth dissolve to create emotional connection";
      } else if (nextScene.sceneType === "call-to-action") {
        transitionType = "cut";
        duration = 0.2;
        reasoning = "Sharp cut for immediate action prompt";
      }

      transitions.push({
        id: crypto.randomUUID(),
        fromSceneId: currentScene.id,
        toSceneId: nextScene.id,
        transitionType,
        duration,
        reasoning,
      });
    }

    return transitions;
  }

  /**
   * Define audio requirements for scenes
   */
  private defineAudioRequirements(
    scenes: VideoScene[],
    creativeDirection: CreativeDirection,
    locale: "en" | "ja"
  ): AudioRequirement[] {
    const audioRequirements: AudioRequirement[] = [];
    let currentTime = 0;

    scenes.forEach((scene) => {
      // Background music
      audioRequirements.push({
        id: crypto.randomUUID(),
        type: "music",
        description: `Background music for ${scene.title}`,
        mood: this.getAudioMoodForScene(scene.sceneType),
        volume: 70,
        timing: {
          startTime: currentTime,
          endTime: currentTime + scene.duration,
        },
        culturalConsiderations:
          locale === "ja" ? ["Japanese market preferences"] : ["Global appeal"],
      });

      // Narration if specified
      if (scene.audioElements.narration) {
        audioRequirements.push({
          id: crypto.randomUUID(),
          type: "narration",
          description: scene.audioElements.narration,
          mood: "professional",
          volume: 90,
          timing: {
            startTime: currentTime + 0.5,
            endTime: currentTime + scene.duration - 0.5,
          },
          culturalConsiderations:
            locale === "ja"
              ? ["Native Japanese speaker", "Professional tone"]
              : ["Clear English pronunciation", "Confident delivery"],
        });
      }

      // Sound effects
      scene.audioElements.soundEffects.forEach((effect) => {
        audioRequirements.push({
          id: crypto.randomUUID(),
          type: "sound-effects",
          description: effect,
          mood: "supportive",
          volume: 60,
          timing: {
            startTime: currentTime,
            endTime: currentTime + 1,
          },
        });
      });

      currentTime += scene.duration;
    });

    return audioRequirements;
  }

  /**
   * Get appropriate audio mood for scene type
   */
  private getAudioMoodForScene(sceneType: VideoScene["sceneType"]): string {
    const moodMapping = {
      intro: "energetic",
      "product-hero": "confident",
      lifestyle: "warm",
      "feature-highlight": "focused",
      "emotional-moment": "inspiring",
      "call-to-action": "urgent",
      outro: "memorable",
    };

    return moodMapping[sceneType] || "neutral";
  }

  /**
   * Calculate optimal video duration based on scenes
   */
  private calculateOptimalVideoDuration(scenes: VideoScene[]): number {
    return scenes.reduce((total, scene) => total + scene.duration, 0);
  }

  /**
   * Build comprehensive creative guidelines for Zara
   */
  private buildCreativeGuidelines(
    creativeDirection: CreativeDirection,
    stylePalette: StylePalette,
    visualDecisions: VisualDecision[]
  ) {
    const brandCompliance: BrandCompliance = {
      logoUsage: {
        placement: ["bottom-right", "center-end"],
        sizing: ["10% of frame height", "readable at all sizes"],
        clearSpace: "2x logo height minimum",
      },
      colorUsage: {
        primaryColors: stylePalette.colors.primary.map((c) => c.hex),
        accentColors: stylePalette.colors.accent.map((c) => c.hex),
        restrictions: ["Avoid oversaturation", "Maintain color harmony"],
      },
      fontUsage: {
        primaryFont: "Primary Brand Font",
        secondaryFont: "Secondary Brand Font",
        sizing: ["Minimum 24px for body text", "48px+ for headlines"],
      },
      messagingTone: {
        primary: creativeDirection.strategy?.emotionalTone || "Professional and approachable",
        avoid: ["Overly technical", "Too casual", "Aggressive sales language"],
        culturalAdaptations: {
          ja: "Respectful and humble tone with appropriate honorifics",
          en: "Confident and direct communication",
        },
      },
    };

    const styleConsistency: StyleConsistency = {
      visualStyle:
        (creativeDirection.visualSpecs?.styleDirection?.primary as VisualStyle) ||
        VisualStyle.MODERN,
      colorMood:
        (creativeDirection.visualSpecs?.colorPalette?.psychology?.emotions[0] as ColorMood) ||
        ColorMood.PROFESSIONAL,
      compositionPrinciples: ["Rule of thirds", "Visual hierarchy", "Consistent spacing"],
      lightingStyle: "Natural and flattering",
      qualityStandards: {
        resolution: "1920x1080 minimum",
        compression: "High quality H.264",
        colorSpace: "Rec. 709",
      },
    };

    const colorPaletteUsage: ColorPaletteUsage = {
      primaryColorUsage: "Brand elements and key highlights",
      secondaryColorUsage: "Supporting elements and backgrounds",
      accentColorUsage: "Call-to-action and emphasis points",
      backgroundColorUsage: "Subtle backgrounds that don't compete",
      textColorUsage: "High contrast for readability",
      restrictions: [
        "Never use primary colors for large background areas",
        "Maintain 4.5:1 contrast ratio minimum for text",
      ],
    };

    const compositionGuidelines: CompositionGuideline[] = [
      {
        principle: "Visual Hierarchy",
        description: "Guide viewer attention through deliberate element placement",
        application: ["Size contrast", "Color emphasis", "Positioning"],
        examples: ["Hero product largest", "CTA prominently placed", "Supporting elements smaller"],
      },
      {
        principle: "Balance",
        description: "Maintain visual equilibrium across all frames",
        application: ["Symmetrical layouts", "Asymmetrical balance", "Color distribution"],
        examples: ["Centered hero shots", "Balanced text placement", "Even color distribution"],
      },
      {
        principle: "Movement",
        description: "Create visual flow that leads to call-to-action",
        application: ["Leading lines", "Progressive disclosure", "Directional cues"],
        examples: ["Arrows pointing to CTA", "Eye-path optimization", "Sequential reveals"],
      },
    ];

    return {
      brandCompliance,
      styleConsistency,
      colorPaletteUsage,
      compositionGuidelines,
    };
  }

  /**
   * Calculate production budget allocation
   */
  private async calculateProductionBudget(
    sessionId: string,
    productionSpecs: any,
    assetPackage: any
  ) {
    // Get remaining budget from cost tracker
    const currentCosts = await this.costTracker.getSessionAnalytics(sessionId);
    const remainingBudget = Math.max(0, 50 - (currentCosts.totalSpent || 0)); // Assume $50 total budget

    const sceneCount = productionSpecs.sceneStructure.length;
    const assetCount = Object.values(assetPackage).flat().length as number;

    // Allocate budget proportionally
    const baseProductionCost = Math.min(remainingBudget * 0.6, 25);
    const postProductionCost = Math.min(remainingBudget * 0.25, 10);
    const deliveryCost = Math.min(remainingBudget * 0.1, 3);
    const contingency = Math.min(remainingBudget * 0.05, 2);

    return {
      totalAllocated: remainingBudget,
      videoProductionCost: baseProductionCost,
      postProductionCost: postProductionCost,
      deliveryCost: deliveryCost,
      contingency: contingency,
    };
  }

  /**
   * Prepare comprehensive Zara workflow
   */
  private prepareZaraWorkflow(productionSpecs: any, assetPackage: any, creativeGuidelines: any) {
    // Generate prioritized tasks
    const prioritizedTasks = this.generateProductionTasks(productionSpecs, assetPackage);

    // Create asset organization map
    const assetOrganization = this.createAssetOrganizationMap(
      productionSpecs.sceneStructure,
      assetPackage
    );

    // Generate scene-asset mapping
    const sceneMapping = this.generateSceneAssetMapping(
      productionSpecs.sceneStructure,
      assetPackage
    );

    // Define quality checkpoints
    const qualityCheckpoints = this.defineQualityCheckpoints(creativeGuidelines);

    return {
      prioritizedTasks,
      assetOrganization,
      sceneMapping,
      qualityCheckpoints,
    };
  }

  /**
   * Generate production tasks for Zara
   */
  private generateProductionTasks(productionSpecs: any, assetPackage: any): ProductionTask[] {
    const tasks: ProductionTask[] = [];

    // Pre-production tasks
    tasks.push({
      id: crypto.randomUUID(),
      title: "Asset Quality Review",
      description: "Review all provided assets for production readiness",
      priority: "critical",
      estimatedTime: 30,
      dependencies: [],
      assets: Object.values(assetPackage)
        .flat()
        .map((a: any) => a.id),
      deliverable: "Asset quality report with approved/revision needed status",
    });

    tasks.push({
      id: crypto.randomUUID(),
      title: "Scene Structure Planning",
      description: "Finalize scene sequence and timing based on creative direction",
      priority: "critical",
      estimatedTime: 45,
      dependencies: [],
      assets: [],
      deliverable: "Detailed scene breakdown with timing and asset assignments",
    });

    // Production tasks (one per scene)
    productionSpecs.sceneStructure.forEach((scene: VideoScene, index: number) => {
      tasks.push({
        id: crypto.randomUUID(),
        title: `Scene ${index + 1}: ${scene.title}`,
        description: `Produce ${scene.title} scene according to specifications`,
        priority: scene.sceneType === "call-to-action" ? "critical" : "high",
        estimatedTime: scene.duration * 3, // 3 minutes production per second of video
        dependencies: ["Asset Quality Review", "Scene Structure Planning"],
        assets: [
          ...scene.visualElements.primaryAssets,
          ...scene.visualElements.backgroundAssets,
          ...scene.visualElements.overlayAssets,
        ],
        deliverable: `Completed ${scene.title} scene ready for integration`,
      });
    });

    // Post-production tasks
    tasks.push({
      id: crypto.randomUUID(),
      title: "Video Integration and Editing",
      description: "Integrate all scenes with transitions and audio",
      priority: "high",
      estimatedTime: 120,
      dependencies: productionSpecs.sceneStructure.map(
        (s: VideoScene, i: number) => `Scene ${i + 1}: ${s.title}`
      ),
      assets: [],
      deliverable: "Complete integrated video ready for review",
    });

    tasks.push({
      id: crypto.randomUUID(),
      title: "Quality Assurance Review",
      description: "Final quality check against creative guidelines and technical specifications",
      priority: "high",
      estimatedTime: 60,
      dependencies: ["Video Integration and Editing"],
      assets: [],
      deliverable: "QA approved video or revision notes",
    });

    return tasks;
  }

  /**
   * Create asset organization map for Zara
   */
  private createAssetOrganizationMap(
    scenes: VideoScene[],
    assetPackage: any
  ): AssetOrganizationMap {
    const byScene: Record<string, string[]> = {};
    const byType: Record<AssetType, string[]> = {
      [AssetType.BACKGROUND]: [],
      [AssetType.PRODUCT_HERO]: [],
      [AssetType.LIFESTYLE_SCENE]: [],
      [AssetType.OVERLAY]: [],
      [AssetType.MOOD_BOARD]: [],
      [AssetType.STYLE_FRAME]: [],
      [AssetType.COLOR_PALETTE]: [],
      [AssetType.COMPOSITION_GUIDE]: [],
      [AssetType.TEXTURE]: [],
      [AssetType.PATTERN]: [],
      [AssetType.LIGHTING_REFERENCE]: [],
      [AssetType.TYPOGRAPHY_TREATMENT]: [],
    };

    // Organize by scene
    scenes.forEach((scene) => {
      byScene[scene.id] = [
        ...scene.visualElements.primaryAssets,
        ...scene.visualElements.backgroundAssets,
        ...scene.visualElements.overlayAssets,
      ];
    });

    // Organize by type
    Object.values(assetPackage)
      .flat()
      .forEach((asset: any) => {
        const assetType = asset.type as AssetType;
        if (byType[assetType]) {
          byType[assetType].push(asset.id);
        }
      });

    // Prioritize assets
    const allAssets = Object.values(assetPackage).flat() as VisualAsset[];
    const critical = allAssets
      .filter((a) => a.quality?.overallScore && a.quality.overallScore > 0.9)
      .map((a) => a.id);
    const important = allAssets
      .filter(
        (a) =>
          a.quality?.overallScore && a.quality.overallScore > 0.7 && a.quality.overallScore <= 0.9
      )
      .map((a) => a.id);
    const supporting = allAssets
      .filter((a) => !critical.includes(a.id) && !important.includes(a.id))
      .map((a) => a.id);

    return {
      byScene,
      byType,
      byPriority: {
        critical,
        important,
        supporting,
      },
      byQuality: {
        high: critical,
        medium: important,
        standard: supporting,
      },
    };
  }

  /**
   * Generate scene to asset mapping analysis
   */
  private generateSceneAssetMapping(scenes: VideoScene[], assetPackage: any): SceneAssetMapping {
    const sceneAssetMatrix: Record<string, Record<string, boolean>> = {};
    const assetUsageFrequency: Record<string, number> = {};

    // Build scene-asset usage matrix
    const allAssets = Object.values(assetPackage).flat() as VisualAsset[];

    scenes.forEach((scene) => {
      sceneAssetMatrix[scene.id] = {};

      const usedAssets = [
        ...scene.visualElements.primaryAssets,
        ...scene.visualElements.backgroundAssets,
        ...scene.visualElements.overlayAssets,
      ];

      allAssets.forEach((asset) => {
        const isUsed = usedAssets.includes(asset.id);
        sceneAssetMatrix[scene.id][asset.id] = isUsed;

        if (isUsed) {
          assetUsageFrequency[asset.id] = (assetUsageFrequency[asset.id] || 0) + 1;
        }
      });
    });

    // Identify critical, redundant, and missing assets
    const criticalAssets = Object.entries(assetUsageFrequency)
      .filter(([_, count]) => count >= 2)
      .map(([assetId, _]) => assetId);

    const redundantAssets = Object.entries(assetUsageFrequency)
      .filter(([_, count]) => count === 0)
      .map(([assetId, _]) => assetId);

    // For missing assets, check if any scenes reference non-existent assets
    const missingAssets: string[] = [];
    scenes.forEach((scene) => {
      const referencedAssets = [
        ...scene.visualElements.primaryAssets,
        ...scene.visualElements.backgroundAssets,
        ...scene.visualElements.overlayAssets,
      ];

      referencedAssets.forEach((assetId) => {
        const assetExists = allAssets.some((asset) => asset.id === assetId);
        if (!assetExists && !missingAssets.includes(assetId)) {
          missingAssets.push(assetId);
        }
      });
    });

    return {
      sceneAssetMatrix,
      assetUsageFrequency,
      criticalAssets,
      redundantAssets,
      missingAssets,
    };
  }

  /**
   * Define quality checkpoints for production
   */
  private defineQualityCheckpoints(creativeGuidelines: any): QualityCheckpoint[] {
    return [
      {
        id: crypto.randomUUID(),
        phase: "pre-production",
        checkType: "asset-quality",
        criteria: [
          "All assets meet minimum resolution requirements",
          "Asset formats are production-ready",
          "No corrupted or incomplete assets",
        ],
        threshold: 0.95,
        automated: true,
      },
      {
        id: crypto.randomUUID(),
        phase: "production",
        checkType: "brand-compliance",
        criteria: [
          "Logo placement follows brand guidelines",
          "Color usage adheres to palette restrictions",
          "Typography meets brand standards",
        ],
        threshold: 0.9,
        automated: false,
      },
      {
        id: crypto.randomUUID(),
        phase: "production",
        checkType: "creative-alignment",
        criteria: [
          "Scenes follow approved creative direction",
          "Visual style remains consistent",
          "Message hierarchy is maintained",
        ],
        threshold: 0.85,
        automated: false,
      },
      {
        id: crypto.randomUUID(),
        phase: "post-production",
        checkType: "technical-specs",
        criteria: [
          "Video meets format specifications",
          "Audio levels are within acceptable range",
          "Color grading matches style guide",
        ],
        threshold: 0.95,
        automated: true,
      },
      {
        id: crypto.randomUUID(),
        phase: "delivery",
        checkType: "asset-quality",
        criteria: [
          "Final video meets quality standards",
          "All delivery formats generated successfully",
          "Metadata and documentation complete",
        ],
        threshold: 1.0,
        automated: true,
      },
    ];
  }

  /**
   * Assess handoff package completeness
   */
  private assessHandoffCompleteness(
    assetPackage: any,
    productionSpecs: any,
    creativeGuidelines: any,
    zaraWorkflow: any
  ): HandoffCompletionStatus {
    const sections = {
      assetPackage: this.assessAssetPackageCompleteness(assetPackage),
      productionSpecs: this.assessProductionSpecsCompleteness(productionSpecs),
      creativeGuidelines: this.assessCreativeGuidelinesCompleteness(creativeGuidelines),
      zaraWorkflow: this.assessZaraWorkflowCompleteness(zaraWorkflow),
    };

    const overall = Object.values(sections).reduce((sum, score) => sum + score, 0) / 4;

    const missingElements: string[] = [];
    const warnings: string[] = [];

    if (sections.assetPackage < 1.0) missingElements.push("Incomplete asset package");
    if (sections.productionSpecs < 1.0)
      missingElements.push("Incomplete production specifications");
    if (sections.creativeGuidelines < 0.9) warnings.push("Creative guidelines may need refinement");
    if (sections.zaraWorkflow < 0.9) warnings.push("Workflow organization could be improved");

    return {
      overall,
      sections,
      missingElements,
      warnings,
      readyForProduction: overall >= 0.9 && missingElements.length === 0,
    };
  }

  /**
   * Validate complete handoff package
   */
  private validateHandoffPackage(zaraHandoffData: ZaraHandoffData) {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Validate asset package
    if (zaraHandoffData.assetPackage.heroAssets.length === 0) {
      issues.push("No hero assets provided");
      recommendations.push("Generate at least one hero asset for product showcase");
    }

    // Validate production specs
    if (zaraHandoffData.productionSpecs.sceneStructure.length < 2) {
      issues.push("Insufficient scene structure");
      recommendations.push("Create minimum 2 scenes for effective commercial");
    }

    // Validate budget
    if (zaraHandoffData.productionBudget.totalAllocated <= 0) {
      issues.push("No budget allocated for video production");
      recommendations.push("Ensure adequate budget remains for video production");
    }

    // Calculate completeness
    const completeness = Math.max(0, 1 - issues.length * 0.2);

    return {
      isValid: issues.length === 0,
      completeness,
      issues,
      recommendations:
        recommendations.length > 0 ? recommendations : ["Handoff package validation complete"],
    };
  }

  // Assessment helper methods
  private assessAssetPackageCompleteness(assetPackage: any): number {
    let score = 0;
    const sections = [
      "heroAssets",
      "backgroundAssets",
      "lifestyleAssets",
      "overlayAssets",
      "supportingAssets",
      "moodReferences",
    ];

    sections.forEach((section) => {
      if (assetPackage[section] && assetPackage[section].length > 0) {
        score += 1 / sections.length;
      }
    });

    return score;
  }

  private assessProductionSpecsCompleteness(productionSpecs: any): number {
    let score = 0;

    if (productionSpecs.videoFormat) score += 0.25;
    if (productionSpecs.sceneStructure && productionSpecs.sceneStructure.length > 0) score += 0.4;
    if (productionSpecs.transitionPlanning && productionSpecs.transitionPlanning.length > 0)
      score += 0.2;
    if (productionSpecs.audioRequirements && productionSpecs.audioRequirements.length > 0)
      score += 0.15;

    return score;
  }

  private assessCreativeGuidelinesCompleteness(creativeGuidelines: any): number {
    let score = 0;

    if (creativeGuidelines.brandCompliance) score += 0.3;
    if (creativeGuidelines.styleConsistency) score += 0.3;
    if (creativeGuidelines.colorPaletteUsage) score += 0.2;
    if (
      creativeGuidelines.compositionGuidelines &&
      creativeGuidelines.compositionGuidelines.length > 0
    )
      score += 0.2;

    return score;
  }

  private assessZaraWorkflowCompleteness(zaraWorkflow: any): number {
    let score = 0;

    if (zaraWorkflow.prioritizedTasks && zaraWorkflow.prioritizedTasks.length > 0) score += 0.3;
    if (zaraWorkflow.assetOrganization) score += 0.25;
    if (zaraWorkflow.sceneMapping) score += 0.25;
    if (zaraWorkflow.qualityCheckpoints && zaraWorkflow.qualityCheckpoints.length > 0) score += 0.2;

    return score;
  }

  /**
   * Create empty handoff data for error cases
   */
  private createEmptyHandoffData(sessionId: string, locale: "en" | "ja"): ZaraHandoffData {
    return {
      creativeDirection: {} as CreativeDirection,
      finalizedVisualDecisions: [],
      approvedStylePalette: {} as StylePalette,
      assetPackage: {
        heroAssets: [],
        backgroundAssets: [],
        lifestyleAssets: [],
        overlayAssets: [],
        supportingAssets: [],
        moodReferences: [],
      },
      productionSpecs: {
        videoFormat: {
          resolution: "1920x1080",
          aspectRatio: "16:9",
          frameRate: 30,
          duration: 60,
        },
        sceneStructure: [],
        transitionPlanning: [],
        audioRequirements: [],
      },
      creativeGuidelines: {
        brandCompliance: {} as BrandCompliance,
        styleConsistency: {} as StyleConsistency,
        colorPaletteUsage: {} as ColorPaletteUsage,
        compositionGuidelines: [],
      },
      productionBudget: {
        totalAllocated: 0,
        videoProductionCost: 0,
        postProductionCost: 0,
        deliveryCost: 0,
        contingency: 0,
      },
      davidSessionId: sessionId,
      handoffTimestamp: new Date().toISOString(),
      locale,
      completionStatus: {
        overall: 0,
        sections: {
          assetPackage: 0,
          productionSpecs: 0,
          creativeGuidelines: 0,
          zaraWorkflow: 0,
        },
        missingElements: ["Complete handoff preparation failed"],
        warnings: ["Handoff package is empty"],
        readyForProduction: false,
      },
      zaraWorkflow: {
        prioritizedTasks: [],
        assetOrganization: {
          byScene: {},
          byType: {} as Record<AssetType, string[]>,
          byPriority: { critical: [], important: [], supporting: [] },
          byQuality: {},
        },
        sceneMapping: {
          sceneAssetMatrix: {},
          assetUsageFrequency: {},
          criticalAssets: [],
          redundantAssets: [],
          missingAssets: [],
        },
        qualityCheckpoints: [],
      },
    };
  }
}
