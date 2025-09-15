/**
 * Creative Director Demo Handler
 *
 * Handles all demo mode interactions for David's 4-phase workflow
 * Provides realistic, immediate responses without API costs
 */

import { davidDemoData } from './demo-data';
import { CreativePhase } from '../enums';
import type { CreativeChatMessage } from '../types/chat-types';

interface DemoHandlerContext {
  sessionId: string;
  currentPhase: CreativePhase;
  selectedStyle?: string;
  conversationHistory?: CreativeChatMessage[];
  locale: 'en' | 'ja';
}

export class CreativeDirectorDemoHandler {

  /**
   * Phase 1: Auto Creative Analysis
   * Automatically triggered when handoff from Maya occurs
   */
  static async handleCreativeAnalysis(context: DemoHandlerContext) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      phase: CreativePhase.CREATIVE_DEVELOPMENT,
      data: {
        creativeAnalysis: davidDemoData.creativeAnalysis,
        message: "I've analyzed your product and identified strong visual opportunities. Your product has excellent potential for premium positioning. I've prepared 4 distinct visual style directions for you to choose from.",
        nextAction: "style_selection",
        quickActions: [
          "Show me the style options",
          "I prefer minimalist approaches",
          "What about dynamic tech styles?",
          "How do you choose the right style?"
        ]
      },
      metadata: {
        processingTime: 2000,
        cost: { current: 0, total: 0 }, // Demo mode = $0
        confidence: 0.95
      }
    };
  }

  /**
   * Phase 2: Style Direction Selection
   * Present AI-generated style options for user selection
   */
  static async handleStyleSelection(message: string, context: DemoHandlerContext) {
    const lowerMessage = message.toLowerCase();

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Respond based on user's request
    if (lowerMessage.includes('style options') || lowerMessage.includes('show me')) {
      return {
        success: true,
        data: {
          message: "Here are 4 carefully crafted style directions based on your product analysis. Each offers a different visual approach to showcase your brand:",
          styleOptions: davidDemoData.styleOptions,
          phase: CreativePhase.CREATIVE_DEVELOPMENT,
          nextAction: "select_style",
          quickActions: [
            "I like Premium Minimalism",
            "Tech Dynamic looks interesting",
            "Tell me about Luxury Editorial",
            "Show Lifestyle Authentic details"
          ]
        },
        metadata: {
          processingTime: 1500,
          cost: { current: 0, total: 0 },
          confidence: 0.92
        }
      };
    }

    if (lowerMessage.includes('minimalist') || lowerMessage.includes('premium minimalism')) {
      return {
        success: true,
        data: {
          message: "Excellent choice! Premium Minimalism perfectly aligns with your product's sophisticated positioning. This style emphasizes clean lines, premium materials, and sophisticated simplicity. Let me develop the scene composition for this direction.",
          selectedStyle: davidDemoData.styleOptions[0],
          scenePlan: davidDemoData.scenePlans["premium-minimalism"],
          phase: CreativePhase.ASSET_GENERATION,
          nextAction: "scene_planning",
          quickActions: [
            "Perfect, let's proceed with scenes",
            "Can we adjust the lighting approach?",
            "Add more lifestyle context",
            "What about the color palette?"
          ]
        },
        metadata: {
          processingTime: 1500,
          cost: { current: 0, total: 0 },
          confidence: 0.88
        }
      };
    }

    if (lowerMessage.includes('tech dynamic') || lowerMessage.includes('dynamic')) {
      return {
        success: true,
        data: {
          message: "Great selection! Tech Dynamic will give your product an innovative, energetic presence. This style uses bold contrasts and dynamic compositions to emphasize your product's cutting-edge nature. The vibrant color palette will make your product stand out.",
          selectedStyle: davidDemoData.styleOptions[1],
          phase: CreativePhase.ASSET_GENERATION,
          nextAction: "scene_planning",
          quickActions: [
            "Let's develop the scenes",
            "Make it even more dynamic",
            "What animation styles work here?",
            "Show me the color combinations"
          ]
        },
        metadata: {
          processingTime: 1500,
          cost: { current: 0, total: 0 },
          confidence: 0.90
        }
      };
    }

    // Default response for style-related questions
    return {
      success: true,
      data: {
        message: "Each style direction is crafted to tell your product's story differently:\n\n• Premium Minimalism: Clean, sophisticated, Apple-inspired\n• Tech Dynamic: Bold, energetic, innovation-focused\n• Luxury Editorial: High-end magazine aesthetic\n• Lifestyle Authentic: Warm, human-centered approach\n\nWhich resonates most with your brand vision?",
        styleOptions: davidDemoData.styleOptions,
        quickActions: [
          "Premium Minimalism fits perfectly",
          "I want the Tech Dynamic energy",
          "Luxury Editorial appeals to me",
          "Lifestyle Authentic feels right"
        ]
      },
      metadata: {
        processingTime: 1200,
        cost: { current: 0, total: 0 },
        confidence: 0.85
      }
    };
  }

  /**
   * Phase 3: Scene Planning & Storytelling
   * Interactive refinement of visual narrative
   */
  static async handleScenePlanning(message: string, context: DemoHandlerContext) {
    const lowerMessage = message.toLowerCase();

    await new Promise(resolve => setTimeout(resolve, 1800));

    if (lowerMessage.includes('proceed') || lowerMessage.includes('scenes')) {
      return {
        success: true,
        data: {
          message: "Perfect! I've mapped out a compelling 3-scene visual narrative:\n\n1. **Hero Shot**: Premium product presentation with dramatic lighting\n2. **Lifestyle Context**: Product integrated into professional environment  \n3. **Detail Focus**: Macro shots showcasing craftsmanship\n\nThis creates a journey from aspiration → integration → appreciation. Ready to generate the visual assets?",
          phase: CreativePhase.ASSET_GENERATION,
          nextAction: "generate_assets",
          quickActions: [
            "Yes, generate the assets!",
            "Adjust the lifestyle scene",
            "Make the hero shot more dramatic",
            "Add another detail shot"
          ]
        },
        metadata: {
          processingTime: 1800,
          cost: { current: 0, total: 0 },
          confidence: 0.93
        }
      };
    }

    if (lowerMessage.includes('lighting') || lowerMessage.includes('adjust')) {
      return {
        success: true,
        data: {
          message: "Great attention to detail! For the premium minimalism approach, I'm using soft directional lighting with subtle rim effects. This creates dimension without harsh shadows, perfect for your sophisticated positioning. The lighting will be consistent across all scenes to maintain visual cohesion.",
          quickActions: [
            "That sounds perfect",
            "Make it more dramatic",
            "Softer, more natural lighting",
            "Show me lighting references"
          ]
        },
        metadata: {
          processingTime: 1400,
          cost: { current: 0, total: 0 },
          confidence: 0.87
        }
      };
    }

    // Default scene planning response
    return {
      success: true,
      data: {
        message: "I'm developing the scene composition based on your style selection. Each scene is designed to build your product's story progressively. Would you like me to explain the visual narrative structure or shall we proceed to asset generation?",
        quickActions: [
          "Explain the visual narrative",
          "Proceed to asset generation",
          "Adjust the scene composition",
          "Add more lifestyle elements"
        ]
      },
      metadata: {
        processingTime: 1600,
        cost: { current: 0, total: 0 },
        confidence: 0.89
      }
    };
  }

  /**
   * Phase 4: Asset Generation & Refinement
   * Generate assets and handle user feedback
   */
  static async handleAssetGeneration(message: string, context: DemoHandlerContext) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('generate') || lowerMessage.includes('assets')) {
      // Simulate longer processing time for asset generation
      await new Promise(resolve => setTimeout(resolve, 3000));

      return {
        success: true,
        data: {
          message: "Fantastic! I'm generating your visual assets now. This includes backgrounds, product hero shots, lifestyle scenes, and supporting graphics. Each asset will have 3-4 variants for you to choose from. The generation is complete!",
          generatedAssets: davidDemoData.generatedAssets,
          phase: CreativePhase.FINALIZATION,
          nextAction: "review_assets",
          quickActions: [
            "Review the generated assets",
            "These look great!",
            "Can you adjust the backgrounds?",
            "Make the product shots more dramatic"
          ]
        },
        metadata: {
          processingTime: 3000,
          cost: { current: 0, total: 0 },
          confidence: 0.91,
          assetsGenerated: davidDemoData.generatedAssets.length
        }
      };
    }

    if (lowerMessage.includes('review') || lowerMessage.includes('assets')) {
      return {
        success: true,
        data: {
          message: "Here are your generated assets! Each asset has multiple variants. Click through them to select your preferred versions. I've organized them by type: Backgrounds, Product Shots, Lifestyle Scenes, and Supporting Graphics. What do you think?",
          availableAssets: davidDemoData.generatedAssets,
          quickActions: [
            "I love these assets!",
            "Can you adjust the lighting?",
            "Make the backgrounds softer",
            "The lifestyle scenes are perfect"
          ]
        },
        metadata: {
          processingTime: 1000,
          cost: { current: 0, total: 0 },
          confidence: 0.94
        }
      };
    }

    if (lowerMessage.includes('adjust') || lowerMessage.includes('refine')) {
      return {
        success: true,
        data: {
          message: "I understand you'd like some adjustments! I can refine any aspect of the generated assets. For backgrounds, I can adjust lighting, texture, or color tone. For product shots, I can modify composition, shadows, or highlights. What specific changes would you like?",
          quickActions: [
            "Softer background lighting",
            "More dramatic product shadows",
            "Warmer color temperature",
            "These are perfect as-is!"
          ]
        },
        metadata: {
          processingTime: 1200,
          cost: { current: 0, total: 0 },
          confidence: 0.86
        }
      };
    }

    // Default asset generation response
    return {
      success: true,
      data: {
        message: "The asset generation is progressing well! I'm creating multiple variants of each visual element so you'll have options to choose from. Each asset is crafted to match your selected style direction perfectly.",
        quickActions: [
          "Show me the progress",
          "I'm excited to see them!",
          "How many assets total?",
          "What types are being generated?"
        ]
      },
      metadata: {
        processingTime: 1500,
        cost: { current: 0, total: 0 },
        confidence: 0.88
      }
    };
  }

  /**
   * General conversation handler
   */
  static async handleGeneralChat(message: string, context: DemoHandlerContext) {
    const lowerMessage = message.toLowerCase();

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (lowerMessage.includes('help') || lowerMessage.includes('what can')) {
      return {
        success: true,
        data: {
          message: "I'm David, your Creative Director! I help transform Maya's product analysis into compelling visual stories. I can:\n\n• Analyze your brand's visual opportunities\n• Create custom style directions\n• Plan scene compositions and storytelling\n• Generate visual assets with AI\n• Refine everything until it's perfect\n\nWhat would you like to explore?",
          quickActions: [
            "Show me style options",
            "How do you plan scenes?",
            "What assets can you generate?",
            "Let's start the creative process"
          ]
        },
        metadata: {
          processingTime: 1000,
          cost: { current: 0, total: 0 },
          confidence: 0.95
        }
      };
    }

    return {
      success: true,
      data: {
        message: "I'm here to help bring your product's visual story to life! Based on Maya's analysis, I can create compelling visual directions. Would you like to explore style options or dive into the creative process?",
        quickActions: [
          "Show me the creative process",
          "What style options do I have?",
          "How does this work with Maya's analysis?",
          "Let's create something amazing!"
        ]
      },
      metadata: {
        processingTime: 800,
        cost: { current: 0, total: 0 },
        confidence: 0.90
      }
    };
  }

  /**
   * Main entry point for demo mode
   */
  static async handleDemoMessage(message: string, context: DemoHandlerContext) {
    try {
      // Route based on current phase and message content
      switch (context.currentPhase) {
        case CreativePhase.ANALYSIS:
          return await this.handleCreativeAnalysis(context);

        case CreativePhase.CREATIVE_DEVELOPMENT:
          if (message.toLowerCase().includes('style') || !context.selectedStyle) {
            return await this.handleStyleSelection(message, context);
          }
          return await this.handleScenePlanning(message, context);

        case CreativePhase.ASSET_GENERATION:
          return await this.handleAssetGeneration(message, context);

        default:
          return await this.handleGeneralChat(message, context);
      }
    } catch (error) {
      console.error('Demo handler error:', error);

      return {
        success: false,
        error: {
          message: "I encountered a small hiccup, but I'm ready to continue! What would you like to work on?",
          recoverable: true
        },
        metadata: {
          processingTime: 500,
          cost: { current: 0, total: 0 },
          confidence: 0
        }
      };
    }
  }
}