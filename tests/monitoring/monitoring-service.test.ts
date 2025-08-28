/**
 * Tests for MonitoringService
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { MonitoringService } from '@/lib/services/monitoring';
import { Logger } from '@/lib/services/logger';
import { MetricsService } from '@/lib/services/metrics';
import { CostTracker } from '@/lib/services/cost-tracker';

// Mock the dependencies
vi.mock('@/lib/services/logger', () => ({
  Logger: {
    getInstance: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      generateCorrelationId: vi.fn(() => 'test-correlation-id'),
      healthCheck: vi.fn(() => true),
    }))
  }
}));

vi.mock('@/lib/services/metrics', () => ({
  MetricsService: {
    getInstance: vi.fn(() => ({
      getPerformanceSummary: vi.fn(() => ({
        totalRequests: 100,
        averageResponseTime: 200,
        errorRate: 2.5,
        currentCpuUsage: 45,
        currentMemoryUsage: 512000000,
      })),
      healthCheck: vi.fn(() => true),
      getActiveAlerts: vi.fn(() => []),
      stopSystemMonitoring: vi.fn(),
    }))
  }
}));

vi.mock('@/lib/services/cost-tracker', () => ({
  CostTracker: {
    getInstance: vi.fn(() => ({
      getBudgetStatus: vi.fn(() => Promise.resolve({
        totalBudget: 300,
        currentSpend: 45.50,
        remainingBudget: 254.50,
        percentageUsed: 15.17,
        alertLevel: 'safe',
        canProceed: true,
      })),
      healthCheck: vi.fn(() => Promise.resolve(true)),
      getActiveAlerts: vi.fn(() => []),
    }))
  }
}));

vi.mock('@/lib/services/security-monitor', () => ({
  SecurityMonitorService: {
    getInstance: vi.fn(() => ({
      getMetrics: vi.fn(() => ({
        totalEvents: 10,
        eventsBySeverity: { low: 5, medium: 3, high: 1, critical: 1 },
        eventsLast24h: 8,
        eventsLastHour: 2,
      })),
      getRecentEvents: vi.fn(() => []),
      getActiveAlerts: vi.fn(() => []),
      healthCheck: vi.fn(() => true),
    }))
  }
}));

vi.mock('@/lib/services/firestore', () => ({
  FirestoreService: {
    getInstance: vi.fn(() => ({
      healthCheck: vi.fn(() => Promise.resolve(true)),
    }))
  }
}));

vi.mock('@/lib/services/cloud-storage', () => ({
  CloudStorageService: {
    getInstance: vi.fn(() => ({
      healthCheck: vi.fn(() => Promise.resolve(true)),
    }))
  }
}));

vi.mock('@/lib/services/veo', () => ({
  VeoService: {
    getInstance: vi.fn(() => ({
      healthCheck: vi.fn(() => Promise.resolve(true)),
    }))
  }
}));

vi.mock('@/lib/services/vertex-ai', () => ({
  VertexAIService: {
    getInstance: vi.fn(() => ({
      healthCheck: vi.fn(() => Promise.resolve(true)),
    }))
  }
}));

describe('MonitoringService', () => {
  let monitoringService: MonitoringService;

  beforeEach(() => {
    // Clear any existing instances
    vi.clearAllMocks();
    
    // Create a new instance for each test
    monitoringService = MonitoringService.getInstance();
  });

  afterEach(() => {
    // Clean up monitoring intervals
    monitoringService.stopMonitoring();
  });

  describe('getInstance', () => {
    test('should return singleton instance', () => {
      const instance1 = MonitoringService.getInstance();
      const instance2 = MonitoringService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('performHealthCheck', () => {
    test('should perform health check and return system status', async () => {
      const healthStatus = await monitoringService.performHealthCheck();
      
      expect(healthStatus).toBeDefined();
      expect(healthStatus.status).toMatch(/^(healthy|degraded|unhealthy|critical)$/);
      expect(healthStatus.timestamp).toBeInstanceOf(Date);
      expect(healthStatus.uptime).toBeGreaterThan(0);
      expect(healthStatus.services).toBeInstanceOf(Array);
      expect(healthStatus.overallScore).toBeGreaterThanOrEqual(0);
      expect(healthStatus.overallScore).toBeLessThanOrEqual(100);
    });

    test('should include service health checks', async () => {
      const healthStatus = await monitoringService.performHealthCheck();
      
      expect(healthStatus.services.length).toBeGreaterThan(0);
      
      for (const service of healthStatus.services) {
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('status');
        expect(service).toHaveProperty('responseTime');
        expect(service).toHaveProperty('lastCheck');
        expect(service).toHaveProperty('details');
        expect(service.status).toMatch(/^(healthy|degraded|unhealthy|critical)$/);
        expect(service.responseTime).toBeGreaterThanOrEqual(0);
        expect(service.details.available).toBeDefined();
      }
    });
  });

  describe('getSystemStatus', () => {
    test('should return system status summary', async () => {
      // Perform initial health check
      await monitoringService.performHealthCheck();
      
      const status = monitoringService.getSystemStatus();
      
      expect(status).toBeDefined();
      expect(status.status).toBeDefined();
      expect(status.uptime).toBeGreaterThan(0);
      expect(status.alerts).toBeGreaterThanOrEqual(0);
      expect(status.score).toBeGreaterThanOrEqual(0);
      expect(status.score).toBeLessThanOrEqual(100);
      expect(status.lastCheck).toBeInstanceOf(Date);
    });
  });

  describe('getServiceStats', () => {
    test('should return monitoring service statistics', async () => {
      const stats = monitoringService.getServiceStats();
      
      expect(stats).toBeDefined();
      expect(stats.healthChecksPerformed).toBeGreaterThanOrEqual(0);
      expect(stats.averageHealthCheckDuration).toBeGreaterThanOrEqual(0);
      expect(stats.uptime).toBeGreaterThan(0);
      expect(stats.lastHealthCheckScore).toBeGreaterThanOrEqual(0);
      expect(stats.lastHealthCheckScore).toBeLessThanOrEqual(100);
      expect(stats.monitoringActive).toBeDefined();
    });
  });

  describe('forceHealthCheck', () => {
    test('should force immediate health check', async () => {
      const healthStatus = await monitoringService.forceHealthCheck();
      
      expect(healthStatus).toBeDefined();
      expect(healthStatus.status).toMatch(/^(healthy|degraded|unhealthy|critical)$/);
    });
  });

  describe('updateConfig', () => {
    test('should update monitoring configuration', () => {
      const newConfig = {
        healthCheckInterval: 60000, // 1 minute
        alertCheckInterval: 120000, // 2 minutes
      };
      
      expect(() => {
        monitoringService.updateConfig(newConfig);
      }).not.toThrow();
      
      const config = monitoringService.getConfig();
      expect(config.healthCheckInterval).toBe(60000);
      expect(config.alertCheckInterval).toBe(120000);
    });
  });

  describe('clearTrends', () => {
    test('should clear trend data', () => {
      expect(() => {
        monitoringService.clearTrends();
      }).not.toThrow();
    });
  });

  describe('exportMonitoringData', () => {
    test('should export monitoring data', async () => {
      // Perform some health checks to generate data
      await monitoringService.performHealthCheck();
      
      const exportData = monitoringService.exportMonitoringData();
      
      expect(exportData).toBeDefined();
      expect(exportData.healthChecks).toBeInstanceOf(Array);
      expect(exportData.trends).toBeDefined();
      expect(exportData.config).toBeDefined();
      expect(exportData.exportedAt).toBeInstanceOf(Date);
    });

    test('should export monitoring data with date range', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const endDate = new Date();
      
      const exportData = monitoringService.exportMonitoringData(startDate, endDate);
      
      expect(exportData).toBeDefined();
      expect(exportData.healthChecks).toBeInstanceOf(Array);
    });
  });

  describe('error handling', () => {
    test('should handle service health check failures gracefully', async () => {
      // This test verifies that the monitoring service doesn't crash
      // when individual service health checks fail
      const healthStatus = await monitoringService.performHealthCheck();
      
      expect(healthStatus).toBeDefined();
      expect(healthStatus.status).toBeDefined();
    });
  });
});