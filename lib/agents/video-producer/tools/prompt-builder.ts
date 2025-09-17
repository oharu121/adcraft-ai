/**
 * Video Producer (Zara) Prompt Builder
 *
 * Builds AI prompts for Zara's workflow steps with proper context accumulation
 */

import type { Locale } from "@/lib/dictionaries";
import type { NarrativeStyle, MusicGenre, VideoFormat } from "@/lib/stores/video-producer-store";

export interface DavidHandoffData {
  productImage: string; // Base64 or URL
  mayaAnalysis: {
    productAnalysis: any;
    strategicInsights: any;
    visualOpportunities: any;
  };
  productionStyle: any;
  creativeDirection: any;
  sceneArchitecture: any[];
}

export interface ZaraStepContext {
  davidHandoff: DavidHandoffData;
  selectedNarrativeStyle?: NarrativeStyle;
  selectedMusicGenre?: MusicGenre;
  selectedVideoFormat?: VideoFormat;
  locale: Locale;
}

/**
 * Step 1: Narrative Style Selection Validation Prompt
 */
export function buildNarrativeStyleValidationPrompt(
  context: ZaraStepContext,
  selectedNarrativeStyleId: string
): string {
  const { davidHandoff, locale } = context;
  const isJapanese = locale === 'ja';

  return `${isJapanese ? '動画プロデューサー（ザラ）として、' : 'As Video Producer (Zara), '}${isJapanese ? 'ユーザーのナラティブスタイル選択を検証し、確認してください。' : 'validate and confirm the user\'s narrative style choice.'}

${isJapanese ? '商品コンテキスト：' : 'PRODUCT CONTEXT:'}
${isJapanese ? '商品分析：' : 'Product Analysis:'} ${JSON.stringify(davidHandoff.mayaAnalysis.productAnalysis, null, 2)}
${isJapanese ? 'ターゲット層：' : 'Target Audience:'} ${davidHandoff.mayaAnalysis.strategicInsights?.targetAudience || 'Not specified'}

${isJapanese ? 'クリエイティブディレクション：' : 'CREATIVE DIRECTION:'}
${isJapanese ? 'プロダクションスタイル：' : 'Production Style:'} ${davidHandoff.productionStyle?.name || 'Not specified'}
${isJapanese ? 'ビジュアルスタイル：' : 'Visual Style:'} ${davidHandoff.creativeDirection?.name || 'Not specified'}
${isJapanese ? 'ムード：' : 'Mood:'} ${davidHandoff.creativeDirection?.description || 'Not specified'}

${isJapanese ? 'ユーザー選択：' : 'USER SELECTION:'}
${isJapanese ? '選択されたナラティブスタイルID：' : 'Selected Narrative Style ID:'} ${selectedNarrativeStyleId}

${isJapanese ? 'タスク：' : 'TASK:'}
${isJapanese ? '1. この選択が商品と創造的方向性にどの程度適合するかを分析してください（1-10スケール）' : '1. Analyze how well this choice aligns with the product and creative direction (1-10 scale)'}
${isJapanese ? '2. この選択の強みと潜在的な改善点を特定してください' : '2. Identify strengths and potential improvements for this choice'}
${isJapanese ? '3. 商品に最適な動画の感情的トーンを推奨してください' : '3. Recommend the optimal emotional tone for the video based on the product'}

${isJapanese ? '以下のJSON形式で応答してください：' : 'Respond in the following JSON format:'}
{
  "validation": {
    "alignmentScore": number,
    "strengths": string[],
    "recommendations": string[]
  },
  "confirmation": {
    "approved": boolean,
    "message": string,
    "nextStepGuidance": string
  }
}`;
}

/**
 * Step 2: Music & Tone Selection Validation Prompt
 */
export function buildMusicToneValidationPrompt(
  context: ZaraStepContext,
  selectedMusicGenreId: string
): string {
  const { davidHandoff, selectedNarrativeStyle, locale } = context;
  const isJapanese = locale === 'ja';

  return `${isJapanese ? '動画プロデューサー（ザラ）として、' : 'As Video Producer (Zara), '}${isJapanese ? 'ユーザーの音楽ジャンル選択を検証し、確認してください。' : 'validate and confirm the user\'s music genre choice.'}

${isJapanese ? '累積コンテキスト：' : 'ACCUMULATED CONTEXT:'}
${isJapanese ? '商品：' : 'Product:'} ${davidHandoff.mayaAnalysis.productAnalysis?.name || 'Product'}
${isJapanese ? 'ターゲット層：' : 'Target Audience:'} ${davidHandoff.mayaAnalysis.strategicInsights?.targetAudience || 'General'}
${isJapanese ? 'ビジュアルスタイル：' : 'Visual Style:'} ${davidHandoff.creativeDirection?.name || 'Not specified'}
${isJapanese ? '承認済みナラティブスタイル：' : 'Approved Narrative Style:'} ${selectedNarrativeStyle?.name || 'Not selected'}
${isJapanese ? 'ナラティブのペーシング：' : 'Narrative Pacing:'} ${selectedNarrativeStyle?.pacing || 'Not specified'}
${isJapanese ? 'ナラティブのトーン：' : 'Narrative Tone:'} ${selectedNarrativeStyle?.tone || 'Not specified'}

${isJapanese ? 'ユーザー選択：' : 'USER SELECTION:'}
${isJapanese ? '選択された音楽ジャンルID：' : 'Selected Music Genre ID:'} ${selectedMusicGenreId}

${isJapanese ? 'タスク：' : 'TASK:'}
${isJapanese ? '1. この音楽選択がナラティブスタイルとビジュアル方向性とどの程度調和するかを分析してください' : '1. Analyze how well this music choice harmonizes with the narrative style and visual direction'}
${isJapanese ? '2. 音楽のムードとエネルギーが商品のブランドパーソナリティと一致するかを評価してください' : '2. Evaluate if the music mood and energy match the product\'s brand personality'}
${isJapanese ? '3. 視聴者の感情的な旅路への影響を予測してください' : '3. Predict the impact on the audience\'s emotional journey'}

${isJapanese ? '以下のJSON形式で応答してください：' : 'Respond in the following JSON format:'}
{
  "validation": {
    "harmonyScore": number,
    "brandAlignment": number,
    "emotionalImpact": string,
    "recommendations": string[]
  },
  "confirmation": {
    "approved": boolean,
    "message": string,
    "productionReadiness": string
  }
}`;
}

/**
 * Step 4: Final Production Prompt Builder
 * Creates comprehensive prompt for video generation
 */
export function buildFinalProductionPrompt(
  context: ZaraStepContext & {
    selectedNarrativeStyle: NarrativeStyle;
    selectedMusicGenre: MusicGenre;
    selectedVideoFormat: VideoFormat;
  }
): string {
  const {
    davidHandoff,
    selectedNarrativeStyle,
    selectedMusicGenre,
    selectedVideoFormat,
    locale
  } = context;

  // Extract key information for video generation
  const productName = davidHandoff.mayaAnalysis?.productAnalysis?.name || 'product';
  const productCategory = davidHandoff.mayaAnalysis?.productAnalysis?.category || 'general';
  const visualStyle = davidHandoff.creativeDirection?.name || 'modern';
  const colorPalette = davidHandoff.creativeDirection?.colorPalette || ['#000000', '#FFFFFF'];

  // Build comprehensive video generation prompt
  const prompt = `Create a professional ${selectedVideoFormat.durationSeconds}-second commercial video for ${productName}, a ${productCategory}.

VISUAL STYLE: ${visualStyle} aesthetic with ${davidHandoff.creativeDirection?.description || 'sophisticated visual approach'}
COLOR PALETTE: ${colorPalette.join(', ')}
ASPECT RATIO: ${selectedVideoFormat.aspectRatio}
RESOLUTION: ${selectedVideoFormat.resolution}

NARRATIVE APPROACH: ${selectedNarrativeStyle.name} - ${selectedNarrativeStyle.description}
PACING: ${selectedNarrativeStyle.pacing}
TONE: ${selectedNarrativeStyle.tone}
NARRATION: ${selectedNarrativeStyle.narrationStyle}

MUSIC & SOUND: ${selectedMusicGenre.name} - ${selectedMusicGenre.description}
MOOD: ${selectedMusicGenre.mood}
ENERGY: ${selectedMusicGenre.energy}

SCENE STRUCTURE:${davidHandoff.sceneArchitecture?.map((scene: any, index: number) =>
  `\nScene ${index + 1}: ${scene.description || 'Product showcase'} - ${scene.composition || 'Centered composition'}`
).join('') || '\nScene 1: Hero product shot with dramatic lighting\nScene 2: Lifestyle context showing product in use'}

PRODUCTION REQUIREMENTS:
- High-quality cinematic production value
- Professional commercial lighting and cinematography
- Smooth transitions between scenes
- Brand-appropriate visual treatment
- Optimized for ${selectedVideoFormat.platforms?.join(' and ') || 'digital platforms'}
- ${selectedVideoFormat.name} format specifications

Create a compelling ${selectedVideoFormat.durationSeconds}-second video that showcases the product's key benefits while maintaining the ${visualStyle} aesthetic and ${selectedNarrativeStyle.name} storytelling approach.`;

  return prompt;
}

/**
 * Production Context Data for Integration with Existing Video API
 */
export function buildProductionContext(
  context: ZaraStepContext & {
    selectedNarrativeStyle: NarrativeStyle;
    selectedMusicGenre: MusicGenre;
    selectedVideoFormat: VideoFormat;
  }
) {
  const prompt = buildFinalProductionPrompt(context);

  return {
    // For existing /api/generate-video endpoint
    videoGenerationRequest: {
      prompt,
      duration: context.selectedVideoFormat.durationSeconds,
      aspectRatio: context.selectedVideoFormat.aspectRatio,
      style: "commercial",
    },

    // Metadata for tracking and analysis
    productionMetadata: {
      sessionId: `zara-${crypto.randomUUID()}`,
      productImage: context.davidHandoff.productImage,
      productName: context.davidHandoff.mayaAnalysis?.productAnalysis?.name,
      creativeDirection: context.davidHandoff.creativeDirection?.name,
      narrativeStyle: context.selectedNarrativeStyle.name,
      musicGenre: context.selectedMusicGenre.name,
      videoFormat: context.selectedVideoFormat.name,
      estimatedCost: 2.5, // Base cost estimation
      locale: context.locale
    }
  };
}

/**
 * Utility to validate all required context is present for final production
 */
export function validateProductionReadiness(context: ZaraStepContext): {
  ready: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!context.davidHandoff) missing.push('David handoff data');
  if (!context.selectedNarrativeStyle) missing.push('Narrative style selection');
  if (!context.selectedMusicGenre) missing.push('Music genre selection');
  if (!context.selectedVideoFormat) missing.push('Video format selection');

  // Check David handoff completeness
  if (context.davidHandoff) {
    if (!context.davidHandoff.mayaAnalysis) missing.push('Maya product analysis');
    if (!context.davidHandoff.creativeDirection) missing.push('Creative direction');
    if (!context.davidHandoff.sceneArchitecture?.length) missing.push('Scene architecture');
  }

  return {
    ready: missing.length === 0,
    missing
  };
}