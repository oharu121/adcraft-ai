import { VertexAIService } from "@/lib/services/vertex-ai";
import { CostTracker } from "@/lib/utils/cost-tracker";

export interface PromptRefinement {
  originalPrompt: string;
  refinedPrompt: string;
  suggestions: string[];
  improvements: {
    category: string;
    description: string;
    impact: "high" | "medium" | "low";
  }[];
  confidence: number; // 0-1 score
}

export interface ChatContext {
  messages: { role: "user" | "assistant"; content: string }[];
  sessionId: string;
}

/**
 * Prompt refinement service using Gemini for improving video generation prompts
 * Provides conversational feedback and structured improvements
 */
export class PromptRefiner {
  private static instance: PromptRefiner;
  private vertexAI: VertexAIService;
  private costTracker: CostTracker;
  private modelEndpoint: string;

  private constructor() {
    this.vertexAI = VertexAIService.getInstance();
    this.costTracker = CostTracker.getInstance();
    const config = this.vertexAI.getConfig();
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    this.modelEndpoint = `${this.vertexAI.getBaseUrl()}/publishers/google/models/${modelName}:predict`;
  }

  /**
   * Get singleton instance of PromptRefiner
   */
  public static getInstance(): PromptRefiner {
    if (!PromptRefiner.instance) {
      PromptRefiner.instance = new PromptRefiner();
    }
    return PromptRefiner.instance;
  }

  /**
   * Refine a video generation prompt with specific improvements
   */
  public async refinePrompt(prompt: string, sessionId?: string): Promise<PromptRefinement> {
    try {
      // Check budget before making API call
      const costCheck = await this.costTracker.canProceedWithOperation(0.2);
      if (!costCheck.canProceed) {
        throw new Error(`Cannot refine prompt: ${costCheck.reason}`);
      }

      const systemPrompt = `You are an expert at refining prompts for AI video generation. 
Your task is to improve video generation prompts to create better, more detailed, and more visually compelling videos.

Guidelines for good video prompts:
- Be specific about visual details, lighting, camera angles
- Include motion descriptions and pacing
- Specify style, mood, and atmosphere
- Mention colors, textures, and composition
- Keep under 4000 characters (aim for 1000-2000 for optimal results)
- Avoid abstract concepts, focus on concrete visuals

Return a JSON object with:
{
  "refinedPrompt": "improved version of the prompt",
  "suggestions": ["specific suggestion 1", "suggestion 2", "suggestion 3"],
  "improvements": [
    {
      "category": "Visual Details",
      "description": "Added specific lighting and camera angle",
      "impact": "high"
    }
  ],
  "confidence": 0.85
}`;

      const userPrompt = `Original prompt: "${prompt}"

Please refine this prompt to make it better for AI video generation. Focus on making it more visual, specific, and compelling while keeping it concise.`;

      // Make request to Gemini API
      const response = await this.makeGeminiRequest(systemPrompt, userPrompt);

      // Record cost
      await this.costTracker.recordCost("gemini", 0.2, "Prompt refinement", sessionId);

      // Parse and validate response
      const refinement = this.parseRefinementResponse(response, prompt);

      return refinement;
    } catch (error) {
      console.error("Prompt refinement failed:", error);
      throw new Error(
        `Failed to refine prompt: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Have a conversational chat about improving the prompt
   */
  public async chatAboutPrompt(userMessage: string, context: ChatContext): Promise<string> {
    try {
      // Check budget
      const costCheck = await this.costTracker.canProceedWithOperation(0.15);
      if (!costCheck.canProceed) {
        throw new Error(`Cannot process chat: ${costCheck.reason}`);
      }

      const systemPrompt = `You are a helpful assistant specializing in video creation and prompt optimization. 
You help users improve their video generation prompts through conversation.

Be conversational, helpful, and specific. Ask clarifying questions to better understand what kind of video they want to create. 
Provide concrete suggestions for visual elements, style, pacing, and technical aspects.

Keep responses concise but informative. Focus on actionable advice.`;

      // Build conversation history
      const conversationHistory = context.messages
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");

      const fullPrompt = `${conversationHistory}\nUser: ${userMessage}`;

      // Make request
      const response = await this.makeGeminiRequest(systemPrompt, fullPrompt);

      // Record cost
      await this.costTracker.recordCost("gemini", 0.15, "Chat conversation", context.sessionId);

      return response;
    } catch (error) {
      console.error("Chat failed:", error);
      throw new Error(`Chat failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get suggestions for common prompt improvements
   */
  public getPromptTips(): string[] {
    return [
      "Add specific camera angles (close-up, wide shot, overhead)",
      "Include lighting details (golden hour, dramatic shadows, soft light)",
      "Describe motion and pacing (slow-motion, quick cuts, smooth camera movement)",
      "Specify visual style (cinematic, documentary, artistic, realistic)",
      "Add environmental details (urban, natural, indoor, weather)",
      "Include color palette preferences (warm tones, high contrast, muted colors)",
      "Describe the mood and atmosphere (peaceful, energetic, mysterious)",
      "Mention composition elements (symmetry, rule of thirds, depth of field)",
    ];
  }

  /**
   * Analyze prompt quality and provide a score
   */
  public analyzePrompt(prompt: string): {
    score: number;
    feedback: string[];
    strengths: string[];
    improvements: string[];
  } {
    const feedback: string[] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];
    let score = 0.5; // Base score

    // Check length
    if (prompt.length < 20) {
      improvements.push("Prompt is too short - add more descriptive details");
      score -= 0.2;
    } else if (prompt.length > 500) {
      improvements.push("Prompt is too long - consider shortening for better results");
      score -= 0.1;
    } else if (prompt.length >= 50 && prompt.length <= 300) {
      strengths.push("Good prompt length");
      score += 0.1;
    }

    // Check for visual elements
    const visualKeywords = [
      "camera",
      "lighting",
      "color",
      "visual",
      "shot",
      "angle",
      "composition",
    ];
    const hasVisualElements = visualKeywords.some((keyword) =>
      prompt.toLowerCase().includes(keyword)
    );

    if (hasVisualElements) {
      strengths.push("Includes visual elements");
      score += 0.2;
    } else {
      improvements.push("Add visual elements like camera angles, lighting, or composition");
    }

    // Check for motion description
    const motionKeywords = [
      "movement",
      "motion",
      "moving",
      "flowing",
      "walking",
      "running",
      "dancing",
    ];
    const hasMotion = motionKeywords.some((keyword) => prompt.toLowerCase().includes(keyword));

    if (hasMotion) {
      strengths.push("Describes motion");
      score += 0.1;
    } else {
      improvements.push("Consider adding motion or movement descriptions");
    }

    // Check for style/mood
    const styleKeywords = [
      "cinematic",
      "dramatic",
      "peaceful",
      "energetic",
      "artistic",
      "realistic",
    ];
    const hasStyle = styleKeywords.some((keyword) => prompt.toLowerCase().includes(keyword));

    if (hasStyle) {
      strengths.push("Specifies style or mood");
      score += 0.1;
    } else {
      improvements.push("Add style or mood descriptors");
    }

    // Ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score));

    // Generate overall feedback
    if (score >= 0.8) {
      feedback.push("Excellent prompt! This should generate great results.");
    } else if (score >= 0.6) {
      feedback.push("Good prompt with room for minor improvements.");
    } else if (score >= 0.4) {
      feedback.push("Decent prompt that could benefit from more details.");
    } else {
      feedback.push("Basic prompt that needs significant improvements.");
    }

    return {
      score,
      feedback,
      strengths,
      improvements,
    };
  }

  /**
   * Make request to Gemini API (with mock mode support for local testing)
   */
  private async makeGeminiRequest(systemPrompt: string, userPrompt: string): Promise<string> {
    // Check if VertexAI is in mock mode
    if (this.vertexAI.isMock()) {
      console.log("[MOCK MODE] Gemini API request (PromptRefiner)");
      console.log("System:", systemPrompt.substring(0, 100) + "...");
      console.log("User:", userPrompt.substring(0, 100) + "...");

      // Return a realistic mock response based on the context
      if (
        userPrompt.toLowerCase().includes("sunset") ||
        userPrompt.toLowerCase().includes("lake")
      ) {
        return "That's a beautiful concept! To make your sunset video more cinematic, consider adding details like: the golden hour lighting reflecting off the water, gentle ripples on the lake surface, perhaps some birds flying in the distance, and specify the camera movement - maybe a slow pan or a gentle zoom. What mood are you going for - peaceful and serene, or more dramatic?";
      } else if (
        userPrompt.toLowerCase().includes("improve") ||
        userPrompt.toLowerCase().includes("better")
      ) {
        return "Great question! To improve your video prompt, try being more specific about: lighting conditions (golden hour, soft morning light), camera angles (aerial view, ground level, close-up), movement (slow motion, steady cam), and visual details (textures, colors, atmosphere). What specific aspect would you like to focus on?";
      } else {
        return "I'd be happy to help improve your video prompt! To give you the best suggestions, could you tell me more about the style you're aiming for? Are you looking for something more cinematic, documentary-style, or artistic? Also, what's the main focus or story you want to tell in this video?";
      }
    }

    const accessToken = await this.vertexAI.getAccessToken();

    const requestBody = {
      instances: [
        {
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
        },
      ],
      parameters: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.9,
      },
    };

    const response = await fetch(this.modelEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    // Extract response content
    const content =
      data.predictions?.[0]?.candidates?.[0]?.content ||
      data.predictions?.[0]?.content ||
      "Sorry, I could not generate a response.";

    return content;
  }

  /**
   * Parse refinement response from Gemini
   */
  private parseRefinementResponse(response: string, originalPrompt: string): PromptRefinement {
    try {
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          originalPrompt,
          refinedPrompt: parsed.refinedPrompt || originalPrompt,
          suggestions: parsed.suggestions || [],
          improvements: parsed.improvements || [],
          confidence: parsed.confidence || 0.7,
        };
      }

      // Fallback to simple refinement
      return {
        originalPrompt,
        refinedPrompt: response.substring(0, 400), // Truncate if too long
        suggestions: [
          "Consider adding more visual details",
          "Specify camera angles or movements",
          "Include lighting and mood descriptions",
        ],
        improvements: [
          {
            category: "General",
            description: "AI-refined version of the prompt",
            impact: "medium" as const,
          },
        ],
        confidence: 0.6,
      };
    } catch (error) {
      console.warn("Failed to parse refinement response:", error);
      return {
        originalPrompt,
        refinedPrompt: originalPrompt,
        suggestions: ["Unable to process refinement at this time"],
        improvements: [],
        confidence: 0.0,
      };
    }
  }

  /**
   * Health check for prompt refiner service
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Simple test of the service
      return await this.vertexAI.healthCheck();
    } catch (error) {
      console.error("Prompt refiner health check failed:", error);
      return false;
    }
  }
}
