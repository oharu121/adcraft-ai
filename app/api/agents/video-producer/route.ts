import { NextRequest, NextResponse } from "next/server";
import { AppModeConfig } from "@/lib/config/app-mode";
import type { CreativeDirection } from "@/lib/agents/creative-director/types/asset-types";
import type { Locale } from "@/lib/dictionaries";
import type { NarrativeStyle, MusicGenre } from "@/lib/stores/video-producer-store";

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
}

// Demo mode video production handler
async function initializeDemoMode(
  request: VideoProducerInitRequest
): Promise<VideoProducerInitResponse> {
  const { sessionId, data, locale } = request;
  const { creativeDirection } = data.creativeDirectorHandoffData;

  console.log(`[Video Producer Demo] Initializing session ${sessionId}`);

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

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
    }
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

  // For now, return similar structure as demo mode
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
    }
  };

  return response;
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
      id: "upbeat-pop",
      name: isJapanese ? "アップビート・ポップ" : "Upbeat Pop",
      description: isJapanese
        ? "明るく楽しいポップサウンドで活気とポジティブさを演出"
        : "Bright, cheerful pop sounds that energize and create positivity",
      mood: isJapanese ? "明るい・楽しい" : "Bright & Joyful",
      energy: isJapanese ? "高・活発" : "High & Energetic",
      instruments: ["Pop vocals", "Electric guitar", "Bass", "Drums"],
      bestFor: isJapanese ? "若者向け・エンターテイメント" : "Youth-oriented and entertainment products"
    }
  ];
}

// Demo mode video production
async function startDemoProduction(sessionId: string, locale: Locale): Promise<any> {
  console.log(`[Video Producer Demo] Starting production for session ${sessionId}`);

  // Simulate video production
  await new Promise(resolve => setTimeout(resolve, 2000));

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

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

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

    if (action === "get-narrative-styles") {
      const { locale } = body;
      const isDemoMode = AppModeConfig.getMode() === 'demo';
      const narrativeStyles = getDemoNarrativeStyles(locale);

      return NextResponse.json({
        success: true,
        data: { narrativeStyles },
        timestamp: Date.now(),
        mode: isDemoMode ? 'demo' : 'real'
      });
    }

    if (action === "get-music-genres") {
      const { locale } = body;
      const isDemoMode = AppModeConfig.getMode() === 'demo';
      const musicGenres = getDemoMusicGenres(locale);

      return NextResponse.json({
        success: true,
        data: { musicGenres },
        timestamp: Date.now(),
        mode: isDemoMode ? 'demo' : 'real'
      });
    }

    if (action === "start-production") {
      const { sessionId, locale } = body;
      const isDemoMode = AppModeConfig.getMode() === 'demo';
      const result = await startDemoProduction(sessionId, locale);

      return NextResponse.json({
        success: true,
        data: result,
        timestamp: Date.now(),
        mode: isDemoMode ? 'demo' : 'real'
      });
    }

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