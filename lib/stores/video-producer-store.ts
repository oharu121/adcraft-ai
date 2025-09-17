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
  VIDEO_FORMAT = "video-format",
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

// Video format interface
export interface VideoFormat {
  id: string;
  name: string;
  description: string;
  aspectRatio: "16:9" | "9:16";
  resolution: "720p" | "1080p";
  durationSeconds: 8; // Fixed to 8 seconds
  bestFor: string;
  platforms: string[];
  icon: string;
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
    videoFormat: boolean;
    finalProduction: boolean;
  };

  // User selections
  selectedNarrativeStyle: NarrativeStyle | null;
  selectedMusicGenre: MusicGenre | null;
  selectedVideoFormat: VideoFormat | null;
  productionSpecs: VideoProductionSpecs | null;

  // Available options (from API or demo data)
  availableNarrativeStyles: NarrativeStyle[];
  availableMusicGenres: MusicGenre[];
  availableVideoFormats: VideoFormat[];

  // Production state
  isProducing: boolean;
  productionProgress: number;
  finalVideoUrl: string | null;

  // Chat and interaction
  messages: any[];
  isAgentTyping: boolean;
  chatInputMessage: string;

  // Actions
  setIsInitialized: (initialized: boolean) => void;
  initializeFromCreativeDirectorHandoff: (data: {
    sessionId: string;
    creativeDirectorHandoffData: CreativeDirectorHandoffData;
    locale: Locale;
  }) => void;

  setCurrentStep: (step: VideoProducerWorkflowStep) => void;
  markStepCompleted: (step: keyof VideoProducerStore['completedSteps']) => void;

  setSelectedNarrativeStyle: (style: NarrativeStyle) => void;
  setSelectedMusicGenre: (genre: MusicGenre) => void;
  setSelectedVideoFormat: (format: VideoFormat) => void;
  setProductionSpecs: (specs: VideoProductionSpecs) => void;

  setAvailableNarrativeStyles: (styles: NarrativeStyle[]) => void;
  setAvailableMusicGenres: (genres: MusicGenre[]) => void;
  setAvailableVideoFormats: (formats: VideoFormat[]) => void;

  startVideoProduction: () => Promise<void>;
  simulateProductionProgress: (finalVideoUrl: string) => void;
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
    videoFormat: false,
    finalProduction: false,
  },

  selectedNarrativeStyle: null,
  selectedMusicGenre: null,
  selectedVideoFormat: null,
  productionSpecs: null,

  availableNarrativeStyles: [],
  availableMusicGenres: [],
  availableVideoFormats: [],

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
      isInitialized: false, // Changed: Let the API initialization set this to true
      currentStep: VideoProducerWorkflowStep.NARRATIVE_STYLE,
      completedSteps: {
        narrativeStyle: false,
        musicTone: false,
        videoFormat: false,
        finalProduction: false,
      },
      // Reset selections for new session
      selectedNarrativeStyle: null,
      selectedMusicGenre: null,
      selectedVideoFormat: null,
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

  setSelectedVideoFormat: (format) => {
    set({ selectedVideoFormat: format });
    get().markStepCompleted('videoFormat');
  },

  setProductionSpecs: (specs) => {
    set({ productionSpecs: specs });
  },

  // Initialization management
  setIsInitialized: (initialized) => {
    set({ isInitialized: initialized });
  },

  // Available options management
  setAvailableNarrativeStyles: (styles) => {
    set({ availableNarrativeStyles: styles });
  },

  setAvailableMusicGenres: (genres) => {
    set({ availableMusicGenres: genres });
  },

  setAvailableVideoFormats: (formats) => {
    set({ availableVideoFormats: formats });
  },

  // Video production management
  startVideoProduction: async () => {
    const state = get();

    set({
      isProducing: true,
      productionProgress: 0,
      finalVideoUrl: null
    });

    try {
      // Call the video producer API to start production
      const response = await fetch('/api/agents/video-producer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start-production',
          sessionId: state.sessionId,
          locale: state.locale,
          data: {
            selectedNarrativeStyle: state.selectedNarrativeStyle,
            selectedMusicGenre: state.selectedMusicGenre,
            selectedVideoFormat: state.selectedVideoFormat,
            creativeDirectorHandoffData: state.creativeDirectorHandoffData
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Production API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Start progress simulation
        get().simulateProductionProgress(result.data.videoUrl);
        get().markStepCompleted('finalProduction');
      } else {
        throw new Error('Production failed: ' + (result.error || 'Unknown error'));
      }

    } catch (error) {
      console.error('Video production error:', error);
      set({
        isProducing: false,
        productionProgress: 0
      });
      // You might want to show an error message to the user here
    }
  },

  // Simulate production progress for demo mode
  simulateProductionProgress: (finalVideoUrl: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Random progress between 5-20%

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        get().setFinalVideoUrl(finalVideoUrl);
      } else {
        get().updateProductionProgress(progress);
      }
    }, 1000); // Update every second
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