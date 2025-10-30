import { NextRequest, NextResponse } from "next/server";
import { AppModeConfig } from "@/lib/config/app-mode";
import type { CreativeDirection } from "@/lib/agents/creative-director/types/asset-types";
import type { Locale } from "@/lib/dictionaries";
import type { NarrativeStyle, MusicGenre } from "@/lib/stores/video-producer-store";
import {
  buildNarrativeStyleValidationPrompt,
  buildMusicToneValidationPrompt,
  buildProductionContext,
  validateProductionReadiness,
  type DavidHandoffData
} from "@/lib/agents/video-producer/tools/prompt-builder";
import { ProductionBridgeService } from "@/lib/agents/video-producer/services/production-bridge";
import {
  processNarrativeStyleValidation,
  processMusicToneValidation
} from "@/lib/agents/video-producer/core/real-handler";
import { VertexAIService } from '@/lib/services/vertex-ai';
import { GeminiClient } from '@/lib/services/gemini';

// Video Producer initialization request
interface VideoProducerInitRequest {
  sessionId: string;
  action: "initialize";
  locale: Locale;
  data: {
    creativeDirectorHandoffData: {
      creativeDirectorSessionId: string;
      creativeDirection: CreativeDirection;
      handoffTimestamp: number;
    };
  };
}

// Video Producer initialization response
interface VideoProducerInitResponse {
  sessionId: string;
  agentStatus: "ready" | "initializing" | "error";
  videoProductionSpecs: {
    resolution: string;
    frameRate: number;
    aspectRatio: string;
    duration: number;
    format: string;
  };
  estimatedProcessingTime: number;
  productionTimeline: {
    preProduction: number;
    production: number;
    postProduction: number;
    total: number;
  };
  cost: {
    estimated: number;
    remaining: number;
  };
  // Following Maya's pattern: API provides all options
  narrativeStyles: NarrativeStyle[];
  musicGenres: MusicGenre[];
}

// Demo mode video production handler
async function initializeDemoMode(
  request: VideoProducerInitRequest
): Promise<VideoProducerInitResponse> {
  const { sessionId, data, locale } = request;
  const { creativeDirection } = data.creativeDirectorHandoffData;

  console.log(`[Video Producer Demo] Initializing session ${sessionId}`);

  // Generate narrative styles and music genres in parallel for maximum performance
  const [narrativeStyles, musicGenres] = await Promise.all([
    generateAINarrativeStyles(creativeDirection, locale),
    generateAIMusicGenres(creativeDirection, locale)
  ]);

  // Demo response with realistic video production specs
  const response: VideoProducerInitResponse = {
    sessionId,
    agentStatus: "ready",
    videoProductionSpecs: {
      resolution: "1920x1080",
      frameRate: 30,
      aspectRatio: "16:9",
      duration: 15, // 15 second commercial
      format: "MP4"
    },
    estimatedProcessingTime: 300, // 5 minutes in seconds
    productionTimeline: {
      preProduction: 60,  // 1 minute
      production: 180,    // 3 minutes
      postProduction: 60, // 1 minute
      total: 300
    },
    cost: {
      estimated: 2.5, // Estimated cost for video generation
      remaining: 296.0
    },
    narrativeStyles,
    musicGenres
  };

  return response;
}

// Real mode video production handler
async function initializeRealMode(
  request: VideoProducerInitRequest
): Promise<VideoProducerInitResponse> {
  const { sessionId, data, locale } = request;
  const { creativeDirection } = data.creativeDirectorHandoffData;

  console.log(`[Video Producer Real] Initializing session ${sessionId}`);

  // TODO: Implement real video production initialization
  // This would involve:
  // 1. Setting up video generation pipeline
  // 2. Preparing assets from creative direction
  // 3. Configuring production parameters
  // 4. Estimating real costs and timelines

  // Generate AI-customized options for real mode
  const customNarrativeStyles = await generateRealModeNarrativeStyles(creativeDirection, locale);
  const customMusicGenres = await generateRealModeMusicGenres(creativeDirection, locale);

  const response: VideoProducerInitResponse = {
    sessionId,
    agentStatus: "ready",
    videoProductionSpecs: {
      resolution: "1920x1080",
      frameRate: 30,
      aspectRatio: "16:9",
      duration: 15,
      format: "MP4"
    },
    estimatedProcessingTime: 360, // Slightly longer for real mode
    productionTimeline: {
      preProduction: 90,
      production: 240,
      postProduction: 30,
      total: 360
    },
    cost: {
      estimated: 2.8, // Real cost might be higher
      remaining: 295.7
    },
    // Real mode: AI-generated options based on David's creative direction
    narrativeStyles: customNarrativeStyles,
    musicGenres: customMusicGenres
  };

  return response;
}

// Generate AI-customized narrative styles for real mode
async function generateRealModeNarrativeStyles(
  creativeDirection: any,
  locale: Locale
): Promise<NarrativeStyle[]> {
  try {
    // Generate 4 AI-customized narrative styles using Gemini (following David's pattern)
    const aiGeneratedStyles = await generateAINarrativeStyles(creativeDirection, locale);
    return aiGeneratedStyles;

  } catch (error) {
    console.error('[Video Producer Real] AI narrative generation failed, falling back to demo options:', error);
    return getDemoNarrativeStyles(locale);
  }
}

/**
 * Generate fully AI-based narrative styles using Gemini (following David's generateAIStyleOptions pattern)
 */
async function generateAINarrativeStyles(
  creativeDirection: any,
  locale: Locale
): Promise<NarrativeStyle[]> {
  const isJapanese = locale === 'ja';
  const productAnalysis = creativeDirection?.zaraHandoffData?.productAnalysis;

  if (!creativeDirection) {
    throw new Error('No creative direction available for AI narrative generation');
  }

  const visualTheme = creativeDirection?.strategy?.visualTheme || 'modern';
  const emotionalTone = creativeDirection?.strategy?.emotionalTone || 'professional';
  const brandMessage = creativeDirection?.strategy?.brandMessage || 'quality';
  const targetAudience = creativeDirection?.strategy?.targetAudienceAlignment?.description || 'general consumers';

  const prompt = isJapanese ?
    `あなたはビデオプロデューサー（Zara）です。David（クリエイティブディレクター）の創造的方向性に基づいて、4つの独特なナラティブスタイルオプションを生成してください。

クリエイティブディレクション:
ビジュアルテーマ: ${visualTheme}
感情的トーン: ${emotionalTone}
ブランドメッセージ: ${brandMessage}
ターゲット層: ${targetAudience}

各ナラティブスタイルには以下が必要です:
- id: ユニークなID（kebab-case）
- name: スタイル名（20文字以内）
- description: 詳細説明（80文字以内）
- pacing: ペーシングスタイル（15文字以内）例："ゆっくり・劇的"
- tone: トーンスタイル（15文字以内）例："感情的・印象的"
- narrationStyle: ナレーションスタイル（15文字以内）例："権威ある・深み"
- examples: 3つの具体例（各20文字以内）
- bestFor: 適用対象（40文字以内）例："高級商品・感情訴求"

4つの異なる方向性を提案してください:
1. ${visualTheme}に最適化されたプライマリスタイル
2. ドラマティック/シネマティック系
3. エネルギッシュ/モダン系
4. 親しみやすい/オーセンティック系

有効なJSONとして返してください:
[{"id": "narrative-1", "name": "ナラティブ名", "description": "説明", "pacing": "ペーシング", "tone": "トーン", "narrationStyle": "ナレーション", "examples": ["例1", "例2", "例3"], "bestFor": "適用対象"}, ...]` :

    `You are Video Producer (Zara). Based on David's (Creative Director) creative direction, generate 4 unique narrative style options for this commercial video.

Creative Direction:
Visual Theme: ${visualTheme}
Emotional Tone: ${emotionalTone}
Brand Message: ${brandMessage}
Target Audience: ${targetAudience}

Each narrative style must include:
- id: Unique ID (kebab-case)
- name: Style name (under 30 characters)
- description: Detailed description (under 120 characters)
- pacing: Pacing style (under 20 characters) e.g. "Slow & Dramatic"
- tone: Tone style (under 20 characters) e.g. "Emotional & Impactful"
- narrationStyle: Narration style (under 25 characters) e.g. "Authoritative & Deep"
- examples: 3 specific examples (each under 30 characters)
- bestFor: Target use cases (under 60 characters) e.g. "Premium and emotional products"

Create 4 different narrative directions:
1. Primary style optimized for ${visualTheme}
2. Dramatic/Cinematic approach
3. Energetic/Modern approach
4. Approachable/Authentic approach

Return as valid JSON:
[{"id": "narrative-1", "name": "Narrative Name", "description": "Description", "pacing": "Pacing", "tone": "Tone", "narrationStyle": "Narration", "examples": ["example1", "example2", "example3"], "bestFor": "Target use cases"}, ...]`;

  try {
    // Create Gemini client using singleton instance (following David's pattern)
    const vertexAIService = VertexAIService.getInstance();
    const geminiClient = new GeminiClient(vertexAIService);

    // Call Gemini API for dynamic narrative styles
    const response = await geminiClient.generateTextOnly(prompt);

    // Parse JSON response with enhanced extraction
    let cleanedText = response.text;

    // Extract JSON from markdown code blocks
    const jsonBlockMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      cleanedText = jsonBlockMatch[1].trim();
    } else {
      // Try to find JSON array or object directly
      const jsonMatch = cleanedText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (jsonMatch) {
        cleanedText = jsonMatch[1].trim();
      } else {
        // Fallback: remove markdown markers
        cleanedText = cleanedText.replace(/```json\n?|\n?```/g, '').trim();
      }
    }

    // Additional JSON cleaning for special characters
    cleanedText = cleanedText
      .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes with regular quotes
      .replace(/[\u201C\u201D]/g, '"'); // Replace smart double quotes

    console.log("[AI Narrative Styles] Raw AI response:", {
      originalText: response.text.substring(0, 200) + '...',
      cleanedText: cleanedText.substring(0, 200) + '...',
      textLength: cleanedText.length
    });

    const narrativeStyles = JSON.parse(cleanedText);

    // Validate the response is an array of valid NarrativeStyle objects
    if (Array.isArray(narrativeStyles) &&
        narrativeStyles.length >= 3 &&
        narrativeStyles.every(style =>
          style.id &&
          style.name &&
          style.description &&
          style.pacing &&
          style.tone &&
          style.narrationStyle &&
          Array.isArray(style.examples) &&
          style.bestFor
        )) {
      // Return exactly 4 options for consistency
      return narrativeStyles.slice(0, 4);
    } else {
      throw new Error('Invalid response format from Gemini for narrative styles');
    }

  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('JSON parsing error for AI narrative styles:', {
        error: error.message,
        position: error.message.match(/position (\d+)/)?.[1] || 'unknown'
      });
    } else {
      console.error('Error generating AI narrative styles:', error);
    }
    throw error; // Re-throw to trigger fallback in parent function
  }
}

// Generate AI-customized music genres for real mode
async function generateRealModeMusicGenres(
  creativeDirection: any,
  locale: Locale
): Promise<MusicGenre[]> {
  try {
    // Generate 4 AI-customized music genres using Gemini (following David's pattern)
    const aiGeneratedGenres = await generateAIMusicGenres(creativeDirection, locale);
    return aiGeneratedGenres;

  } catch (error) {
    console.error('[Video Producer Real] AI music generation failed, falling back to demo options:', error);
    return getDemoMusicGenres(locale);
  }
}

/**
 * Generate fully AI-based music genres using Gemini (following David's generateAIStyleOptions pattern)
 */
async function generateAIMusicGenres(
  creativeDirection: any,
  locale: Locale
): Promise<MusicGenre[]> {
  const isJapanese = locale === 'ja';

  if (!creativeDirection) {
    throw new Error('No creative direction available for AI music generation');
  }

  const visualTheme = creativeDirection?.strategy?.visualTheme || 'modern';
  const emotionalTone = creativeDirection?.strategy?.emotionalTone || 'professional';
  const brandMessage = creativeDirection?.strategy?.brandMessage || 'quality';
  const targetAudience = creativeDirection?.strategy?.targetAudienceAlignment?.description || 'general consumers';
  const mood = creativeDirection?.visualSpecs?.styleDirection?.mood || 'modern';

  const prompt = isJapanese ?
    `あなたはビデオプロデューサー（Zara）です。David（クリエイティブディレクター）の創造的方向性に基づいて、4つの独特な音楽ジャンルオプションを生成してください。

クリエイティブディレクション:
ビジュアルテーマ: ${visualTheme}
感情的トーン: ${emotionalTone}
ブランドメッセージ: ${brandMessage}
ターゲット層: ${targetAudience}
ムード: ${mood}

各音楽ジャンルには以下が必要です:
- id: ユニークなID（kebab-case）
- name: 音楽スタイル名（20文字以内）
- description: 詳細説明（80文字以内）
- mood: ムードスタイル（15文字以内）例："未来的・クール"
- energy: エネルギーレベル（15文字以内）例："中高・ダイナミック"
- instruments: 4つの楽器/サウンド要素（各15文字以内）
- bestFor: 適用対象（40文字以内）例："テック商品・イノベーション"

4つの異なる音楽方向性を提案してください:
1. ${visualTheme}に最適化されたシグネチャーサウンド
2. シネマティック/オーケストラ系
3. モダン/エレクトロニック系
4. 温かい/アコースティック系

有効なJSONとして返してください:
[{"id": "music-1", "name": "音楽名", "description": "説明", "mood": "ムード", "energy": "エネルギー", "instruments": ["楽器1", "楽器2", "楽器3", "楽器4"], "bestFor": "適用対象"}, ...]` :

    `You are Video Producer (Zara). Based on David's (Creative Director) creative direction, generate 4 unique music genre options for this commercial video.

Creative Direction:
Visual Theme: ${visualTheme}
Emotional Tone: ${emotionalTone}
Brand Message: ${brandMessage}
Target Audience: ${targetAudience}
Mood: ${mood}

Each music genre must include:
- id: Unique ID (kebab-case)
- name: Music style name (under 30 characters)
- description: Detailed description (under 120 characters)
- mood: Mood style (under 20 characters) e.g. "Futuristic & Cool"
- energy: Energy level (under 25 characters) e.g. "Medium-High & Dynamic"
- instruments: 4 instruments/sound elements (each under 20 characters)
- bestFor: Target use cases (under 60 characters) e.g. "Tech products and innovations"

Create 4 different music directions:
1. Signature sound optimized for ${visualTheme}
2. Cinematic/Orchestral approach
3. Modern/Electronic approach
4. Warm/Acoustic approach

Return as valid JSON:
[{"id": "music-1", "name": "Music Name", "description": "Description", "mood": "Mood", "energy": "Energy", "instruments": ["instrument1", "instrument2", "instrument3", "instrument4"], "bestFor": "Target use cases"}, ...]`;

  try {
    // Create Gemini client using singleton instance (following David's pattern)
    const vertexAIService = VertexAIService.getInstance();
    const geminiClient = new GeminiClient(vertexAIService);

    // Call Gemini API for dynamic music genres
    const response = await geminiClient.generateTextOnly(prompt);

    // Parse JSON response with enhanced error handling
    let cleanedText = response.text;

    // Extract JSON from markdown code blocks
    const jsonBlockMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      cleanedText = jsonBlockMatch[1].trim();
    } else {
      // Try to find JSON array or object directly
      const jsonMatch = cleanedText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (jsonMatch) {
        cleanedText = jsonMatch[1].trim();
      } else {
        // Fallback: remove markdown markers
        cleanedText = cleanedText.replace(/```json\n?|\n?```/g, '').trim();
      }
    }

    console.log("[AI Music Genres] Raw AI response:", {
      originalText: response.text.substring(0, 200) + '...',
      cleanedText: cleanedText.substring(0, 200) + '...',
      textLength: cleanedText.length
    });

    // Additional JSON cleaning for special characters (but preserve structure)
    cleanedText = cleanedText
      .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes with regular quotes
      .replace(/[\u201C\u201D]/g, '"'); // Replace smart double quotes

    let musicGenres;
    try {
      musicGenres = JSON.parse(cleanedText);
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      console.error("[AI Music Genres] JSON Parse Error Details:", {
        error: errorMessage,
        cleanedText: cleanedText,
        position: errorMessage.match(/position (\d+)/)?.[1] || 'unknown'
      });

      // Try to fix common JSON issues and parse again
      const fixedText = cleanedText
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double quotes
        .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas

      try {
        musicGenres = JSON.parse(fixedText);
        console.log("[AI Music Genres] Successfully parsed after JSON fixes");
      } catch (secondError) {
        const secondErrorMessage = secondError instanceof Error ? secondError.message : String(secondError);
        console.error("[AI Music Genres] Second parse attempt failed:", secondErrorMessage);
        throw new Error(`Failed to parse AI response as JSON: ${errorMessage}`);
      }
    }

    // Validate the response is an array of valid MusicGenre objects
    if (Array.isArray(musicGenres) &&
        musicGenres.length >= 3 &&
        musicGenres.every(genre =>
          genre.id &&
          genre.name &&
          genre.description &&
          genre.mood &&
          genre.energy &&
          Array.isArray(genre.instruments) &&
          genre.bestFor
        )) {
      // Return exactly 4 options for consistency
      return musicGenres.slice(0, 4);
    } else {
      throw new Error('Invalid response format from Gemini for music genres');
    }

  } catch (error) {
    console.error('[AI Music Genres] Error in generateAIMusicGenres:', error);
    throw error; // Re-throw to trigger fallback in parent function
  }
}

// Demo mode narrative styles
function getDemoNarrativeStyles(locale: Locale): NarrativeStyle[] {
  const isJapanese = locale === 'ja';

  return [
    {
      id: "dramatic-cinematic",
      name: isJapanese ? "ドラマティック・シネマティック" : "Dramatic Cinematic",
      description: isJapanese
        ? "映画のような壮大さで、商品の魅力を深く印象的に伝える"
        : "Epic, movie-like storytelling that creates deep emotional impact",
      pacing: isJapanese ? "ゆっくり・劇的" : "Slow & Dramatic",
      tone: isJapanese ? "感情的・印象的" : "Emotional & Impactful",
      narrationStyle: isJapanese ? "権威ある・深み" : "Authoritative & Deep",
      examples: ["Luxury brands", "Premium products", "Life-changing solutions"],
      bestFor: isJapanese ? "高級商品・感情的な商品" : "Luxury goods and emotional products"
    },
    {
      id: "energetic-modern",
      name: isJapanese ? "エネルギッシュ・モダン" : "Energetic Modern",
      description: isJapanese
        ? "現代的でテンポの速い、若々しいエネルギーで商品を紹介"
        : "Fast-paced, contemporary style with youthful energy",
      pacing: isJapanese ? "速い・活発" : "Fast & Dynamic",
      tone: isJapanese ? "明るい・楽しい" : "Upbeat & Fun",
      narrationStyle: isJapanese ? "会話的・親しみやすい" : "Conversational & Friendly",
      examples: ["Tech gadgets", "Fitness products", "Youth brands"],
      bestFor: isJapanese ? "テック・フィットネス・若者向け商品" : "Tech, fitness, and youth-oriented products"
    },
    {
      id: "warm-authentic",
      name: isJapanese ? "温かい・真実的" : "Warm Authentic",
      description: isJapanese
        ? "真心で語りかける、信頼できる温かみのあるストーリーテリング"
        : "Genuine, heartfelt storytelling that builds trust and connection",
      pacing: isJapanese ? "中程度・安定" : "Medium & Steady",
      tone: isJapanese ? "温かい・信頼できる" : "Warm & Trustworthy",
      narrationStyle: isJapanese ? "親近感・誠実" : "Personal & Sincere",
      examples: ["Family products", "Health & wellness", "Local businesses"],
      bestFor: isJapanese ? "家族向け・健康・地域ビジネス" : "Family-oriented and wellness products"
    },
    {
      id: "sophisticated-elegant",
      name: isJapanese ? "洗練された・エレガント" : "Sophisticated Elegant",
      description: isJapanese
        ? "洗練された品格で、商品の高級感と独特性を表現"
        : "Refined elegance that highlights premium quality and uniqueness",
      pacing: isJapanese ? "ゆっくり・品格" : "Slow & Refined",
      tone: isJapanese ? "洗練された・高級" : "Sophisticated & Premium",
      narrationStyle: isJapanese ? "上品・知的" : "Cultured & Intelligent",
      examples: ["Luxury fashion", "Fine dining", "Art & culture"],
      bestFor: isJapanese ? "高級ファッション・美食・芸術" : "Luxury fashion and cultural products"
    }
  ];
}

// Demo mode music genres
function getDemoMusicGenres(locale: Locale): MusicGenre[] {
  const isJapanese = locale === 'ja';

  return [
    {
      id: "epic-orchestral",
      name: isJapanese ? "エピック・オーケストラ" : "Epic Orchestral",
      description: isJapanese
        ? "壮大なオーケストラサウンドで感動的なドラマを演出"
        : "Grand orchestral soundscapes that create emotional drama",
      mood: isJapanese ? "壮大・感動的" : "Epic & Inspiring",
      energy: isJapanese ? "高・力強い" : "High & Powerful",
      instruments: ["Orchestra", "Strings", "Brass", "Timpani"],
      bestFor: isJapanese ? "高級商品・感動的メッセージ" : "Luxury products and inspiring messages"
    },
    {
      id: "modern-electronic",
      name: isJapanese ? "モダン・エレクトロニック" : "Modern Electronic",
      description: isJapanese
        ? "現代的な電子音楽で革新性とテクノロジーを表現"
        : "Contemporary electronic sounds showcasing innovation and technology",
      mood: isJapanese ? "未来的・クール" : "Futuristic & Cool",
      energy: isJapanese ? "中高・ダイナミック" : "Medium-High & Dynamic",
      instruments: ["Synthesizers", "Digital beats", "Electronic bass", "FX"],
      bestFor: isJapanese ? "テック商品・イノベーション" : "Tech products and innovations"
    },
    {
      id: "acoustic-warm",
      name: isJapanese ? "アコースティック・温かい" : "Acoustic Warm",
      description: isJapanese
        ? "温かいアコースティックサウンドで親近感と信頼を築く"
        : "Warm acoustic tones that build trust and personal connection",
      mood: isJapanese ? "温かい・親しみやすい" : "Warm & Approachable",
      energy: isJapanese ? "中・リラックス" : "Medium & Relaxed",
      instruments: ["Acoustic guitar", "Piano", "Strings", "Light percussion"],
      bestFor: isJapanese ? "家族向け・ライフスタイル商品" : "Family and lifestyle products"
    },
    {
      id: "upbeat-energetic",
      name: isJapanese ? "アップビート・エネルギッシュ" : "Upbeat Energetic",
      description: isJapanese
        ? "明るく活発な音楽で活気とポジティブな雰囲気を演出"
        : "Bright, energetic music that creates vibrant and positive atmosphere",
      mood: isJapanese ? "明るい・活発" : "Bright & Energetic",
      energy: isJapanese ? "高・ダイナミック" : "High & Dynamic",
      instruments: ["Electric guitar", "Upbeat drums", "Bass", "Energetic vocals"],
      bestFor: isJapanese ? "若者向け・スポーツ・エンターテイメント" : "Youth products, sports, and entertainment"
    }
  ];
}

// Demo mode video production
async function startDemoProduction(sessionId: string, locale: Locale): Promise<any> {
  console.log(`[Video Producer Demo] Starting production for session ${sessionId}`);


  // Use a sample video URL for demo purposes
  // In a real implementation, this would be the generated video
  const demoVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  return {
    success: true,
    productionId: crypto.randomUUID(),
    estimatedCompletion: Date.now() + (8 * 1000), // 8 seconds for demo
    videoUrl: demoVideoUrl,
    status: "in_progress"
  };
}

// Demo mode chat handler
async function handleDemoChat(sessionId: string, message: string, locale: Locale): Promise<any> {
  console.log(`[Video Producer Demo] Chat for session ${sessionId}: ${message}`);

  const isJapanese = locale === 'ja';

  // Simple demo responses based on keywords
  let response = "";

  if (message.toLowerCase().includes("music") || message.includes("音楽")) {
    response = isJapanese
      ? "音楽の選択について素晴らしい質問ですね！商品の雰囲気に合わせて、感情的なインパクトを最大化する音楽を選びましょう。どのような感情を視聴者に伝えたいですか？"
      : "Great question about music! Let's choose the perfect soundtrack that amplifies your product's emotional impact. What feeling do you want to evoke in your audience?";
  } else if (message.toLowerCase().includes("pace") || message.toLowerCase().includes("timing") || message.includes("ペース")) {
    response = isJapanese
      ? "ペーシングは商品の魅力を最大限に引き出す重要な要素です。ドラマティックにじっくりと見せるか、エネルギッシュに素早く印象づけるか、どちらがあなたの商品に適していると思いますか？"
      : "Pacing is crucial for maximizing your product's appeal! Should we go dramatic and deliberate, or energetic and quick? What feels right for your product's personality?";
  } else if (message.toLowerCase().includes("style") || message.includes("スタイル")) {
    response = isJapanese
      ? "ナラティブスタイルについてお聞きですね！あなたの商品のストーリーをどのように伝えたいかが重要です。感情に訴えかけるドラマティックな手法か、親しみやすく現代的なアプローチ、どちらがブランドイメージに合いますか？"
      : "Narrative style is key to your story! Do you want to touch hearts with dramatic storytelling, or connect personally with a modern, approachable style? What fits your brand personality?";
  } else {
    response = isJapanese
      ? "こんにちは！ビデオ制作について何かご質問がありますか？音楽、ペーシング、ナラティブスタイルについてお気軽にお聞きください。あなたの商品に最適なコマーシャルを作りましょう！"
      : "Hi there! Any questions about video production? Feel free to ask about music, pacing, or narrative styles. Let's create the perfect commercial for your product!";
  }

  return {
    response,
    timestamp: Date.now(),
    cost: 0.01 // Small demo cost
  };
}

// Main handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Video Producer API] Request received:", body);

    const { action } = body;

    if (action === "initialize") {
      const initRequest = body as VideoProducerInitRequest;

      // Validate required fields
      if (!initRequest.sessionId || !initRequest.data?.creativeDirectorHandoffData) {
        return NextResponse.json(
          { error: "Missing required fields: sessionId or creativeDirectorHandoffData" },
          { status: 400 }
        );
      }

      // Check app mode and route to appropriate handler
      const isDemoMode = AppModeConfig.getMode() === 'demo';
      let response: VideoProducerInitResponse;

      if (isDemoMode) {
        response = await initializeDemoMode(initRequest);
      } else {
        response = await initializeRealMode(initRequest);
      }

      return NextResponse.json({
        success: true,
        data: response,
        timestamp: Date.now(),
        mode: isDemoMode ? 'demo' : 'real'
      });
    }

    // Note: narrative-styles and music-genres are now provided in initialization response
    // following Maya's pattern where API provides all options upfront

    if (action === "chat") {
      const { sessionId, locale, data } = body;
      const isDemoMode = AppModeConfig.getMode() === 'demo';
      const message = data?.message || "";
      const result = await handleDemoChat(sessionId, message, locale);

      return NextResponse.json({
        success: true,
        data: result,
        timestamp: Date.now(),
        mode: isDemoMode ? 'demo' : 'real'
      });
    }

    // Real mode Step 1: Narrative Style Selection Validation
    if (action === "select-narrative-style") {
      const { sessionId, locale, data, context } = body;
      const isDemoMode = AppModeConfig.getMode() === 'demo';

      if (isDemoMode) {
        // Demo mode: Simple approval
        return NextResponse.json({
          success: true,
          data: {
            validation: {
              alignmentScore: 8.5,
              strengths: ["Good pacing match", "Appropriate tone for product"],
              recommendations: ["Consider emphasizing key benefits more prominently"]
            },
            confirmation: {
              approved: true,
              message: "Excellent narrative style choice! This aligns well with your product and creative direction.",
              nextStepGuidance: "Now let's select the perfect music to complement this narrative approach."
            }
          },
          timestamp: Date.now(),
          mode: 'demo'
        });
      }

      // Real mode: AI validation
      try {
        const prompt = buildNarrativeStyleValidationPrompt({
          davidHandoff: context.davidHandoff,
          locale
        }, data.narrativeStyleId);

        // Process with actual AI integration
        const aiResult = await processNarrativeStyleValidation({
          sessionId,
          prompt,
          locale,
          context: {
            davidHandoff: context.davidHandoff
          }
        });

        if (!aiResult.success) {
          return NextResponse.json({
            success: false,
            error: aiResult.error || "AI validation failed",
            timestamp: Date.now(),
            mode: 'real'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data: aiResult.response,
          cost: aiResult.cost,
          confidence: aiResult.confidence,
          processingTime: aiResult.processingTime,
          timestamp: Date.now(),
          mode: 'real'
        });

      } catch (error) {
        console.error("[Video Producer Real] Narrative validation error:", error);
        return NextResponse.json({
          success: false,
          error: "Failed to validate narrative style selection",
          timestamp: Date.now()
        }, { status: 500 });
      }
    }

    // Real mode Step 2: Music & Tone Selection Validation
    if (action === "select-music-genre") {
      const { sessionId, locale, data, context } = body;
      const isDemoMode = AppModeConfig.getMode() === 'demo';

      if (isDemoMode) {
        // Demo mode: Simple approval
        return NextResponse.json({
          success: true,
          data: {
            validation: {
              harmonyScore: 9.0,
              brandAlignment: 8.5,
              emotionalImpact: "Creates strong emotional connection with audience",
              recommendations: ["Perfect choice for your brand personality"]
            },
            confirmation: {
              approved: true,
              message: "Outstanding music selection! This will create the perfect atmosphere for your commercial.",
              productionReadiness: "All creative elements are now in perfect harmony. Ready for video production!"
            }
          },
          timestamp: Date.now(),
          mode: 'demo'
        });
      }

      // Real mode: AI validation with accumulated context
      try {
        const prompt = buildMusicToneValidationPrompt({
          davidHandoff: context.davidHandoff,
          selectedNarrativeStyle: context.selectedNarrativeStyle,
          locale
        }, data.musicGenreId);

        // Process with actual AI integration
        const aiResult = await processMusicToneValidation({
          sessionId,
          prompt,
          locale,
          context: {
            davidHandoff: context.davidHandoff,
            selectedNarrativeStyle: context.selectedNarrativeStyle
          }
        });

        if (!aiResult.success) {
          return NextResponse.json({
            success: false,
            error: aiResult.error || "AI validation failed",
            timestamp: Date.now(),
            mode: 'real'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data: aiResult.response,
          cost: aiResult.cost,
          confidence: aiResult.confidence,
          processingTime: aiResult.processingTime,
          timestamp: Date.now(),
          mode: 'real'
        });

      } catch (error) {
        console.error("[Video Producer Real] Music validation error:", error);
        return NextResponse.json({
          success: false,
          error: "Failed to validate music genre selection",
          timestamp: Date.now()
        }, { status: 500 });
      }
    }

    // Real mode Step 4: Final Production - Bridge to existing video generation
    if (action === "start-production") {
      const { sessionId, locale, data } = body;
      const isDemoMode = AppModeConfig.getMode() === 'demo';

      if (isDemoMode) {
        // Use existing demo production handler
        const result = await startDemoProduction(sessionId, locale);
        return NextResponse.json({
          success: true,
          data: {
            mode: 'demo',
            videoUrl: result.videoUrl,
            productionId: result.productionId,
            estimatedCompletion: result.estimatedCompletion,
            status: result.status
          },
          timestamp: Date.now(),
          mode: 'demo'
        });
      }

      // Real mode: Build comprehensive context and bridge to video generation
      try {
        // 🔍 DEBUG: Log what we received from frontend
        console.log("[VideoProducer] 🔍 HANDOFF DATA DEBUG:", {
          hasCreativeDirectorHandoffData: !!data.creativeDirectorHandoffData,
          productAnalysis_structure: data.creativeDirectorHandoffData?.productAnalysis,
          productAnalysis_keys: Object.keys(data.creativeDirectorHandoffData?.productAnalysis || {}),
          productAnalysis_name: data.creativeDirectorHandoffData?.productAnalysis?.name,
          productAnalysis_description: data.creativeDirectorHandoffData?.productAnalysis?.description,
          productAnalysis_product: data.creativeDirectorHandoffData?.productAnalysis?.product,
          productImage: data.creativeDirectorHandoffData?.productImage ? "Present" : "Missing"
        });

        // Map creativeDirectorHandoffData to davidHandoff structure
        const davidHandoff = data.creativeDirectorHandoffData ? {
          productImage: data.creativeDirectorHandoffData.productImage || '', // Use the passed productImage
          mayaAnalysis: {
            productAnalysis: data.creativeDirectorHandoffData.productAnalysis?.product || data.creativeDirectorHandoffData.productAnalysis || {},
            strategicInsights: data.creativeDirectorHandoffData.productAnalysis?.targetAudience || {},
            visualOpportunities: data.creativeDirectorHandoffData.productAnalysis?.keyMessages || {}
          },
          productionStyle: data.creativeDirectorHandoffData.creativeDirection?.strategy || {},
          creativeDirection: data.creativeDirectorHandoffData.creativeDirection || {},
          sceneArchitecture: data.creativeDirectorHandoffData.creativeDirection?.zaraHandoffData?.sceneBreakdown || []
        } : data.davidHandoff;

        // 🔍 DEBUG: Log what we mapped
        console.log("[VideoProducer] 🔍 MAPPED HANDOFF DEBUG:", {
          mapped_productAnalysis: davidHandoff.mayaAnalysis?.productAnalysis,
          mapped_productName: davidHandoff.mayaAnalysis?.productAnalysis?.name,
          mapped_productDescription: davidHandoff.mayaAnalysis?.productAnalysis?.description
        });

        // Validate all required context is present
        const readinessCheck = validateProductionReadiness({
          davidHandoff,
          selectedNarrativeStyle: data.selectedNarrativeStyle,
          selectedMusicGenre: data.selectedMusicGenre,
          selectedVideoFormat: data.selectedVideoFormat,
          locale
        });

        if (!readinessCheck.ready) {
          return NextResponse.json({
            success: false,
            error: "Missing required production context",
            details: { missing: readinessCheck.missing },
            timestamp: Date.now()
          }, { status: 400 });
        }

        // Build production context for existing video generation API
        const productionContext = buildProductionContext({
          davidHandoff,
          selectedNarrativeStyle: data.selectedNarrativeStyle,
          selectedMusicGenre: data.selectedMusicGenre,
          selectedVideoFormat: data.selectedVideoFormat,
          locale
        });

        console.log("[Video Producer Real] Production context built:", {
          sessionId,
          prompt: productionContext.videoGenerationRequest.prompt.substring(0, 200) + '...',
          metadata: productionContext.productionMetadata
        });

        // Use ProductionBridgeService to integrate with existing video generation pipeline
        const productionBridge = ProductionBridgeService.getInstance();

        const productionResult = await productionBridge.startProduction({
          sessionId,
          locale,
          davidHandoff,
          selectedNarrativeStyle: data.selectedNarrativeStyle,
          selectedMusicGenre: data.selectedMusicGenre,
          selectedVideoFormat: data.selectedVideoFormat
        });

        if (!productionResult.success) {
          return NextResponse.json({
            success: false,
            error: productionResult.error?.message || "Video production failed to start",
            details: productionResult.error?.details,
            timestamp: Date.now()
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data: productionResult.data,
          timestamp: Date.now(),
          mode: 'real'
        });

      } catch (error) {
        console.error("[Video Producer Real] Production preparation error:", error);
        return NextResponse.json({
          success: false,
          error: "Failed to prepare video production",
          timestamp: Date.now()
        }, { status: 500 });
      }
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );

  } catch (error) {
    console.error("[Video Producer API] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    agent: "video-producer",
    status: "healthy",
    mode: AppModeConfig.getMode(),
    timestamp: Date.now()
  });
}