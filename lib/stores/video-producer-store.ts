/**
 * Zara - Video Producer Agent Zustand Store
 *
 * State management for Zara's interactive video production workflow
 */

import { create } from 'zustand';
import type { Locale } from '@/lib/dictionaries';

// Video Producer workflow steps
export enum VideoProducerWorkflowStep {
  NARRATIVE_STYLE = "narrative-style",
  MUSIC_TONE = "music-tone",
  FINAL_PRODUCTION = "final-production"
}

// Narrative style interface
export interface NarrativeStyle {
  id: string;
  name: string;
  description: string;
  pacing: string;
  tone: string;
  narrationStyle: string;
  examples: string[];
  bestFor: string;
}

// Music genre interface
export interface MusicGenre {
  id: string;
  name: string;
  description: string;
  mood: string;
  energy: string;
  instruments: string[];
  bestFor: string;
}

// Video production specs interface
export interface VideoProductionSpecs {
  resolution: string;
  frameRate: number;
  aspectRatio: string;
  duration: number;
  format: string;
  estimatedTime: number;
}

// Creative direction handoff data interface
export interface CreativeDirectorHandoffData {
  creativeDirectorSessionId: string;
  creativeDirection: any; // From David's handoff
  productAnalysis: any; // From Maya's analysis
  handoffTimestamp: number;
}

// Video Producer store state interface
interface VideoProducerStore {
  // Session management
  sessionId: string | null;
  isInitialized: boolean;
  locale: Locale;

  // Handoff data from Creative Director
  creativeDirectorHandoffData: CreativeDirectorHandoffData | null;

  // Workflow state
  currentStep: VideoProducerWorkflowStep;
  completedSteps: {
    narrativeStyle: boolean;
    musicTone: boolean;
    finalProduction: boolean;
  };

  // User selections
  selectedNarrativeStyle: NarrativeStyle | null;
  selectedMusicGenre: MusicGenre | null;
  productionSpecs: VideoProductionSpecs | null;

  // Available options (from API or demo data)
  availableNarrativeStyles: NarrativeStyle[];
  availableMusicGenres: MusicGenre[];

  // Production state
  isProducing: boolean;
  productionProgress: number;
  finalVideoUrl: string | null;

  // Chat and interaction
  messages: any[];
  isAgentTyping: boolean;
  chatInputMessage: string;

  // Actions
  initializeFromCreativeDirectorHandoff: (data: {
    sessionId: string;
    creativeDirectorHandoffData: CreativeDirectorHandoffData;
    locale: Locale;
  }) => void;

  setCurrentStep: (step: VideoProducerWorkflowStep) => void;
  markStepCompleted: (step: keyof VideoProducerStore['completedSteps']) => void;

  setSelectedNarrativeStyle: (style: NarrativeStyle) => void;
  setSelectedMusicGenre: (genre: MusicGenre) => void;
  setProductionSpecs: (specs: VideoProductionSpecs) => void;

  setAvailableNarrativeStyles: (styles: NarrativeStyle[]) => void;
  setAvailableMusicGenres: (genres: MusicGenre[]) => void;

  startVideoProduction: () => void;
  updateProductionProgress: (progress: number) => void;
  setFinalVideoUrl: (url: string) => void;

  // Chat actions
  addMessage: (message: any) => void;
  setIsAgentTyping: (typing: boolean) => void;
  setChatInputMessage: (message: string) => void;

  // Reset
  reset: () => void;
}

// Initial state
const initialState = {
  sessionId: null,
  isInitialized: false,
  locale: 'en' as Locale,

  creativeDirectorHandoffData: null,

  currentStep: VideoProducerWorkflowStep.NARRATIVE_STYLE,
  completedSteps: {
    narrativeStyle: false,
    musicTone: false,
    finalProduction: false,
  },

  selectedNarrativeStyle: null,
  selectedMusicGenre: null,
  productionSpecs: null,

  availableNarrativeStyles: [],
  availableMusicGenres: [],

  isProducing: false,
  productionProgress: 0,
  finalVideoUrl: null,

  messages: [],
  isAgentTyping: false,
  chatInputMessage: '',
};

// Create Zustand store
export const useVideoProducerStore = create<VideoProducerStore>((set, get) => ({
  ...initialState,

  // Initialize from Creative Director handoff
  initializeFromCreativeDirectorHandoff: (data) => {
    set({
      sessionId: data.sessionId,
      creativeDirectorHandoffData: data.creativeDirectorHandoffData,
      locale: data.locale,
      isInitialized: true,
      currentStep: VideoProducerWorkflowStep.NARRATIVE_STYLE,
      completedSteps: {
        narrativeStyle: false,
        musicTone: false,
        finalProduction: false,
      },
      // Reset selections for new session
      selectedNarrativeStyle: null,
      selectedMusicGenre: null,
      productionSpecs: null,
      isProducing: false,
      productionProgress: 0,
      finalVideoUrl: null,
      messages: [],
    });
  },

  // Workflow management
  setCurrentStep: (step) => {
    set({ currentStep: step });
  },

  markStepCompleted: (step) => {
    set((state) => ({
      completedSteps: {
        ...state.completedSteps,
        [step]: true,
      },
    }));
  },

  // Selection management
  setSelectedNarrativeStyle: (style) => {
    set({ selectedNarrativeStyle: style });
    get().markStepCompleted('narrativeStyle');
  },

  setSelectedMusicGenre: (genre) => {
    set({ selectedMusicGenre: genre });
    get().markStepCompleted('musicTone');
  },

  setProductionSpecs: (specs) => {
    set({ productionSpecs: specs });
  },

  // Available options management
  setAvailableNarrativeStyles: (styles) => {
    set({ availableNarrativeStyles: styles });
  },

  setAvailableMusicGenres: (genres) => {
    set({ availableMusicGenres: genres });
  },

  // Video production management
  startVideoProduction: () => {
    set({
      isProducing: true,
      productionProgress: 0,
      finalVideoUrl: null
    });
    get().markStepCompleted('finalProduction');
  },

  updateProductionProgress: (progress) => {
    set({ productionProgress: progress });
  },

  setFinalVideoUrl: (url) => {
    set({
      finalVideoUrl: url,
      isProducing: false,
      productionProgress: 100
    });
  },

  // Chat management
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  setIsAgentTyping: (typing) => {
    set({ isAgentTyping: typing });
  },

  setChatInputMessage: (message) => {
    set({ chatInputMessage: message });
  },

  // Reset store
  reset: () => {
    set(initialState);
  },
}));