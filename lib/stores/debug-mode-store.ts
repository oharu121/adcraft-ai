import { create } from "zustand";

export type DebugMode = "demo" | "real";

interface DebugModeData {
  mode: DebugMode;
  displayName: string;
  description: string;
  canSwitch: boolean;
}

interface ApiModeResponse {
  success: boolean;
  data: {
    currentMode: DebugMode;
    displayName: string;
    description: string;
    canSwitch: boolean;
    timestamp: string;
  };
}

interface DebugModeStore {
  // State
  mode: DebugMode;
  modeData: DebugModeData | null;
  isLoading: boolean;
  isVisible: boolean;
  isInitialized: boolean;

  // Actions
  setMode: (mode: DebugMode) => void;
  setModeData: (data: DebugModeData) => void;
  setIsLoading: (loading: boolean) => void;
  setIsVisible: (visible: boolean) => void;
  
  // Async actions
  fetchModeInfo: () => Promise<void>;
  switchMode: () => Promise<void>;
  
  // Helpers
  getDisplayProps: (currentMode: DebugMode) => {
    emoji: string;
    bgColor: string;
    textColor: string;
  };
}

/**
 * Shared Zustand store for debug mode state
 * Ensures all components use the same state instance
 */
export const useDebugModeStore = create<DebugModeStore>((set, get) => ({
  // Initial state
  mode: "demo",
  modeData: null,
  isLoading: false,
  isVisible: false,
  isInitialized: false,

  // Setters
  setMode: (mode) => set({ mode }),
  setModeData: (data) => set({ modeData: data, mode: data.mode }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsVisible: (isVisible) => set({ isVisible }),

  // Fetch mode info from API
  fetchModeInfo: async () => {
    try {
      const response = await fetch("/api/debug/mode");
      if (response.ok) {
        const apiResponse: ApiModeResponse = await response.json();
        if (apiResponse.success) {
          const data: DebugModeData = {
            mode: apiResponse.data.currentMode,
            displayName: apiResponse.data.displayName,
            description: apiResponse.data.description,
            canSwitch: apiResponse.data.canSwitch,
          };
          
          set({ 
            mode: data.mode, 
            modeData: data, 
            isVisible: true,
            isInitialized: true 
          });
        }
      }
    } catch (error) {
      console.debug("Failed to fetch mode info:", error);
    }
  },

  // Switch mode via GET API - ensures backend/frontend sync
  switchMode: async () => {
    const { modeData, isLoading } = get();
    if (!modeData || isLoading) return;

    set({ isLoading: true });
    try {
      const response = await fetch("/api/debug/switchMode");

      if (response.ok) {
        const apiResponse: ApiModeResponse = await response.json();
        if (apiResponse.success) {
          // Only update local state after successful backend toggle
          const data: DebugModeData = {
            mode: apiResponse.data.currentMode,
            displayName: apiResponse.data.displayName,
            description: apiResponse.data.description,
            canSwitch: apiResponse.data.canSwitch,
          };
          
          set({ 
            mode: data.mode, 
            modeData: data 
          });
        }
      } else {
        console.error("Failed to switch mode:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to switch mode:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Helper to get display properties
  getDisplayProps: (currentMode: DebugMode) => {
    const isDemoMode = currentMode === "demo";
    return {
      emoji: isDemoMode ? "🎭" : "🤖",
      bgColor: isDemoMode ? "bg-purple-100" : "bg-green-100",
      textColor: isDemoMode ? "text-purple-800" : "text-green-800",
    };
  },
}));