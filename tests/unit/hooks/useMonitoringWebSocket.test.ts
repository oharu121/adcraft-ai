import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMonitoringWebSocket } from '../../../hooks/useMonitoringWebSocket'

// Mock EventSource
const mockEventSource = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
  readyState: 1, // OPEN
  url: '/api/ws/monitoring',
  withCredentials: false
}

const mockEventSourceConstructor = vi.fn(() => mockEventSource)

// Global setup for EventSource mock
beforeEach(() => {
  global.EventSource = mockEventSourceConstructor as any
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useMonitoringWebSocket', () => {
  const mockConfig = {
    url: '/api/ws/monitoring',
    reconnectAttempts: 3,
    reconnectInterval: 1000,
    heartbeatInterval: 30000,
    onHealthChange: vi.fn(),
    onBudgetUpdate: vi.fn(),
    onNewAlert: vi.fn(),
    onMetricsUpdate: vi.fn(),
    onError: vi.fn(),
    enabled: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockEventSource.readyState = 1 // OPEN
  })

  describe('Connection Management', () => {
    it('establishes EventSource connection on mount when enabled', () => {
      renderHook(() => useMonitoringWebSocket(mockConfig))

      expect(mockEventSourceConstructor).toHaveBeenCalledWith('/api/ws/monitoring')
      expect(mockEventSource.addEventListener).toHaveBeenCalledWith('open', expect.any(Function))
      expect(mockEventSource.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
      expect(mockEventSource.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    })

    it('does not connect when enabled is false', () => {
      renderHook(() => useMonitoringWebSocket({ ...mockConfig, enabled: false }))

      expect(mockEventSourceConstructor).not.toHaveBeenCalled()
    })

    it('closes connection on unmount', () => {
      const { unmount } = renderHook(() => useMonitoringWebSocket(mockConfig))

      unmount()

      expect(mockEventSource.close).toHaveBeenCalled()
    })

    it('returns correct connection state', () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      expect(result.current.isConnected).toBe(true)
      expect(result.current.connectionStatus).toBe('connected')
      expect(result.current.readyState).toBe(1)
    })
  })

  describe('Event Handling', () => {
    it('handles health-change events correctly', () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      const healthChangeEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'health-change',
          data: { overallScore: 85, service: 'Vertex AI', status: 'degraded' },
          timestamp: '2024-01-01T12:00:00Z'
        })
      })

      // Simulate receiving the event
      const messageHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      act(() => {
        messageHandler(healthChangeEvent)
      })

      expect(mockConfig.onHealthChange).toHaveBeenCalledWith({
        overallScore: 85,
        service: 'Vertex AI',
        status: 'degraded'
      })
    })

    it('handles budget-update events correctly', () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      const budgetUpdateEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'budget-update',
          data: { totalSpent: 175.50, utilization: 58.5 },
          timestamp: '2024-01-01T12:00:00Z'
        })
      })

      const messageHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      act(() => {
        messageHandler(budgetUpdateEvent)
      })

      expect(mockConfig.onBudgetUpdate).toHaveBeenCalledWith({
        totalSpent: 175.50,
        utilization: 58.5
      })
    })

    it('handles new-alert events correctly', () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      const alertEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'new-alert',
          data: { severity: 'critical', message: 'Service down', service: 'Veo API' },
          timestamp: '2024-01-01T12:00:00Z'
        })
      })

      const messageHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      act(() => {
        messageHandler(alertEvent)
      })

      expect(mockConfig.onNewAlert).toHaveBeenCalledWith({
        severity: 'critical',
        message: 'Service down',
        service: 'Veo API'
      })
    })

    it('handles metrics-update events correctly', () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      const metricsEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'metrics-update',
          data: { responseTime: 145, errorRate: 1.2, throughput: 250 },
          timestamp: '2024-01-01T12:00:00Z'
        })
      })

      const messageHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      act(() => {
        messageHandler(metricsEvent)
      })

      expect(mockConfig.onMetricsUpdate).toHaveBeenCalledWith({
        responseTime: 145,
        errorRate: 1.2,
        throughput: 250
      })
    })

    it('ignores unknown event types', () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      const unknownEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'unknown-event',
          data: { some: 'data' },
          timestamp: '2024-01-01T12:00:00Z'
        })
      })

      const messageHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      act(() => {
        messageHandler(unknownEvent)
      })

      expect(mockConfig.onHealthChange).not.toHaveBeenCalled()
      expect(mockConfig.onBudgetUpdate).not.toHaveBeenCalled()
      expect(mockConfig.onNewAlert).not.toHaveBeenCalled()
      expect(mockConfig.onMetricsUpdate).not.toHaveBeenCalled()
    })

    it('handles malformed JSON gracefully', () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      const malformedEvent = new MessageEvent('message', {
        data: 'invalid json'
      })

      const messageHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      act(() => {
        messageHandler(malformedEvent)
      })

      expect(mockConfig.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to parse message')
        })
      )
    })
  })

  describe('Connection State Tracking', () => {
    it('updates connection state on open event', () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      const openHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )?.[1]

      act(() => {
        openHandler(new Event('open'))
      })

      expect(result.current.isConnected).toBe(true)
      expect(result.current.connectionStatus).toBe('connected')
      expect(result.current.reconnectAttempts).toBe(0)
    })

    it('updates connection state on error event', () => {
      mockEventSource.readyState = 2 // CLOSED

      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      const errorHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]

      act(() => {
        errorHandler(new Event('error'))
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.connectionStatus).toBe('disconnected')
      expect(mockConfig.onError).toHaveBeenCalled()
    })
  })

  describe('Reconnection Logic', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('attempts to reconnect on connection failure', async () => {
      mockEventSource.readyState = 3 // CLOSED

      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      const errorHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]

      act(() => {
        errorHandler(new Event('error'))
      })

      expect(result.current.connectionStatus).toBe('reconnecting')

      // Fast-forward past reconnect interval
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockEventSourceConstructor).toHaveBeenCalledTimes(2)
      })
    })

    it('implements exponential backoff for reconnection attempts', () => {
      mockEventSource.readyState = 3 // CLOSED

      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      const errorHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]

      // First reconnection attempt
      act(() => {
        errorHandler(new Event('error'))
        vi.advanceTimersByTime(1000) // Base interval
      })

      // Second reconnection attempt should use 2x interval
      act(() => {
        errorHandler(new Event('error'))
        vi.advanceTimersByTime(2000) // 2 * base interval
      })

      expect(result.current.reconnectAttempts).toBe(2)
    })

    it('stops reconnecting after max attempts reached', () => {
      mockEventSource.readyState = 3 // CLOSED

      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      const errorHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]

      // Simulate max reconnection attempts
      for (let i = 0; i < 3; i++) {
        act(() => {
          errorHandler(new Event('error'))
          vi.advanceTimersByTime(1000 * Math.pow(2, i))
        })
      }

      expect(result.current.connectionStatus).toBe('failed')
      expect(result.current.reconnectAttempts).toBe(3)

      // Should not attempt further reconnections
      act(() => {
        errorHandler(new Event('error'))
        vi.advanceTimersByTime(5000)
      })

      expect(mockEventSourceConstructor).toHaveBeenCalledTimes(3) // No additional calls
    })
  })

  describe('Latency Tracking', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('calculates latency from server timestamps', () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      const metricsEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'metrics-update',
          data: { responseTime: 145 },
          timestamp: '2024-01-01T11:59:58Z' // 2 seconds ago
        })
      })

      const messageHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      act(() => {
        messageHandler(metricsEvent)
      })

      expect(result.current.latency).toBe(2000) // 2 seconds in ms
    })

    it('updates last update timestamp', () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      const initialLastUpdate = result.current.lastUpdate

      const metricsEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'metrics-update',
          data: { responseTime: 145 },
          timestamp: '2024-01-01T12:00:00Z'
        })
      })

      const messageHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      act(() => {
        messageHandler(metricsEvent)
      })

      expect(result.current.lastUpdate).not.toBe(initialLastUpdate)
      expect(new Date(result.current.lastUpdate).getTime()).toBeGreaterThan(
        new Date(initialLastUpdate).getTime()
      )
    })
  })

  describe('Heartbeat Mechanism', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('sends heartbeat messages at configured intervals', () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      // Fast-forward past heartbeat interval
      act(() => {
        vi.advanceTimersByTime(30000)
      })

      expect(result.current.lastHeartbeat).toBeTruthy()
    })

    it('detects connection timeout when heartbeat fails', async () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      // Simulate heartbeat timeout (no response for 2x interval)
      act(() => {
        vi.advanceTimersByTime(60000)
      })

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('reconnecting')
      })
    })
  })

  describe('Manual Connection Control', () => {
    it('allows manual connection', async () => {
      const { result } = renderHook(() => useMonitoringWebSocket({
        ...mockConfig,
        enabled: false
      }))

      expect(result.current.isConnected).toBe(false)

      act(() => {
        result.current.connect()
      })

      expect(mockEventSourceConstructor).toHaveBeenCalledWith('/api/ws/monitoring')
      expect(result.current.isConnected).toBe(true)
    })

    it('allows manual disconnection', () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      expect(result.current.isConnected).toBe(true)

      act(() => {
        result.current.disconnect()
      })

      expect(mockEventSource.close).toHaveBeenCalled()
      expect(result.current.isConnected).toBe(false)
    })

    it('allows manual reconnection', () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      act(() => {
        result.current.disconnect()
      })

      expect(result.current.isConnected).toBe(false)

      act(() => {
        result.current.reconnect()
      })

      expect(mockEventSourceConstructor).toHaveBeenCalledTimes(2)
      expect(result.current.isConnected).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('handles EventSource constructor errors', () => {
      const constructorError = new Error('Failed to create EventSource')
      mockEventSourceConstructor.mockImplementation(() => {
        throw constructorError
      })

      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      expect(result.current.isConnected).toBe(false)
      expect(result.current.connectionStatus).toBe('failed')
      expect(mockConfig.onError).toHaveBeenCalledWith(constructorError)
    })

    it('handles network errors gracefully', () => {
      const { result } = renderHook(() => useMonitoringWebSocket(mockConfig))

      const errorHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]

      const networkError = new Event('error')
      networkError.target = { readyState: 2 } as any

      act(() => {
        errorHandler(networkError)
      })

      expect(result.current.isConnected).toBe(false)
      expect(mockConfig.onError).toHaveBeenCalled()
    })
  })

  describe('Configuration Updates', () => {
    it('reconnects when URL changes', () => {
      const { result, rerender } = renderHook(
        ({ url }) => useMonitoringWebSocket({ ...mockConfig, url }),
        { initialProps: { url: '/api/ws/monitoring' } }
      )

      expect(mockEventSourceConstructor).toHaveBeenCalledWith('/api/ws/monitoring')

      rerender({ url: '/api/ws/monitoring-v2' })

      expect(mockEventSource.close).toHaveBeenCalled()
      expect(mockEventSourceConstructor).toHaveBeenCalledWith('/api/ws/monitoring-v2')
    })

    it('updates event handlers when callbacks change', () => {
      const newOnHealthChange = vi.fn()
      
      const { result, rerender } = renderHook(
        ({ onHealthChange }) => useMonitoringWebSocket({ ...mockConfig, onHealthChange }),
        { initialProps: { onHealthChange: mockConfig.onHealthChange } }
      )

      rerender({ onHealthChange: newOnHealthChange })

      const healthChangeEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'health-change',
          data: { overallScore: 90 },
          timestamp: '2024-01-01T12:00:00Z'
        })
      })

      const messageHandler = mockEventSource.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1]

      act(() => {
        messageHandler(healthChangeEvent)
      })

      expect(newOnHealthChange).toHaveBeenCalledWith({ overallScore: 90 })
      expect(mockConfig.onHealthChange).not.toHaveBeenCalled()
    })
  })

  describe('Memory Management', () => {
    it('cleans up event listeners on unmount', () => {
      const { unmount } = renderHook(() => useMonitoringWebSocket(mockConfig))

      unmount()

      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith('open', expect.any(Function))
      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function))
      expect(mockEventSource.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function))
      expect(mockEventSource.close).toHaveBeenCalled()
    })

    it('clears timers on unmount', () => {
      vi.useFakeTimers()
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      const { unmount } = renderHook(() => useMonitoringWebSocket(mockConfig))

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
      vi.useRealTimers()
    })
  })
})