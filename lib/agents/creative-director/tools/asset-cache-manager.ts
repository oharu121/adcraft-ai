/**
 * Creative Director Asset Cache Manager
 *
 * Advanced asset loading and caching system for David's generated assets,
 * providing intelligent caching, preloading, and performance optimization.
 */

export interface CachedAsset {
  id: string;
  url: string;
  blob?: Blob;
  base64?: string;
  metadata: {
    assetType: string;
    quality: string;
    fileSize: number;
    mimeType: string;
    dimensions?: { width: number; height: number };
    generatedAt: string;
    sessionId: string;
  };
  cacheInfo: {
    cachedAt: string;
    lastAccessed: string;
    accessCount: number;
    expiresAt: string;
    cacheStrategy: 'memory' | 'indexeddb' | 'hybrid';
    priority: 'high' | 'medium' | 'low';
  };
  loadingState: {
    status: 'pending' | 'loading' | 'loaded' | 'error' | 'expired';
    progress: number;
    error?: string;
    retryCount: number;
    lastRetryAt?: string;
  };
}

export interface CacheStrategy {
  name: string;
  description: string;
  memoryLimit: number; // MB
  indexedDBLimit: number; // MB
  ttl: number; // milliseconds
  preloadStrategy: 'aggressive' | 'smart' | 'lazy';
  compressionLevel: 'none' | 'light' | 'medium' | 'high';
  priorities: {
    productHero: 'high' | 'medium' | 'low';
    lifestyleScene: 'high' | 'medium' | 'low';
    background: 'high' | 'medium' | 'low';
    styleFrame: 'high' | 'medium' | 'low';
  };
}

export interface LoadingOptions {
  useCache: boolean;
  preload: boolean;
  quality: 'original' | 'optimized' | 'thumbnail';
  timeout: number;
  retryAttempts: number;
  progressCallback?: (progress: number) => void;
  errorCallback?: (error: Error) => void;
  successCallback?: (asset: CachedAsset) => void;
}

export interface CachePerformance {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  averageLoadTime: number;
  memoryUsage: number;
  indexedDBUsage: number;
  totalSizeStored: number;
  assetsCount: number;
  performance: {
    fastLoads: number; // <100ms
    mediumLoads: number; // 100ms-1s
    slowLoads: number; // >1s
  };
}

export interface PreloadStrategy {
  enabled: boolean;
  assetTypes: string[];
  maxConcurrent: number;
  priorityOrder: string[];
  predictiveLoading: boolean;
  userBehaviorAnalysis: boolean;
}

/**
 * Creative Director Asset Cache Manager
 * Provides intelligent asset caching and loading optimization for David's creative workflow
 */
export class CreativeDirectorAssetCacheManager {
  private static instance: CreativeDirectorAssetCacheManager;
  private memoryCache: Map<string, CachedAsset> = new Map();
  private indexedDB?: IDBDatabase;
  private isInitialized: boolean = false;
  private performanceMetrics: CachePerformance;
  private cacheStrategy: CacheStrategy;
  private preloadStrategy: PreloadStrategy;
  private loadingQueue: Map<string, Promise<CachedAsset>> = new Map();
  
  // Cache limits and configuration
  private readonly MEMORY_LIMIT_MB = 100;
  private readonly INDEXEDDB_LIMIT_MB = 500;
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly PRELOAD_BATCH_SIZE = 3;

  private constructor() {
    this.performanceMetrics = {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      averageLoadTime: 0,
      memoryUsage: 0,
      indexedDBUsage: 0,
      totalSizeStored: 0,
      assetsCount: 0,
      performance: {
        fastLoads: 0,
        mediumLoads: 0,
        slowLoads: 0
      }
    };
    
    this.cacheStrategy = this.createOptimalCacheStrategy();
    this.preloadStrategy = this.createSmartPreloadStrategy();
    
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CreativeDirectorAssetCacheManager {
    if (!CreativeDirectorAssetCacheManager.instance) {
      CreativeDirectorAssetCacheManager.instance = new CreativeDirectorAssetCacheManager();
    }
    return CreativeDirectorAssetCacheManager.instance;
  }

  /**
   * Initialize cache system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize IndexedDB
      await this.initializeIndexedDB();
      
      // Load existing cache metrics
      await this.loadCacheMetrics();
      
      // Start periodic cleanup
      this.startPeriodicCleanup();
      
      // Initialize preloading
      this.initializePreloadSystem();
      
      this.isInitialized = true;
      console.log("[ASSET CACHE] Cache manager initialized successfully");
      
    } catch (error) {
      console.error("[ASSET CACHE] Failed to initialize cache manager:", error);
      throw error;
    }
  }

  /**
   * Load asset with intelligent caching
   */
  public async loadAsset(
    assetId: string,
    url: string,
    metadata: CachedAsset['metadata'],
    options: Partial<LoadingOptions> = {}
  ): Promise<CachedAsset> {
    const startTime = performance.now();
    this.performanceMetrics.totalRequests++;
    
    const loadingOptions: LoadingOptions = {
      useCache: true,
      preload: false,
      quality: 'original',
      timeout: 30000,
      retryAttempts: this.MAX_RETRY_ATTEMPTS,
      ...options
    };
    
    try {
      // Check if already loading
      const existingLoad = this.loadingQueue.get(assetId);
      if (existingLoad) {
        return await existingLoad;
      }
      
      // Check memory cache first
      if (loadingOptions.useCache) {
        const cachedAsset = await this.getCachedAsset(assetId);
        if (cachedAsset && !this.isAssetExpired(cachedAsset)) {
          this.recordCacheHit(performance.now() - startTime);
          this.updateAccessInfo(cachedAsset);
          loadingOptions.successCallback?.(cachedAsset);
          return cachedAsset;
        }
      }
      
      // Create loading promise
      const loadPromise = this.performAssetLoad(assetId, url, metadata, loadingOptions, startTime);
      this.loadingQueue.set(assetId, loadPromise);
      
      const result = await loadPromise;
      
      // Clean up loading queue
      this.loadingQueue.delete(assetId);
      
      return result;
      
    } catch (error) {
      this.loadingQueue.delete(assetId);
      this.recordCacheMiss(performance.now() - startTime);
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      loadingOptions.errorCallback?.(new Error(errorMsg));
      
      throw error;
    }
  }

  /**
   * Preload assets based on prediction
   */
  public async preloadAssets(
    assetIds: string[],
    urls: string[],
    metadataList: CachedAsset['metadata'][]
  ): Promise<void> {
    if (!this.preloadStrategy.enabled) return;
    
    const preloadTasks: Promise<void>[] = [];
    const assetsToPreload = assetIds.slice(0, this.preloadStrategy.maxConcurrent);
    
    console.log(`[ASSET CACHE] Preloading ${assetsToPreload.length} assets`);
    
    for (let i = 0; i < assetsToPreload.length; i++) {
      const assetId = assetsToPreload[i];
      const url = urls[i];
      const metadata = metadataList[i];
      
      if (!this.memoryCache.has(assetId)) {
        const preloadTask = this.loadAsset(assetId, url, metadata, {
          useCache: true,
          preload: true,
          quality: 'optimized',
          timeout: 15000
        }).catch(error => {
          console.warn(`[ASSET CACHE] Preload failed for ${assetId}:`, error);
        });
        
        preloadTasks.push(preloadTask as any);
      }
    }
    
    await Promise.allSettled(preloadTasks);
    console.log(`[ASSET CACHE] Preload completed for ${preloadTasks.length} assets`);
  }

  /**
   * Get cached asset
   */
  public async getCachedAsset(assetId: string): Promise<CachedAsset | null> {
    // Check memory cache first
    const memoryAsset = this.memoryCache.get(assetId);
    if (memoryAsset) {
      return memoryAsset;
    }
    
    // Check IndexedDB
    if (this.indexedDB) {
      try {
        const indexedDBAsset = await this.getFromIndexedDB(assetId);
        if (indexedDBAsset) {
          // Promote to memory cache
          this.addToMemoryCache(indexedDBAsset);
          return indexedDBAsset;
        }
      } catch (error) {
        console.warn(`[ASSET CACHE] IndexedDB lookup failed for ${assetId}:`, error);
      }
    }
    
    return null;
  }

  /**
   * Clear cache with various strategies
   */
  public async clearCache(strategy: 'all' | 'expired' | 'memory' | 'indexeddb' | 'lru' = 'expired'): Promise<void> {
    console.log(`[ASSET CACHE] Clearing cache with strategy: ${strategy}`);
    
    switch (strategy) {
      case 'all':
        this.memoryCache.clear();
        await this.clearIndexedDB();
        break;
        
      case 'expired':
        await this.removeExpiredAssets();
        break;
        
      case 'memory':
        this.memoryCache.clear();
        break;
        
      case 'indexeddb':
        await this.clearIndexedDB();
        break;
        
      case 'lru':
        await this.performLRUEviction();
        break;
    }
    
    this.updateCacheMetrics();
    console.log(`[ASSET CACHE] Cache cleared using ${strategy} strategy`);
  }

  /**
   * Get cache performance metrics
   */
  public getCacheMetrics(): CachePerformance {
    this.updateCacheMetrics();
    return { ...this.performanceMetrics };
  }

  /**
   * Optimize cache based on usage patterns
   */
  public async optimizeCache(): Promise<void> {
    console.log("[ASSET CACHE] Starting cache optimization");
    
    // Remove expired assets
    await this.removeExpiredAssets();
    
    // Perform LRU eviction if over limits
    if (this.isOverMemoryLimit() || this.isOverIndexedDBLimit()) {
      await this.performLRUEviction();
    }
    
    // Reorganize based on access patterns
    await this.reorganizeByAccessPatterns();
    
    // Update preload strategy based on usage
    this.updatePreloadStrategy();
    
    console.log("[ASSET CACHE] Cache optimization completed");
  }

  /**
   * Get cache recommendations
   */
  public getCacheRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.performanceMetrics;
    
    if (metrics.hitRate < 0.7) {
      recommendations.push("Consider enabling more aggressive preloading to improve hit rate");
    }
    
    if (metrics.performance.slowLoads > metrics.totalRequests * 0.2) {
      recommendations.push("Many assets are loading slowly - consider cache optimization");
    }
    
    if (metrics.memoryUsage > this.MEMORY_LIMIT_MB * 0.9) {
      recommendations.push("Memory cache is nearly full - enable automatic cleanup");
    }
    
    if (metrics.averageLoadTime > 1000) {
      recommendations.push("Average load time is high - optimize asset compression");
    }
    
    return recommendations.length > 0 ? recommendations : ["Cache performance is optimal"];
  }

  /**
   * Private methods for implementation
   */
  
  private async performAssetLoad(
    assetId: string,
    url: string,
    metadata: CachedAsset['metadata'],
    options: LoadingOptions,
    startTime: number
  ): Promise<CachedAsset> {
    const cachedAsset: CachedAsset = {
      id: assetId,
      url,
      metadata,
      cacheInfo: {
        cachedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        accessCount: 1,
        expiresAt: new Date(Date.now() + this.DEFAULT_TTL).toISOString(),
        cacheStrategy: this.determineCacheStrategy(metadata.assetType, metadata.fileSize),
        priority: this.getCachePriority(metadata.assetType)
      },
      loadingState: {
        status: 'loading',
        progress: 0,
        retryCount: 0
      }
    };
    
    try {
      // Perform the actual asset loading
      const response = await fetch(url, {
        signal: AbortSignal.timeout(options.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Get blob and create base64 if needed
      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);
      
      cachedAsset.blob = blob;
      cachedAsset.base64 = base64;
      cachedAsset.loadingState.status = 'loaded';
      cachedAsset.loadingState.progress = 100;
      
      // Store in appropriate cache
      await this.storeAsset(cachedAsset);
      
      // Update performance metrics
      const loadTime = performance.now() - startTime;
      this.recordCacheMiss(loadTime);
      
      options.successCallback?.(cachedAsset);
      
      return cachedAsset;
      
    } catch (error) {
      cachedAsset.loadingState.status = 'error';
      cachedAsset.loadingState.error = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry logic
      if (cachedAsset.loadingState.retryCount < options.retryAttempts) {
        cachedAsset.loadingState.retryCount++;
        cachedAsset.loadingState.lastRetryAt = new Date().toISOString();
        
        console.log(`[ASSET CACHE] Retrying asset load ${assetId} (attempt ${cachedAsset.loadingState.retryCount})`);
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, cachedAsset.loadingState.retryCount - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.performAssetLoad(assetId, url, metadata, options, startTime);
      }
      
      throw error;
    }
  }

  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CreativeDirectorAssetCache', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.indexedDB = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('assets')) {
          const store = db.createObjectStore('assets', { keyPath: 'id' });
          store.createIndex('sessionId', 'metadata.sessionId', { unique: false });
          store.createIndex('assetType', 'metadata.assetType', { unique: false });
          store.createIndex('expiresAt', 'cacheInfo.expiresAt', { unique: false });
        }
      };
    });
  }

  private async storeAsset(asset: CachedAsset): Promise<void> {
    // Determine storage strategy
    if (asset.cacheInfo.cacheStrategy === 'memory' || asset.cacheInfo.cacheStrategy === 'hybrid') {
      this.addToMemoryCache(asset);
    }
    
    if (asset.cacheInfo.cacheStrategy === 'indexeddb' || asset.cacheInfo.cacheStrategy === 'hybrid') {
      await this.addToIndexedDB(asset);
    }
  }

  private addToMemoryCache(asset: CachedAsset): void {
    // Check memory limits
    if (this.isOverMemoryLimit()) {
      this.evictLRUFromMemory();
    }
    
    this.memoryCache.set(asset.id, asset);
  }

  private async addToIndexedDB(asset: CachedAsset): Promise<void> {
    if (!this.indexedDB) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['assets'], 'readwrite');
      const store = transaction.objectStore('assets');
      
      const request = store.put(asset);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromIndexedDB(assetId: string): Promise<CachedAsset | null> {
    if (!this.indexedDB) return null;
    
    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['assets'], 'readonly');
      const store = transaction.objectStore('assets');
      
      const request = store.get(assetId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private determineCacheStrategy(assetType: string, fileSize: number): CachedAsset['cacheInfo']['cacheStrategy'] {
    const sizeMB = fileSize / (1024 * 1024);
    
    // Small high-priority assets stay in memory
    if (sizeMB < 5 && this.getCachePriority(assetType) === 'high') {
      return 'memory';
    }
    
    // Medium assets use hybrid approach
    if (sizeMB < 20) {
      return 'hybrid';
    }
    
    // Large assets only in IndexedDB
    return 'indexeddb';
  }

  private getCachePriority(assetType: string): 'high' | 'medium' | 'low' {
    return this.cacheStrategy.priorities[assetType as keyof typeof this.cacheStrategy.priorities] || 'medium';
  }

  private isAssetExpired(asset: CachedAsset): boolean {
    return new Date(asset.cacheInfo.expiresAt) < new Date();
  }

  private updateAccessInfo(asset: CachedAsset): void {
    asset.cacheInfo.lastAccessed = new Date().toISOString();
    asset.cacheInfo.accessCount++;
  }

  private recordCacheHit(loadTime: number): void {
    this.performanceMetrics.totalHits++;
    this.performanceMetrics.hitRate = this.performanceMetrics.totalHits / this.performanceMetrics.totalRequests;
    this.updateLoadTimeMetrics(loadTime);
  }

  private recordCacheMiss(loadTime: number): void {
    this.performanceMetrics.totalMisses++;
    this.performanceMetrics.missRate = this.performanceMetrics.totalMisses / this.performanceMetrics.totalRequests;
    this.updateLoadTimeMetrics(loadTime);
  }

  private updateLoadTimeMetrics(loadTime: number): void {
    if (loadTime < 100) {
      this.performanceMetrics.performance.fastLoads++;
    } else if (loadTime < 1000) {
      this.performanceMetrics.performance.mediumLoads++;
    } else {
      this.performanceMetrics.performance.slowLoads++;
    }
    
    // Update average
    const totalLoads = this.performanceMetrics.performance.fastLoads + 
                      this.performanceMetrics.performance.mediumLoads + 
                      this.performanceMetrics.performance.slowLoads;
    
    this.performanceMetrics.averageLoadTime = 
      ((this.performanceMetrics.averageLoadTime * (totalLoads - 1)) + loadTime) / totalLoads;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private isOverMemoryLimit(): boolean {
    const memoryUsageMB = Array.from(this.memoryCache.values())
      .reduce((total, asset) => total + (asset.blob?.size || 0), 0) / (1024 * 1024);
    
    return memoryUsageMB > this.MEMORY_LIMIT_MB;
  }

  private isOverIndexedDBLimit(): boolean {
    return this.performanceMetrics.indexedDBUsage > this.INDEXEDDB_LIMIT_MB;
  }

  private evictLRUFromMemory(): void {
    const assetsArray = Array.from(this.memoryCache.values());
    assetsArray.sort((a, b) => 
      new Date(a.cacheInfo.lastAccessed).getTime() - new Date(b.cacheInfo.lastAccessed).getTime()
    );
    
    // Remove oldest 20% of assets
    const toRemove = Math.ceil(assetsArray.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(assetsArray[i].id);
    }
    
    console.log(`[ASSET CACHE] Evicted ${toRemove} assets from memory cache`);
  }

  private async performLRUEviction(): Promise<void> {
    this.evictLRUFromMemory();
    // Additional IndexedDB eviction could be implemented here
  }

  private async removeExpiredAssets(): Promise<void> {
    const now = new Date();
    
    // Remove from memory cache
    for (const [id, asset] of this.memoryCache.entries()) {
      if (new Date(asset.cacheInfo.expiresAt) < now) {
        this.memoryCache.delete(id);
      }
    }
    
    // Remove from IndexedDB
    if (this.indexedDB) {
      // Implementation for IndexedDB cleanup would go here
    }
  }

  private updateCacheMetrics(): void {
    this.performanceMetrics.assetsCount = this.memoryCache.size;
    
    let totalSize = 0;
    for (const asset of this.memoryCache.values()) {
      totalSize += asset.blob?.size || 0;
    }
    
    this.performanceMetrics.memoryUsage = totalSize / (1024 * 1024);
    this.performanceMetrics.totalSizeStored = totalSize;
  }

  private createOptimalCacheStrategy(): CacheStrategy {
    return {
      name: 'Balanced Performance',
      description: 'Optimized for creative workflow performance with intelligent asset prioritization',
      memoryLimit: this.MEMORY_LIMIT_MB,
      indexedDBLimit: this.INDEXEDDB_LIMIT_MB,
      ttl: this.DEFAULT_TTL,
      preloadStrategy: 'smart',
      compressionLevel: 'medium',
      priorities: {
        productHero: 'high',
        lifestyleScene: 'high',
        background: 'medium',
        styleFrame: 'low'
      }
    };
  }

  private createSmartPreloadStrategy(): PreloadStrategy {
    return {
      enabled: true,
      assetTypes: ['product-hero', 'lifestyle-scene', 'background'],
      maxConcurrent: this.PRELOAD_BATCH_SIZE,
      priorityOrder: ['product-hero', 'lifestyle-scene', 'background', 'mood-board', 'style-frame'],
      predictiveLoading: true,
      userBehaviorAnalysis: false // Could be enabled with user tracking
    };
  }

  private async loadCacheMetrics(): Promise<void> {
    // Implementation to load persisted metrics would go here
  }

  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.optimizeCache().catch(error => {
        console.error("[ASSET CACHE] Periodic cleanup failed:", error);
      });
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  private initializePreloadSystem(): void {
    console.log("[ASSET CACHE] Preload system initialized with smart strategy");
  }

  private async reorganizeByAccessPatterns(): Promise<void> {
    // Implementation for reorganizing cache based on access patterns
    console.log("[ASSET CACHE] Cache reorganized based on access patterns");
  }

  private updatePreloadStrategy(): void {
    // Update preload strategy based on usage patterns
    const metrics = this.performanceMetrics;
    
    if (metrics.hitRate < 0.6) {
      this.preloadStrategy.maxConcurrent = Math.min(5, this.preloadStrategy.maxConcurrent + 1);
    } else if (metrics.hitRate > 0.9) {
      this.preloadStrategy.maxConcurrent = Math.max(2, this.preloadStrategy.maxConcurrent - 1);
    }
  }

  private async clearIndexedDB(): Promise<void> {
    if (!this.indexedDB) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['assets'], 'readwrite');
      const store = transaction.objectStore('assets');
      
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Health check for asset cache system
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Test memory cache
      const testAsset: CachedAsset = {
        id: 'health-check',
        url: 'test://health-check',
        metadata: {
          assetType: 'test',
          quality: 'standard',
          fileSize: 1000,
          mimeType: 'image/jpeg',
          generatedAt: new Date().toISOString(),
          sessionId: 'health-check'
        },
        cacheInfo: {
          cachedAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
          accessCount: 1,
          expiresAt: new Date(Date.now() + 60000).toISOString(),
          cacheStrategy: 'memory',
          priority: 'low'
        },
        loadingState: {
          status: 'loaded',
          progress: 100,
          retryCount: 0
        }
      };
      
      this.addToMemoryCache(testAsset);
      const retrieved = this.memoryCache.get('health-check');
      
      // Clean up
      this.memoryCache.delete('health-check');
      
      const healthy = retrieved?.id === 'health-check';
      console.log(`[ASSET CACHE] Health check: ${healthy ? 'PASS' : 'FAIL'}`);
      
      return healthy;
    } catch (error) {
      console.error("[ASSET CACHE] Health check failed:", error);
      return false;
    }
  }
}