import { create } from 'zustand';
import { SessionStatus } from '../agents/creative-director/enums';
import { 
  CreativeChatMessage
} from '../agents/creative-director/types/chat-types';
import { 
  VisualAsset, 
  CreativeDirection, 
  StylePalette
} from '../agents/creative-director/types/asset-types';
import {
  AssetType,
  AssetStatus,
  VisualStyle,
  ColorMood,
  CreativePhase
} from '../agents/creative-director/enums';

interface CreativeDirectorStore {
  // Session state
  sessionId: string;
  sessionStatus: SessionStatus;
  isConnected: boolean;
  isAgentTyping: boolean;
  
  // Maya handoff state
  mayaHandoffData: {
    productAnalysis: any | null;
    strategicInsights: any | null;
    visualOpportunities: any | null;
  };
  
  // UI flow state - simplified for 4-phase workflow
  currentPhase: CreativePhase;
  showCreativeChat: boolean;
  showAssetGallery: boolean;
  showStyleSelector: boolean;
  showAssetVariants: boolean;
  
  // Creative direction state - simplified for demo workflow
  messages: CreativeChatMessage[];
  creativeDirection: CreativeDirection | null;

  // Phase 1: Production Style State
  selectedProductionStyle: any | null;

  // Phase 2: Style Selection State
  availableStyleOptions: any[]; // Style options from demo data
  selectedStyleOption: any | null;

  // Simplified visual decisions
  visualDecisions: {
    styleDirection: VisualStyle | null;
    colorMood: ColorMood | null;
    selectedStyle: string | null;
    brandAlignmentScore: number;
  };
  
  // Asset generation state - simplified for demo
  assets: {
    generated: any[]; // Use any[] for demo compatibility with both VisualAsset and DemoAsset
    inProgress: string[]; // Asset IDs currently generating
    failed: string[];     // Asset IDs that failed
    approved: string[];   // Asset IDs approved for production
  };
  assetGenerationProgress: Record<string, {
    progress: number;
    stage: string;
    estimatedCompletion: number;
  }>;
  
  // Creative analysis state
  analysisProgress: number;
  analysisStartTime: number;
  elapsedTime: number;
  errorMessage: string;
  creativeError: { type: string; canProceed: boolean } | null;
  
  // Chat state - CRITICAL for persistence
  chatInputMessage: string;
  
  // Accordion state for creative sections
  expandedSections: {
    visualDirection: boolean;
    colorPalette: boolean;
    assetGeneration: boolean;
    productionReady: boolean;
    handoffPreparation: boolean;
  };
  
  // Cost tracking
  costTracking: {
    current: number;
    total: number;
    remaining: number;
    assetGenerationCosts: number;
  };
  
  // Handoff preparation state
  handoffPreparation: {
    directionFinalized: boolean;
    assetsApproved: boolean;
    productionNotesComplete: boolean;
    readyForAlex: boolean;
    alexHandoffData: any | null;
  };
  
  // Actions for session management
  setSessionId: (id: string) => void;
  setSessionStatus: (status: SessionStatus) => void;
  setIsConnected: (connected: boolean) => void;
  setIsAgentTyping: (typing: boolean) => void;
  
  // Actions for Maya handoff
  setMayaHandoffData: (data: any) => void;
  
  // Actions for UI flow - simplified
  setCurrentPhase: (phase: CreativePhase) => void;
  setShowCreativeChat: (show: boolean) => void;
  setShowAssetGallery: (show: boolean) => void;
  setShowStyleSelector: (show: boolean) => void;
  setShowAssetVariants: (show: boolean) => void;
  
  // Actions for creative direction - simplified
  setMessages: (messages: CreativeChatMessage[]) => void;
  addMessage: (message: CreativeChatMessage) => void;
  setCreativeDirection: (direction: CreativeDirection | null) => void;

  // Phase 1: Production Style Actions
  setSelectedProductionStyle: (style: any) => void;

  // Phase 2: Style Selection Actions
  setAvailableStyleOptions: (options: any[]) => void;
  selectStyleOption: (styleOption: any) => void;

  // Simplified visual decision actions
  updateVisualDecisions: (decisions: Partial<CreativeDirectorStore['visualDecisions']>) => void;
  
  // Actions for assets - simplified for demo
  addAsset: (asset: any) => void; // Use any for demo compatibility
  updateAsset: (assetId: string, updates: Partial<any>) => void;
  setAssetGenerationProgress: (assetId: string, progress: any) => void;
  approveAsset: (assetId: string) => void;
  
  // Actions for analysis
  setAnalysisProgress: (progress: number) => void;
  setAnalysisStartTime: (time: number) => void;
  setElapsedTime: (time: number) => void;
  setErrorMessage: (message: string) => void;
  setCreativeError: (error: { type: string; canProceed: boolean } | null) => void;
  
  // Actions for chat - THE CRITICAL ONE!
  setChatInputMessage: (message: string) => void;
  
  // Actions for accordion
  toggleSection: (section: keyof CreativeDirectorStore['expandedSections']) => void;
  
  // Actions for cost tracking
  updateCostTracking: (costs: Partial<CreativeDirectorStore['costTracking']>) => void;
  
  // Actions for handoff preparation
  updateHandoffPreparation: (updates: Partial<CreativeDirectorStore['handoffPreparation']>) => void;
  
  // Complex actions
  resetSession: () => void;
  startCreativeAnalysis: () => void;
  completeCreativeAnalysis: () => void;
  initializeFromMayaHandoff: (handoffData: any) => void;
  prepareAlexHandoff: () => void;
}

export const useCreativeDirectorStore = create<CreativeDirectorStore>((set, get) => ({
  // Initial state - following Maya's pattern
  sessionId: "",
  sessionStatus: SessionStatus.INITIALIZING,
  isConnected: false,
  isAgentTyping: false,

  mayaHandoffData: {
    productAnalysis: null,
    strategicInsights: null,
    visualOpportunities: null,
  },

  currentPhase: CreativePhase.ANALYSIS,
  showCreativeChat: false,
  showAssetGallery: false,
  showStyleSelector: false,
  showAssetVariants: false,

  messages: [],
  creativeDirection: null,

  // Phase 1: Production Style Initial State
  selectedProductionStyle: null,

  // Phase 2: Style Selection Initial State
  availableStyleOptions: [],
  selectedStyleOption: null,

  // Simplified visual decisions initial state
  visualDecisions: {
    styleDirection: null,
    colorMood: null,
    selectedStyle: null,
    brandAlignmentScore: 0,
  },

  assets: {
    generated: [],
    inProgress: [],
    failed: [],
    approved: [],
  },
  assetGenerationProgress: {},

  analysisProgress: 0,
  analysisStartTime: 0,
  elapsedTime: 0,
  errorMessage: "",
  creativeError: null,

  // CRITICAL CHAT STATE - persists across component unmounts!
  chatInputMessage: "",

  expandedSections: {
    visualDirection: true,
    colorPalette: true,
    assetGeneration: true,
    productionReady: true,
    handoffPreparation: false,
  },

  costTracking: {
    current: 0,
    total: 0,
    remaining: 300, // Default budget
    assetGenerationCosts: 0,
  },

  handoffPreparation: {
    directionFinalized: false,
    assetsApproved: false,
    productionNotesComplete: false,
    readyForAlex: false,
    alexHandoffData: null,
  },

  // Simple setters
  setSessionId: (id) => set({ sessionId: id }),
  setSessionStatus: (status) => set({ sessionStatus: status }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setIsAgentTyping: (typing) => set({ isAgentTyping: typing }),

  setMayaHandoffData: (data) => set({ mayaHandoffData: data }),

  setCurrentPhase: (phase) => set({ currentPhase: phase }),
  setShowCreativeChat: (show) => set({ showCreativeChat: show }),
  setShowAssetGallery: (show) => set({ showAssetGallery: show }),
  setShowStyleSelector: (show) => set({ showStyleSelector: show }),
  setShowAssetVariants: (show) => set({ showAssetVariants: show }),

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setCreativeDirection: (direction) => set({ creativeDirection: direction }),

  // Phase 1: Production Style Actions
  setSelectedProductionStyle: (style) => set({ selectedProductionStyle: style }),

  // Phase 2: Style Selection Actions
  setAvailableStyleOptions: (options) => set({ availableStyleOptions: options }),
  selectStyleOption: (styleOption) => set((state) => ({
    selectedStyleOption: styleOption,
    visualDecisions: {
      ...state.visualDecisions,
      selectedStyle: styleOption?.id || null
    }
  })),

  // Simplified visual decisions actions
  updateVisualDecisions: (decisions) =>
    set((state) => ({
      visualDecisions: { ...state.visualDecisions, ...decisions }
    })),

  addAsset: (asset) =>
    set((state) => ({
      assets: {
        ...state.assets,
        generated: [...state.assets.generated, asset],
      },
    })),
  
  updateAsset: (assetId, updates) =>
    set((state) => ({
      assets: {
        ...state.assets,
        generated: state.assets.generated.map((asset) =>
          asset.id === assetId ? { ...asset, ...updates } : asset
        ),
      },
    })),

  setAssetGenerationProgress: (assetId, progress) =>
    set((state) => ({
      assetGenerationProgress: {
        ...state.assetGenerationProgress,
        [assetId]: progress,
      },
    })),

  approveAsset: (assetId) =>
    set((state) => ({
      assets: {
        ...state.assets,
        approved: [...state.assets.approved, assetId],
      },
    })),

  setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
  setAnalysisStartTime: (time) => set({ analysisStartTime: time }),
  setElapsedTime: (time) => set({ elapsedTime: time }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  setCreativeError: (error) => set({ creativeError: error }),

  // THE HERO METHOD - no more lost chat messages!
  setChatInputMessage: (message) => set({ chatInputMessage: message }),

  // Toggle accordion sections
  toggleSection: (section) =>
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [section]: !state.expandedSections[section],
      },
    })),

  updateCostTracking: (costs) =>
    set((state) => ({
      costTracking: { ...state.costTracking, ...costs },
    })),

  updateHandoffPreparation: (updates) =>
    set((state) => ({
      handoffPreparation: { ...state.handoffPreparation, ...updates },
    })),

  // Complex actions that handle multiple state updates
  resetSession: () =>
    set({
      sessionId: "",
      sessionStatus: SessionStatus.INITIALIZING,
      messages: [],
      creativeDirection: null,
      assets: {
        generated: [],
        inProgress: [],
        failed: [],
        approved: [],
      },
      currentPhase: CreativePhase.ANALYSIS,
      isConnected: false,
      isAgentTyping: false,
      analysisProgress: 0,
      analysisStartTime: 0,
      elapsedTime: 0,
      errorMessage: "",
      showCreativeChat: false,
      chatInputMessage: "", // Reset chat input on session reset
      creativeError: null,
      assetGenerationProgress: {},
      visualDecisions: {
        styleDirection: null,
        colorMood: null,
        selectedStyle: null,
        brandAlignmentScore: 0,
      },
      expandedSections: {
        visualDirection: false,
        colorPalette: false,
        assetGeneration: false,
        productionReady: false,
        handoffPreparation: false,
      },
      handoffPreparation: {
        directionFinalized: false,
        assetsApproved: false,
        productionNotesComplete: false,
        readyForAlex: false,
        alexHandoffData: null,
      },
    }),

  startCreativeAnalysis: () =>
    set({
      sessionStatus: SessionStatus.ANALYZING,
      currentPhase: CreativePhase.ANALYSIS,
      analysisProgress: 0,
      elapsedTime: 0,
      errorMessage: "",
      analysisStartTime: Date.now(),
    }),

  completeCreativeAnalysis: () =>
    set({
      sessionStatus: SessionStatus.READY,
      currentPhase: CreativePhase.CREATIVE_DEVELOPMENT,
      analysisProgress: 100,
    }),

  initializeFromMayaHandoff: (handoffData) =>
    set({
      sessionId: handoffData.sessionId, // Set the sessionId from handoff data
      mayaHandoffData: handoffData,
      sessionStatus: SessionStatus.READY,
      currentPhase: CreativePhase.ANALYSIS,
      isConnected: true,
    }),

  prepareAlexHandoff: () => {
    const state = get();
    const alexHandoffData = {
      creativeDirection: state.creativeDirection,
      visualAssets: state.assets.approved.map(id => 
        state.assets.generated.find(asset => asset.id === id)
      ).filter(Boolean),
      productionNotes: state.creativeDirection?.alexHandoffData?.productionNotes || [],
      technicalSpecs: state.creativeDirection?.productionGuidelines?.technicalRequirements || [],
    };
    
    set((state) => ({
      handoffPreparation: {
        ...state.handoffPreparation,
        alexHandoffData,
        readyForAlex: true,
      },
    }));
  },
}));