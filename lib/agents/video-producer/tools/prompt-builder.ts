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

  // Extract comprehensive context from Maya and David
  const productName = davidHandoff.mayaAnalysis?.productAnalysis?.name || 'product';
  const productCategory = davidHandoff.mayaAnalysis?.productAnalysis?.category || 'general';
  const targetAudience = davidHandoff.mayaAnalysis?.strategicInsights?.targetAudience || 'general consumers';
  const keyMessages = davidHandoff.mayaAnalysis?.strategicInsights?.keyMessages || [];
  const productBenefits = davidHandoff.mayaAnalysis?.productAnalysis?.benefits || [];

  // David's creative direction context
  const productionStyle = davidHandoff.productionStyle?.name || 'cinematic';
  const visualStyle = davidHandoff.creativeDirection?.name || 'modern';
  const colorPalette = davidHandoff.creativeDirection?.colorPalette || ['#000000', '#FFFFFF'];
  const visualKeywords = davidHandoff.creativeDirection?.visualKeywords || [];
  const mood = davidHandoff.creativeDirection?.description || 'sophisticated and modern';

  // Build comprehensive, AI-optimized video generation prompt
  const prompt = `COMMERCIAL VIDEO GENERATION:

PRODUCT_CONTEXT:
- Name: ${productName}
- Category: ${productCategory}
- Target_Audience: ${targetAudience}
- Key_Messages: ${keyMessages.join(', ') || 'Quality and innovation'}
- Product_Benefits: ${productBenefits.join(', ') || 'Premium quality and reliability'}

VIDEO_SPECIFICATIONS:
- Duration: ${selectedVideoFormat.durationSeconds} seconds
- Aspect_Ratio: ${selectedVideoFormat.aspectRatio}
- Production_Style: ${productionStyle}
- Platforms: ${selectedVideoFormat.platforms?.join(', ') || 'digital platforms'}

VISUAL_DIRECTION:
- Creative_Style: ${visualStyle}
- Mood: ${mood}
- Color_Palette: ${colorPalette.join(', ')}
- Visual_Keywords: ${visualKeywords.join(', ') || 'modern, sophisticated'}

NARRATIVE_STRUCTURE:
- Style: ${selectedNarrativeStyle.name}
- Approach: ${selectedNarrativeStyle.description}
- Pacing: ${selectedNarrativeStyle.pacing}
- Tone: ${selectedNarrativeStyle.tone}
- Narration: ${selectedNarrativeStyle.narrationStyle}
- Best_For: ${selectedNarrativeStyle.bestFor}

AUDIO_DESIGN:
- Genre: ${selectedMusicGenre.name}
- Mood: ${selectedMusicGenre.mood}
- Energy: ${selectedMusicGenre.energy}
- Description: ${selectedMusicGenre.description}
- Instruments: ${selectedMusicGenre.instruments?.join(', ') || 'cinematic orchestra'}
- Audio_Best_For: ${selectedMusicGenre.bestFor}

SCENE_ARCHITECTURE:
${davidHandoff.sceneArchitecture?.length > 0
  ? davidHandoff.sceneArchitecture.map((scene: any, index: number) =>
      `Scene_${index + 1}: ${scene.description || 'product showcase'}
  - Composition: ${scene.composition || 'centered'}
  - Shot_Type: ${scene.shotType || 'medium shot'}
  - Lighting: ${scene.lighting || 'cinematic'}
  - Props: ${scene.props?.join(', ') || 'minimal props'}`
    ).join('\n')
  : `Scene_1: Hero product shot featuring ${productName}
  - Composition: centered
  - Shot_Type: close-up
  - Lighting: dramatic professional
  - Props: minimal, focus on product

Scene_2: Product in lifestyle context
  - Composition: rule of thirds
  - Shot_Type: medium shot
  - Lighting: natural cinematic
  - Props: relevant lifestyle elements

Scene_3: Product benefits demonstration
  - Composition: centered
  - Shot_Type: detail shot
  - Lighting: bright professional
  - Props: supporting demonstration elements`
}

PRODUCTION_REQUIREMENTS:
- Quality: Professional commercial grade
- Lighting: Cinematic with dramatic shadows
- Transitions: Smooth, seamless cuts
- Brand_Focus: ${keyMessages.join(' and ') || 'Quality and innovation'}
- Call_to_Action: Emphasize product benefits and brand positioning
- Visual_Consistency: Maintain ${visualStyle} aesthetic throughout
- Audio_Sync: Music and visuals must complement the ${selectedNarrativeStyle.tone} tone

TECHNICAL_SPECS:
- Frame_Rate: 24fps
- Resolution: ${selectedVideoFormat.resolution || '720p'}
- Audio: Native generation with ${selectedMusicGenre.name} style
- Color_Grading: ${colorPalette.length > 0 ? `Emphasize ${colorPalette.join(' and ')} color scheme` : 'Professional color correction'}`;

  return prompt;
}

/**
 * Single Scene + Narration Focused Prompt (NEW APPROACH)
 * One focused 8-second scene with clear product showcase and narration
 */
export function buildSingleSceneNarrationPrompt(
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

  // Extract ACTUAL analysis data - no more placeholders!
  const productName = davidHandoff.mayaAnalysis?.productAnalysis?.name || 'product';
  const productDescription = davidHandoff.mayaAnalysis?.productAnalysis?.description || '';
  const keyFeatures = davidHandoff.mayaAnalysis?.productAnalysis?.keyFeatures || [];
  const targetAudience = davidHandoff.mayaAnalysis?.strategicInsights?.targetAudience || 'consumers';
  const keyMessages = davidHandoff.mayaAnalysis?.strategicInsights?.keyMessages || [];
  const productBenefits = davidHandoff.mayaAnalysis?.productAnalysis?.benefits || [];

  // David's ACTUAL creative direction
  const visualStyle = davidHandoff.creativeDirection?.name || 'modern';
  const mood = davidHandoff.creativeDirection?.description || 'sophisticated';
  const actualColorPalette = davidHandoff.creativeDirection?.colorPalette || [];
  const visualKeywords = davidHandoff.creativeDirection?.visualKeywords || [];

  // Build narration text from actual analysis
  const narrationText = keyMessages.length > 0
    ? keyMessages[0]
    : productBenefits.length > 0
      ? `${productName} - ${productBenefits[0]}`
      : productDescription
        ? `${productName} - ${productDescription.slice(0, 50)}${productDescription.length > 50 ? '...' : ''}`
        : `Experience ${productName}`;

  const prompt = `SINGLE SCENE COMMERCIAL VIDEO (8 SECONDS):

PRODUCT_HERO_FOCUS:
- Name: ${productName}
- Description: ${productDescription || 'Premium product'}
- Target_Audience: ${targetAudience}
- Key_Features: ${keyFeatures.join(', ') || 'Premium quality'}
- Primary_Benefit: ${productBenefits[0] || 'Premium quality'}
- Key_Message: ${keyMessages[0] || 'Experience premium quality'}

SINGLE_SCENE_STRUCTURE:
Scene_1 (0-8 seconds): Complete Product Showcase with Narration
  - Shot_Type: Hero beauty shot of the ACTUAL uploaded product
  - Product_Context: ${productDescription ? `Show ${productName} as ${productDescription}` : `Focus on ${productName} product showcase`}
  - Composition: Product prominently centered and clearly visible
  - Lighting: Professional, dramatic lighting to highlight product details
  - Camera_Movement: Slow zoom or gentle rotation to showcase all angles
  - Product_Focus: The uploaded product must be the star throughout
  - Text_Overlay: "${productName}" appears at 2-3 seconds
  - Narration: "${narrationText}" (clear voiceover delivery)
  - Background: Minimal, elegant to not distract from product
  - Final_Frame: Product with brand name clearly visible

VISUAL_DIRECTION:
- Creative_Style: ${visualStyle}
- Mood: ${mood}
- Color_Palette: ${actualColorPalette.length > 0 ? actualColorPalette.join(', ') : 'elegant and sophisticated colors'}
- Visual_Keywords: ${visualKeywords.join(', ') || 'professional, clean, premium'}
- Product_Context: Design appropriate for the specific product shown

AUDIO_DESIGN:
- Background_Music: ${selectedMusicGenre.name} style
- Music_Mood: ${selectedMusicGenre.mood}
- Narration_Voice: Professional, clear voiceover
- Narration_Text: "${narrationText}"
- Audio_Balance: Music supports but doesn't overpower narration

CRITICAL_REQUIREMENTS:
- UPLOADED PRODUCT MUST BE PROMINENTLY FEATURED throughout all 8 seconds
- Product identity must be visually clear and accurate
- ONE continuous scene - no quick cuts or scene changes
- Clear product visibility is priority over artistic effects
- Narration must be clearly audible and synchronized
- Brand name "${productName}" must appear as text overlay
- Product must match the uploaded image exactly

TECHNICAL_SPECS:
- Duration: 8 seconds continuous
- Aspect_Ratio: ${selectedVideoFormat.aspectRatio}
- Quality: Professional commercial grade
- Audio: Background music + clear narration voiceover
- Text_Overlay: "${productName}" brand name
- Focus: Single hero product shot throughout

PRODUCTION_STYLE: Professional commercial with clear product showcase and informative narration`;

  return prompt;
}

/**
 * 8-Second Optimized Prompt Refinement (DEPRECATED - Use Single Scene instead)
 * Strips complex narrative to focus on pure product showcase
 */
export function buildEightSecondOptimizedPrompt(
  context: ZaraStepContext & {
    selectedNarrativeStyle: NarrativeStyle;
    selectedMusicGenre: MusicGenre;
    selectedVideoFormat: VideoFormat;
  }
): string {
  // DEPRECATED: Use buildSingleSceneNarrationPrompt instead
  return buildSingleSceneNarrationPrompt(context);
}

/**
 * Future-Ready 15-30 Second Prompt Template (For Future Use)
 * Full creative journey when duration constraints are lifted
 */
export function buildExtendedDurationPrompt(
  context: ZaraStepContext & {
    selectedNarrativeStyle: NarrativeStyle;
    selectedMusicGenre: MusicGenre;
    selectedVideoFormat: VideoFormat;
  },
  targetDuration: number = 30
): string {
  const {
    davidHandoff,
    selectedNarrativeStyle,
    selectedMusicGenre,
    selectedVideoFormat,
    locale
  } = context;

  // Full context utilization for extended duration
  const productName = davidHandoff.mayaAnalysis?.productAnalysis?.name || 'product';
  const productCategory = davidHandoff.mayaAnalysis?.productAnalysis?.category || 'general';
  const targetAudience = davidHandoff.mayaAnalysis?.strategicInsights?.targetAudience || 'general consumers';
  const keyMessages = davidHandoff.mayaAnalysis?.strategicInsights?.keyMessages || [];
  const productBenefits = davidHandoff.mayaAnalysis?.productAnalysis?.benefits || [];
  const visualStyle = davidHandoff.creativeDirection?.name || 'modern';
  const mood = davidHandoff.creativeDirection?.description || 'sophisticated';
  const colorPalette = davidHandoff.creativeDirection?.colorPalette || ['#000000', '#FFFFFF'];
  const visualKeywords = davidHandoff.creativeDirection?.visualKeywords || [];

  const prompt = `EXTENDED COMMERCIAL VIDEO (${targetDuration} SECONDS):

FULL_PRODUCT_CONTEXT:
- Name: ${productName}
- Category: ${productCategory}
- Target_Audience: ${targetAudience}
- Key_Messages: ${keyMessages.join(', ') || 'Quality and innovation'}
- Product_Benefits: ${productBenefits.join(', ') || 'Premium quality and reliability'}

EXTENDED_NARRATIVE_STRUCTURE:
- Style: ${selectedNarrativeStyle.name}
- Approach: ${selectedNarrativeStyle.description}
- Pacing: ${selectedNarrativeStyle.pacing}
- Tone: ${selectedNarrativeStyle.tone}
- Narration_Style: ${selectedNarrativeStyle.narrationStyle}

FULL_SCENE_ARCHITECTURE:
Scene_1 (0-${Math.floor(targetDuration * 0.2)} seconds): Problem/Context Setup
  - Establish target audience pain point or need
  - Create emotional connection with viewer
  - Set stage for product introduction

Scene_2 (${Math.floor(targetDuration * 0.2)}-${Math.floor(targetDuration * 0.5)} seconds): Product Introduction & Hero Shot
  - Feature the uploaded product prominently
  - Showcase key visual elements and design
  - Begin benefit demonstration

Scene_3 (${Math.floor(targetDuration * 0.5)}-${Math.floor(targetDuration * 0.8)} seconds): Benefit Demonstration
  - Show product solving the established problem
  - Demonstrate key features and benefits
  - Emotional satisfaction from product use

Scene_4 (${Math.floor(targetDuration * 0.8)}-${targetDuration} seconds): Resolution & Call-to-Action
  - Brand reveal with logo
  - Key message delivery
  - Clear call-to-action

ADVANCED_PRODUCTION:
- Visual_Style: ${visualStyle}
- Mood: ${mood}
- Color_Palette: ${colorPalette.join(', ')}
- Visual_Keywords: ${visualKeywords.join(', ')}
- Audio_Design: ${selectedMusicGenre.name} - ${selectedMusicGenre.description}
- Instruments: ${selectedMusicGenre.instruments?.join(', ') || 'full orchestration'}

CREATIVE_FREEDOM:
- Duration allows for full storytelling arc
- Multiple camera angles and compositions
- Complex transitions and effects
- Detailed product feature showcase
- Emotional narrative development
- Brand personality expression

TARGET_PLATFORMS: ${selectedVideoFormat.platforms?.join(', ') || 'All digital platforms'}
ASPECT_RATIO: ${selectedVideoFormat.aspectRatio}`;

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
  // NEW APPROACH: Single Scene + Narration for better product focus
  const prompt = buildSingleSceneNarrationPrompt(context);

  // Future: Switch to extended duration when platform constraints are lifted
  // const prompt = buildExtendedDurationPrompt(context, 30);

  // Prepare image for Veo API if available
  const imageInput = context.davidHandoff.productImage ? {
    bytesBase64Encoded: context.davidHandoff.productImage.startsWith('data:')
      ? context.davidHandoff.productImage.split(',')[1] // Remove data:image/png;base64, prefix
      : context.davidHandoff.productImage,
    mimeType: context.davidHandoff.productImage.startsWith('data:image/png')
      ? 'image/png'
      : context.davidHandoff.productImage.startsWith('data:image/jpeg') || context.davidHandoff.productImage.startsWith('data:image/jpg')
        ? 'image/jpeg'
        : 'image/png' // Default fallback
  } : undefined;

  return {
    // For existing /api/generate-video endpoint
    videoGenerationRequest: {
      prompt,
      duration: context.selectedVideoFormat.durationSeconds,
      aspectRatio: context.selectedVideoFormat.aspectRatio,
      style: "commercial",
      ...(imageInput && { image: imageInput }), // Include image if available
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