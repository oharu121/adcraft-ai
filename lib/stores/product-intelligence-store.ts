import { create } from 'zustand';
import { SessionStatus } from '../agents/product-intelligence/enums';
import { ChatMessage, ProductAnalysis } from '../agents/product-intelligence/types';
import { AppPhase } from '../types/app-phases';
import { PhaseManager } from '../utils/phase-manager';


interface ProductIntelligenceStore {
  // Session state
  sessionId: string;
  sessionStatus: SessionStatus;
  isConnected: boolean;
  isAgentTyping: boolean;

  // Phase management
  currentPhase: AppPhase;
  completedPhases: AppPhase[];
  
  // Product input state
  uploadedImage: File | null;
  productName: string;
  productDescription: string;
  inputMode: 'image' | 'text';
  
  // UI flow state
  currentStep: 'upload' | 'analyze' | 'chat' | 'handoff';
  showCommercialChat: boolean;
  showImageModal: boolean;
  showAllFeatures: boolean;
  showProductNameError: boolean;
  
  // Analysis state
  messages: ChatMessage[];
  analysis: ProductAnalysis | null;
  analysisProgress: number;
  analysisStartTime: number;
  elapsedTime: number;
  errorMessage: string;
  analysisError: { type: string; canProceed: boolean } | null;
  
  // Chat state - THIS IS THE CRITICAL ONE FOR YOUR USE CASE!
  chatInputMessage: string;
  
  // Accordion state
  expandedSections: {
    keyMessages: boolean;
    visualStyle: boolean;
    narrativeStructure: boolean;
    keyScenes: boolean;
    musicTone: boolean;
  };
  
  // Actions for session management
  setSessionId: (id: string) => void;
  setSessionStatus: (status: SessionStatus) => void;
  setIsConnected: (connected: boolean) => void;
  setIsAgentTyping: (typing: boolean) => void;

  // Actions for phase management
  setCurrentPhase: (phase: AppPhase) => void;
  completePhase: (phase: AppPhase) => void;
  canAccessPhase: (phase: AppPhase) => boolean;
  transitionToPhase: (phase: AppPhase) => void;
  
  // Actions for product input
  setUploadedImage: (file: File | null) => void;
  setProductName: (name: string) => void;
  setProductDescription: (description: string) => void;
  setInputMode: (mode: 'image' | 'text') => void;
  
  // Actions for UI flow
  setCurrentStep: (step: 'upload' | 'analyze' | 'chat' | 'handoff') => void;
  setShowCommercialChat: (show: boolean) => void;
  setShowImageModal: (show: boolean) => void;
  setShowAllFeatures: (show: boolean) => void;
  setShowProductNameError: (show: boolean) => void;
  
  // Actions for analysis
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setAnalysis: (analysis: ProductAnalysis | null) => void;
  setAnalysisProgress: (progress: number) => void;
  setAnalysisStartTime: (time: number) => void;
  setElapsedTime: (time: number) => void;
  setErrorMessage: (message: string) => void;
  setAnalysisError: (error: { type: string; canProceed: boolean } | null) => void;
  
  // Actions for chat - THE MONEY SHOT! 🎯
  setChatInputMessage: (message: string) => void;
  
  // Actions for accordion
  toggleSection: (section: keyof ProductIntelligenceStore['expandedSections']) => void;
  
  // Complex actions
  resetSession: () => void;
  startAnalysis: () => void;
  completeAnalysis: () => void;
}

export const useProductIntelligenceStore = create<ProductIntelligenceStore>((set, get) => ({
  // Initial state - exactly matching your current useState calls
  sessionId: "",
  sessionStatus: SessionStatus.INITIALIZING,
  isConnected: false,
  isAgentTyping: false,

  // Phase management initial state
  currentPhase: 'product-input' as AppPhase,
  completedPhases: [],

  uploadedImage: null,
  productName: "",
  productDescription: "",
  inputMode: "image",

  currentStep: "upload",
  showCommercialChat: false,
  showImageModal: false,
  showAllFeatures: false,
  showProductNameError: false,

  messages: [],
  analysis: null,
  analysisProgress: 0,
  analysisStartTime: 0,
  elapsedTime: 0,
  errorMessage: "",
  analysisError: null,

  // 🎯 THE CRITICAL CHAT STATE - persists across component unmounts!
  chatInputMessage: "",

  expandedSections: {
    keyMessages: true,
    visualStyle: true,
    narrativeStructure: true,
    keyScenes: true,
    musicTone: true,
  },

  // Simple setters
  setSessionId: (id) => set({ sessionId: id }),
  setSessionStatus: (status) => set({ sessionStatus: status }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setIsAgentTyping: (typing) => set({ isAgentTyping: typing }),

  // Phase management actions
  setCurrentPhase: (phase) => set({ currentPhase: phase }),
  completePhase: (phase) => set((state) => ({
    completedPhases: state.completedPhases.includes(phase)
      ? state.completedPhases
      : [...state.completedPhases, phase]
  })),
  canAccessPhase: (phase) => {
    const state = get();
    return PhaseManager.canAccessPhase(phase, state.currentPhase);
  },
  transitionToPhase: (phase) => {
    const state = get();
    if (PhaseManager.isValidTransition(state.currentPhase, phase)) {
      set({ currentPhase: phase });
      // Auto-complete previous phase
      if (!state.completedPhases.includes(state.currentPhase)) {
        set((state) => ({
          completedPhases: [...state.completedPhases, state.currentPhase]
        }));
      }
    }
  },

  setUploadedImage: (file) => set({ uploadedImage: file }),
  setProductName: (name) => set({ productName: name }),
  setProductDescription: (description) => set({ productDescription: description }),
  setInputMode: (mode) => set({ inputMode: mode }),

  setCurrentStep: (step) => set({ currentStep: step }),
  setShowCommercialChat: (show) => set({ showCommercialChat: show }),
  setShowImageModal: (show) => set({ showImageModal: show }),
  setShowAllFeatures: (show) => set({ showAllFeatures: show }),
  setShowProductNameError: (show) => set({ showProductNameError: show }),

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setAnalysis: (analysis) => set({ analysis }),
  setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
  setAnalysisStartTime: (time) => set({ analysisStartTime: time }),
  setElapsedTime: (time) => set({ elapsedTime: time }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  setAnalysisError: (error) => set({ analysisError: error }),

  // 🚀 THE HERO METHOD - no more lost chat messages!
  setChatInputMessage: (message) => set({ chatInputMessage: message }),

  // Toggle accordion sections
  toggleSection: (section) =>
    set((state) => ({
      expandedSections: {
        ...state.expandedSections,
        [section]: !state.expandedSections[section],
      },
    })),

  // Complex actions that handle multiple state updates
  resetSession: () =>
    set({
      sessionId: "",
      sessionStatus: SessionStatus.INITIALIZING,
      messages: [],
      analysis: null,
      uploadedImage: null,
      productDescription: "",
      productName: "",
      currentStep: "upload",
      isConnected: false,
      isAgentTyping: false,
      analysisProgress: 0,
      analysisStartTime: 0,
      elapsedTime: 0,
      errorMessage: "",
      showCommercialChat: false,
      chatInputMessage: "", // Reset chat input on session reset
      analysisError: null,
      showProductNameError: false,
      showAllFeatures: false,
      // Reset phase management
      currentPhase: 'product-input' as AppPhase,
      completedPhases: [],
      expandedSections: {
        keyMessages: false,
        visualStyle: false,
        narrativeStructure: false,
        keyScenes: false,
        musicTone: false,
      },
    }),

  startAnalysis: () =>
    set({
      sessionStatus: SessionStatus.ANALYZING,
      currentStep: "analyze",
      analysisProgress: 0,
      elapsedTime: 0,
      errorMessage: "",
      analysisStartTime: Date.now(),
    }),

  completeAnalysis: () =>
    set({
      sessionStatus: SessionStatus.ACTIVE,
      currentStep: "chat",
      analysisProgress: 100,
    }),
}));