/**
 * Phase Manager Utilities
 * Handles phase transitions, validations, and state determination
 */

import { AppPhase, PhaseState, PHASE_ORDER } from '@/lib/types/app-phases';

export class PhaseManager {
  /**
   * Determine current phase based on app state
   */
  static determineCurrentPhase({
    hasProductInput,
    isAnalyzing,
    hasAnalysis,
    hasCreativeDirectorData,
    hasVideoProduction,
    isCompleted
  }: {
    hasProductInput: boolean;
    isAnalyzing: boolean;
    hasAnalysis: boolean;
    hasCreativeDirectorData: boolean;
    hasVideoProduction: boolean;
    isCompleted: boolean;
  }): AppPhase {
    if (isCompleted) return 'completed';
    if (hasVideoProduction) return 'alex-production';
    if (hasCreativeDirectorData) return 'david-creative';
    if (hasAnalysis) return 'maya-strategy';
    if (isAnalyzing) return 'maya-analysis';
    if (hasProductInput) return 'maya-analysis';
    return 'product-input';
  }

  /**
   * Check if a phase can be accessed
   */
  static canAccessPhase(targetPhase: AppPhase, currentPhase: AppPhase): boolean {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    const targetIndex = PHASE_ORDER.indexOf(targetPhase);

    // Can only access current phase or previous completed phases
    return targetIndex <= currentIndex;
  }

  /**
   * Get next phase in sequence
   */
  static getNextPhase(currentPhase: AppPhase): AppPhase | null {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    if (currentIndex >= PHASE_ORDER.length - 1) return null;
    return PHASE_ORDER[currentIndex + 1];
  }

  /**
   * Get previous phase in sequence
   */
  static getPreviousPhase(currentPhase: AppPhase): AppPhase | null {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    if (currentIndex <= 0) return null;
    return PHASE_ORDER[currentIndex - 1];
  }

  /**
   * Check if phase transition is valid
   */
  static isValidTransition(from: AppPhase, to: AppPhase): boolean {
    const fromIndex = PHASE_ORDER.indexOf(from);
    const toIndex = PHASE_ORDER.indexOf(to);

    // Can go forward by 1 step or backward to any previous phase
    return toIndex === fromIndex + 1 || toIndex < fromIndex;
  }

  /**
   * Get completed phases based on current phase
   */
  static getCompletedPhases(currentPhase: AppPhase): AppPhase[] {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    return PHASE_ORDER.slice(0, currentIndex);
  }
}