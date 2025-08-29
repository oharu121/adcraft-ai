import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, createMockFn, userEvent } from '../../../utils'
import { MonitoringDashboard } from '../../../../components/monitoring/MonitoringDashboard'
import * as SWR from 'swr'

// Mock SWR
vi.mock('swr')
const mockSWR = vi.mocked(SWR.default)

// Mock child components
vi.mock('../../../../components/monitoring/overview/SystemStatusOverview', () => ({
  SystemStatusOverview: ({ data, isLoading, error }: any) => (
    <div data-testid="system-status-overview">
      {isLoading ? 'Loading system status...' : error ? 'System status error' : 'System Status Content'}
      {data && <div data-testid="system-data">{JSON.stringify(data)}</div>}
    </div>
  )
}))

vi.mock('../../../../components/monitoring/overview/BudgetOverview', () => ({
  BudgetOverview: ({ data, isLoading, error }: any) => (
    <div data-testid="budget-overview">
      {isLoading ? 'Loading budget...' : error ? 'Budget error' : 'Budget Content'}
      {data && <div data-testid="budget-data">{JSON.stringify(data)}</div>}
    </div>
  )
}))

vi.mock('../../../../hooks/useMonitoringWebSocket', () => ({
  useMonitoringWebSocket: () => ({
    isConnected: true,
    connectionStatus: 'connected',
    latency: 50,
    lastUpdate: new Date().toISOString(),
    connect: vi.fn(),
    disconnect: vi.fn()
  })
}))

describe('MonitoringDashboard', () => {
  const mockDictionary = {
    monitoring: {
      title: 'System Monitoring',
      refresh: 'Refresh',
      autoRefresh: 'Auto Refresh',
      lastUpdated: 'Last Updated',
      connectionStatus: 'Connection Status',
      connected: 'Connected',
      disconnected: 'Disconnected',
      latency: 'Latency',
      systemHealth: 'System Health',
      budgetOverview: 'Budget Overview',
      loading: 'Loading monitoring data...',
      error: 'Failed to load monitoring data',
      retry: 'Retry'
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry'
    }
  }

  const defaultProps = {
    dictionary: mockDictionary,
    autoRefresh: true,
    refreshInterval: 30000,
    className: 'test-dashboard'
  }

  const mockDashboardData = {
    systemHealth: {
      overallScore: 95,
      services: [
        { name: 'Firestore', status: 'healthy', uptime: 99.9 },
        { name: 'Veo', status: 'healthy', uptime: 98.5 }
      ],
      criticalIssues: 0
    },
    budget: {
      totalSpent: 150.50,
      totalBudget: 300.00,
      utilization: 50.17,
      transactions: []
    },
    lastUpdated: new Date().toISOString()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default successful SWR mock
    mockSWR.mockReturnValue({
      data: mockDashboardData,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn()
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('renders dashboard with all sections', async () => {
      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      expect(screen.getByText('System Monitoring')).toBeInTheDocument()
      expect(screen.getByTestId('system-status-overview')).toBeInTheDocument()
      expect(screen.getByTestId('budget-overview')).toBeInTheDocument()
      expect(screen.getByText('System Status Content')).toBeInTheDocument()
      expect(screen.getByText('Budget Content')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      renderWithProviders(<MonitoringDashboard {...defaultProps} />)
      
      const dashboard = screen.getByRole('main')
      expect(dashboard).toHaveClass('test-dashboard')
    })

    it('displays connection status indicator', () => {
      renderWithProviders(<MonitoringDashboard {...defaultProps} />)
      
      expect(screen.getByText('Connection Status')).toBeInTheDocument()
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('50ms', { exact: false })).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading state when data is loading', () => {
      mockSWR.mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        isValidating: false,
        mutate: vi.fn()
      } as any)

      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      expect(screen.getByText('Loading monitoring data...')).toBeInTheDocument()
      expect(screen.getByText('Loading system status...')).toBeInTheDocument()
      expect(screen.getByText('Loading budget...')).toBeInTheDocument()
    })

    it('shows loading spinner during data validation', () => {
      mockSWR.mockReturnValue({
        data: mockDashboardData,
        error: null,
        isLoading: false,
        isValidating: true,
        mutate: vi.fn()
      } as any)

      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error state when data fetching fails', () => {
      const error = new Error('Network error')
      mockSWR.mockReturnValue({
        data: null,
        error,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn()
      } as any)

      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      expect(screen.getByText('Failed to load monitoring data')).toBeInTheDocument()
      expect(screen.getByText('System status error')).toBeInTheDocument()
      expect(screen.getByText('Budget error')).toBeInTheDocument()
    })

    it('shows retry button on error', () => {
      const mockMutate = vi.fn()
      mockSWR.mockReturnValue({
        data: null,
        error: new Error('Network error'),
        isLoading: false,
        isValidating: false,
        mutate: mockMutate
      } as any)

      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      const retryButton = screen.getByRole('button', { name: 'Retry' })
      expect(retryButton).toBeInTheDocument()
    })
  })

  describe('Auto-refresh', () => {
    it('enables auto-refresh by default', () => {
      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      expect(mockSWR).toHaveBeenCalledWith(
        '/api/monitoring/dashboard',
        expect.any(Function),
        expect.objectContaining({
          refreshInterval: 30000,
          revalidateOnFocus: true
        })
      )
    })

    it('disables auto-refresh when autoRefresh is false', () => {
      renderWithProviders(
        <MonitoringDashboard {...defaultProps} autoRefresh={false} />
      )

      expect(mockSWR).toHaveBeenCalledWith(
        '/api/monitoring/dashboard',
        expect.any(Function),
        expect.objectContaining({
          refreshInterval: 0
        })
      )
    })

    it('uses custom refresh interval', () => {
      renderWithProviders(
        <MonitoringDashboard {...defaultProps} refreshInterval={60000} />
      )

      expect(mockSWR).toHaveBeenCalledWith(
        '/api/monitoring/dashboard',
        expect.any(Function),
        expect.objectContaining({
          refreshInterval: 60000
        })
      )
    })
  })

  describe('Manual Refresh', () => {
    it('triggers manual refresh when refresh button is clicked', async () => {
      const mockMutate = vi.fn()
      mockSWR.mockReturnValue({
        data: mockDashboardData,
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: mockMutate
      } as any)

      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      const refreshButton = screen.getByRole('button', { name: 'Refresh' })
      await userEvent.click(refreshButton)

      expect(mockMutate).toHaveBeenCalled()
    })

    it('disables refresh button during loading', () => {
      mockSWR.mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        isValidating: false,
        mutate: vi.fn()
      } as any)

      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      const refreshButton = screen.getByRole('button', { name: 'Refresh' })
      expect(refreshButton).toBeDisabled()
    })
  })

  describe('Data Passing', () => {
    it('passes system health data to SystemStatusOverview', () => {
      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      const systemData = screen.getByTestId('system-data')
      const systemHealthData = JSON.parse(systemData.textContent || '{}')
      
      expect(systemHealthData).toEqual(mockDashboardData.systemHealth)
    })

    it('passes budget data to BudgetOverview', () => {
      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      const budgetData = screen.getByTestId('budget-data')
      const budgetHealthData = JSON.parse(budgetData.textContent || '{}')
      
      expect(budgetHealthData).toEqual(mockDashboardData.budget)
    })
  })

  describe('Internationalization', () => {
    it('renders Japanese text when Japanese dictionary is provided', () => {
      const japaneseDictionary = {
        monitoring: {
          title: 'システム監視',
          refresh: '更新',
          autoRefresh: '自動更新',
          lastUpdated: '最終更新',
          connectionStatus: '接続状況',
          connected: '接続済み',
          disconnected: '未接続',
          latency: 'レイテンシ',
          systemHealth: 'システムヘルス',
          budgetOverview: '予算概要',
          loading: '監視データを読み込み中...',
          error: '監視データの読み込みに失敗',
          retry: '再試行'
        },
        common: {
          loading: '読み込み中...',
          error: 'エラー',
          retry: '再試行'
        }
      }

      renderWithProviders(
        <MonitoringDashboard {...defaultProps} dictionary={japaneseDictionary} />,
        { locale: 'ja' }
      )

      expect(screen.getByText('システム監視')).toBeInTheDocument()
      expect(screen.getByText('更新')).toBeInTheDocument()
      expect(screen.getByText('接続状況')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByLabelText('System monitoring dashboard')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      const refreshButton = screen.getByRole('button', { name: 'Refresh' })
      refreshButton.focus()
      
      expect(refreshButton).toHaveFocus()
    })

    it('announces loading state to screen readers', () => {
      mockSWR.mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        isValidating: false,
        mutate: vi.fn()
      } as any)

      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      expect(screen.getByRole('status')).toHaveTextContent('Loading monitoring data...')
    })

    it('announces error state to screen readers', () => {
      mockSWR.mockReturnValue({
        data: null,
        error: new Error('Network error'),
        isLoading: false,
        isValidating: false,
        mutate: vi.fn()
      } as any)

      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load monitoring data')
    })
  })

  describe('Real-time Updates', () => {
    it('displays last update timestamp', async () => {
      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      expect(screen.getByText('Last Updated')).toBeInTheDocument()
      
      // Should show a formatted timestamp
      const timestampElement = screen.getByText(/\d{1,2}:\d{2}:\d{2}/)
      expect(timestampElement).toBeInTheDocument()
    })

    it('updates connection status based on WebSocket state', () => {
      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('50ms', { exact: false })).toBeInTheDocument()
    })
  })

  describe('Error Boundaries', () => {
    it('catches and displays component errors gracefully', () => {
      // Mock console.error to prevent error logging in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock a component that throws an error
      vi.mocked(require('../../../../components/monitoring/overview/SystemStatusOverview')).SystemStatusOverview.mockImplementation(() => {
        throw new Error('Component error')
      })

      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      // Should show error boundary fallback
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })

  describe('Responsive Behavior', () => {
    it('adapts layout for mobile screens', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      renderWithProviders(<MonitoringDashboard {...defaultProps} />)

      const dashboard = screen.getByRole('main')
      expect(dashboard).toHaveClass('mobile-optimized') // Assuming this class exists
    })
  })
})