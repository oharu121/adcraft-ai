● You're absolutely right! Zara should have the same level of interactive workflow as Maya and David. The product.md
documentation is correct - we just haven't built Zara's interactive workflow yet.

Looking at the current state:

- ✅ Maya: Full interactive workflow with chat, strategy refinement, and handoff
- ✅ David: Full 3-step interactive workflow with handoff to Zara
- ❌ Zara: Only has handoff infrastructure, missing the interactive workflow

Zara's Missing Interactive Workflow Components:

1. Zara's Interactive UI Component (like CreativeDirectorCard.tsx)

- Multi-step workflow for video production decisions
- Narrative style selection (dramatic vs energetic pacing)
- Music & tone selection interface
- Production timeline and specifications
- Real-time chat integration

2. Zara's Chat System Integration

- Interactive conversations about production decisions
- Real-time production updates and user feedback
- Contextual quick actions for video production

3. Actual Video Generation Pipeline

- Veo API integration for final video production
- Scene sequencing based on David's creative direction
- Audio coordination and music integration
- Multi-format optimization (16:9, 1:1, 9:16)

4. Zara's Workflow Steps (following the pattern):

- Step 1: Narrative Style Selection (pacing, tone, narration style)
- Step 2: Music & Audio Selection (genre, mood, audio mixing)
- Step 3: Final Production & Review (video generation, optimization, delivery)

So the product.md is correctly aspirational - it describes the complete system we're building. Zara just needs his  
 full interactive workflow implementation to match Maya and David's level of sophistication.

The handoff system we built is the foundation - now we need to build Zara's interactive workflow on top of it.


  Perfect! Looking at the notes, I can see that video format optimization is specifically mentioned as one of Zara's    
  responsibilities:

  formatOptimization: "instagram" | "youtube" | "linkedin" | "tiktok";

  And in the agent specialties:
  videoLength: "15s-teaser" | "30s-standard" | "60s-detailed";
  formatOptimization: "instagram" | "youtube" | "linkedin" | "tiktok";

  This confirms that video format selection is indeed part of Zara's domain. Looking at the current workflow, I think   
  the best approach would be to add this as a new step between Music & Tone and Final Production. This way we have:     

  1. Narrative Style (storytelling approach)
  2. Music & Tone (audio/mood) 
  3. Video Format (platform optimization & technical specs) ← NEW
  4. Final Production (review and produce)

  This makes sense because:
  - It follows the logical flow from creative decisions to technical specifications
  - It aligns with the notes that show format optimization as a key Zara responsibility
  - It keeps each step focused on one type of decision
  - It matches the pattern established by David's workflow

  For the format options, based on Veo 3 constraints (landscape/portrait) and the notes mentioning platform-specific    
  optimization, I should propose:

  Landscape (16:9):
  - YouTube, LinkedIn, desktop websites
  - Professional, traditional commercial feel

  Portrait (9:16):
  - TikTok, Instagram Stories, mobile-first
  - Modern, social media optimized

  Square (1:1) (if Veo supports it):
  - Instagram posts, Facebook, general social media
  - Versatile for multiple platforms

  I should implement this as a new step in the VideoProducerWorkflowStep enum and update the VideoProducerCard to       
  handle the 4-step flow.

    📐 Veo 3 Supported Video Formats (Confirmed)

  Aspect Ratios Available:

  1. 16:9 (Landscape) - Default
    - Resolutions: 720p (default) or 1080p
    - Best for: YouTube, LinkedIn, websites, desktop viewing
  2. 9:16 (Portrait) - Mobile-focused
    - Resolution: 720p only
    - Best for: TikTok, Instagram Stories, mobile-first content

  Video Specifications:

  - Duration: 8 seconds (fixed)
  - Frame Rate: 24 FPS (fixed)
  - Audio: Native audio generation included

  🎯 Recommended Implementation

  Based on this, I suggest adding a Video Format Selection step with these options:

  interface VideoFormat {
    id: string;
    name: string;
    aspectRatio: "16:9" | "9:16";
    resolution: "720p" | "1080p";
    bestFor: string;
    platforms: string[];
  }

  Format Options:
  1. Professional Landscape (16:9, 1080p)
    - Best for: Business presentations, YouTube, professional websites
    - Platforms: YouTube, LinkedIn, company websites
  2. Standard Landscape (16:9, 720p)
    - Best for: General web use, faster processing
    - Platforms: Most websites, email marketing
  3. Mobile Portrait (9:16, 720p)
    - Best for: Social media stories, mobile-first campaigns
    - Platforms: TikTok, Instagram Stories, Snapchat

● 🎬 ZARA'S UNIQUE CONSIDERATIONS

  1. Video Production Complexity:

  - Unlike David's asset generation, video production is computationally expensive
  - Need realistic progress tracking (5-8 minutes for 8-second video)
  - Production failures require graceful handling and retry mechanisms

  2. Platform Optimization:

  - Video format selection affects final video generation parameters
  - Each format (YouTube landscape vs TikTok portrait) needs different Veo API calls
  - Music and narrative must align with platform expectations

  3. Cost Management:

  - Video generation is the most expensive operation (~$2.50 per video)
  - Need clear cost warnings before production
  - Budget tracking integration with overall session costs

 🔄 ZARA (VIDEO PRODUCER) PROMPT DATA FLOW (Corrected)

  Pre-Video Producer: Handoff from David ✓

  Input: Complete creative direction package from David
  - Product image + analysis (from Maya)
  - Production style + creative direction (from David)
  - Scene architecture with generated assets (from David)

  Step 1: Narrative Style (Dynamic, needs prompt)

  ├─ Input: user choice on narrative style (NO chat feedback)
  ├─ Prompt: David's handoff + product context + user's narrative selection
  └─ Stored: selectedNarrativeStyle object

  Step 2: Music & Tone (Dynamic, needs accumulated context)

  ├─ Input: user choice on music genre (NO chat feedback)
  ├─ Prompt: David's handoff + narrative style + user's music selection
  └─ Stored: selectedMusicGenre object

  Step 3: Video Format (Fixed options, NO prompt needed)

  ├─ Input: user choice on video format (aspect ratio/platform)
  ├─ Prompt: N/A (fixed options)
  └─ Stored: selectedVideoFormat object

  Step 4: Final Production (Complex, needs full context including product image)

  ├─ Input: user confirmation to start production
  ├─ Prompt: Product image + Maya analysis + David's handoff + all Zara's selections
  └─ Stored: finalVideoUrl + production metadata

  📊 CORRECTED DATA STRUCTURE

  Step 4: Final Production Prompt Context (Complete)

  // Full Production Context (Most Important)
  {
    // Original product data
    productImage: string, // ✅ ADDED - Essential for video generation
    mayaAnalysis: {      // ✅ ADDED - Product context for video narrative
      productAnalysis: object,
      strategicInsights: object,
      visualOpportunities: object
    },

    // David's creative direction
    davidHandoff: {
      productionStyle: selectedProductionStyle,
      creativeDirection: selectedStyleOption,
      sceneArchitecture: assets.generated
    },

    // Zara's selections
    narrativeStyle: selectedNarrativeStyle,
    musicGenre: selectedMusicGenre,
    videoFormat: selectedVideoFormat,

    // Production request
    action: "start-production",
    locale: "en" | "ja"
  }

  Updated API Flow

  // Step 1: Narrative Style (AI validates choice)
  POST /api/agents/video-producer
  {
    action: "select-narrative-style",
    sessionId: string,
    data: { narrativeStyleId: string },
    context: {
      davidHandoff: davidHandoffData
    }
  }

  // Step 2: Music & Tone (AI validates choice)
  POST /api/agents/video-producer
  {
    action: "select-music-genre",
    sessionId: string,
    data: { musicGenreId: string },
    context: {
      davidHandoff: davidHandoffData,
      selectedNarrativeStyle: object
    }
  }

  // Step 3: Video Format (Pure UI selection - no API call needed)
  // Just store in Zustand: setSelectedVideoFormat(format)

  // Step 4: Final Production (Full context)
  POST /api/agents/video-producer
  {
    action: "start-production",
    sessionId: string,
    locale: string,
    data: {
      productImage: string,           // ✅ ADDED
      mayaAnalysis: object,          // ✅ ADDED
      davidHandoff: object,
      selectedNarrativeStyle: object,
      selectedMusicGenre: object,
      selectedVideoFormat: object
    }
  }

  🎯 REVISED KEY PRINCIPLES

  1. Simplified Flow:

  - Step 1-2: User selection → AI validation/confirmation (no chat)
  - Step 3: Pure UI selection (no API call)
  - Step 4: Full video production with complete context

  2. Context Accumulation:

  // Step 1: Basic validation
  context = { davidHandoff }

  // Step 2: Accumulated context
  context = { davidHandoff, narrativeStyle }

  // Step 3: No API call (just UI state)

  // Step 4: FULL context for production
  context = {
    productImage,     // ✅ For visual reference
    mayaAnalysis,     // ✅ For product understanding
    davidHandoff,     // Creative direction
    allZaraSelections // User's video preferences
  }

  3. Production Prompt Structure:

  // What Zara's AI will receive for video generation:
  {
    productImage: "base64_image_data",

    productContext: {
      name: "Product name",
      category: "Product category",
      targetAudience: "Description",
      keyMessages: ["message1", "message2"]
    },

    creativeDirection: {
      visualStyle: "Premium Minimalism",
      colorPalette: ["#color1", "#color2"],
      mood: "sophisticated"
    },

    videoRequirements: {
      narrativeStyle: "Hero's Journey",
      musicGenre: "Upbeat & Energetic",
      format: "16:9 landscape 1080p",
      duration: 8,
      platforms: ["YouTube", "LinkedIn"]
    },

    sceneArchitecture: [
      { description: "Hero product shot...", composition: "..." },
      { description: "Lifestyle context...", composition: "..." }
    ]
  }

  ⚡ IMPLEMENTATION BENEFITS

  Streamlined UX:

  - ✅ Steps 1-2: Quick selection → AI confirmation (no lengthy chat)
  - ✅ Step 3: Instant UI selection (no waiting)
  - ✅ Step 4: Full production with complete context

  Cost Efficiency:

  - ✅ Reduced API calls (Step 3 has no API call)
  - ✅ Focused prompts (Steps 1-2 are validation only)
  - ✅ Single expensive call (Step 4 production)

  Better Production Quality:

  - ✅ Product image ensures visual consistency
  - ✅ Maya analysis provides product context for narrative
  - ✅ Complete creative direction from David
  - ✅ All user preferences for personalization

  ✅ Existing Infrastructure:
  - Complete Veo API integration (VeoService)
  - Cost tracking & budget management (CostTracker)
  - Job tracking & status monitoring (JobTracker)
  - Firestore session management
  - Video storage & serving via proxy endpoint
  - Rate limiting & validation

  Recommended Approach: Reuse & Refine

  Instead of building from scratch, let's adapt your existing system for Zara's flow:

  What We Can Reuse Directly:

  1. /api/generate-video - Core video generation endpoint
  2. /api/video/[fileId] - Video serving infrastructure
  3. VeoService, CostTracker, JobTracker - All the heavy lifting
  4. Firestore schema - Session and job management
  5. Budget monitoring & rate limiting

  What We Need to Build for Zara:

  1. Prompt Construction Logic - Convert David's handoff + Zara's selections into optimal Veo prompts
  2. Context Accumulation - Steps 1-2 validation, Step 4 full context assembly
  3. Extended API Actions - Add Zara-specific endpoints to existing /api/agents/video-producer
  4. Integration Bridge - Connect Zara's Step 4 to your existing /api/generate-video

  Refined Implementation Plan:

  Step 1-2: Zara validates user selections with AI
  Step 3: Pure UI (no API needed)Step 4: Zara builds comprehensive prompt → calls existing /api/generate-video    
   → reuses entire pipeline

  This approach:
  - ✅ Leverages proven infrastructure
  - ✅ Avoids duplication
  - ✅ Maintains cost/budget controls
  - ✅ Faster implementation

● The remaining blob URL usages are either:
  1. In ImageUploadArea.tsx - creating preview URLs for uploaded files (different use case)
  2. In VideoDisplay.tsx - for file downloads (temporary usage)

  These are appropriate uses since they create URLs for different purposes and have proper cleanup.

● Fixed the blob URL recreation issue! The problem was that both ProductAnalysisCard.tsx and ImageModal.tsx
  were calling URL.createObjectURL(uploadedImage) directly in their render functions, creating new blob URLs
  on every re-render.

  Changes made:

  1. ProductAnalysisCard.tsx:118-122 - Added memoization and cleanup
  2. ImageModal.tsx:18-33 - Added memoization and cleanup
  3. ImageModal.tsx:60 - Changed from direct URL.createObjectURL() to memoized imageUrl

  How it works now:
  - useMemo creates blob URL only when uploadedImage changes, not on every render
  - useEffect cleanup revokes blob URLs to prevent memory leaks
  - Same product image will now use the same blob URL across re-renders

  The blob URLs in ImageUploadArea.tsx and VideoDisplay.tsx are appropriate since they serve different
  purposes (file previews and downloads) with proper cleanup patterns.

● The blob URL recreation issue has been completely resolved. Now when you upload a product image and interact
   with Maya's chat, you should see:

  1. Only one blob URL request per product image upload
  2. Same blob URL reused across component re-renders
  3. Proper cleanup when switching images or unmounting components

  The fix prevents multiple blob:http://localhost:3000/[different-ids] requests for the same product image
  that you were seeing in Chrome dev console.
  