/**
 * Tests for AlertingService
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { AlertingService, AlertRule } from '@/lib/services/alerting';

// Mock the dependencies
vi.mock('@/lib/services/logger', () => ({
  Logger: {
    getInstance: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      critical: vi.fn(),
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
      })),
      getActiveAlerts: vi.fn(() => []),
      recordCustomMetric: vi.fn(),
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
      getActiveAlerts: vi.fn(() => []),
    }))
  }
}));

describe('AlertingService', () => {
  let alertingService: AlertingService;

  beforeEach(() => {
    vi.clearAllMocks();
    alertingService = AlertingService.getInstance();
  });

  afterEach(() => {
    alertingService.stopMonitoring();
  });

  describe('getInstance', () => {
    test('should return singleton instance', () => {
      const instance1 = AlertingService.getInstance();
      const instance2 = AlertingService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('addRule', () => {
    test('should add alert rule successfully', () => {
      const rule: Omit<AlertRule, 'createdAt' | 'updatedAt'> = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'Test alert rule',
        enabled: true,
        source: 'performance',
        conditions: [
          { metric: 'test_metric', value: 100 }
        ],
        aggregationWindow: 5 * 60 * 1000, // 5 minutes
        threshold: 90,
        operator: 'gt',
        severity: 'high',
        channels: [
          { type: 'console', config: {}, enabled: true }
        ],
        cooldownPeriod: 10 * 60 * 1000, // 10 minutes
        maxAlerts: 5,
        autoResolve: true,
        autoResolveAfter: 15 * 60 * 1000, // 15 minutes
        tags: ['test', 'performance'],
      };

      const ruleId = alertingService.addRule(rule);
      
      expect(ruleId).toBe('test-rule');
      
      const rules = alertingService.getRules();
      const addedRule = rules.find(r => r.id === 'test-rule');
      expect(addedRule).toBeDefined();
      expect(addedRule?.name).toBe('Test Rule');
    });
  });

  describe('removeRule', () => {
    test('should remove alert rule successfully', () => {
      const rule: Omit<AlertRule, 'createdAt' | 'updatedAt'> = {
        id: 'test-rule-remove',
        name: 'Test Rule to Remove',
        description: 'Test alert rule for removal',
        enabled: true,
        source: 'performance',
        conditions: [
          { metric: 'test_metric', value: 100 }
        ],
        aggregationWindow: 5 * 60 * 1000,
        threshold: 90,
        operator: 'gt',
        severity: 'high',
        channels: [
          { type: 'console', config: {}, enabled: true }
        ],
        cooldownPeriod: 10 * 60 * 1000,
        maxAlerts: 5,
        autoResolve: true,
        autoResolveAfter: 15 * 60 * 1000,
        tags: ['test'],
      };

      // Add rule
      alertingService.addRule(rule);
      
      // Remove rule
      const removed = alertingService.removeRule('test-rule-remove');
      expect(removed).toBe(true);
      
      // Verify rule is removed
      const rules = alertingService.getRules();
      const removedRule = rules.find(r => r.id === 'test-rule-remove');
      expect(removedRule).toBeUndefined();
    });

    test('should return false for non-existent rule', () => {
      const removed = alertingService.removeRule('non-existent-rule');
      expect(removed).toBe(false);
    });
  });

  describe('toggleRule', () => {
    test('should enable/disable alert rule', () => {
      const rule: Omit<AlertRule, 'createdAt' | 'updatedAt'> = {
        id: 'test-rule-toggle',
        name: 'Test Rule to Toggle',
        description: 'Test alert rule for toggling',
        enabled: true,
        source: 'performance',
        conditions: [
          { metric: 'test_metric', value: 100 }
        ],
        aggregationWindow: 5 * 60 * 1000,
        threshold: 90,
        operator: 'gt',
        severity: 'high',
        channels: [
          { type: 'console', config: {}, enabled: true }
        ],
        cooldownPeriod: 10 * 60 * 1000,
        maxAlerts: 5,
        autoResolve: true,
        autoResolveAfter: 15 * 60 * 1000,
        tags: ['test'],
      };

      // Add rule
      alertingService.addRule(rule);
      
      // Disable rule
      const toggled = alertingService.toggleRule('test-rule-toggle', false);
      expect(toggled).toBe(true);
      
      // Verify rule is disabled
      const rules = alertingService.getRules();
      const toggledRule = rules.find(r => r.id === 'test-rule-toggle');
      expect(toggledRule?.enabled).toBe(false);
      
      // Enable rule again
      const reToggled = alertingService.toggleRule('test-rule-toggle', true);
      expect(reToggled).toBe(true);
      
      const reToggledRule = rules.find(r => r.id === 'test-rule-toggle');
      expect(reToggledRule?.enabled).toBe(true);
    });
  });

  describe('getRules', () => {
    test('should return all alert rules', () => {
      const rules = alertingService.getRules();
      
      expect(rules).toBeInstanceOf(Array);
      // Should have default rules initialized
      expect(rules.length).toBeGreaterThan(0);
      
      // Verify each rule has required properties
      for (const rule of rules) {
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('name');
        expect(rule).toHaveProperty('description');
        expect(rule).toHaveProperty('enabled');
        expect(rule).toHaveProperty('source');
        expect(rule).toHaveProperty('conditions');
        expect(rule).toHaveProperty('threshold');
        expect(rule).toHaveProperty('operator');
        expect(rule).toHaveProperty('severity');
        expect(rule).toHaveProperty('channels');
        expect(rule).toHaveProperty('createdAt');
        expect(rule).toHaveProperty('updatedAt');
      }
    });
  });

  describe('getActiveAlerts', () => {
    test('should return active alerts', () => {
      const activeAlerts = alertingService.getActiveAlerts();
      
      expect(activeAlerts).toBeInstanceOf(Array);
      
      // If there are active alerts, verify their structure
      for (const alert of activeAlerts) {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('ruleId');
        expect(alert).toHaveProperty('title');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('status');
        expect(alert.status).toBe('active');
        expect(alert).toHaveProperty('triggeredAt');
        expect(alert.triggeredAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('getAlerts', () => {
    test('should return alerts with filtering options', () => {
      const allAlerts = alertingService.getAlerts();
      expect(allAlerts).toBeInstanceOf(Array);
      
      // Test filtering by status
      const activeAlerts = alertingService.getAlerts({ status: 'active' });
      expect(activeAlerts.every(alert => alert.status === 'active')).toBe(true);
      
      // Test limiting results
      const limitedAlerts = alertingService.getAlerts({ limit: 5 });
      expect(limitedAlerts.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getSummary', () => {
    test('should return alerting summary', () => {
      const summary = alertingService.getSummary();
      
      expect(summary).toBeDefined();
      expect(summary).toHaveProperty('totalRules');
      expect(summary).toHaveProperty('activeRules');
      expect(summary).toHaveProperty('totalAlerts');
      expect(summary).toHaveProperty('activeAlerts');
      expect(summary).toHaveProperty('alertsBySource');
      expect(summary).toHaveProperty('alertsBySeverity');
      expect(summary).toHaveProperty('recentAlerts');
      expect(summary).toHaveProperty('topRules');
      
      expect(summary.totalRules).toBeGreaterThanOrEqual(0);
      expect(summary.activeRules).toBeGreaterThanOrEqual(0);
      expect(summary.totalAlerts).toBeGreaterThanOrEqual(0);
      expect(summary.activeAlerts).toBeGreaterThanOrEqual(0);
      expect(summary.recentAlerts).toBeInstanceOf(Array);
      expect(summary.topRules).toBeInstanceOf(Array);
    });
  });

  describe('updateConfig', () => {
    test('should update alerting configuration', () => {
      const newConfig = {
        enabled: true,
        maxAlertsPerRule: 20,
        maxTotalAlerts: 200,
      };
      
      expect(() => {
        alertingService.updateConfig(newConfig);
      }).not.toThrow();
      
      const config = alertingService.getConfig();
      expect(config.maxAlertsPerRule).toBe(20);
      expect(config.maxTotalAlerts).toBe(200);
    });
  });

  describe('healthCheck', () => {
    test('should perform health check', () => {
      const isHealthy = alertingService.healthCheck();
      expect(typeof isHealthy).toBe('boolean');
    });
  });

  describe('getStats', () => {
    test('should return service statistics', () => {
      const stats = alertingService.getStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('enabled');
      expect(stats).toHaveProperty('totalRules');
      expect(stats).toHaveProperty('activeRules');
      expect(stats).toHaveProperty('totalAlerts');
      expect(stats).toHaveProperty('activeAlerts');
      expect(stats).toHaveProperty('notificationsSent');
      expect(stats).toHaveProperty('evaluationInterval');
      
      expect(typeof stats.enabled).toBe('boolean');
      expect(stats.totalRules).toBeGreaterThanOrEqual(0);
      expect(stats.activeRules).toBeGreaterThanOrEqual(0);
      expect(stats.totalAlerts).toBeGreaterThanOrEqual(0);
      expect(stats.activeAlerts).toBeGreaterThanOrEqual(0);
      expect(stats.notificationsSent).toBeGreaterThanOrEqual(0);
    });
  });

  describe('default rules', () => {
    test('should have default rules configured', () => {
      const rules = alertingService.getRules();
      
      // Should have default rules for common scenarios
      const expectedRules = [
        'high-error-rate',
        'slow-response-time',
        'budget-exceeded',
        'security-critical-events',
        'high-memory-usage'
      ];
      
      for (const expectedRuleId of expectedRules) {
        const rule = rules.find(r => r.id === expectedRuleId);
        expect(rule).toBeDefined();
        expect(rule?.enabled).toBeDefined();
      }
    });
  });
});