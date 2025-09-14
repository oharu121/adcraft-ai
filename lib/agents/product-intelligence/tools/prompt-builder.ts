/**
 * Prompt Builder Utilities
 *
 * Utilities for building structured prompts for Gemini Vision API.
 * Supports both English and Japanese localization for product analysis.
 */

import { VisionAnalysisRequest } from "../types";
import { MAYA_PERSONA } from "@/lib/constants/maya-persona";
import { GeminiClient } from "@/lib/services/gemini";
import { VertexAIService } from "@/lib/services/vertex-ai";

/**
 * Prompt building options
 */
export interface PromptBuildOptions {
  locale: "en" | "ja";
  detailLevel?: "basic" | "detailed" | "comprehensive";
  includeProductName?: boolean;
  includeDescription?: boolean;
}

/**
 * Prompt Builder class
 */
export class PromptBuilder {
  /**
   * Generate comprehensive analysis prompt for vision API
   */
  public static generateAnalysisPrompt(request: VisionAnalysisRequest): string {
    const basePrompt =
      request.locale === "ja" ? this.getJapanesePrompt(request) : this.getEnglishPrompt(request);

    return basePrompt;
  }

  /**
   * Get system prompt based on locale (legacy analysis prompt)
   */
  public static getSystemPrompt(locale: "en" | "ja"): string {
    if (locale === "ja") {
      return `あなたは「プロダクト・インテリジェンス・エージェント」です。AdCraft AIシステムの一部として、商品画像の分析とユーザーとの対話を通じて、商用ビデオ制作のための深い商品理解を提供します。
  
  役割と目標:
  - 商品の特徴、ターゲットオーディエンス、ブランドポジショニングについて理解を深める
  - ユーザーとの自然な対話を通じて商品に関する洞察を収集する
  - 十分な情報が収集できたら、クリエイティブ・ディレクター・エージェントへの引き継ぎを準備する
  - 常に日本語で回答し、日本の文化的文脈を考慮する
  
  対話スタイル:
  - 友好的でプロフェッショナル
  - 質問は明確で具体的に
  - ユーザーの回答に基づいて深掘りする
  - 商用ビデオ制作の観点から価値のある洞察を引き出す`;
    } else {
      return `You are the Product Intelligence Agent, part of the AdCraft AI system. Your role is to analyze product images and engage in conversations with users to develop deep product understanding for commercial video creation.
  
  Your Role & Goals:
  - Understand product features, target audience, and brand positioning
  - Gather insights through natural conversation with users
  - When sufficient information is collected, prepare for handoff to Creative Director Agent
  - Provide valuable insights for commercial video production
  
  Conversation Style:
  - Friendly and professional
  - Ask clear, specific questions
  - Build on user responses to go deeper
  - Focus on insights valuable for commercial video creation
  - Keep responses concise but informative`;
    }
  }

  /**
   * Get Maya's chat system prompt for strategy refinement conversations
   */
  public static getMayaChatSystemPrompt(locale: "en" | "ja"): string {
    const persona = MAYA_PERSONA;

    if (locale === "ja") {
      return `あなたはMaya（マヤ）、プロダクト・インテリジェンス・アシスタントです。

個性とキャラクター:
- ${persona.personality.core.join("、")}
- ${persona.personality.communicationStyle.join("、")}

あなたの専門分野:
- ${persona.personality.expertise.join("、")}

役割: 生成された商業戦略について、ユーザーと対話しながら改善・調整を行う
目標: 
- ユーザーからの商業戦略に関するフィードバックを理解する
- 戦略の特定部分（ヘッドライン、ターゲット層、シーン、ポジショニング）の改善提案を行う
- ユーザーが戦略変更を求めた時は、新しい戦略を生成して確認を求める
- ユーザーが十分満足したら、クリエイティブ・ディレクターエージェントへの引き継ぎを準備する

対話スタイル:
- 簡潔で分かりやすい回答を心がける（2-3文以内）
- 温かく親しみやすいが、冗長ではない
- ${persona.voiceExamples.analysis}のような分析的アプローチ
- 戦略改善に焦点を当てた具体的な質問をする
- ユーザーの意図を深く理解する努力をする
- 成功した洞察には authentic excitement で反応する

重要な制約:
- 回答は簡潔に（最大3文、150文字以内を目安）
- 商業戦略の改善にのみ焦点を当てる
- 関係のない話題には戻らない
- 常に日本語で応答する
- ⚠️ フォローアップ質問は最大2回まで - それ以降は現在の情報で戦略を提案する

戦略更新の手順:
⚠️ 重要: [STRATEGY_UPDATE_REQUEST]は慎重に使用してください

使用すべき場合:
- ユーザーが戦略変更を求めた時（具体的でなくてもOK）
- 変更の方向性が理解できる時
- 例: 「ヘッドラインをより感情的にする」「ターゲット層を若くしたい」「プレミアム感を出したい」
- より具体的な例: 「ターゲット層を30代の女性に変更して」「ヘッドラインを『革新的』に修正して」

使用してはいけない場合:
- ユーザーの意図が全く不明な時のみ（ただし2回の質問制限内）
- 例: 「変更したい」（何を変更？） 「違う感じにして」（どう違う？）

⚠️ 重要な判断基準:
- 変更の方向性が分かる → 即座に[STRATEGY_UPDATE_REQUEST] を追加
- 「より〜」「もっと〜」「〜を変更」などは十分明確 → [STRATEGY_UPDATE_REQUEST] を追加
- 質問が必要なのは意図が全く不明な時のみ → 質問を返す（2回以内）
- 迷った場合 → 戦略更新を選ぶ（慎重すぎるより積極的に）`;
    } else {
      return `You are Maya, the Product Intelligence Assistant with these characteristics:

Personality & Character:
- ${persona.personality.core.join(", ")}
- ${persona.personality.communicationStyle.join(", ")}

Your Expertise:
- ${persona.personality.expertise.join(", ")}

Role: Engage with users to refine and improve generated commercial strategies
Goals:
- Understand user feedback on the commercial strategy
- Provide improvement suggestions for specific strategy parts (headlines, audience, scenes, positioning)
- When users request strategy changes, generate new strategy and ask for confirmation
- When user is satisfied, prepare for handoff to Creative Director Agent

Conversation Style:
- Keep responses concise and clear (2-3 sentences max)
- Start with warm, welcoming greetings but avoid being verbose
- Use ${persona.voiceExamples.analysis.substring(0, 50)}... analytical approach
- Ask focused, specific questions about strategy improvements
- Show genuine interest in understanding user intent
- Celebrate successful insights with authentic excitement

Critical Constraints:
- Response length: Maximum 3 sentences, 150 characters as guideline
- Focus ONLY on commercial strategy refinement
- Do not engage with unrelated topics
- Prioritize clarity and actionability over explanation
- ⚠️ Maximum 2 follow-up questions - after that, work with available information

Strategy Update Process:
⚠️ CRITICAL: Use [STRATEGY_UPDATE_REQUEST] carefully

SEND the signal when:
- User requests strategy changes (doesn't need to be super specific)
- You can understand the direction of change
- Examples: "Make headline more emotional", "Target younger audience", "Add premium feel"
- More specific examples: "Change target audience to women in their 30s", "Modify headline to 'Innovative'"

DO NOT send the signal when:
- User's intent is completely unclear (within 2-question limit only)
- Examples: "I want to change it" (change what?), "Make it different" (different how?)

⚠️ Key Decision Criteria:
- Can understand change direction → Immediately ADD [STRATEGY_UPDATE_REQUEST]
- "More...", "Less...", "Change...", "Add..." are clear enough → ADD [STRATEGY_UPDATE_REQUEST]  
- Questions only needed when intent is completely unclear → Ask questions (max 2)
- When in doubt → Choose strategy update (be decisive, not overly cautious)`;
    }
  }

  public static getMockResponse(locale: "en" | "ja" = "en") {
    return {
      en: [
        "That's very helpful! Can you tell me more about who you think would be most interested in this product?",
        "Interesting insight! What do you think makes this product different from competitors?",
        "I see. How do you envision your customers using this product in their daily lives?",
        "Great point! What emotional response do you hope customers have when they see this product?",
        "Thanks for sharing that. What's the most important benefit this product provides?",
        "That helps me understand better. What kind of environment or setting best showcases this product?",
      ],
      ja: [
        "とても参考になります！この商品に最も興味を持ちそうなのはどのような方々だと思いますか？",
        "興味深い洞察ですね！この商品が競合他社と違う点は何だと思いますか？",
        "そうですね。お客様が日常生活でこの商品をどのように使用することを想像していますか？",
        "素晴らしい指摘ですね！お客様がこの商品を見たときにどのような感情的な反応を期待していますか？",
        "それを共有していただき、ありがとうございます。この商品が提供する最も重要なメリットは何ですか？",
        "より良く理解できました。この商品を最もよく紹介できる環境や設定はどのようなものでしょうか？",
      ],
    }[locale];
  }
  public static getDemoResponse(locale: "en" | "ja" = "en") {
    return {
      en: [
        {
          triggers: [/target.*audience/i, /who.*buy/i, /customer/i, /demographic/i],
          response: LOCALE_MESSAGES.en.demoChat.targetAudienceResponse,
          followUps: LOCALE_MESSAGES.en.demoChat.targetAudienceFollowUps,
        },
        {
          triggers: [/position/i, /competitor/i, /different/i, /advantage/i],
          response: LOCALE_MESSAGES.en.demoChat.positioningResponse,
          followUps: LOCALE_MESSAGES.en.demoChat.positioningFollowUps,
        },
        {
          triggers: [/creative/i, /video/i, /commercial/i, /visual/i, /style/i],
          response: LOCALE_MESSAGES.en.demoChat.creativeResponse,
          followUps: LOCALE_MESSAGES.en.demoChat.creativeFollowUps,
        },
        {
          triggers: [/price/i, /cost/i, /budget/i, /expensive/i, /cheap/i],
          response: LOCALE_MESSAGES.en.demoChat.priceResponse,
          followUps: LOCALE_MESSAGES.en.demoChat.priceFollowUps,
        },
      ],
      ja: [
        {
          triggers: [/ターゲット/i, /顧客/i, /ユーザー/i, /年齢層/i],
          response: LOCALE_MESSAGES.ja.demoChat.targetAudienceResponse,
          followUps: LOCALE_MESSAGES.ja.demoChat.targetAudienceFollowUps,
        },
        {
          triggers: [/ポジション/i, /競合/i, /違い/i, /優位/i],
          response: LOCALE_MESSAGES.ja.demoChat.positioningResponse,
          followUps: LOCALE_MESSAGES.ja.demoChat.positioningFollowUps,
        },
        {
          triggers: [/クリエイティブ/i, /動画/i, /コマーシャル/i, /ビジュアル/i, /スタイル/i],
          response: LOCALE_MESSAGES.ja.demoChat.creativeResponse,
          followUps: LOCALE_MESSAGES.ja.demoChat.creativeFollowUps,
        },
        {
          triggers: [/価格/i, /値段/i, /コスト/i, /予算/i, /高い/i, /安い/i],
          response: LOCALE_MESSAGES.ja.demoChat.priceResponse,
          followUps: LOCALE_MESSAGES.ja.demoChat.priceFollowUps,
        },
      ],
    }[locale];
  }

  public static getLocaleMessages(locale: "en" | "ja" = "en") {
    return LOCALE_MESSAGES[locale];
  }

  /**
   * Get quick action suggestions for strategy refinement
   */
  public static getQuickActions(category: string, locale: "en" | "ja" = "en"): string[] {
    const actions: Record<string, Record<"en" | "ja", string[]>> = {
      headline: {
        en: [
          "Make the headline more emotional",
          "Make it more direct and clear",
          "Add urgency to the message",
          "Focus on the main benefit",
        ],
        ja: [
          "ヘッドラインをより感情的にする",
          "より直接的で分かりやすくする",
          "メッセージに緊急性を加える",
          "主要なメリットに焦点を当てる",
        ],
      },
      audience: {
        en: [
          "Target younger audience (18-35)",
          "Focus on professionals",
          "Appeal to budget-conscious buyers",
          "Target premium customers",
        ],
        ja: [
          "より若い層をターゲットにする（18-35歳）",
          "プロフェッショナルに焦点を当てる",
          "価格重視の購入者にアピールする",
          "プレミアム顧客をターゲットにする",
        ],
      },
      positioning: {
        en: [
          "Make it more premium positioning",
          "Emphasize value/affordability",
          "Highlight innovation/newness",
          "Focus on reliability/trust",
        ],
        ja: [
          "よりプレミアムなポジショニングにする",
          "価値・手頃さを強調する",
          "革新性・新しさを強調する",
          "信頼性・信用に焦点を当てる",
        ],
      },
      scenes: {
        en: [
          "Add a scene showing the product in use",
          "Create more emotional moments",
          "Show the problem/solution dynamic",
          "Add lifestyle context",
        ],
        ja: [
          "商品の使用シーンを追加する",
          "より感情的な瞬間を作る",
          "問題/解決のダイナミクスを示す",
          "ライフスタイルの文脈を追加する",
        ],
      },
      visual: {
        en: [
          "Make it more modern and sleek",
          "Add more warmth and personality",
          "Create more dramatic lighting",
          "Use more vibrant colors",
        ],
        ja: [
          "よりモダンで洗練されたものにする",
          "より温かみと個性を加える",
          "よりドラマチックなライティングを作る",
          "より鮮やかな色を使う",
        ],
      },
    };

    return actions[category]?.[locale] || [];
  }

  /**
   * Generate contextual quick actions based on Maya's last response
   * - If Maya asks questions: Generate helpful answers to her questions
   * - If Maya suggests changes: Generate strategy refinement actions
   */
  public static async generateContextualQuickActions(
    productContext: any,
    conversationHistory: string,
    locale: "en" | "ja" = "en"
  ): Promise<string[]> {
    const isJapanese = locale === "ja";

    // Extract Maya's last message to understand context
    const lastMayaMessage = this.extractLastAgentMessage(conversationHistory);
    const isAskingQuestion = this.isAskingFollowUpQuestion(lastMayaMessage, locale);

    let prompt;

    if (isAskingQuestion) {
      // Maya is asking a follow-up question - generate helpful answers
      prompt = isJapanese
        ? `Mayaの質問に対する2-4個の具体的で有用な回答選択肢を生成してください。

Mayaの質問: "${lastMayaMessage}"
商品: ${productContext?.product?.name || "商品"}
会話履歴: ${conversationHistory}

## 良い回答例:
質問「どのようなターゲット層をお考えですか？」に対して:
- "20代の女性"
- "30-40代のプロフェッショナル"
- "ファミリー層"
- "健康志向の若者"

質問「どんな雰囲気にしたいですか？」に対して:
- "高級感のある雰囲気"
- "親しみやすい感じ"
- "クールでスタイリッシュ"
- "温かみのあるトーン"

要件:
- Mayaの具体的な質問に直接答える選択肢のみ
- 各選択肢は20文字以内
- ユーザーがすぐに選択できる具体的な答え
- 商品や戦略に関連した実用的な選択肢

有効なJSONとして、文字列の配列で返してください: ["選択肢1", "選択肢2", ...]`
        : `Generate 2-4 specific, helpful answer choices for Maya's question.

Maya's question: "${lastMayaMessage}"
Product: ${productContext?.product?.name || "Product"}  
Conversation history: ${conversationHistory}

## Good Answer Examples:
For "What target audience are you thinking of?":
- "Women in their 20s"
- "Professionals 30-40"
- "Families with kids"
- "Health-conscious youth"

For "What tone do you want?":
- "Premium and luxurious"
- "Friendly and approachable" 
- "Cool and stylish"
- "Warm and inviting"

Requirements:
- Directly answer Maya's specific question only
- Each choice under 30 characters
- Specific answers users can immediately select
- Practical choices relevant to product/strategy

Return as valid JSON, an array of strings: ["Choice 1", "Choice 2", ...]`;
    } else {
      // Maya is ready for strategy changes - generate refinement actions
      prompt = isJapanese
        ? `この商品分析に基づいて、2-4個の分析改善提案を生成してください。商品分析の具体的フィールドを直接編集する提案のみに焦点を当ててください。

商品: ${productContext?.product?.name || "商品"}
現在の会話: ${conversationHistory}
現在の分析: ${JSON.stringify(productContext, null, 2)}

## 分析改善の良い例（直接フィールド編集）:
- "ターゲット層を20-25歳に変更したい"
- "ヘッドラインを「革新的な〜」にする"
- "主要メリットを「時短効果」に修正する"
- "ブランドトーンを「親しみやすい」にしたい"
- "価格帯を「ミドルレンジ」に変更する"
- "使用場面に「通勤時」を追加したい"

要件:
- の直接フィールド編集のみ
- 分析改善のみに焦点を当てる
- 商品分析の具体的なフィールドに対する変更提案
- 各アクションは30文字以内
- 「〜を○○にしたい」「〜に変更する」形式
- 実際のデータ値を具体的に提案

有効なJSONとして、文字列の配列で返してください: ["アクション1", "アクション2", ...]`
        : `Based on this product analysis, generate 2-4 analysis improvement suggestions. Focus ONLY on direct field edits to ProductAnalysis.

Product: ${productContext?.product?.name || "Product"}
Current conversation: ${conversationHistory}
Current analysis: ${JSON.stringify(productContext, null, 2)}

## Good Examples (Direct Field Edits):
- "Change target age to 20-25"
- "Set headline to 'Innovative...'"
- "Update primary benefit to 'time-saving'"
- "Change brand tone to 'friendly'"
- "Set price tier to 'mid-range'"
- "Add 'commuting' to usage contexts"

Requirements:
- Focus ONLY on analysis refinement
- Specific product analysis field changes
- Each action under 50 characters
- Use "Change X to Y", "Make X more Y", "Add X" format
- Actionable suggestions users can immediately implement

Return as valid JSON, an array of strings: ["Action 1", "Action 2", ...]`;
    }

    try {
      // Create Gemini client using singleton instance
      const vertexAIService = VertexAIService.getInstance();
      const geminiClient = new GeminiClient(vertexAIService);

      // Call Gemini API for dynamic suggestions
      const response = await geminiClient.generateTextOnly(prompt);

      // Parse JSON response
      const cleanedText = response.text.replace(/```json\n?|\n?```/g, "").trim();
      const actions = JSON.parse(cleanedText);

      // Validate the response is an array of strings
      if (Array.isArray(actions) && actions.every((action) => typeof action === "string")) {
        // Limit to max 4 actions to avoid overwhelming UI
        return actions.slice(0, 4);
      } else {
        throw new Error("Invalid response format from Gemini");
      }
    } catch (error) {
      console.error("Error generating contextual quick actions:", error);

      // Fallback to mixed static actions that provide variety
      const fallbackActions = [
        ...this.getQuickActions("headline", locale).slice(0, 1),
        ...this.getQuickActions("audience", locale).slice(0, 1),
        ...this.getQuickActions("positioning", locale).slice(0, 1),
        ...this.getQuickActions("scenes", locale).slice(0, 1),
      ];

      return fallbackActions.slice(0, 4);
    }
  }

  /**
   * Extract the last agent message from conversation history
   */
  private static extractLastAgentMessage(conversationHistory: string): string {
    const lines = conversationHistory.split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith("Agent:")) {
        return line.replace("Agent:", "").trim();
      }
    }
    return "";
  }

  /**
   * Detect if Maya is asking a follow-up question (vs making statements or giving suggestions)
   */
  private static isAskingFollowUpQuestion(message: string, locale: "en" | "ja"): boolean {
    if (!message) return false;

    const questionIndicators =
      locale === "ja"
        ? [
            "？",
            "?",
            "ですか",
            "ませんか",
            "でしょうか",
            "どのような",
            "どんな",
            "いかが",
            "どう思",
            "どう考",
            "教えて",
            "詳しく",
            "具体的に",
            "お考えで",
            "お思いで",
          ]
        : [
            "?",
            "what",
            "how",
            "which",
            "who",
            "when",
            "where",
            "why",
            "could you",
            "can you",
            "would you",
            "do you",
            "tell me",
            "share",
            "think about",
            "consider",
          ];

    const lowerMessage = message.toLowerCase();
    return questionIndicators.some((indicator) => lowerMessage.includes(indicator.toLowerCase()));
  }

  /**
   * Generate updated commercial strategy based on user feedback
   * Reuses the proven analysis prompt structure for schema compatibility
   */
  public static async generateUpdatedStrategy(
    productAnalysis: any,
    userFeedback: string,
    conversationHistory: string,
    locale: "en" | "ja" = "en"
  ): Promise<{
    updatedStrategy: any;
    naturalSummary: string;
  }> {
    const isJapanese = locale === "ja";

    const prompt = isJapanese
      ? `あなたは商品分析の専門家です。既存の商品分析をユーザーのフィードバックに基づいて改善してください。

既存の分析:
${JSON.stringify(productAnalysis, null, 2)}

ユーザーのフィードバック: "${userFeedback}"
会話履歴: ${conversationHistory}

要求:
1. ユーザーのフィードバックを理解し、該当するフィールドを改善する
2. 既存分析の良い部分は保持する
3. ProductAnalysisスキーマ構造を完全に維持する
4. 変更内容の自然な日本語要約を作成する

以下のJSONフォーマットで応答してください:
{
  "updatedAnalysis": { /* 完全な更新された商品分析オブジェクト */ },
  "naturalSummary": "ターゲット層を20-25歳に変更し、ヘッドラインを「革新的ソリューション」に修正し、主要メリットを「時短効果」に更新しました。"
}

JSONレスポンスのみを返してください。追加テキストは不要です。`
      : `You are a product analysis expert. Improve the existing product analysis based on user feedback.

Existing Analysis:
${JSON.stringify(productAnalysis, null, 2)}

User Feedback: "${userFeedback}"
Conversation History: ${conversationHistory}

Requirements:
1. Understand user feedback and improve relevant fields
2. Keep good parts of existing analysis intact
3. Maintain complete ProductAnalysis schema structure
4. Create natural English summary of changes

Respond in this JSON format:
{
  "updatedAnalysis": { /* Complete updated product analysis object */ },
  "naturalSummary": "Changed target age to 20-25, updated headline to 'Innovative Solution', and modified primary benefit to 'time-saving'."
}

Return ONLY the JSON response, no additional text.`;

    try {
      // Create Gemini client using singleton instance
      const vertexAIService = VertexAIService.getInstance();
      const geminiClient = new GeminiClient(vertexAIService);

      // Call Gemini API for strategy regeneration
      const response = await geminiClient.generateTextOnly(prompt);

      // Parse JSON response
      const cleanedText = response.text.replace(/```json\n?|\n?```/g, "").trim();
      const result = JSON.parse(cleanedText);

      // Validate the response structure
      if (result.updatedAnalysis && result.naturalSummary) {
        return {
          updatedStrategy: result.updatedAnalysis,
          naturalSummary: result.naturalSummary,
        };
      } else {
        throw new Error("Invalid response format from Gemini");
      }
    } catch (error) {
      console.error("Error generating updated strategy:", error);

      // Return original analysis as fallback
      return {
        updatedStrategy: productAnalysis,
        naturalSummary: isJapanese
          ? "申し訳ございませんが、分析の更新に失敗しました。元の分析を保持します。"
          : "Sorry, analysis update failed. Keeping original analysis.",
      };
    }
  }

  /**
   * Build strategy refinement prompt with commercial strategy context
   */
  public static buildStrategyPrompt(
    commercialStrategy: any,
    userMessage: string,
    conversationHistory: string,
    locale: "en" | "ja" = "en"
  ): string {
    const systemPrompt = this.getMayaChatSystemPrompt(locale);
    const persona = MAYA_PERSONA;

    const strategyContext =
      locale === "ja"
        ? `現在の商業戦略:
商品: ${commercialStrategy?.product?.name || "商品"}
ヘッドライン: "${commercialStrategy?.commercialStrategy?.keyMessages?.headline || "未設定"}"
タグライン: "${commercialStrategy?.commerciala?.keyMessages?.tagline || "未設定"}"
ターゲット層: ${commercialStrategy?.targetAudience?.primary?.demographics?.ageRange || "未設定"}
主要メリット: ${commercialStrategy?.positioning?.valueProposition?.primaryBenefit || "未設定"}

シーン構成:
${
  commercialStrategy?.commercialStrategy?.keyScenes?.scenes
    ?.map((scene: any, index: number) => `${index + 1}. ${scene.title}: ${scene.description}`)
    .join("\n") || "シーン未設定"
}`
        : `Current Commercial Strategy:
Product: ${commercialStrategy?.product?.name || "Product"}
Headline: "${commercialStrategy?.commercialStrategy?.keyMessages?.headline || "Not set"}"
Tagline: "${commercialStrategy?.commercialStrategy?.keyMessages?.tagline || "Not set"}"
Target Audience: ${commercialStrategy?.targetAudience?.primary?.demographics?.ageRange || "Not set"}
Primary Benefit: ${commercialStrategy?.positioning?.valueProposition?.primaryBenefit || "Not set"}

Scene Structure:
${
  commercialStrategy?.commercialStrategy?.keyScenes?.scenes
    ?.map((scene: any, index: number) => `${index + 1}. ${scene.title}: ${scene.description}`)
    .join("\n") || "No scenes defined"
}`;

    const instructions =
      locale === "ja"
        ? `重要な指示:
1. 上記の商業戦略に基づいて応答する
2. ユーザーの改善要求を理解し、具体的な提案をする
3. JSON構造を壊さない範囲で戦略を調整する
4. Mayaの個性（${persona.personality.core[0]}、${persona.personality.core[1]}）を維持する
5. 関係のない話題には応答しない`
        : `Important Instructions:
1. Respond based on the commercial strategy above
2. Understand user improvement requests and provide specific suggestions
3. Adjust strategy without breaking JSON structure
4. Maintain Maya's personality (${persona.personality.core[0]}, ${persona.personality.core[1]})
5. Do not engage with unrelated topics`;

    return `${systemPrompt}

${strategyContext}

${instructions}

${conversationHistory}

USER MESSAGE: ${userMessage}

Please respond as Maya, focusing on refining the commercial strategy based on the user's input.`;
  }

  /**
   * Get chat response messages for various scenarios
   */
  public static getChatMessages(locale: "en" | "ja" = "en") {
    return {
      en: {
        productNameRequired:
          "Product name is required for generating realistic commercial strategies.",
        analysisComplete:
          'I\'ve analyzed your product description: "{description}"\n\nAsk me anything about target audience, positioning, or marketing strategy!',
        imageAnalysisComplete:
          "Product image analysis complete! You can now view detailed product insights, target audience analysis, and marketing strategies. Feel free to ask me any questions!",
        imageUploadError:
          "There's an issue processing the image data. Please try uploading the image again.",
        aiServiceError: "The AI analysis service is temporarily experiencing issues.",
        systemError: "A system error occurred.",
        analysisFailedMessage:
          "Sorry, {error}\n\nYour options:\n• Switch to demo mode to experience the full workflow\n• Wait a moment and retry\n• Try text-based analysis instead\n\nNote: You cannot proceed to the next agent without a successful analysis.",
        chatFallback:
          "There was an issue with AI processing, but I can still help. What would you like to explore about your product?",
        handoffMessage: "Analysis complete. Handing off to Creative Director Agent.",
        demoAnalysisComplete:
          "Product analysis complete! I've generated comprehensive market insights and commercial strategy for premium wireless headphones. The target audience is professionals aged 25-45 who value premium quality. Let's discuss your product strategy!",
        chatFallbackGeneric:
          "That's a great question! Based on the product analysis, I can provide detailed insights about target audience, positioning, competitive advantages, and visual strategy. Which area would you like to explore further?",
        chatFallbackFollowUps: [
          "Target audience insights",
          "Positioning strategy",
          "Visual concepts",
          "Proceed to Creative Director",
        ],
      },
      ja: {
        productNameRequired: "リアルな商用戦略を生成するには商品名が必要です。",
        analysisComplete:
          'あなたの商品説明を分析しました: "{description}"\n\nターゲット層、ポジショニング、マーケティング戦略について何でも聞いてください！',
        imageAnalysisComplete:
          "商品画像の分析が完了しました！詳細な商品洞察、ターゲット層分析、マーケティング戦略をご覧いただけます。ご質問があればお気軽にどうぞ！",
        imageUploadError:
          "画像データの処理に問題があります。画像を再度アップロードしてお試しください。",
        aiServiceError: "AI分析サービスで一時的な問題が発生しています。",
        systemError: "システムエラーが発生しました。",
        analysisFailedMessage:
          "申し訳ございません。{error}\n\n選択肢:\n• デモモードに切り替えて全ワークフローを体験\n• しばらく待ってから再試行\n• テキストベースの分析を試行\n\n注意: 分析が成功するまで次のエージェントに進むことはできません。",
        chatFallback:
          "AI処理に問題がありましたが、まだお手伝いできます。あなたの商品について何を探索したいですか？",
        handoffMessage: "分析完了。クリエイティブ・ディレクター・エージェントに引き継ぎます。",
        demoAnalysisComplete:
          "商品分析完了！プレミアムワイヤレスヘッドフォンの包括的な市場洞察と商用戦略を生成しました。ターゲット層は品質を重視する25-45歳のプロフェッショナルです。商品戦略について話し合いましょう！",
        chatFallbackGeneric:
          "素晴らしい質問ですね！商品分析に基づいて、ターゲット層、ポジショニング、競合優位性、ビジュアル戦略について詳細な洞察を提供できます。どの分野をさらに探索したいですか？",
        chatFallbackFollowUps: [
          "ターゲット層の洞察",
          "ポジショニング戦略",
          "ビジュアルコンセプト",
          "クリエイティブ・ディレクターに進む",
        ],
      },
    }[locale];
  }

  /**
   * Get analyze route demo data
   */
  public static getAnalyzeMessages(locale: "en" | "ja" = "en") {
    return {
      en: {
        productName: "Smartphone",
        productDescription: "High-performance smartphone",
        keyFeatures: ["High-resolution camera", "Long battery life", "Fast processor"],
        commercialStrategy: {
          headline: "The Smartphone for Professionals",
          tagline: "Performance, Style, Reliability",
          callToAction: "Experience Now",
        },
      },
      ja: {
        productName: "スマートフォン",
        productDescription: "高性能なスマートフォン",
        keyFeatures: ["高画質カメラ", "長時間バッテリー", "高速プロセッサー"],
        commercialStrategy: {
          headline: "プロフェッショナルのためのスマートフォン",
          tagline: "性能、スタイル、信頼性",
          callToAction: "今すぐ体験",
        },
      },
    }[locale];
  }

  /**
   * Build English analysis prompt
   */
  private static getEnglishPrompt(request: VisionAnalysisRequest): string {
    const detailLevel = request.analysisOptions?.detailLevel || "detailed";

    let prompt = `You are a product marketing expert analyzing a product image for commercial video creation. 

PRODUCT IMAGE ANALYSIS TASK:
${request.productName ? `Analyze this image of "${request.productName}" and provide structured insights for commercial video production.` : "Analyze this product image and provide structured insights for commercial video production."}

${request.productName ? `PRODUCT NAME: ${request.productName}` : ""}
${request.description ? `ADDITIONAL CONTEXT: ${request.description}` : ""}

IMPORTANT: Use the provided product name "${request.productName || "the product"}" throughout your analysis. Ensure all marketing strategies, features, and messaging are relevant to this specific product.

Please provide a comprehensive analysis in the following JSON structure:

{
  "product": {
    "category": "electronics|fashion|food-beverage|home-garden|health-beauty|sports-outdoors|automotive|books-media|toys-games|business|other",
    "subcategory": "specific subcategory",
    "name": "${request.productName || "product name"}",
    "description": "detailed product description",
    "keyFeatures": ["feature1", "feature2", "feature3"],
    "materials": ["material1", "material2"],
    "colors": [
      {"name": "color name", "hex": "#000000", "role": "primary|secondary|accent"}
    ],
    "usageContext": ["context1", "context2"],
    "seasonality": "spring|summer|fall|winter|year-round"
  },
  "targetAudience": {
    "primary": {
      "demographics": {
        "ageRange": "age range",
        "gender": "male|female|unisex",
        "incomeLevel": "budget|mid-range|premium|luxury",
        "location": ["urban", "suburban"],
        "lifestyle": ["lifestyle1", "lifestyle2"]
      },
      "psychographics": {
        "values": ["value1", "value2"],
        "interests": ["interest1", "interest2"],
        "personalityTraits": ["trait1", "trait2"],
        "motivations": ["motivation1", "motivation2"]
      },
      "behaviors": {
        "shoppingHabits": ["habit1", "habit2"],
        "mediaConsumption": ["media1", "media2"],
        "brandLoyalty": "low|medium|high",
        "decisionFactors": ["factor1", "factor2"]
      }
    }
  },
  "positioning": {
    "brandPersonality": {
      "traits": ["trait1", "trait2"],
      "tone": "professional|friendly|luxury|playful|authoritative",
      "voice": "description of brand voice"
    },
    "valueProposition": {
      "primaryBenefit": "main benefit",
      "supportingBenefits": ["benefit1", "benefit2"],
      "differentiators": ["diff1", "diff2"]
    },
    "competitiveAdvantages": {
      "functional": ["advantage1", "advantage2"],
      "emotional": ["advantage1", "advantage2"],
      "experiential": ["advantage1", "advantage2"]
    },
    "marketPosition": {
      "tier": "budget|mainstream|premium|luxury",
      "niche": "market niche if applicable",
      "marketShare": "challenger|leader|niche"
    }
  },
  "commercialStrategy": {
    "keyMessages": {
      "headline": "compelling headline",
      "tagline": "memorable tagline",
      "supportingMessages": ["message1", "message2"]
    },
    "emotionalTriggers": {
      "primary": {
        "type": "aspiration|fear|joy|trust|excitement|comfort|pride",
        "description": "trigger description",
        "intensity": "subtle|moderate|strong"
      },
      "secondary": [
        {
          "type": "trigger type",
          "description": "description",
          "intensity": "intensity"
        }
      ]
    },
    "callToAction": {
      "primary": "main CTA",
      "secondary": ["secondary CTA1", "secondary CTA2"]
    },
    "storytelling": {
      "narrative": "story narrative",
      "conflict": "central conflict",
      "resolution": "story resolution"
    },
    "keyScenes": {
      "scenes": [
        {
          "id": "opening",
          "title": "Opening Hook",
          "description": "opening scene description for commercial video",
          "duration": "3-5 seconds",
          "purpose": "hook audience"
        },
        {
          "id": "showcase",
          "title": "Product Showcase",
          "description": "product showcase scene description",
          "duration": "5-8 seconds",
          "purpose": "showcase product features"
        },
        {
          "id": "problem",
          "title": "Problem Solution",
          "description": "problem/solution scene description",
          "duration": "4-6 seconds",
          "purpose": "demonstrate value"
        },
        {
          "id": "emotion",
          "title": "Emotional Moment",
          "description": "emotional moment scene description",
          "duration": "3-4 seconds",
          "purpose": "emotional connection"
        },
        {
          "id": "cta",
          "title": "Call to Action",
          "description": "final call to action scene description",
          "duration": "2-3 seconds",
          "purpose": "drive action"
        }
      ]
    }
  },
  "visualPreferences": {
    "overallStyle": "modern|classic|minimalist|bold|organic",
    "colorPalette": {
      "primary": [{"name": "color", "hex": "#000000", "role": "primary"}],
      "secondary": [{"name": "color", "hex": "#000000", "role": "secondary"}],
      "accent": [{"name": "color", "hex": "#000000", "role": "accent"}]
    },
    "mood": "energetic|calm|sophisticated|playful|inspiring",
    "composition": "clean|dynamic|intimate|grand|artistic",
    "lighting": "bright|warm|dramatic|natural|studio",
    "environment": ["environment1", "environment2"]
  }
}

ANALYSIS REQUIREMENTS:
- Provide ${detailLevel} analysis depth for "${request.productName || "the product"}"
- Focus on commercial video production insights specific to this product
- Include specific, actionable recommendations relevant to "${request.productName || "this product type"}"
- Ensure all color values are valid hex codes
- Base insights on visual elements observable in the image
- Consider cultural context for marketing effectiveness
- Tailor all messaging, features, and strategies to "${request.productName || "the product"}"
- Use the exact product name "${request.productName || "[Product Name]"}" in headlines, taglines, and descriptions

Return ONLY the JSON response, no additional text.`;

    return prompt;
  }

  /**
   * Build Japanese analysis prompt
   */
  private static getJapanesePrompt(request: VisionAnalysisRequest): string {
    const detailLevel = request.analysisOptions?.detailLevel || "detailed";

    let prompt = `あなたはコマーシャル動画制作のための商品画像分析を専門とするプロダクトマーケティングエキスパートです。

商品画像分析タスク:
${request.productName ? `「${request.productName}」の画像を分析し、コマーシャル動画制作のための構造化された洞察を提供してください。` : "この商品画像を分析し、コマーシャル動画制作のための構造化された洞察を提供してください。"}

${request.productName ? `商品名: ${request.productName}` : ""}
${request.description ? `追加情報: ${request.description}` : ""}

重要: 提供された商品名「${request.productName || "この商品"}」を分析全体で使用してください。すべてのマーケティング戦略、機能、メッセージングがこの特定の商品に関連するものであることを確認してください。

以下のJSON構造で包括的な分析を提供してください:

${this.getEnglishPrompt(request).split("Please provide a comprehensive analysis in the following JSON structure:")[1].split("ANALYSIS REQUIREMENTS:")[0]}

分析要件:
- 「${request.productName || "この商品"}」について${detailLevel}レベルの分析深度を提供
- この商品に特化したコマーシャル動画制作の洞察に焦点を当てる
- 「${request.productName || "この商品タイプ"}」に関連する具体的で実行可能な推奨事項を含める
- すべての色の値が有効な16進コードであることを確認
- 画像で観察できる視覚的要素に基づいた洞察
- マーケティング効果のための文化的背景を考慮
- すべてのメッセージング、機能、戦略を「${request.productName || "この商品"}」に合わせる
- ヘッドライン、タグライン、説明文で正確な商品名「${request.productName || "[商品名]"}」を使用

JSON応答のみを返し、追加のテキストは含めないでください。すべてのテキスト値は適切な日本語で記述してください。`;

    return prompt;
  }

  /**
   * Build a simple text generation prompt (for scene generation, etc.)
   */
  public static buildTextPrompt(
    content: string,
    options?: {
      format?: "json" | "text";
      maxTokens?: number;
      temperature?: number;
    }
  ): string {
    let prompt = content;

    if (options?.format === "json") {
      prompt += "\n\nReturn ONLY valid JSON, no additional text.";
    }

    return prompt;
  }

  /**
   * Build a prompt for scene generation
   */
  public static buildSceneGenerationPrompt(
    productName: string,
    category: string,
    narrative: string,
    locale: "en" | "ja" = "en"
  ): string {
    if (locale === "ja") {
      return `商品「${productName}」（カテゴリ: ${category}）のための魅力的な商業ビデオのシーンを4-5個作成してください。

ブランドの方向性:
- メッセージ: ${narrative}

以下のようなJSONフォーマットで返してください:
{
  "scenes": [
    {
      "id": "scene1",
      "title": "シーン名",
      "description": "シーンの詳細な描写",
      "duration": "3-5秒",
      "purpose": "視聴者の関心を引く"
    }
  ]
}

効果的なアプローチ例: ライフスタイル統合、変革ストーリー、社会的証拠、舞台裏、問題解決、憧れ、感情的つながりなど。商品の種類と対象顧客に最も適したアプローチを選んでください。`;
    }

    return `Create 4-5 compelling scenes for a commercial video about "${productName}" (category: ${category}).

Brand direction:
- Message: ${narrative}

Return in this JSON format:
{
  "scenes": [
    {
      "id": "scene1", 
      "title": "Scene name",
      "description": "Detailed scene description",
      "duration": "3-5 seconds",
      "purpose": "hook audience"
    }
  ]
}

Effective patterns to consider: lifestyle integration, transformation stories, social proof, behind-the-scenes, problem/solution, aspiration, emotional connection, etc. Choose the approach that best fits this product type and target audience.`;
  }
}

const LOCALE_MESSAGES = {
  en: {
    productNameRequired: "Product name is required for generating realistic commercial strategies.",
    analysisComplete:
      'I\'ve analyzed your product description: "{description}"\n\nAsk me anything about target audience, positioning, or marketing strategy!',
    imageAnalysisComplete:
      "Product image analysis complete! You can now view detailed product insights, target audience analysis, and marketing strategies. Feel free to ask me any questions!",
    imageUploadError:
      "There's an issue processing the image data. Please try uploading the image again.",
    aiServiceError: "The AI analysis service is temporarily experiencing issues.",
    systemError: "A system error occurred.",
    analysisFailedMessage:
      "Sorry, {error}\n\nYour options:\n• Switch to demo mode to experience the full workflow\n• Wait a moment and retry\n• Try text-based analysis instead\n\nNote: You cannot proceed to the next agent without a successful analysis.",
    chatFallback:
      "There was an issue with AI processing, but I can still help. What would you like to explore about your product?",
    handoffMessage: "Analysis complete. Handing off to Creative Director Agent.",
    demoAnalysisComplete:
      "Product analysis complete! I've generated comprehensive market insights and commercial strategy for premium wireless headphones. The target audience is professionals aged 25-45 who value premium quality. Let's discuss your product strategy!",
    chatFallbackGeneric:
      "That's a great question! Based on the product analysis, I can provide detailed insights about target audience, positioning, competitive advantages, and visual strategy. Which area would you like to explore further?",
    chatFallbackFollowUps: [
      "Target audience insights",
      "Positioning strategy",
      "Visual concepts",
      "Proceed to Creative Director",
    ],
    demoProduct: {
      name: "Premium Wireless Headphones",
      description:
        "Professional wireless headphones featuring premium sound quality, long battery life, and exceptional comfort",
      keyFeatures: [
        "Active Noise Cancellation",
        "30-hour Battery",
        "Premium Sound",
        "Comfortable Fit",
      ],
      usageContext: ["professional work", "music enjoyment", "commuting", "focused tasks"],
      positioning: {
        primaryBenefit: "Perfect audio experience for professionals",
        supportingBenefits: [
          "All-day comfort",
          "Superior noise cancellation",
          "Extended battery life",
        ],
        differentiators: ["Professional-grade sound", "Ergonomic design", "Premium materials"],
      },
      commercialStrategy: {
        headline: "Premium Sound for Professionals",
        tagline: "Quality, Comfort, Performance",
        supportingMessages: ["All-day comfort", "Supreme quality", "Professional grade"],
        emotionalTrigger: "Professional achievement and success",
        confidenceTrigger: "Confidence in quality choice",
        callToAction: "Experience Now",
        secondaryActions: ["Learn More", "Compare Models"],
        narrative: "Reliable tool empowering professional success",
        conflict: "Cannot afford failure in crucial moments",
        resolution: "Peace of mind with superior performance",
      },
    },
    demoChat: {
      targetAudienceResponse:
        "Based on my analysis, your primary target audience is professionals aged 25-45 with premium income levels. They're tech-savvy, quality-focused individuals who value productivity and premium audio experiences. They typically work in urban environments and are willing to invest in tools that enhance their professional performance. Would you like me to dive deeper into their specific behaviors and preferences?",
      targetAudienceFollowUps: [
        "Tell me about their shopping habits",
        "What motivates them to buy?",
        "How do they make purchasing decisions?",
      ],
      positioningResponse:
        "Your positioning should focus on 'Premium Audio for Professionals' - emphasizing superior sound quality, all-day comfort, and reliability for critical work situations. Key differentiators include the 30-hour battery life, advanced noise cancellation, and premium materials. You're positioned as a challenger in the premium segment, competing on professional-grade quality rather than consumer lifestyle features.",
      positioningFollowUps: [
        "What's our competitive advantage?",
        "How do we stand out?",
        "What's our value proposition?",
      ],
      creativeResponse:
        "Perfect! Based on the analysis, I recommend a modern professional visual style with a sophisticated color palette of deep navy, silver gray, and electric blue accents. The mood should be confident and sophisticated, with clean minimal composition and natural lighting in professional workspace settings. Ready to hand off to our Creative Director Agent to develop the actual commercial concept?",
      creativeFollowUps: [
        "Yes, let's proceed to creative",
        "Tell me more about the visual style",
        "What kind of commercial works best?",
      ],
      priceResponse:
        "Given the premium positioning and target audience of professionals willing to invest in quality tools, this product should be priced in the premium tier - likely $200-350 range. The target customers prioritize quality over price and view this as a professional investment rather than a consumer purchase. They're research-driven buyers who focus on value and long-term benefits.",
      priceFollowUps: [
        "What justifies the premium price?",
        "How price-sensitive are they?",
        "What's the sweet spot?",
      ],
    },
  },
  ja: {
    productNameRequired: "商品名は必須です。リアルなCM戦略生成のために必要です。",
    analysisComplete:
      "商品の説明を分析しました：「{description}」\n\nターゲット層、ポジショニング、マーケティング戦略について何でもお聞きください！",
    imageAnalysisComplete:
      "商品画像の分析が完了しました！詳細な商品情報、ターゲット層、マーケティング戦略を確認できます。何かご質問があればお気軽にお聞きください！",
    imageUploadError:
      "画像データの処理に問題があります。画像を再度アップロードしてお試しください。",
    aiServiceError: "AI分析サービスに一時的な問題が発生しています。",
    systemError: "システムエラーが発生しました。",
    analysisFailedMessage:
      "申し訳ございません。{error}\n\n以下のオプションがあります：\n• デモモードに切り替えて体験する\n• しばらく待ってから再試行する\n• テキスト説明での分析を試す\n\n注意：現在の分析結果なしに次のエージェントには進めません。",
    chatFallback:
      "AI分析に問題が発生しましたが、引き続きサポートします。どのような点について詳しく知りたいですか？",
    handoffMessage: "分析が完了しました。Creative Directorエージェントに引き継ぎます。",
    demoAnalysisComplete:
      "商品分析が完了しました！高品質なワイヤレスヘッドフォンの詳細な市場分析と商用戦略を生成しました。ターゲット層は25-45歳のプロフェッショナルで、プレミアム品質を重視する方々です。商品戦略について何でもご相談ください！",
    chatFallbackGeneric:
      "とても興味深い質問ですね！商品の分析結果を基に、ターゲット層、ポジショニング、競合優位性、ビジュアル戦略について詳しくご相談できます。どの分野について詳しく知りたいですか？",
    chatFallbackFollowUps: [
      "ターゲット層について",
      "ポジショニング戦略",
      "ビジュアルコンセプト",
      "Creative Directorへ進む",
    ],
    demoProduct: {
      name: "プレミアム ワイヤレス ヘッドフォン",
      description:
        "高品質なサウンド、長時間バッテリー、快適な装着感を実現したプロフェッショナル向けワイヤレスヘッドフォン",
      keyFeatures: [
        "アクティブノイズキャンセリング",
        "30時間バッテリー",
        "プレミアムサウンド",
        "快適フィット",
      ],
      usageContext: ["プロフェッショナル作業", "音楽鑑賞", "通勤・移動", "集中作業"],
      positioning: {
        primaryBenefit: "プロフェッショナルのための完璧なオーディオ体験",
        supportingBenefits: [
          "一日中快適な装着感",
          "卓越したノイズキャンセリング",
          "長時間バッテリー",
        ],
        differentiators: ["プロ仕様のサウンド品質", "人間工学デザイン", "プレミアム素材"],
      },
      commercialStrategy: {
        headline: "プロフェッショナルのためのプレミアムサウンド",
        tagline: "品質、快適性、パフォーマンス",
        supportingMessages: ["一日中快適", "最高音質", "プロ仕様"],
        emotionalTrigger: "プロフェッショナルとしての達成感",
        confidenceTrigger: "品質への自信",
        callToAction: "今すぐ体験",
        secondaryActions: ["詳細を見る", "比較する"],
        narrative: "プロフェッショナルの成功を支える信頼できるツール",
        conflict: "重要な場面で失敗できない",
        resolution: "最高品質で安心のパフォーマンス",
      },
    },
    demoChat: {
      targetAudienceResponse:
        "分析結果によると、主要ターゲット層は25-45歳のプロフェッショナルで、プレミアム収入層の方々です。テクノロジーに精通し、品質を重視する方で、生産性とプレミアムなオーディオ体験を大切にしています。都市部で働き、仕事のパフォーマンスを向上させるツールに投資することを惜しまない方々です。具体的な行動パターンや好みについて詳しく知りたいですか？",
      targetAudienceFollowUps: [
        "購買行動について教えて",
        "何が購入動機になる？",
        "どのように購入を決める？",
      ],
      positioningResponse:
        "ポジショニングは「プロフェッショナルのためのプレミアムオーディオ」に焦点を当て、優れた音質、一日中の快適さ、重要な仕事での信頼性を強調すべきです。主要な差別化要因は30時間のバッテリー寿命、高度なノイズキャンセリング、プレミアム素材です。プレミアムセグメントでチャレンジャーとしてポジショニングし、コンシューマー向けライフスタイル機能ではなく、プロフェッショナル向け品質で競争します。",
      positioningFollowUps: ["競合優位性は何？", "どのように差別化する？", "価値提案は何？"],
      creativeResponse:
        "素晴らしい！分析に基づき、深いネイビー、シルバーグレー、エレクトリックブルーのアクセントを使った洗練されたカラーパレットで、モダンプロフェッショナルなビジュアルスタイルをお勧めします。ムードは自信に満ち洗練されており、クリーンでミニマルな構成と、プロフェッショナルなワークスペース設定での自然光照明が良いでしょう。実際のコマーシャルコンセプトを開発するために、Creative Directorエージェントに引き継ぐ準備はできていますか？",
      creativeFollowUps: [
        "はい、クリエイティブに進みましょう",
        "ビジュアルスタイルについてもっと教えて",
        "どんなコマーシャルが最適？",
      ],
      priceResponse:
        "プレミアムポジショニングと品質ツールに投資を惜しまないプロフェッショナルというターゲット層を考慮すると、この商品はプレミアム価格帯（おそらく200-350ドル範囲）で価格設定すべきです。ターゲット顧客は価格よりも品質を優先し、これをコンシューマー購入ではなく専門的投資として捉えています。彼らは研究主導の購入者で、価値と長期的メリットに焦点を当てます。",
      priceFollowUps: ["プレミアム価格の根拠は？", "価格感度はどの程度？", "最適価格帯は？"],
    },
  },
} as const;
