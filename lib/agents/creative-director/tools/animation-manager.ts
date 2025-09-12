/**
 * Creative Director Animation Manager
 *
 * Smooth transitions and animations throughout David's interface,
 * providing professional visual feedback and enhanced user experience.
 */

export interface AnimationConfig {
  duration: number;
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'bounce' | 'elastic';
  delay?: number;
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
  iterations?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

export interface TransitionTiming {
  fast: number;
  normal: number;
  slow: number;
  creative: number; // For creative-focused animations
  elegant: number;  // For sophisticated transitions
}

export interface AnimationSequence {
  id: string;
  name: string;
  steps: AnimationStep[];
  totalDuration: number;
  onComplete?: () => void;
  onStep?: (stepIndex: number) => void;
}

export interface AnimationStep {
  element: Element | string; // Element or selector
  animation: string; // CSS animation name or keyframes
  config: AnimationConfig;
  parallel?: boolean; // Run parallel with next step
}

export interface CreativeTransitions {
  assetGeneration: {
    start: AnimationSequence;
    progress: AnimationSequence;
    complete: AnimationSequence;
    error: AnimationSequence;
  };
  stateChanges: {
    expandSection: AnimationSequence;
    collapseSection: AnimationSequence;
    switchView: AnimationSequence;
    updateProgress: AnimationSequence;
  };
  userInteraction: {
    buttonHover: AnimationConfig;
    buttonPress: AnimationConfig;
    inputFocus: AnimationConfig;
    cardHover: AnimationConfig;
  };
  davidPersonality: {
    thinking: AnimationSequence;
    excited: AnimationSequence;
    explaining: AnimationSequence;
    creating: AnimationSequence;
  };
}

/**
 * Creative Director Animation Manager
 * Provides sophisticated animations and transitions for David's creative workflow interface
 */
export class CreativeDirectorAnimationManager {
  private static instance: CreativeDirectorAnimationManager;
  private activeAnimations: Map<string, Animation> = new Map();
  private animationSequences: Map<string, AnimationSequence> = new Map();
  private transitionTiming: TransitionTiming;
  private creativeTransitions: CreativeTransitions;
  private isReducedMotion: boolean = false;
  private performanceMode: 'high' | 'balanced' | 'performance' = 'balanced';

  private constructor() {
    this.transitionTiming = this.createOptimalTiming();
    this.creativeTransitions = this.createCreativeTransitions();
    this.initializeAnimationSystem();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CreativeDirectorAnimationManager {
    if (!CreativeDirectorAnimationManager.instance) {
      CreativeDirectorAnimationManager.instance = new CreativeDirectorAnimationManager();
    }
    return CreativeDirectorAnimationManager.instance;
  }

  /**
   * Initialize animation system
   */
  private initializeAnimationSystem(): void {
    // Check for reduced motion preference
    if (typeof window !== 'undefined') {
      this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Listen for changes
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        this.isReducedMotion = e.matches;
        this.adjustAnimationsForAccessibility();
      });
      
      // Inject CSS animations
      this.injectAnimationStyles();
    }
    
    console.log("[ANIMATION MANAGER] Animation system initialized");
  }

  /**
   * Asset generation animation sequence
   */
  public async animateAssetGeneration(
    assetId: string,
    stage: 'start' | 'progress' | 'complete' | 'error',
    progress?: number,
    element?: Element
  ): Promise<void> {
    const sequence = this.creativeTransitions.assetGeneration[stage];
    
    if (stage === 'progress' && progress !== undefined) {
      await this.animateProgressUpdate(assetId, progress, element);
    } else {
      await this.playAnimationSequence(`${assetId}-${stage}`, sequence, element);
    }
  }

  /**
   * David's personality animations
   */
  public async animateDavidState(
    state: 'thinking' | 'excited' | 'explaining' | 'creating',
    duration?: number,
    element?: Element
  ): Promise<void> {
    const sequence = this.creativeTransitions.davidPersonality[state];
    
    // Adjust duration if provided
    if (duration) {
      sequence.steps.forEach(step => {
        step.config.duration = duration;
      });
    }
    
    await this.playAnimationSequence(`david-${state}`, sequence, element);
  }

  /**
   * Section expand/collapse animations
   */
  public async animateSection(
    sectionId: string,
    action: 'expand' | 'collapse',
    element?: Element
  ): Promise<void> {
    const sequence = action === 'expand' ? 
      this.creativeTransitions.stateChanges.expandSection :
      this.creativeTransitions.stateChanges.collapseSection;
    
    await this.playAnimationSequence(`section-${sectionId}-${action}`, sequence, element);
  }

  /**
   * View transition animations
   */
  public async animateViewSwitch(
    fromView: string,
    toView: string,
    container?: Element
  ): Promise<void> {
    const sequence = this.creativeTransitions.stateChanges.switchView;
    
    // Customize sequence for specific view transitions
    if (fromView === 'overview' && toView === 'chat') {
      await this.animateChatViewTransition(container);
    } else if (fromView === 'chat' && toView === 'assets') {
      await this.animateAssetsViewTransition(container);
    } else {
      await this.playAnimationSequence(`view-${fromView}-to-${toView}`, sequence, container);
    }
  }

  /**
   * Interactive element hover animations
   */
  public applyHoverAnimations(element: Element, type: 'button' | 'card' | 'input' = 'button'): void {
    const config = this.creativeTransitions.userInteraction;
    
    switch (type) {
      case 'button':
        this.applyHoverEffect(element, config.buttonHover);
        break;
      case 'card':
        this.applyHoverEffect(element, config.cardHover);
        break;
      case 'input':
        this.applyFocusEffect(element, config.inputFocus);
        break;
    }
  }

  /**
   * Staggered list animations
   */
  public async animateListItems(
    items: Element[],
    direction: 'in' | 'out' = 'in',
    staggerDelay: number = 100
  ): Promise<void> {
    const promises: Promise<void>[] = [];
    
    items.forEach((item, index) => {
      const delay = staggerDelay * index;
      
      const animation = direction === 'in' ? 
        this.createFadeInUpAnimation(item, delay) :
        this.createFadeOutDownAnimation(item, delay);
      
      promises.push(animation);
    });
    
    await Promise.all(promises);
  }

  /**
   * Progress bar animations
   */
  public async animateProgressBar(
    element: Element,
    fromProgress: number,
    toProgress: number,
    duration: number = 1000,
    commentary?: string
  ): Promise<void> {
    const steps = Math.abs(toProgress - fromProgress);
    const stepDuration = duration / steps;
    const increment = fromProgress < toProgress ? 1 : -1;
    
    let currentProgress = fromProgress;
    
    while (currentProgress !== toProgress) {
      currentProgress += increment;
      
      // Update progress bar
      this.updateProgressBarValue(element, currentProgress);
      
      // Add creative flourish at milestones
      if (currentProgress % 25 === 0) {
        await this.addProgressMilestoneEffect(element, currentProgress, commentary);
      }
      
      await this.delay(stepDuration);
    }
  }

  /**
   * Message appear animations
   */
  public async animateMessageAppear(
    messageElement: Element,
    isFromDavid: boolean = true,
    messageType: 'text' | 'visual' | 'insight' = 'text'
  ): Promise<void> {
    const sequence = this.createMessageAppearSequence(isFromDavid, messageType);
    await this.playAnimationSequence(`message-${Date.now()}`, sequence, messageElement);
  }

  /**
   * Asset thumbnail animations
   */
  public async animateAssetThumbnail(
    thumbnail: Element,
    action: 'appear' | 'hover' | 'select' | 'generate',
    quality?: string
  ): Promise<void> {
    switch (action) {
      case 'appear':
        await this.animateAssetAppear(thumbnail, quality);
        break;
      case 'hover':
        await this.animateAssetHover(thumbnail);
        break;
      case 'select':
        await this.animateAssetSelection(thumbnail);
        break;
      case 'generate':
        await this.animateAssetGeneration(crypto.randomUUID(), 'start', 0, thumbnail);
        break;
    }
  }

  /**
   * Error state animations
   */
  public async animateErrorState(
    element: Element,
    errorType: 'validation' | 'network' | 'generation' | 'general' = 'general'
  ): Promise<void> {
    const sequence = this.createErrorAnimation(errorType);
    await this.playAnimationSequence(`error-${Date.now()}`, sequence, element);
  }

  /**
   * Success state animations
   */
  public async animateSuccessState(
    element: Element,
    successType: 'completion' | 'approval' | 'upload' | 'general' = 'general'
  ): Promise<void> {
    const sequence = this.createSuccessAnimation(successType);
    await this.playAnimationSequence(`success-${Date.now()}`, sequence, element);
  }

  /**
   * Set performance mode
   */
  public setPerformanceMode(mode: 'high' | 'balanced' | 'performance'): void {
    this.performanceMode = mode;
    this.adjustAnimationsForPerformance();
    console.log(`[ANIMATION MANAGER] Performance mode set to: ${mode}`);
  }

  /**
   * Cancel all animations for element
   */
  public cancelAnimations(elementOrId: Element | string): void {
    const key = typeof elementOrId === 'string' ? elementOrId : `element-${Math.random()}`;
    
    const animation = this.activeAnimations.get(key);
    if (animation) {
      animation.cancel();
      this.activeAnimations.delete(key);
    }
  }

  /**
   * Get animation performance metrics
   */
  public getAnimationMetrics(): {
    activeAnimations: number;
    totalSequences: number;
    performanceMode: string;
    reducedMotion: boolean;
    averageFrameRate?: number;
  } {
    return {
      activeAnimations: this.activeAnimations.size,
      totalSequences: this.animationSequences.size,
      performanceMode: this.performanceMode,
      reducedMotion: this.isReducedMotion,
      // Frame rate would be calculated if performance API is available
    };
  }

  /**
   * Private implementation methods
   */
  
  private async playAnimationSequence(
    id: string,
    sequence: AnimationSequence,
    targetElement?: Element
  ): Promise<void> {
    if (this.isReducedMotion) {
      // Skip animations but still call callbacks
      sequence.onComplete?.();
      return;
    }
    
    this.animationSequences.set(id, sequence);
    
    try {
      for (let i = 0; i < sequence.steps.length; i++) {
        const step = sequence.steps[i];
        const nextStep = sequence.steps[i + 1];
        
        sequence.onStep?.(i);
        
        const element = this.resolveElement(step.element, targetElement);
        if (!element) continue;
        
        const animation = await this.executeAnimationStep(step, element);
        
        if (animation) {
          this.activeAnimations.set(`${id}-step-${i}`, animation);
          
          // Wait for animation unless it runs parallel with the next step
          if (!step.parallel) {
            await animation.finished;
          }
          
          this.activeAnimations.delete(`${id}-step-${i}`);
        }
      }
      
      sequence.onComplete?.();
      
    } catch (error) {
      console.error(`[ANIMATION MANAGER] Animation sequence failed: ${id}`, error);
    } finally {
      this.animationSequences.delete(id);
    }
  }

  private async executeAnimationStep(step: AnimationStep, element: Element): Promise<Animation | null> {
    try {
      const keyframes = this.getKeyframes(step.animation);
      const options = this.getAnimationOptions(step.config);
      
      const animation = element.animate(keyframes, options);
      
      return animation;
      
    } catch (error) {
      console.error("[ANIMATION MANAGER] Failed to execute animation step:", error);
      return null;
    }
  }

  private resolveElement(elementOrSelector: Element | string, fallback?: Element): Element | null {
    if (typeof elementOrSelector === 'string') {
      return document.querySelector(elementOrSelector) || fallback || null;
    }
    return elementOrSelector;
  }

  private getKeyframes(animationName: string): Keyframe[] {
    const keyframes: Record<string, Keyframe[]> = {
      fadeIn: [
        { opacity: '0', transform: 'translateY(10px)' },
        { opacity: '1', transform: 'translateY(0)' }
      ],
      fadeOut: [
        { opacity: '1', transform: 'translateY(0)' },
        { opacity: '0', transform: 'translateY(-10px)' }
      ],
      slideInRight: [
        { transform: 'translateX(100%)', opacity: '0' },
        { transform: 'translateX(0)', opacity: '1' }
      ],
      slideInLeft: [
        { transform: 'translateX(-100%)', opacity: '0' },
        { transform: 'translateX(0)', opacity: '1' }
      ],
      scaleIn: [
        { transform: 'scale(0.8)', opacity: '0' },
        { transform: 'scale(1)', opacity: '1' }
      ],
      pulse: [
        { transform: 'scale(1)' },
        { transform: 'scale(1.05)' },
        { transform: 'scale(1)' }
      ],
      bounce: [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-10px)' },
        { transform: 'translateY(0)' },
        { transform: 'translateY(-5px)' },
        { transform: 'translateY(0)' }
      ],
      shimmer: [
        { backgroundPosition: '-100% 0' },
        { backgroundPosition: '100% 0' }
      ],
      spin: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' }
      ],
      wiggle: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(5deg)' },
        { transform: 'rotate(-5deg)' },
        { transform: 'rotate(0deg)' }
      ]
    };
    
    return keyframes[animationName] || keyframes.fadeIn;
  }

  private getAnimationOptions(config: AnimationConfig): KeyframeAnimationOptions {
    const iterations = config.iterations === 'infinite' ? Infinity : (config.iterations || 1);
    
    return {
      duration: this.adjustDurationForPerformance(config.duration),
      easing: config.easing,
      delay: config.delay || 0,
      fill: config.fill || 'both',
      iterations,
      direction: config.direction || 'normal'
    };
  }

  private adjustDurationForPerformance(duration: number): number {
    if (this.isReducedMotion) return 0;
    
    switch (this.performanceMode) {
      case 'performance':
        return Math.max(100, duration * 0.5);
      case 'high':
        return duration * 1.2;
      default:
        return duration;
    }
  }

  private createOptimalTiming(): TransitionTiming {
    return {
      fast: 150,
      normal: 300,
      slow: 600,
      creative: 800,  // For creative-focused animations
      elegant: 400    // For sophisticated transitions
    };
  }

  private createCreativeTransitions(): CreativeTransitions {
    return {
      assetGeneration: {
        start: this.createAssetStartSequence(),
        progress: this.createAssetProgressSequence(),
        complete: this.createAssetCompleteSequence(),
        error: this.createAssetErrorSequence()
      },
      stateChanges: {
        expandSection: this.createExpandSequence(),
        collapseSection: this.createCollapseSequence(),
        switchView: this.createViewSwitchSequence(),
        updateProgress: this.createProgressUpdateSequence()
      },
      userInteraction: {
        buttonHover: { duration: this.transitionTiming.fast, easing: 'ease-out' },
        buttonPress: { duration: this.transitionTiming.fast, easing: 'ease-in-out' },
        inputFocus: { duration: this.transitionTiming.normal, easing: 'ease-out' },
        cardHover: { duration: this.transitionTiming.normal, easing: 'ease-out' }
      },
      davidPersonality: {
        thinking: this.createDavidThinkingSequence(),
        excited: this.createDavidExcitedSequence(),
        explaining: this.createDavidExplainingSequence(),
        creating: this.createDavidCreatingSequence()
      }
    };
  }

  private createAssetStartSequence(): AnimationSequence {
    return {
      id: 'asset-start',
      name: 'Asset Generation Start',
      totalDuration: 1200,
      steps: [
        {
          element: '.asset-placeholder',
          animation: 'scaleIn',
          config: { duration: 400, easing: 'ease-out' }
        },
        {
          element: '.progress-bar',
          animation: 'fadeIn',
          config: { duration: 300, easing: 'ease-in', delay: 200 },
          parallel: true
        },
        {
          element: '.david-commentary',
          animation: 'slideInRight',
          config: { duration: 500, easing: 'ease-out', delay: 400 }
        }
      ]
    };
  }

  private createAssetProgressSequence(): AnimationSequence {
    return {
      id: 'asset-progress',
      name: 'Asset Generation Progress',
      totalDuration: 800,
      steps: [
        {
          element: '.progress-fill',
          animation: 'shimmer',
          config: { duration: 800, easing: 'ease-in-out', iterations: 'infinite' }
        }
      ]
    };
  }

  private createAssetCompleteSequence(): AnimationSequence {
    return {
      id: 'asset-complete',
      name: 'Asset Generation Complete',
      totalDuration: 1000,
      steps: [
        {
          element: '.asset-thumbnail',
          animation: 'scaleIn',
          config: { duration: 400, easing: 'bounce' }
        },
        {
          element: '.completion-indicator',
          animation: 'pulse',
          config: { duration: 600, easing: 'ease-in-out', delay: 200 }
        }
      ]
    };
  }

  private createAssetErrorSequence(): AnimationSequence {
    return {
      id: 'asset-error',
      name: 'Asset Generation Error',
      totalDuration: 600,
      steps: [
        {
          element: '.error-indicator',
          animation: 'wiggle',
          config: { duration: 400, easing: 'ease-in-out' }
        },
        {
          element: '.retry-button',
          animation: 'fadeIn',
          config: { duration: 200, easing: 'ease-out', delay: 400 }
        }
      ]
    };
  }

  private createExpandSequence(): AnimationSequence {
    return {
      id: 'expand-section',
      name: 'Section Expand',
      totalDuration: this.transitionTiming.creative,
      steps: [
        {
          element: '.section-content',
          animation: 'slideInLeft',
          config: { duration: this.transitionTiming.creative, easing: 'ease-out' }
        }
      ]
    };
  }

  private createCollapseSequence(): AnimationSequence {
    return {
      id: 'collapse-section',
      name: 'Section Collapse',
      totalDuration: this.transitionTiming.normal,
      steps: [
        {
          element: '.section-content',
          animation: 'fadeOut',
          config: { duration: this.transitionTiming.normal, easing: 'ease-in' }
        }
      ]
    };
  }

  private createViewSwitchSequence(): AnimationSequence {
    return {
      id: 'view-switch',
      name: 'View Switch',
      totalDuration: this.transitionTiming.elegant,
      steps: [
        {
          element: '.view-container',
          animation: 'fadeOut',
          config: { duration: this.transitionTiming.elegant / 2, easing: 'ease-in' }
        },
        {
          element: '.view-container',
          animation: 'fadeIn',
          config: { duration: this.transitionTiming.elegant / 2, easing: 'ease-out' }
        }
      ]
    };
  }

  private createProgressUpdateSequence(): AnimationSequence {
    return {
      id: 'progress-update',
      name: 'Progress Update',
      totalDuration: this.transitionTiming.normal,
      steps: [
        {
          element: '.progress-bar',
          animation: 'pulse',
          config: { duration: this.transitionTiming.normal, easing: 'ease-in-out' }
        }
      ]
    };
  }

  private createDavidThinkingSequence(): AnimationSequence {
    return {
      id: 'david-thinking',
      name: 'David Thinking',
      totalDuration: 2000,
      steps: [
        {
          element: '.david-avatar',
          animation: 'pulse',
          config: { duration: 1000, easing: 'ease-in-out', iterations: 2 }
        }
      ]
    };
  }

  private createDavidExcitedSequence(): AnimationSequence {
    return {
      id: 'david-excited',
      name: 'David Excited',
      totalDuration: 800,
      steps: [
        {
          element: '.david-avatar',
          animation: 'bounce',
          config: { duration: 800, easing: 'ease-out' }
        }
      ]
    };
  }

  private createDavidExplainingSequence(): AnimationSequence {
    return {
      id: 'david-explaining',
      name: 'David Explaining',
      totalDuration: 1500,
      steps: [
        {
          element: '.david-avatar',
          animation: 'wiggle',
          config: { duration: 300, easing: 'ease-in-out' }
        },
        {
          element: '.explanation-bubble',
          animation: 'fadeIn',
          config: { duration: 400, easing: 'ease-out', delay: 200 }
        }
      ]
    };
  }

  private createDavidCreatingSequence(): AnimationSequence {
    return {
      id: 'david-creating',
      name: 'David Creating',
      totalDuration: 3000,
      steps: [
        {
          element: '.david-avatar',
          animation: 'spin',
          config: { duration: 1000, easing: 'linear', iterations: 3 }
        }
      ]
    };
  }

  private injectAnimationStyles(): void {
    const styles = `
      .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      .animate-fade-out { animation: fadeOut 0.3s ease-in forwards; }
      .animate-slide-in-right { animation: slideInRight 0.4s ease-out forwards; }
      .animate-slide-in-left { animation: slideInLeft 0.4s ease-out forwards; }
      .animate-scale-in { animation: scaleIn 0.3s ease-out forwards; }
      .animate-pulse { animation: pulse 0.6s ease-in-out infinite; }
      .animate-bounce { animation: bounce 0.8s ease-out; }
      .animate-shimmer { animation: shimmer 1s ease-in-out infinite; }
      .animate-spin { animation: spin 1s linear infinite; }
      .animate-wiggle { animation: wiggle 0.4s ease-in-out; }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
      }
      
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideInLeft {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes scaleIn {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      @keyframes bounce {
        0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
        40%, 43% { transform: translateY(-10px); }
        70% { transform: translateY(-5px); }
        90% { transform: translateY(-2px); }
      }
      
      @keyframes shimmer {
        0% { background-position: -100% 0; }
        100% { background-position: 100% 0; }
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes wiggle {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(5deg); }
        75% { transform: rotate(-5deg); }
      }
      
      @media (prefers-reduced-motion: reduce) {
        .animate-fade-in,
        .animate-fade-out,
        .animate-slide-in-right,
        .animate-slide-in-left,
        .animate-scale-in,
        .animate-pulse,
        .animate-bounce,
        .animate-shimmer,
        .animate-spin,
        .animate-wiggle {
          animation: none !important;
        }
      }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Additional helper methods...
  
  private async animateProgressUpdate(assetId: string, progress: number, element?: Element): Promise<void> {
    // Implementation for progress-specific animation
  }

  private async animateChatViewTransition(container?: Element): Promise<void> {
    // Implementation for chat view transition
  }

  private async animateAssetsViewTransition(container?: Element): Promise<void> {
    // Implementation for assets view transition
  }

  private applyHoverEffect(element: Element, config: AnimationConfig): void {
    // Implementation for hover effects
  }

  private applyFocusEffect(element: Element, config: AnimationConfig): void {
    // Implementation for focus effects
  }

  private async createFadeInUpAnimation(element: Element, delay: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        element.animate([
          { opacity: '0', transform: 'translateY(20px)' },
          { opacity: '1', transform: 'translateY(0)' }
        ], {
          duration: this.transitionTiming.normal,
          easing: 'ease-out',
          fill: 'forwards'
        }).addEventListener('finish', () => resolve());
      }, delay);
    });
  }

  private async createFadeOutDownAnimation(element: Element, delay: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        element.animate([
          { opacity: '1', transform: 'translateY(0)' },
          { opacity: '0', transform: 'translateY(20px)' }
        ], {
          duration: this.transitionTiming.normal,
          easing: 'ease-in',
          fill: 'forwards'
        }).addEventListener('finish', () => resolve());
      }, delay);
    });
  }

  private updateProgressBarValue(element: Element, progress: number): void {
    if (element instanceof HTMLElement) {
      element.style.width = `${progress}%`;
    }
  }

  private async addProgressMilestoneEffect(element: Element, progress: number, commentary?: string): Promise<void> {
    // Add sparkle effect or other milestone indicators
    const sparkle = document.createElement('div');
    sparkle.className = 'progress-milestone';
    sparkle.style.cssText = `
      position: absolute;
      width: 10px;
      height: 10px;
      background: radial-gradient(circle, #ffd700, #ff6b35);
      border-radius: 50%;
      animation: sparkle 0.5s ease-out;
    `;
    
    element.appendChild(sparkle);
    
    setTimeout(() => sparkle.remove(), 500);
  }

  private createMessageAppearSequence(isFromDavid: boolean, messageType: string): AnimationSequence {
    return {
      id: 'message-appear',
      name: 'Message Appear',
      totalDuration: isFromDavid ? this.transitionTiming.creative : this.transitionTiming.normal,
      steps: [
        {
          element: '.message',
          animation: isFromDavid ? 'slideInLeft' : 'slideInRight',
          config: { 
            duration: isFromDavid ? this.transitionTiming.creative : this.transitionTiming.normal, 
            easing: 'ease-out' 
          }
        }
      ]
    };
  }

  private async animateAssetAppear(thumbnail: Element, quality?: string): Promise<void> {
    const duration = quality === 'premium' ? this.transitionTiming.elegant : this.transitionTiming.normal;
    
    await thumbnail.animate([
      { opacity: '0', transform: 'scale(0.8) rotate(-5deg)' },
      { opacity: '1', transform: 'scale(1) rotate(0deg)' }
    ], {
      duration,
      easing: 'ease-out',
      fill: 'forwards'
    }).finished;
  }

  private async animateAssetHover(thumbnail: Element): Promise<void> {
    await thumbnail.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' }
    ], {
      duration: this.transitionTiming.fast,
      easing: 'ease-out',
      fill: 'forwards'
    }).finished;
  }

  private async animateAssetSelection(thumbnail: Element): Promise<void> {
    await thumbnail.animate([
      { transform: 'scale(1)', boxShadow: '0 0 0 0px rgba(139, 69, 19, 0.6)' },
      { transform: 'scale(1.02)', boxShadow: '0 0 0 4px rgba(139, 69, 19, 0.6)' }
    ], {
      duration: this.transitionTiming.normal,
      easing: 'ease-out',
      fill: 'forwards'
    }).finished;
  }

  private createErrorAnimation(errorType: string): AnimationSequence {
    return {
      id: 'error-animation',
      name: 'Error Animation',
      totalDuration: 600,
      steps: [
        {
          element: '.error-element',
          animation: 'wiggle',
          config: { duration: 400, easing: 'ease-in-out' }
        }
      ]
    };
  }

  private createSuccessAnimation(successType: string): AnimationSequence {
    return {
      id: 'success-animation',
      name: 'Success Animation',
      totalDuration: 800,
      steps: [
        {
          element: '.success-element',
          animation: 'bounce',
          config: { duration: 800, easing: 'ease-out' }
        }
      ]
    };
  }

  private adjustAnimationsForAccessibility(): void {
    if (this.isReducedMotion) {
      console.log("[ANIMATION MANAGER] Reduced motion mode enabled - animations disabled");
    }
  }

  private adjustAnimationsForPerformance(): void {
    console.log(`[ANIMATION MANAGER] Performance mode adjusted to: ${this.performanceMode}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for animation system
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Test basic animation functionality
      if (typeof window === 'undefined') {
        console.log("[ANIMATION MANAGER] Health check: Running in server environment - animations not testable");
        return true;
      }
      
      // Test keyframe creation
      const testKeyframes = this.getKeyframes('fadeIn');
      const testOptions = this.getAnimationOptions({ duration: 100, easing: 'ease' });
      
      const healthy = testKeyframes.length > 0 && testOptions.duration === 100;
      console.log(`[ANIMATION MANAGER] Health check: ${healthy ? 'PASS' : 'FAIL'}`);
      
      return healthy;
    } catch (error) {
      console.error("[ANIMATION MANAGER] Health check failed:", error);
      return false;
    }
  }
}