/**
 * Creative Director Demo Data
 *
 * Comprehensive demo data for testing David's 4-phase workflow:
 * Phase 1: Auto Creative Analysis
 * Phase 2: Style Direction Selection
 * Phase 3: Scene Planning & Storytelling
 * Phase 4: Asset Generation & Refinement
 */

import {
  AssetType,
  AssetStatus,
  VisualStyle,
  ColorMood,
  CreativePhase
} from '../enums';
import type {
  VisualAsset,
  CreativeDirection,
  StylePalette
} from '../types/asset-types';

// Phase 1: Auto Creative Analysis (generated from Maya handoff)
export const demoCreativeAnalysis = {
  brandPersonality: [
    "Premium & Sophisticated",
    "Tech-Forward Innovation",
    "Minimalist Elegance",
    "Professional Trustworthy"
  ],
  visualOpportunities: [
    "Product hero shots with premium lighting",
    "Lifestyle scenes showcasing modern professionals",
    "Clean technical detail shots",
    "Brand story through environmental context"
  ],
  targetMood: [
    "Aspirational & Inspiring",
    "Clean & Professional",
    "Innovative & Forward-thinking",
    "Trustworthy & Reliable"
  ],
  competitorInsights: [
    "Market lacks premium positioning in this category",
    "Opportunity for cleaner, more sophisticated visual approach",
    "Gap in lifestyle integration messaging"
  ]
};

// Phase 2: Style Direction Options (AI-generated alternatives)
export const demoStyleOptions = [
  {
    id: "premium-minimalism",
    name: "Premium Minimalism",
    description: "Clean, sophisticated, Apple-inspired aesthetic with focus on negative space and premium materials",
    colorPalette: ["#1a1a1a", "#f8f8f8", "#007AFF", "#34C759"],
    moodBoard: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=200&fit=crop",
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop",
      "https://images.unsplash.com/photo-1560472355-a9a6ea6a2e64?w=300&h=200&fit=crop"
    ],
    visualKeywords: ["Clean lines", "Negative space", "Premium materials", "Subtle shadows"],
    animationStyle: "Subtle Motion" as const,
    examples: [
      "Smooth product rotations",
      "Gentle parallax scrolling",
      "Fade-in text animations"
    ]
  },
  {
    id: "tech-dynamic",
    name: "Tech Dynamic",
    description: "Bold, energetic approach with vibrant colors and dynamic compositions for innovation-focused brands",
    colorPalette: ["#FF3B30", "#007AFF", "#5856D6", "#FF9500"],
    moodBoard: [
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop",
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=200&fit=crop",
      "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=300&h=200&fit=crop"
    ],
    visualKeywords: ["Bold contrasts", "Dynamic angles", "Energy & motion", "Tech-inspired"],
    animationStyle: "Dynamic" as const,
    examples: [
      "Kinetic typography",
      "Geometric transitions",
      "Bold slide animations"
    ]
  },
  {
    id: "luxury-editorial",
    name: "Luxury Editorial",
    description: "High-end magazine aesthetic with rich textures, dramatic lighting, and sophisticated compositions",
    colorPalette: ["#000000", "#B8860B", "#F5F5DC", "#8B4513"],
    moodBoard: [
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=300&h=200&fit=crop",
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=200&fit=crop",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=200&fit=crop"
    ],
    visualKeywords: ["Dramatic lighting", "Rich textures", "Editorial quality", "Luxury positioning"],
    animationStyle: "Static" as const,
    examples: [
      "Classic product photography",
      "Editorial-style layouts",
      "Timeless compositions"
    ]
  },
  {
    id: "lifestyle-authentic",
    name: "Lifestyle Authentic",
    description: "Warm, approachable style focusing on real-life contexts and human connections",
    colorPalette: ["#8B7355", "#F4A460", "#DEB887", "#A0522D"],
    moodBoard: [
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop",
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=300&h=200&fit=crop",
      "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=300&h=200&fit=crop"
    ],
    visualKeywords: ["Natural lighting", "Authentic moments", "Warm tones", "Human-centered"],
    animationStyle: "Subtle Motion" as const,
    examples: [
      "Natural camera movements",
      "Organic transitions",
      "Lifestyle storytelling"
    ]
  }
];

// Phase 3: Scene Planning Templates (generated from selected style)
export const demoScenePlans = {
  "premium-minimalism": {
    scenes: [
      {
        id: "hero-shot",
        type: "Hero Shot" as const,
        description: "Clean product presentation on premium surface with dramatic directional lighting",
        composition: "Rule of thirds with negative space emphasis",
        shotType: "Medium close-up with slight angle",
        lighting: "Soft directional light with subtle rim lighting",
        props: ["Premium marble surface", "Minimal geometric shapes", "Subtle shadow play"]
      },
      {
        id: "lifestyle-context",
        type: "Lifestyle" as const,
        description: "Product integrated into modern professional environment",
        composition: "Environmental context with product as focal point",
        shotType: "Wide contextual shot transitioning to medium",
        lighting: "Natural window light mixed with ambient",
        props: ["Modern office space", "Clean desk setup", "Professional accessories"]
      },
      {
        id: "detail-focus",
        type: "Detail" as const,
        description: "Macro detail showcasing premium materials and craftsmanship",
        composition: "Tight framing with shallow depth of field",
        shotType: "Macro close-up with selective focus",
        lighting: "Precise accent lighting highlighting texture",
        props: ["Neutral background", "Complementary textures", "Premium material highlights"]
      }
    ],
    visualNarrative: "Journey from premium presentation → real-world integration → intimate craftsmanship details",
    transitionStyle: "Smooth fades with minimal motion graphics"
  }
};

// Simplified demo asset structure for easier demo usage
export interface DemoAsset {
  id: string;
  type: AssetType;
  name: string;
  status: AssetStatus;
  url?: string; // For demo convenience
  userApproved?: boolean; // For demo UI
  metadata?: {
    preview?: string;
    dimensions?: string;
    format?: string;
    fileSize?: string;
    generationPrompt?: string;
    aiModel?: string;
    variations?: string[];
  };
  createdAt: number;
  createdBy: string;
  tags: string[];
}

// Phase 4: Demo Generated Assets
export const demoGeneratedAssets: DemoAsset[] = [
  // Background Assets
  {
    id: "bg-001",
    type: AssetType.BACKGROUND,
    name: "Premium Marble Background",
    status: AssetStatus.READY,
    url: "https://images.unsplash.com/photo-1615975505099-999b9c7ddad5?w=800&h=600&fit=crop",
    metadata: {
      preview: "https://images.unsplash.com/photo-1615975505099-999b9c7ddad5?w=300&h=200&fit=crop",
      dimensions: "1920x1080",
      format: "JPEG",
      fileSize: "2.1MB",
      generationPrompt: "Premium white marble background with subtle veining and soft directional lighting",
      aiModel: "imagen-3.0",
      variations: [
        "https://images.unsplash.com/photo-1615975505099-999b9c7ddad5?w=300&h=200&fit=crop",
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=300&h=200&fit=crop",
        "https://images.unsplash.com/photo-1604076947832-16e6b20b4b5d?w=300&h=200&fit=crop"
      ]
    },
    createdAt: Date.now() - 300000,
    createdBy: "creative-director",
    tags: ["background", "marble", "premium", "minimal"],
    userApproved: false
  },

  // Product Hero Shots
  {
    id: "hero-001",
    type: AssetType.PRODUCT_HERO,
    name: "Main Product Hero Shot",
    status: AssetStatus.READY,
    url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
    metadata: {
      preview: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop",
      dimensions: "1920x1080",
      format: "JPEG",
      fileSize: "1.8MB",
      generationPrompt: "Premium product shot with dramatic lighting and minimal composition",
      aiModel: "imagen-3.0",
      variations: [
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop",
        "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=300&h=200&fit=crop",
        "https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=300&h=200&fit=crop"
      ]
    },
    createdAt: Date.now() - 240000,
    createdBy: "creative-director",
    tags: ["hero", "product", "premium", "lighting"],
    userApproved: false
  },

  // Lifestyle Scenes
  {
    id: "lifestyle-001",
    type: AssetType.LIFESTYLE_SCENE,
    name: "Professional Office Context",
    status: AssetStatus.READY,
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
    metadata: {
      preview: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop",
      dimensions: "1920x1080",
      format: "JPEG",
      fileSize: "2.3MB",
      generationPrompt: "Modern professional office setting with product integration",
      aiModel: "imagen-3.0",
      variations: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop",
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=300&h=200&fit=crop",
        "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=300&h=200&fit=crop"
      ]
    },
    createdAt: Date.now() - 180000,
    createdBy: "creative-director",
    tags: ["lifestyle", "office", "professional", "context"],
    userApproved: true
  },

  // Color Palettes
  {
    id: "palette-001",
    type: AssetType.COLOR_PALETTE,
    name: "Premium Minimalism Palette",
    status: AssetStatus.READY,
    url: "/demo-assets/color-palette-premium.svg",
    metadata: {
      preview: "/demo-assets/color-palette-premium-thumb.png",
      dimensions: "800x400",
      format: "SVG",
      fileSize: "12KB",
      generationPrompt: "Premium color palette with sophisticated neutral tones",
      aiModel: "creative-director-internal",
      variations: [
        "/demo-assets/palette-variant-1.png",
        "/demo-assets/palette-variant-2.png",
        "/demo-assets/palette-variant-3.png"
      ]
    },
    createdAt: Date.now() - 120000,
    createdBy: "creative-director",
    tags: ["color", "palette", "premium", "minimal"],
    userApproved: true
  },

  // Mood Boards
  {
    id: "mood-001",
    type: AssetType.MOOD_BOARD,
    name: "Premium Minimalism Mood Board",
    status: AssetStatus.READY,
    url: "/demo-assets/mood-board-premium.jpg",
    metadata: {
      preview: "/demo-assets/mood-board-premium-thumb.jpg",
      dimensions: "1200x800",
      format: "JPEG",
      fileSize: "1.5MB",
      generationPrompt: "Curated mood board showcasing premium minimalism aesthetic",
      aiModel: "creative-director-internal",
      variations: [
        "/demo-assets/mood-variant-1.jpg",
        "/demo-assets/mood-variant-2.jpg",
        "/demo-assets/mood-variant-3.jpg"
      ]
    },
    createdAt: Date.now() - 360000,
    createdBy: "creative-director",
    tags: ["mood", "inspiration", "premium", "curated"],
    userApproved: true
  }
];

// Simplified demo creative direction for easier demo usage
export const demoCreativeDirection = {
  id: "creative-direction-demo",
  sessionId: "demo-session",
  createdAt: Date.now() - 600000,

  brandAnalysis: {
    brandPersonality: demoCreativeAnalysis.brandPersonality,
    targetMood: demoCreativeAnalysis.targetMood,
    visualOpportunities: demoCreativeAnalysis.visualOpportunities,
    competitorInsights: demoCreativeAnalysis.competitorInsights
  },

  styleDirection: {
    selectedStyle: "premium-minimalism",
    styleRationale: "Premium minimalism aligns perfectly with the brand's sophisticated positioning and target audience expectations. The clean aesthetic will emphasize product quality while maintaining visual hierarchy.",
    colorMood: ColorMood.SOPHISTICATED,
    visualKeywords: ["Premium", "Clean", "Sophisticated", "Minimal"]
  },

  sceneComposition: {
    primaryScenes: demoScenePlans["premium-minimalism"].scenes,
    visualNarrative: demoScenePlans["premium-minimalism"].visualNarrative,
    transitionStyle: demoScenePlans["premium-minimalism"].transitionStyle,
    totalDuration: 30
  },

  // Simplified for demo
  assetRequirements: {
    primary: [],
    secondary: [],
    optional: []
  },

  productionGuidelines: {
    aspectRatio: "16:9",
    resolution: "1920x1080",
    frameRate: 30,
    duration: 30,
    audioStyle: "Minimal ambient with subtle brand sound",
    technicalRequirements: []
  },

  alexHandoffData: {
    narrativeFlow: [
      "Focus on premium quality messaging",
      "Maintain sophisticated tone throughout",
      "Emphasize product integration in professional contexts"
    ],
    sceneBreakdown: [],
    assetMapping: [],
    productionNotes: [
      "Premium quality and craftsmanship",
      "Professional reliability",
      "Sophisticated design choice"
    ],
    timingGuidelines: []
  }
};

// Demo Chat Messages for realistic conversation flow
export const demoChatMessages = [
  {
    id: "msg-001",
    type: "agent" as const,
    content: "Hi! I'm David, your Creative Director. I've received Maya's excellent product analysis. Let me start by analyzing the visual opportunities for your product. One moment while I process the creative direction...",
    timestamp: Date.now() - 900000,
    sessionId: "demo-session",
    locale: "en" as const
  },
  {
    id: "msg-002",
    type: "agent" as const,
    content: "Perfect! Based on Maya's analysis, I see strong opportunities for premium positioning. I've prepared 4 distinct visual style directions for you to choose from. Each style will shape how we tell your product's story visually. Would you like to review the style options?",
    timestamp: Date.now() - 840000,
    sessionId: "demo-session",
    locale: "en" as const,
    quickActions: [
      "Show me the style options",
      "I prefer minimalist approaches",
      "What about dynamic tech styles?",
      "How do you choose the right style?"
    ]
  }
];

// Export everything for easy import
export const davidDemoData = {
  creativeAnalysis: demoCreativeAnalysis,
  styleOptions: demoStyleOptions,
  scenePlans: demoScenePlans,
  generatedAssets: demoGeneratedAssets,
  creativeDirection: demoCreativeDirection,
  chatMessages: demoChatMessages
};