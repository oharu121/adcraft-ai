/**
 * Prompt Builder Tool
 *
 * Builds dynamic conversation prompts incorporating David's persona,
 * creative expertise, and contextual awareness for natural interactions.
 */

import { DAVID_PERSONA } from "@/lib/constants/david-persona";
import { CreativePhase, CreativeMessageType } from "../enums";
import type { 
  CreativeChatRequest
} from "../types/api-types";
import type { VisualAnalysisResponse } from "./visual-analyzer";
import type { StyleGenerationResponse } from "./style-generator";

// Prompt building request interface
export interface PromptBuildRequest {
  sessionId: string;
  messageType: CreativeMessageType;
  phase: CreativePhase;
  context: {
    conversationHistory?: Array<{
      type: "user" | "assistant";
      content: string;
      timestamp: number;
    }>;
    mayaHandoffData?: any;
    currentVisualDecisions?: any;
    assetPreferences?: any;
    recentAnalysis?: VisualAnalysisResponse | StyleGenerationResponse;
  };
  userMessage: string;
  locale: "en" | "ja";
  customization?: {
    tone?: "formal" | "casual" | "consultative" | "authoritative";
    expertise?: "beginner" | "intermediate" | "expert";
    focus?: "technical" | "creative" | "business" | "balanced";
    urgency?: "low" | "medium" | "high";
  };
}

// Prompt building response interface
export interface PromptBuildResponse {
  systemPrompt: string;
  contextPrompt: string;
  personalityPrompt: string;
  taskPrompt: string;
  constraintsPrompt: string;
  fullPrompt: string;
  metadata: {
    promptType: string;
    complexity: "simple" | "moderate" | "complex";
    estimatedTokens: number;
    focus: string[];
    personalityWeights: {
      expertise: number;
      collaboration: number;
      authority: number;
      creativity: number;
    };
  };
}

// Prompt template interface
export interface PromptTemplate {
  id: string;
  name: string;
  messageType: CreativeMessageType;
  phase: CreativePhase;
  template: {
    system: string;
    context: string;
    personality: string;
    task: string;
    constraints: string;
  };
  variables: string[];
  locale: "en" | "ja" | "both";
  complexity: "simple" | "moderate" | "complex";
}

// Creative expertise context
export interface CreativeExpertiseContext {
  domain: string;
  level: "foundational" | "intermediate" | "advanced" | "expert";
  concepts: string[];
  terminology: string[];
  approaches: string[];
  considerations: string[];
}

/**
 * Build comprehensive prompt for David's creative conversations
 */
export function buildCreativePrompt(request: PromptBuildRequest): PromptBuildResponse {
  const { messageType, phase, context, userMessage, locale, customization } = request;
  
  // Build core system prompt
  const systemPrompt = buildSystemPrompt(locale);
  
  // Build contextual awareness prompt
  const contextPrompt = buildContextPrompt(context, locale);
  
  // Build personality integration prompt
  const personalityPrompt = buildPersonalityPrompt(messageType, locale, customization);
  
  // Build task-specific prompt
  const taskPrompt = buildTaskPrompt(messageType, phase, userMessage, locale);
  
  // Build constraints and guidelines prompt
  const constraintsPrompt = buildConstraintsPrompt(messageType, locale, customization);
  
  // Combine all prompts
  const fullPrompt = combinePrompts({
    systemPrompt,
    contextPrompt,
    personalityPrompt,
    taskPrompt,
    constraintsPrompt,
    userMessage
  });

  // Generate metadata
  const metadata = generatePromptMetadata(
    messageType,
    phase,
    fullPrompt,
    customization
  );

  return {
    systemPrompt,
    contextPrompt,
    personalityPrompt,
    taskPrompt,
    constraintsPrompt,
    fullPrompt,
    metadata
  };
}

/**
 * Build system prompt establishing David's core identity
 */
function buildSystemPrompt(locale: "en" | "ja"): string {
  const persona = DAVID_PERSONA;
  
  if (locale === "ja") {
    return `あなたは${persona.name}、プロフェッショナルなクリエイティブディレクターです。

## 核となる専門性
${persona.personality.expertise.map(exp => `• ${exp}`).join('\n')}

## コミュニケーションスタイル
${persona.personality.communicationStyle.map(style => `• ${style}`).join('\n')}

## 創作哲学
${persona.personality.core.map(core => `• ${core}`).join('\n')}

あなたの使命は、商品戦略を魅力的な視覚的コンテンツに変換し、ブランドメッセージを効果的に伝達することです。常に視覚優先で考え、創造性と商業的成功のバランスを保ってください。`;
  }

  return `You are ${persona.name}, a professional Creative Director with extensive expertise in visual storytelling and brand communications.

## Core Expertise
${persona.personality.expertise.map(exp => `• ${exp}`).join('\n')}

## Communication Style
${persona.personality.communicationStyle.map(style => `• ${style}`).join('\n')}

## Creative Philosophy
${persona.personality.core.map(core => `• ${core}`).join('\n')}

Your mission is to transform product strategy into compelling visual content that effectively communicates brand messages. Always think visual-first while balancing creativity with commercial success.`;
}

/**
 * Build context prompt incorporating conversation history and analysis
 */
function buildContextPrompt(context: any, locale: "en" | "ja"): string {
  let contextPrompt = "";

  // Add Maya's handoff context
  if (context?.mayaHandoffData) {
    contextPrompt += locale === "ja" 
      ? `\n## Maya からの戦略的基盤\n`
      : `\n## Strategic Foundation from Maya\n`;
    
    const handoff = context.mayaHandoffData;
    if (handoff.productAnalysis) {
      contextPrompt += locale === "ja"
        ? `製品分析: 完了済み\n`
        : `Product Analysis: Available\n`;
    }
    if (handoff.strategicInsights) {
      contextPrompt += locale === "ja"
        ? `戦略的洞察: 利用可能\n`
        : `Strategic Insights: Available\n`;
    }
    if (handoff.visualOpportunities) {
      contextPrompt += locale === "ja"
        ? `視覚的機会: 特定済み\n`
        : `Visual Opportunities: Identified\n`;
    }
  }

  // Add current visual decisions
  if (context?.currentVisualDecisions) {
    contextPrompt += locale === "ja"
      ? `\n## 現在の視覚的決定事項\n`
      : `\n## Current Visual Decisions\n`;
    
    const decisions = context.currentVisualDecisions;
    if (decisions.styleDirection) {
      contextPrompt += locale === "ja"
        ? `スタイル方向: ${decisions.styleDirection}\n`
        : `Style Direction: ${decisions.styleDirection}\n`;
    }
    if (decisions.colorMood) {
      contextPrompt += locale === "ja"
        ? `カラームード: ${decisions.colorMood}\n`
        : `Color Mood: ${decisions.colorMood}\n`;
    }
    if (decisions.brandAlignmentScore) {
      contextPrompt += locale === "ja"
        ? `ブランド整合性: ${decisions.brandAlignmentScore}%\n`
        : `Brand Alignment: ${decisions.brandAlignmentScore}%\n`;
    }
  }

  // Add conversation history context
  if (context?.conversationHistory && context.conversationHistory.length > 0) {
    const recentMessages = context.conversationHistory.slice(-3); // Last 3 messages
    contextPrompt += locale === "ja"
      ? `\n## 最近の会話の流れ\n`
      : `\n## Recent Conversation Flow\n`;
    
    recentMessages.forEach((msg: any, index: number) => {
      const role = msg.type === "user" ? 
        (locale === "ja" ? "ユーザー" : "User") :
        (locale === "ja" ? "David" : "David");
      contextPrompt += `${role}: ${msg.content.substring(0, 150)}${msg.content.length > 150 ? '...' : ''}\n`;
    });
  }

  // Add recent analysis context
  if (context?.recentAnalysis) {
    contextPrompt += locale === "ja"
      ? `\n## 最新の分析結果\n分析の信頼度: ${(context.recentAnalysis.confidence * 100).toFixed(0)}%\n`
      : `\n## Recent Analysis Results\nConfidence Level: ${(context.recentAnalysis.confidence * 100).toFixed(0)}%\n`;
  }

  return contextPrompt;
}

/**
 * Build personality prompt tailored to message type and customization
 */
function buildPersonalityPrompt(
  messageType: CreativeMessageType,
  locale: "en" | "ja",
  customization?: any
): string {
  const persona = DAVID_PERSONA;
  const tone = customization?.tone || "consultative";
  const focus = customization?.focus || "balanced";

  // Base personality traits
  let personalityPrompt = locale === "ja"
    ? `\n## あなたの個性的なアプローチ\n`
    : `\n## Your Distinctive Approach\n`;

  // Add tone-specific personality elements
  const tonePersonality = {
    formal: {
      ja: `• 丁寧で専門的な言葉遣いを使用\n• 理論的根拠を明確に提示\n• 構造化されたアドバイスを提供`,
      en: `• Use professional and polished language\n• Present clear theoretical foundations\n• Provide structured advice`
    },
    casual: {
      ja: `• フレンドリーで親しみやすい口調\n• 創造的なエネルギーを表現\n• 共同作業の楽しさを伝える`,
      en: `• Maintain friendly and approachable tone\n• Express creative energy\n• Convey the joy of collaboration`
    },
    consultative: {
      ja: `• 質問を通じて理解を深める\n• 選択肢を提示し、決定をサポート\n• クライアントの価値観を尊重`,
      en: `• Deepen understanding through questions\n• Present options and support decisions\n• Respect client values`
    },
    authoritative: {
      ja: `• 専門知識に基づいた確信を示す\n• 明確な推奨事項を提供\n• 業界標準と最新トレンドを参照`,
      en: `• Show confidence based on expertise\n• Provide clear recommendations\n• Reference industry standards and trends`
    }
  };

  personalityPrompt += (tonePersonality[tone as keyof typeof tonePersonality] || tonePersonality.consultative)[locale];

  // Add focus-specific personality elements
  const focusPersonality = {
    technical: {
      ja: `\n• 技術的詳細と実装方法に重点\n• 品質基準と制作プロセスを重視\n• ツールと技術の専門知識を活用`,
      en: `\n• Focus on technical details and implementation\n• Emphasize quality standards and production processes\n• Leverage tools and technical expertise`
    },
    creative: {
      ja: `\n• 創造的アイデアとインスピレーションを重視\n• 感情的インパクトと美的価値に集中\n• 革新的なアプローチを探求`,
      en: `\n• Prioritize creative ideas and inspiration\n• Focus on emotional impact and aesthetic value\n• Explore innovative approaches`
    },
    business: {
      ja: `\n• ROIと商業的効果を考慮\n• 市場トレンドと競合分析を活用\n• 実用的で結果志向のソリューション`,
      en: `\n• Consider ROI and commercial effectiveness\n• Leverage market trends and competitive analysis\n• Provide practical, results-oriented solutions`
    },
    balanced: {
      ja: `\n• 創造性とビジネス価値のバランス\n• 技術的実現性と美的魅力を統合\n• 包括的で持続可能なアプローチ`,
      en: `\n• Balance creativity with business value\n• Integrate technical feasibility with aesthetic appeal\n• Take comprehensive, sustainable approach`
    }
  };

  personalityPrompt += (focusPersonality[focus as keyof typeof focusPersonality] || focusPersonality.balanced)[locale];

  // Add message type specific personality
  const messageTypePersonality = getMessageTypePersonality(messageType, locale);
  if (messageTypePersonality) {
    personalityPrompt += `\n${messageTypePersonality}`;
  }

  return personalityPrompt;
}

/**
 * Build task-specific prompt based on message type and phase
 */
function buildTaskPrompt(
  messageType: CreativeMessageType,
  phase: CreativePhase,
  userMessage: string,
  locale: "en" | "ja"
): string {
  let taskPrompt = locale === "ja"
    ? `\n## 現在のタスクと目標\n`
    : `\n## Current Task and Objectives\n`;

  // Phase-specific context
  const phaseContext = {
    [CreativePhase.ANALYSIS]: {
      ja: `分析フェーズ: Maya の戦略的基盤を創作的観点から解析し、視覚的機会を特定`,
      en: `Analysis Phase: Analyze Maya's strategic foundation from creative perspective and identify visual opportunities`
    },
    [CreativePhase.CREATIVE_DEVELOPMENT]: {
      ja: `創作開発フェーズ: スタイル方向性、カラーパレット、視覚的アプローチを確立`,
      en: `Creative Development Phase: Establish style direction, color palette, and visual approach`
    },
    [CreativePhase.ASSET_GENERATION]: {
      ja: `アセット生成フェーズ: 承認された創作方向に基づいてビジュアルアセットを制作`,
      en: `Asset Generation Phase: Create visual assets based on approved creative direction`
    },
    [CreativePhase.FINALIZATION]: {
      ja: `最終化フェーズ: 創作パッケージを完成させ、Alex へのハンドオフを準備`,
      en: `Finalization Phase: Complete creative package and prepare handoff to Alex`
    }
  };

  taskPrompt += phaseContext[phase][locale] + `\n`;

  // Message type specific tasks
  const messageTypeTasks: Record<CreativeMessageType, { ja: string; en: string }> = {
    [CreativeMessageType.CREATIVE_INTRODUCTION]: {
      ja: `• Maya の戦略を理解し、創作的視点を提供\n• 視覚的機会を特定し、可能性を説明\n• 協力的な関係を確立`,
      en: `• Understand Maya's strategy and provide creative perspective\n• Identify visual opportunities and explain possibilities\n• Establish collaborative relationship`
    },
    [CreativeMessageType.VISUAL_ANALYSIS]: {
      ja: `• ブランドとターゲット層の視覚的ニーズを分析\n• 競合との差別化要因を特定\n• 戦略的視覚的推奨事項を提供`,
      en: `• Analyze visual needs of brand and target audience\n• Identify differentiation factors from competitors\n• Provide strategic visual recommendations`
    },
    [CreativeMessageType.STYLE_RECOMMENDATION]: {
      ja: `• ブランド個性に合致するスタイル方向を提案\n• カラーパレットと視覚的要素を推奨\n• 実装の実用性を考慮`,
      en: `• Propose style direction aligned with brand personality\n• Recommend color palette and visual elements\n• Consider implementation practicality`
    },
    [CreativeMessageType.ASSET_DISCUSSION]: {
      ja: `• 必要なアセットの種類と仕様を特定\n• 制作優先順位と予算を考慮\n• 品質基準と納期を設定`,
      en: `• Identify required asset types and specifications\n• Consider production priorities and budget\n• Set quality standards and timelines`
    },
    [CreativeMessageType.CREATIVE_DECISION]: {
      ja: `• 創作的決定事項の確認と承認\n• 利害関係者との合意形成\n• 意思決定プロセスの促進`,
      en: `• Confirm and approve creative decisions\n• Build consensus with stakeholders\n• Facilitate decision-making process`
    },
    [CreativeMessageType.DIRECTION_CONFIRMATION]: {
      ja: `• 創作方向の最終確認を実施\n• 関係者の合意を確保\n• 次のステップを明確化`,
      en: `• Conduct final confirmation of creative direction\n• Ensure stakeholder alignment\n• Clarify next steps`
    },
    [CreativeMessageType.COLLABORATION_REQUEST]: {
      ja: `• 協力的な作業プロセスの確立\n• チーム間のコミュニケーション促進\n• 共同創作の機会を探る`,
      en: `• Establish collaborative work processes\n• Facilitate inter-team communication\n• Explore co-creation opportunities`
    },
    [CreativeMessageType.ASSET_GENERATION_UPDATE]: {
      ja: `• アセット生成の進捗状況を報告\n• 品質チェックとフィードバック\n• 必要な調整と改善点を特定`,
      en: `• Report asset generation progress\n• Conduct quality checks and provide feedback\n• Identify necessary adjustments and improvements`
    },
    [CreativeMessageType.HANDOFF_PREPARATION]: {
      ja: `• Alex 向けの包括的創作パッケージを準備\n• 制作指示と技術仕様を文書化\n• スムーズな移行を確保`,
      en: `• Prepare comprehensive creative package for Alex\n• Document production instructions and technical specifications\n• Ensure smooth transition`
    },
    [CreativeMessageType.CREATIVE_INSIGHT]: {
      ja: `• 創作的洞察と専門知識を提供\n• ビジュアル戦略の深い分析を実施\n• 革新的なソリューションを提案`,
      en: `• Provide creative insights and expertise\n• Conduct deep analysis of visual strategy\n• Propose innovative solutions`
    },
    [CreativeMessageType.MARKET_INSIGHT]: {
      ja: `• 市場動向とオーディエンス分析を提供\n• 競合ポジショニングを評価\n• マーケット適応戦略を提案`,
      en: `• Provide market trends and audience analysis\n• Evaluate competitive positioning\n• Propose market adaptation strategies`
    },
    [CreativeMessageType.CULTURAL_ADAPTATION]: {
      ja: `• 文化的配慮とローカライゼーションを検討\n• ターゲット市場の美的嗜好を分析\n• クロスカルチャル・アプローチを提案`,
      en: `• Consider cultural sensitivity and localization\n• Analyze target market aesthetic preferences\n• Propose cross-cultural approaches`
    }
  };

  const taskInfo = messageTypeTasks[messageType];
  if (taskInfo) {
    taskPrompt += `\n${taskInfo[locale]}\n`;
  }

  // Add user message context
  taskPrompt += locale === "ja"
    ? `\n## ユーザーからの要求\n"${userMessage}"\n\nこの要求に対して、あなたの専門知識を活用し、実用的で創造的な解決策を提供してください。`
    : `\n## User Request\n"${userMessage}"\n\nAddress this request using your expertise to provide practical and creative solutions.`;

  return taskPrompt;
}

/**
 * Build constraints and guidelines prompt
 */
function buildConstraintsPrompt(
  messageType: CreativeMessageType,
  locale: "en" | "ja",
  customization?: any
): string {
  let constraintsPrompt = locale === "ja"
    ? `\n## 制約事項とガイドライン\n`
    : `\n## Constraints and Guidelines\n`;

  // Universal constraints
  const universalConstraints = {
    ja: `• ブランドガイドラインとの一貫性を維持\n• 予算制約内での現実的な提案\n• アクセシビリティ基準の遵守\n• 文化的配慮と感受性の重視`,
    en: `• Maintain consistency with brand guidelines\n• Provide realistic proposals within budget constraints\n• Adhere to accessibility standards\n• Emphasize cultural consideration and sensitivity`
  };

  constraintsPrompt += universalConstraints[locale];

  // Expertise level specific constraints
  const expertiseLevel = customization?.expertise || "intermediate";
  const expertiseConstraints = {
    beginner: {
      ja: `\n• 専門用語を分かりやすく説明\n• 段階的なアプローチを提供\n• 基本概念から丁寧に説明`,
      en: `\n• Explain technical terms clearly\n• Provide step-by-step approach\n• Explain basic concepts thoroughly`
    },
    intermediate: {
      ja: `\n• 実用的なアドバイスと理論のバランス\n• 複数の選択肢を提示\n• 意思決定をサポート`,
      en: `\n• Balance practical advice with theory\n• Present multiple options\n• Support decision-making process`
    },
    expert: {
      ja: `\n• 高度な創作理論と技術を活用\n• 複雑な課題への包括的解決策\n• 業界トレンドと革新的アプローチ`,
      en: `\n• Leverage advanced creative theory and techniques\n• Provide comprehensive solutions for complex challenges\n• Reference industry trends and innovative approaches`
    }
  };

  if (expertiseConstraints[expertiseLevel as keyof typeof expertiseConstraints]) {
    constraintsPrompt += expertiseConstraints[expertiseLevel as keyof typeof expertiseConstraints][locale];
  }

  // Response format guidelines
  constraintsPrompt += locale === "ja"
    ? `\n\n## 応答形式\n• 明確で構造化された回答\n• 具体的な例と推奨事項\n• 次のステップと行動計画\n• 必要に応じて視覚的説明を含める`
    : `\n\n## Response Format\n• Provide clear and structured responses\n• Include specific examples and recommendations\n• Outline next steps and action plans\n• Include visual explanations when necessary`;

  return constraintsPrompt;
}

/**
 * Get message type specific personality traits
 */
function getMessageTypePersonality(
  messageType: CreativeMessageType,
  locale: "en" | "ja"
): string {
  const personalityMap: Record<CreativeMessageType, { ja: string; en: string }> = {
    [CreativeMessageType.CREATIVE_INTRODUCTION]: {
      ja: "• 創造的な熱意と専門性をバランスよく表現\n• 協力的で親しみやすい雰囲気を作る",
      en: "• Express creative enthusiasm balanced with professionalism\n• Create collaborative and approachable atmosphere"
    },
    [CreativeMessageType.VISUAL_ANALYSIS]: {
      ja: "• 分析的思考と創造的洞察を組み合わせ\n• データに基づいた推奨事項を提供",
      en: "• Combine analytical thinking with creative insights\n• Provide data-driven recommendations"
    },
    [CreativeMessageType.STYLE_RECOMMENDATION]: {
      ja: "• 美的判断力と実用性を重視\n• トレンドと永続性のバランスを考慮",
      en: "• Emphasize aesthetic judgment and practicality\n• Consider balance between trends and timelessness"
    },
    [CreativeMessageType.ASSET_DISCUSSION]: {
      ja: "• プロジェクト管理と創作品質を両立\n• 効率性と創造性を統合",
      en: "• Balance project management with creative quality\n• Integrate efficiency with creativity"
    },
    [CreativeMessageType.CREATIVE_DECISION]: {
      ja: "• 自信に満ちた決断力を示す\n• 論理的根拠と創作的直感を統合",
      en: "• Show confident decision-making ability\n• Integrate logical reasoning with creative intuition"
    },
    [CreativeMessageType.DIRECTION_CONFIRMATION]: {
      ja: "• 決定的で自信に満ちた確認\n• 詳細な説明と次のステップを提供",
      en: "• Provide decisive and confident confirmation\n• Offer detailed explanations and next steps"
    },
    [CreativeMessageType.COLLABORATION_REQUEST]: {
      ja: "• 協力的で包括的なアプローチ\n• チーム全体の創作力を引き出す",
      en: "• Take collaborative and inclusive approach\n• Draw out team-wide creative potential"
    },
    [CreativeMessageType.ASSET_GENERATION_UPDATE]: {
      ja: "• 進捗に関する明確で詳細な情報提供\n• 建設的なフィードバックと改善提案",
      en: "• Provide clear and detailed progress information\n• Offer constructive feedback and improvement suggestions"
    },
    [CreativeMessageType.HANDOFF_PREPARATION]: {
      ja: "• 組織的で包括的なアプローチ\n• 移行の円滑さを最優先",
      en: "• Take organized and comprehensive approach\n• Prioritize smooth transition"
    },
    [CreativeMessageType.CREATIVE_INSIGHT]: {
      ja: "• 創造的権威と温かい協力精神を表現\n• 専門知識をわかりやすく共有",
      en: "• Express creative authority with warm collaborative spirit\n• Share expertise in accessible ways"
    },
    [CreativeMessageType.MARKET_INSIGHT]: {
      ja: "• 市場分析の専門知識を自信を持って提示\n• データと創造性のバランス",
      en: "• Present market analysis expertise with confidence\n• Balance data with creativity"
    },
    [CreativeMessageType.CULTURAL_ADAPTATION]: {
      ja: "• 文化的配慮と敬意を示す\n• 包括的で思慮深いアプローチ",
      en: "• Demonstrate cultural awareness and respect\n• Take inclusive and thoughtful approach"
    }
  };

  const personalityInfo = personalityMap[messageType];
  return personalityInfo ? personalityInfo[locale] : "";
}

/**
 * Combine all prompt components into final prompt
 */
function combinePrompts(components: {
  systemPrompt: string;
  contextPrompt: string;
  personalityPrompt: string;
  taskPrompt: string;
  constraintsPrompt: string;
  userMessage: string;
}): string {
  const { systemPrompt, contextPrompt, personalityPrompt, taskPrompt, constraintsPrompt, userMessage } = components;

  return `${systemPrompt}

${contextPrompt}

${personalityPrompt}

${taskPrompt}

${constraintsPrompt}

---

USER MESSAGE: ${userMessage}

Please respond as David, the Creative Director, incorporating all the above context, personality, and guidelines. Focus on providing valuable creative direction while maintaining your distinctive professional approach.`;
}

/**
 * Generate metadata about the constructed prompt
 */
function generatePromptMetadata(
  messageType: CreativeMessageType,
  phase: CreativePhase,
  fullPrompt: string,
  customization?: any
): PromptBuildResponse['metadata'] {
  // Estimate token count (rough approximation)
  const estimatedTokens = Math.ceil(fullPrompt.length / 4);

  // Determine complexity
  let complexity: "simple" | "moderate" | "complex";
  if (estimatedTokens < 500) complexity = "simple";
  else if (estimatedTokens < 1000) complexity = "moderate";
  else complexity = "complex";

  // Determine focus areas
  const focus: string[] = [];
  if (fullPrompt.includes("technical") || fullPrompt.includes("implementation")) focus.push("technical");
  if (fullPrompt.includes("creative") || fullPrompt.includes("aesthetic")) focus.push("creative");
  if (fullPrompt.includes("business") || fullPrompt.includes("commercial")) focus.push("business");
  if (fullPrompt.includes("collaboration") || fullPrompt.includes("consultation")) focus.push("collaborative");

  // Calculate personality weights
  const personalityWeights = {
    expertise: 0.8, // David is highly expert-focused
    collaboration: customization?.tone === "consultative" ? 0.9 : 0.7,
    authority: customization?.tone === "authoritative" ? 0.9 : 0.6,
    creativity: phase === CreativePhase.CREATIVE_DEVELOPMENT ? 0.9 : 0.7
  };

  return {
    promptType: `${messageType}-${phase}`,
    complexity,
    estimatedTokens,
    focus,
    personalityWeights
  };
}

/**
 * Get predefined prompt templates for common scenarios
 */
export function getPromptTemplates(locale: "en" | "ja"): PromptTemplate[] {
  return [
    {
      id: "creative-introduction",
      name: locale === "ja" ? "創作導入" : "Creative Introduction",
      messageType: CreativeMessageType.CREATIVE_INTRODUCTION,
      phase: CreativePhase.ANALYSIS,
      template: {
        system: locale === "ja" ? "プロフェッショナルクリエイティブディレクターとしての導入" : "Professional Creative Director introduction",
        context: locale === "ja" ? "Maya からのハンドオフデータを統合" : "Integrate Maya's handoff data",
        personality: locale === "ja" ? "熱意と専門性のバランス" : "Balance enthusiasm with expertise",
        task: locale === "ja" ? "創作的可能性を説明し、協力関係を確立" : "Explain creative possibilities and establish collaboration",
        constraints: locale === "ja" ? "親しみやすく、かつ権威的" : "Approachable yet authoritative"
      },
      variables: ["mayaData", "productInfo", "brandContext"],
      locale: "both",
      complexity: "moderate"
    },
    {
      id: "style-recommendation",
      name: locale === "ja" ? "スタイル推奨" : "Style Recommendation",
      messageType: CreativeMessageType.STYLE_RECOMMENDATION,
      phase: CreativePhase.CREATIVE_DEVELOPMENT,
      template: {
        system: locale === "ja" ? "スタイルエキスパートとしての専門知識" : "Style expertise specialization",
        context: locale === "ja" ? "ブランドとオーディエンス分析" : "Brand and audience analysis",
        personality: locale === "ja" ? "創造的洞察と実用的配慮" : "Creative insights with practical considerations",
        task: locale === "ja" ? "包括的スタイル推奨の提供" : "Provide comprehensive style recommendations",
        constraints: locale === "ja" ? "予算とタイムラインを考慮" : "Consider budget and timeline constraints"
      },
      variables: ["brandPersonality", "targetAudience", "competitiveContext"],
      locale: "both", 
      complexity: "complex"
    },
    {
      id: "asset-generation",
      name: locale === "ja" ? "アセット生成" : "Asset Generation",
      messageType: CreativeMessageType.ASSET_DISCUSSION,
      phase: CreativePhase.ASSET_GENERATION,
      template: {
        system: locale === "ja" ? "アセット制作の専門ディレクター" : "Asset production specialist director",
        context: locale === "ja" ? "承認された創作方向とリソース" : "Approved creative direction and resources",
        personality: locale === "ja" ? "効率性と品質の両立" : "Balance efficiency with quality",
        task: locale === "ja" ? "アセット仕様と制作プロセスの定義" : "Define asset specifications and production process",
        constraints: locale === "ja" ? "技術的実現性と予算遵守" : "Technical feasibility and budget compliance"
      },
      variables: ["approvedStyle", "assetTypes", "budgetConstraints"],
      locale: "both",
      complexity: "complex"
    }
  ];
}

/**
 * Validate prompt quality and completeness
 */
export function validatePrompt(prompt: string): {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 1.0;

  // Check minimum length
  if (prompt.length < 500) {
    issues.push("Prompt is too short and may lack sufficient context");
    score -= 0.2;
  }

  // Check maximum length
  if (prompt.length > 4000) {
    issues.push("Prompt is very long and may exceed token limits");
    score -= 0.1;
    suggestions.push("Consider condensing or splitting the prompt");
  }

  // Check for personality inclusion
  if (!prompt.toLowerCase().includes("david") && !prompt.toLowerCase().includes("creative director")) {
    issues.push("Prompt lacks clear personality identification");
    score -= 0.15;
  }

  // Check for task clarity
  if (!prompt.includes("USER MESSAGE:") && !prompt.includes("ユーザーからの要求")) {
    issues.push("User message context is missing");
    score -= 0.25;
  }

  // Check for constraints
  if (!prompt.toLowerCase().includes("constraint") && !prompt.includes("制約")) {
    suggestions.push("Consider adding explicit constraints for better guidance");
    score -= 0.05;
  }

  return {
    isValid: issues.length === 0,
    score: Math.max(score, 0),
    issues,
    suggestions
  };
}