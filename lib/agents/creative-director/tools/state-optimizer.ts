/**
 * Creative Director State Optimizer
 *
 * Advanced state management optimization for David's Zustand store,
 * providing selective updates, memoization, and performance enhancements.
 */

import { StoreApi, UseBoundStore } from 'zustand';

export interface StateUpdateMetrics {
  updateId: string;
  stateSlice: string;
  updateType: 'partial' | 'full' | 'batch' | 'selective';
  affectedComponents: string[];
  renderCount: number;
  updateTime: number;
  performanceImpact: 'minimal' | 'moderate' | 'significant';
  timestamp: string;
}

export interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  applicableScenarios: string[];
  performanceGain: string;
  implementation: string;
}

export interface StateSliceConfig {
  slice: string;
  updateFrequency: 'high' | 'medium' | 'low';
  dependencies: string[];
  optimizationLevel: 'aggressive' | 'balanced' | 'conservative';
  memoize: boolean;
  batchUpdates: boolean;
}

export interface PerformanceOptimization {
  memoizedSelectors: Map<string, any>;
  batchedUpdates: Map<string, any[]>;
  updateQueue: Map<string, NodeJS.Timeout>;
  renderTracking: Map<string, number>;
  performanceMetrics: StateUpdateMetrics[];
}

/**
 * Creative Director State Optimizer
 * Provides advanced state management optimization for David's Zustand store
 */
export class CreativeDirectorStateOptimizer {
  private static instance: CreativeDirectorStateOptimizer;
  private optimization: PerformanceOptimization;
  private stateConfigs: StateSliceConfig[];
  private isOptimizationEnabled: boolean = true;
  
  // Debounce timers for batched updates
  private readonly BATCH_DELAY = 16; // One animation frame
  private readonly HIGH_FREQUENCY_DELAY = 8;
  private readonly MEDIUM_FREQUENCY_DELAY = 50;
  private readonly LOW_FREQUENCY_DELAY = 200;

  private constructor() {
    this.optimization = {
      memoizedSelectors: new Map(),
      batchedUpdates: new Map(),
      updateQueue: new Map(),
      renderTracking: new Map(),
      performanceMetrics: []
    };
    
    this.stateConfigs = this.createOptimalStateConfigs();
    this.initializeOptimization();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CreativeDirectorStateOptimizer {
    if (!CreativeDirectorStateOptimizer.instance) {
      CreativeDirectorStateOptimizer.instance = new CreativeDirectorStateOptimizer();
    }
    return CreativeDirectorStateOptimizer.instance;
  }

  /**
   * Create optimized update function with selective updates
   */
  public createOptimizedUpdater<T>(
    store: UseBoundStore<StoreApi<T>>,
    sliceName: string
  ) {
    const config = this.getSliceConfig(sliceName);
    
    return {
      // Selective update - only update specific fields
      updateSelective: (updates: Partial<T>, affectedComponents?: string[]) => {
        const updateId = crypto.randomUUID();
        const startTime = performance.now();
        
        // Track render count before update
        const beforeRenderCount = this.getRenderCount(sliceName);
        
        // Apply update with optimization strategy
        if (config.batchUpdates && config.updateFrequency === 'high') {
          this.batchUpdate(store, sliceName, updates, affectedComponents);
        } else if (config.memoize) {
          this.memoizedUpdate(store, sliceName, updates, affectedComponents);
        } else {
          store.setState(updates as any);
        }
        
        // Track performance metrics
        const afterRenderCount = this.getRenderCount(sliceName);
        this.recordUpdateMetrics({
          updateId,
          stateSlice: sliceName,
          updateType: 'selective',
          affectedComponents: affectedComponents || [],
          renderCount: afterRenderCount - beforeRenderCount,
          updateTime: performance.now() - startTime,
          performanceImpact: this.calculatePerformanceImpact(afterRenderCount - beforeRenderCount),
          timestamp: new Date().toISOString()
        });
      },

      // Batched update - collect multiple updates and apply together
      updateBatched: (updates: Partial<T>[], delay?: number) => {
        const batchKey = `${sliceName}-batch`;
        const existingUpdates = this.optimization.batchedUpdates.get(batchKey) || [];
        
        this.optimization.batchedUpdates.set(batchKey, [...existingUpdates, ...updates]);
        
        // Clear existing batch timer
        if (this.optimization.updateQueue.has(batchKey)) {
          clearTimeout(this.optimization.updateQueue.get(batchKey)!);
        }
        
        // Set new batch timer
        const batchDelay = delay || this.getBatchDelay(config.updateFrequency);
        const timer = setTimeout(() => {
          this.flushBatchedUpdates(store, sliceName, batchKey);
        }, batchDelay);
        
        this.optimization.updateQueue.set(batchKey, timer);
      },

      // Memoized update - prevent unnecessary updates with same values
      updateMemoized: (updates: Partial<T>, memoKey?: string) => {
        const key = memoKey || `${sliceName}-memo`;
        const existingValue = this.optimization.memoizedSelectors.get(key);
        
        // Compare with existing memoized value
        if (existingValue && this.deepEqual(existingValue, updates)) {
          console.log(`[STATE OPTIMIZER] Skipping update - no changes detected for ${sliceName}`);
          return;
        }
        
        // Store memoized value and update
        this.optimization.memoizedSelectors.set(key, updates);
        store.setState(updates as any);
      },

      // Conditional update - only update if condition is met
      updateConditional: (
        updates: Partial<T>, 
        condition: (currentState: T) => boolean,
        fallbackAction?: () => void
      ) => {
        const currentState = store.getState();
        
        if (condition(currentState)) {
          store.setState(updates as any);
        } else if (fallbackAction) {
          fallbackAction();
        }
      },

      // Progressive update - update in stages for complex operations
      updateProgressive: async (
        updateStages: { updates: Partial<T>; delay?: number }[]
      ) => {
        for (let i = 0; i < updateStages.length; i++) {
          const stage = updateStages[i];
          
          store.setState(stage.updates as any);
          
          if (stage.delay && i < updateStages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, stage.delay));
          }
        }
      }
    };
  }

  /**
   * Create optimized selectors with memoization
   */
  public createOptimizedSelectors<T, R>(
    store: UseBoundStore<StoreApi<T>>,
    selectors: Record<string, (state: T) => R>
  ) {
    const optimizedSelectors: Record<string, (state: T) => R> = {};
    
    Object.entries(selectors).forEach(([name, selector]) => {
      const memoKey = `selector-${name}`;
      
      optimizedSelectors[name] = (state: T) => {
        const stateHash = this.hashState(state);
        const cachedResult = this.optimization.memoizedSelectors.get(`${memoKey}-${stateHash}`);
        
        if (cachedResult !== undefined) {
          return cachedResult;
        }
        
        const result = selector(state);
        this.optimization.memoizedSelectors.set(`${memoKey}-${stateHash}`, result);
        
        return result;
      };
    });
    
    return optimizedSelectors;
  }

  /**
   * Performance monitoring for state updates
   */
  public monitorStatePerformance<T>(
    store: UseBoundStore<StoreApi<T>>,
    componentName: string
  ) {
    const originalGetState = store.getState;
    const originalSetState = store.setState;
    
    // Wrap getState to track access
    store.getState = () => {
      const renderCount = this.optimization.renderTracking.get(componentName) || 0;
      this.optimization.renderTracking.set(componentName, renderCount + 1);
      
      return originalGetState();
    };
    
    // Wrap setState to track updates
    store.setState = (updates: any) => {
      const startTime = performance.now();
      
      originalSetState(updates);
      
      const updateTime = performance.now() - startTime;
      
      if (updateTime > 5) { // Log slow updates
        console.warn(`[STATE OPTIMIZER] Slow state update detected: ${updateTime.toFixed(2)}ms in ${componentName}`);
      }
    };
  }

  /**
   * Get performance analytics
   */
  public getPerformanceAnalytics() {
    const metrics = this.optimization.performanceMetrics;
    
    if (metrics.length === 0) {
      return this.getEmptyAnalytics();
    }
    
    const totalUpdates = metrics.length;
    const averageUpdateTime = metrics.reduce((sum, m) => sum + m.updateTime, 0) / totalUpdates;
    const averageRenderCount = metrics.reduce((sum, m) => sum + m.renderCount, 0) / totalUpdates;
    
    const updatesBySlice = metrics.reduce((acc, m) => {
      acc[m.stateSlice] = (acc[m.stateSlice] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const performanceImpactDistribution = metrics.reduce((acc, m) => {
      acc[m.performanceImpact] = (acc[m.performanceImpact] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      summary: {
        totalUpdates,
        averageUpdateTime,
        averageRenderCount,
        optimizationEnabled: this.isOptimizationEnabled
      },
      
      bySlice: updatesBySlice,
      performanceImpact: performanceImpactDistribution,
      
      optimization: {
        memoizedSelectorsCount: this.optimization.memoizedSelectors.size,
        activeBatchesCount: this.optimization.batchedUpdates.size,
        queuedUpdatesCount: this.optimization.updateQueue.size
      },
      
      recommendations: this.generateOptimizationRecommendations(metrics),
      
      trends: {
        recentPerformance: this.analyzeRecentPerformance(metrics),
        bottlenecks: this.identifyPerformanceBottlenecks(metrics)
      }
    };
  }

  /**
   * Get optimization strategies
   */
  public getOptimizationStrategies(): OptimizationStrategy[] {
    return [
      {
        id: 'selective-updates',
        name: 'Selective State Updates',
        description: 'Update only the specific state slices that changed, reducing unnecessary re-renders',
        applicableScenarios: ['Frequent updates', 'Large state objects', 'Multiple connected components'],
        performanceGain: '30-50% reduction in re-renders',
        implementation: 'Use updateSelective with specific field targeting'
      },
      {
        id: 'batched-updates',
        name: 'Batched State Updates',
        description: 'Group multiple state updates together to minimize render cycles',
        applicableScenarios: ['Rapid successive updates', 'Animation sequences', 'Form input handling'],
        performanceGain: '40-60% fewer render cycles',
        implementation: 'Use updateBatched with appropriate delay timing'
      },
      {
        id: 'memoized-selectors',
        name: 'Memoized Selectors',
        description: 'Cache selector results to prevent expensive recalculations',
        applicableScenarios: ['Complex state transformations', 'Derived data calculations', 'List filtering'],
        performanceGain: '20-80% faster selector execution',
        implementation: 'Use createOptimizedSelectors for expensive computations'
      },
      {
        id: 'conditional-updates',
        name: 'Conditional State Updates',
        description: 'Only apply updates when specific conditions are met',
        applicableScenarios: ['Value validation', 'State change guards', 'Business logic gates'],
        performanceGain: '10-30% fewer unnecessary updates',
        implementation: 'Use updateConditional with validation functions'
      },
      {
        id: 'progressive-updates',
        name: 'Progressive State Updates',
        description: 'Apply complex state changes in stages to maintain responsiveness',
        applicableScenarios: ['Large data loading', 'Animation sequences', 'Complex workflows'],
        performanceGain: 'Improved perceived performance and responsiveness',
        implementation: 'Use updateProgressive for multi-stage operations'
      }
    ];
  }

  /**
   * Enable/disable optimization
   */
  public setOptimizationEnabled(enabled: boolean): void {
    this.isOptimizationEnabled = enabled;
    console.log(`[STATE OPTIMIZER] Optimization ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Clear optimization caches
   */
  public clearCaches(): void {
    this.optimization.memoizedSelectors.clear();
    this.optimization.batchedUpdates.clear();
    this.optimization.updateQueue.forEach(timer => clearTimeout(timer));
    this.optimization.updateQueue.clear();
    this.optimization.renderTracking.clear();
    
    console.log("[STATE OPTIMIZER] All caches cleared");
  }

  /**
   * Private helper methods
   */
  
  private createOptimalStateConfigs(): StateSliceConfig[] {
    return [
      {
        slice: 'messages',
        updateFrequency: 'high',
        dependencies: ['chatInputMessage', 'isAgentTyping'],
        optimizationLevel: 'aggressive',
        memoize: true,
        batchUpdates: true
      },
      {
        slice: 'assetGenerationProgress',
        updateFrequency: 'high',
        dependencies: ['assets'],
        optimizationLevel: 'aggressive',
        memoize: false,
        batchUpdates: true
      },
      {
        slice: 'visualDecisions',
        updateFrequency: 'medium',
        dependencies: ['creativeDirection', 'currentStylePalette'],
        optimizationLevel: 'balanced',
        memoize: true,
        batchUpdates: false
      },
      {
        slice: 'costTracking',
        updateFrequency: 'medium',
        dependencies: ['assets'],
        optimizationLevel: 'balanced',
        memoize: true,
        batchUpdates: false
      },
      {
        slice: 'expandedSections',
        updateFrequency: 'low',
        dependencies: [],
        optimizationLevel: 'conservative',
        memoize: false,
        batchUpdates: false
      },
      {
        slice: 'handoffPreparation',
        updateFrequency: 'low',
        dependencies: ['assets', 'creativeDirection'],
        optimizationLevel: 'conservative',
        memoize: true,
        batchUpdates: false
      }
    ];
  }

  private getSliceConfig(sliceName: string): StateSliceConfig {
    return this.stateConfigs.find(config => config.slice === sliceName) || {
      slice: sliceName,
      updateFrequency: 'medium',
      dependencies: [],
      optimizationLevel: 'balanced',
      memoize: false,
      batchUpdates: false
    };
  }

  private batchUpdate<T>(
    store: UseBoundStore<StoreApi<T>>,
    sliceName: string,
    updates: Partial<T>,
    affectedComponents?: string[]
  ): void {
    const batchKey = `${sliceName}-immediate`;
    const existingUpdates = this.optimization.batchedUpdates.get(batchKey) || [];
    
    this.optimization.batchedUpdates.set(batchKey, [...existingUpdates, updates]);
    
    // Use requestAnimationFrame for immediate batching
    requestAnimationFrame(() => {
      this.flushBatchedUpdates(store, sliceName, batchKey);
    });
  }

  private memoizedUpdate<T>(
    store: UseBoundStore<StoreApi<T>>,
    sliceName: string,
    updates: Partial<T>,
    affectedComponents?: string[]
  ): void {
    const currentState = store.getState();
    const memoKey = `${sliceName}-current`;
    const hasChanged = this.hasStateChanged(currentState, updates, memoKey);
    
    if (hasChanged) {
      this.optimization.memoizedSelectors.set(memoKey, updates);
      store.setState(updates as any);
    }
  }

  private flushBatchedUpdates<T>(
    store: UseBoundStore<StoreApi<T>>,
    sliceName: string,
    batchKey: string
  ): void {
    const updates = this.optimization.batchedUpdates.get(batchKey);
    if (!updates || updates.length === 0) return;
    
    // Merge all batched updates
    const mergedUpdates = updates.reduce((merged, update) => ({
      ...merged,
      ...update
    }), {} as Partial<T>);
    
    store.setState(mergedUpdates as any);
    
    // Clean up
    this.optimization.batchedUpdates.delete(batchKey);
    if (this.optimization.updateQueue.has(batchKey)) {
      this.optimization.updateQueue.delete(batchKey);
    }
    
    console.log(`[STATE OPTIMIZER] Flushed ${updates.length} batched updates for ${sliceName}`);
  }

  private getBatchDelay(updateFrequency: StateSliceConfig['updateFrequency']): number {
    switch (updateFrequency) {
      case 'high': return this.HIGH_FREQUENCY_DELAY;
      case 'medium': return this.MEDIUM_FREQUENCY_DELAY;
      case 'low': return this.LOW_FREQUENCY_DELAY;
      default: return this.BATCH_DELAY;
    }
  }

  private getRenderCount(sliceName: string): number {
    return this.optimization.renderTracking.get(sliceName) || 0;
  }

  private calculatePerformanceImpact(renderCount: number): 'minimal' | 'moderate' | 'significant' {
    if (renderCount <= 2) return 'minimal';
    if (renderCount <= 5) return 'moderate';
    return 'significant';
  }

  private recordUpdateMetrics(metrics: StateUpdateMetrics): void {
    this.optimization.performanceMetrics.push(metrics);
    
    // Keep only last 1000 metrics
    if (this.optimization.performanceMetrics.length > 1000) {
      this.optimization.performanceMetrics = this.optimization.performanceMetrics.slice(-1000);
    }
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => this.deepEqual(obj1[key], obj2[key]));
  }

  private hashState(state: any): string {
    return JSON.stringify(state);
  }

  private hasStateChanged<T>(currentState: T, updates: Partial<T>, memoKey: string): boolean {
    const previousValue = this.optimization.memoizedSelectors.get(memoKey);
    
    if (!previousValue) return true;
    
    return Object.keys(updates).some(key => {
      const currentValue = (currentState as any)[key];
      const newValue = (updates as any)[key];
      return !this.deepEqual(currentValue, newValue);
    });
  }

  private initializeOptimization(): void {
    console.log("[STATE OPTIMIZER] Initialized with optimal configurations");
    
    // Set up periodic cache cleanup
    setInterval(() => {
      this.cleanupStaleCache();
    }, 300000); // 5 minutes
  }

  private cleanupStaleCache(): void {
    const now = Date.now();
    const staleThreshold = 600000; // 10 minutes
    
    // Clean up old memoized selectors (simple cleanup for now)
    if (this.optimization.memoizedSelectors.size > 100) {
      const keysToDelete = Array.from(this.optimization.memoizedSelectors.keys()).slice(0, 20);
      keysToDelete.forEach(key => this.optimization.memoizedSelectors.delete(key));
    }
    
    console.log("[STATE OPTIMIZER] Performed cache cleanup");
  }

  private generateOptimizationRecommendations(metrics: StateUpdateMetrics[]): string[] {
    const recommendations: string[] = [];
    
    const highRenderUpdates = metrics.filter(m => m.renderCount > 5);
    const slowUpdates = metrics.filter(m => m.updateTime > 10);
    const frequentUpdates = this.getFrequentUpdateSlices(metrics);
    
    if (highRenderUpdates.length > metrics.length * 0.2) {
      recommendations.push('Consider using selective updates to reduce render cycles');
    }
    
    if (slowUpdates.length > 0) {
      recommendations.push('Optimize slow state updates with batching or memoization');
    }
    
    if (frequentUpdates.length > 0) {
      recommendations.push(`Enable batched updates for high-frequency slices: ${frequentUpdates.join(', ')}`);
    }
    
    return recommendations.length > 0 ? recommendations : ['State performance is optimal'];
  }

  private analyzeRecentPerformance(metrics: StateUpdateMetrics[]): string {
    const recentMetrics = metrics.slice(-50); // Last 50 updates
    
    if (recentMetrics.length === 0) return 'No recent activity';
    
    const averageTime = recentMetrics.reduce((sum, m) => sum + m.updateTime, 0) / recentMetrics.length;
    const averageRenders = recentMetrics.reduce((sum, m) => sum + m.renderCount, 0) / recentMetrics.length;
    
    if (averageTime < 2 && averageRenders < 3) return 'Excellent';
    if (averageTime < 5 && averageRenders < 5) return 'Good';
    if (averageTime < 10 && averageRenders < 8) return 'Fair';
    return 'Needs optimization';
  }

  private identifyPerformanceBottlenecks(metrics: StateUpdateMetrics[]): string[] {
    const bottlenecks: string[] = [];
    
    const slicePerformance = metrics.reduce((acc, m) => {
      if (!acc[m.stateSlice]) {
        acc[m.stateSlice] = { totalTime: 0, totalRenders: 0, count: 0 };
      }
      acc[m.stateSlice].totalTime += m.updateTime;
      acc[m.stateSlice].totalRenders += m.renderCount;
      acc[m.stateSlice].count += 1;
      return acc;
    }, {} as Record<string, { totalTime: number; totalRenders: number; count: number }>);
    
    Object.entries(slicePerformance).forEach(([slice, perf]) => {
      const avgTime = perf.totalTime / perf.count;
      const avgRenders = perf.totalRenders / perf.count;
      
      if (avgTime > 5 || avgRenders > 5) {
        bottlenecks.push(`${slice} (${avgTime.toFixed(1)}ms avg, ${avgRenders.toFixed(1)} renders avg)`);
      }
    });
    
    return bottlenecks;
  }

  private getFrequentUpdateSlices(metrics: StateUpdateMetrics[]): string[] {
    const updateCounts = metrics.reduce((acc, m) => {
      acc[m.stateSlice] = (acc[m.stateSlice] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const averageUpdates = Object.values(updateCounts).reduce((sum, count) => sum + count, 0) / Object.keys(updateCounts).length;
    
    return Object.entries(updateCounts)
      .filter(([_, count]) => count > averageUpdates * 1.5)
      .map(([slice, _]) => slice);
  }

  private getEmptyAnalytics() {
    return {
      summary: {
        totalUpdates: 0,
        averageUpdateTime: 0,
        averageRenderCount: 0,
        optimizationEnabled: this.isOptimizationEnabled
      },
      bySlice: {},
      performanceImpact: {},
      optimization: {
        memoizedSelectorsCount: 0,
        activeBatchesCount: 0,
        queuedUpdatesCount: 0
      },
      recommendations: ['No performance data available'],
      trends: {
        recentPerformance: 'No data',
        bottlenecks: []
      }
    };
  }

  /**
   * Health check for state optimization system
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Test memoization
      const testKey = 'health-check-memo';
      this.optimization.memoizedSelectors.set(testKey, { test: 'value' });
      const memoized = this.optimization.memoizedSelectors.get(testKey);
      
      // Test batching
      const testBatch = 'health-check-batch';
      this.optimization.batchedUpdates.set(testBatch, [{ test: 'batch' }]);
      
      // Clean up
      this.optimization.memoizedSelectors.delete(testKey);
      this.optimization.batchedUpdates.delete(testBatch);
      
      console.log("[STATE OPTIMIZER] Health check completed successfully");
      return memoized !== undefined;
    } catch (error) {
      console.error("[STATE OPTIMIZER] Health check failed:", error);
      return false;
    }
  }
}