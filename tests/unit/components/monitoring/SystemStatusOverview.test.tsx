import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithProviders, userEvent } from '../../../utils'
import { SystemStatusOverview } from '../../../../components/monitoring/overview/SystemStatusOverview'

// Mock D3 for health score gauge
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    append: vi.fn(() => ({
      attr: vi.fn().mockReturnThis(),
      style: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      datum: vi.fn().mockReturnThis(),
      call: vi.fn().mockReturnThis()
    })),
    selectAll: vi.fn(() => ({
      data: vi.fn(() => ({
        enter: vi.fn(() => ({
          append: vi.fn(() => ({
            attr: vi.fn().mockReturnThis(),
            style: vi.fn().mockReturnThis(),
            text: vi.fn().mockReturnThis()
          }))
        }))
      }))
    })),
    attr: vi.fn().mockReturnThis(),
    style: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis()
  })),
  arc: vi.fn(() => ({
    innerRadius: vi.fn().mockReturnThis(),
    outerRadius: vi.fn().mockReturnThis(),
    startAngle: vi.fn().mockReturnThis(),
    endAngle: vi.fn().mockReturnThis()
  })),
  scaleLinear: vi.fn(() => ({
    domain: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis()
  })),
  interpolate: vi.fn()
}))

describe('SystemStatusOverview', () => {
  const mockDictionary = {
    monitoring: {
      systemHealth: 'System Health',
      healthScore: 'Health Score',
      services: 'Services',
      uptime: 'Uptime',
      criticalIssues: 'Critical Issues',
      lastCheck: 'Last Check',
      viewDetails: 'View Details',
      healthy: 'Healthy',
      degraded: 'Degraded',
      down: 'Down',
      unknown: 'Unknown',
      noIssues: 'No critical issues',
      issuesFound: 'issues found'
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      na: 'N/A'
    }
  }

  const mockHealthyData = {
    overallScore: 95,
    services: [
      {
        name: 'Firestore',
        status: 'healthy' as const,
        uptime: 99.9,
        responseTime: 45,
        lastCheck: '2024-01-01T12:00:00Z'
      },
      {
        name: 'Vertex AI',
        status: 'healthy' as const,
        uptime: 99.5,
        responseTime: 120,
        lastCheck: '2024-01-01T12:00:00Z'
      },
      {
        name: 'Cloud Storage',
        status: 'healthy' as const,
        uptime: 99.8,
        responseTime: 80,
        lastCheck: '2024-01-01T12:00:00Z'
      }
    ],
    criticalIssues: 0,
    systemUptime: 99.7,
    lastUpdated: '2024-01-01T12:00:00Z'
  }

  const mockDegradedData = {
    ...mockHealthyData,
    overallScore: 70,
    services: [
      ...mockHealthyData.services.slice(0, 2),
      {
        name: 'Cloud Storage',
        status: 'degraded' as const,
        uptime: 95.2,
        responseTime: 1500,
        lastCheck: '2024-01-01T12:00:00Z'
      }
    ],
    criticalIssues: 1
  }

  const mockErrorData = {
    ...mockHealthyData,
    overallScore: 30,
    services: [
      ...mockHealthyData.services.slice(0, 1),
      {
        name: 'Vertex AI',
        status: 'down' as const,
        uptime: 0,
        responseTime: 0,
        lastCheck: '2024-01-01T11:55:00Z'
      },
      {
        name: 'Cloud Storage',
        status: 'degraded' as const,
        uptime: 85.0,
        responseTime: 2000,
        lastCheck: '2024-01-01T12:00:00Z'
      }
    ],
    criticalIssues: 3
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders system health overview with healthy data', () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('System Health')).toBeInTheDocument()
      expect(screen.getByText('95')).toBeInTheDocument()
      expect(screen.getByText('Health Score')).toBeInTheDocument()
      expect(screen.getByText('No critical issues')).toBeInTheDocument()
    })

    it('displays all services with their status', () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Firestore')).toBeInTheDocument()
      expect(screen.getByText('Vertex AI')).toBeInTheDocument()
      expect(screen.getByText('Cloud Storage')).toBeInTheDocument()
      expect(screen.getAllByText('Healthy')).toHaveLength(3)
    })

    it('shows uptime percentages for each service', () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('99.9%')).toBeInTheDocument()
      expect(screen.getByText('99.5%')).toBeInTheDocument()
      expect(screen.getByText('99.8%')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading skeleton when isLoading is true', () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={null} 
          dictionary={mockDictionary}
          isLoading={true}
          error={null}
        />
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByTestId('health-score-skeleton')).toBeInTheDocument()
      expect(screen.getByTestId('services-skeleton')).toBeInTheDocument()
    })

    it('shows loading spinner with proper aria-label', () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={null} 
          dictionary={mockDictionary}
          isLoading={true}
          error={null}
        />
      )

      expect(screen.getByLabelText('Loading system health data')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when error occurs', () => {
      const error = new Error('Failed to fetch system health')
      renderWithProviders(
        <SystemStatusOverview 
          data={null} 
          dictionary={mockDictionary}
          isLoading={false}
          error={error}
        />
      )

      expect(screen.getByRole('alert')).toHaveTextContent('Error')
      expect(screen.getByText('Failed to fetch system health')).toBeInTheDocument()
    })

    it('shows retry button on error', () => {
      const mockOnRetry = vi.fn()
      renderWithProviders(
        <SystemStatusOverview 
          data={null} 
          dictionary={mockDictionary}
          isLoading={false}
          error={new Error('Network error')}
          onRetry={mockOnRetry}
        />
      )

      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()
    })
  })

  describe('Health Score Visualization', () => {
    it('displays health score gauge with correct value', () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const healthScore = screen.getByTestId('health-score-gauge')
      expect(healthScore).toBeInTheDocument()
      expect(screen.getByText('95')).toBeInTheDocument()
    })

    it('applies correct color scheme based on health score', () => {
      const { rerender } = renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      // Healthy score (95) should have green color
      let gauge = screen.getByTestId('health-score-gauge')
      expect(gauge).toHaveClass('text-green-600')

      // Degraded score (70) should have yellow color
      rerender(
        <SystemStatusOverview 
          data={mockDegradedData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )
      gauge = screen.getByTestId('health-score-gauge')
      expect(gauge).toHaveClass('text-yellow-600')

      // Critical score (30) should have red color
      rerender(
        <SystemStatusOverview 
          data={mockErrorData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )
      gauge = screen.getByTestId('health-score-gauge')
      expect(gauge).toHaveClass('text-red-600')
    })
  })

  describe('Service Status Grid', () => {
    it('displays service status with appropriate visual indicators', () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={mockDegradedData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      // Check for status indicators
      expect(screen.getAllByTestId('status-healthy')).toHaveLength(2)
      expect(screen.getByTestId('status-degraded')).toBeInTheDocument()
    })

    it('shows response times for each service', () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('45ms')).toBeInTheDocument()
      expect(screen.getByText('120ms')).toBeInTheDocument()
      expect(screen.getByText('80ms')).toBeInTheDocument()
    })

    it('handles services with down status', () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={mockErrorData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByTestId('status-down')).toBeInTheDocument()
      expect(screen.getByText('Down')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  describe('Critical Issues', () => {
    it('displays no critical issues when count is 0', () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('No critical issues')).toBeInTheDocument()
      expect(screen.getByTestId('critical-issues-badge')).toHaveClass('bg-green-100')
    })

    it('displays critical issues count when greater than 0', () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={mockErrorData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('3 issues found')).toBeInTheDocument()
      expect(screen.getByTestId('critical-issues-badge')).toHaveClass('bg-red-100')
    })
  })

  describe('Interactivity', () => {
    it('allows expanding service details', async () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const firestoreService = screen.getByText('Firestore').closest('[data-testid="service-item"]')
      const detailsButton = within(firestoreService!).getByRole('button', { name: 'View Details' })
      
      await userEvent.click(detailsButton)

      expect(screen.getByTestId('service-details-firestore')).toBeInTheDocument()
      expect(screen.getByText('Response Time: 45ms')).toBeInTheDocument()
    })

    it('supports keyboard navigation for service items', async () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const firstService = screen.getAllByTestId('service-item')[0]
      const detailsButton = within(firstService).getByRole('button')
      
      detailsButton.focus()
      expect(detailsButton).toHaveFocus()

      await userEvent.keyboard('{Enter}')
      expect(screen.getByTestId('service-details-firestore')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByRole('region', { name: 'System Health' })).toBeInTheDocument()
      expect(screen.getByLabelText('Health score: 95 out of 100')).toBeInTheDocument()
      expect(screen.getByRole('list', { name: 'Services status' })).toBeInTheDocument()
    })

    it('provides screen reader announcements for status changes', () => {
      const { rerender } = renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      rerender(
        <SystemStatusOverview 
          data={mockDegradedData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByRole('status')).toHaveTextContent('System health has changed')
    })

    it('uses proper heading hierarchy', () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByRole('heading', { level: 3, name: 'System Health' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 4, name: 'Services' })).toBeInTheDocument()
    })
  })

  describe('Internationalization', () => {
    it('displays Japanese text when Japanese dictionary is provided', () => {
      const japaneseDictionary = {
        monitoring: {
          systemHealth: 'システムヘルス',
          healthScore: 'ヘルススコア',
          services: 'サービス',
          uptime: '稼働時間',
          criticalIssues: '重要な問題',
          lastCheck: '最終確認',
          viewDetails: '詳細を表示',
          healthy: '正常',
          degraded: '低下',
          down: '停止',
          unknown: '不明',
          noIssues: '重要な問題なし',
          issuesFound: '問題が見つかりました'
        },
        common: {
          loading: '読み込み中...',
          error: 'エラー',
          na: 'N/A'
        }
      }

      renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={japaneseDictionary}
          isLoading={false}
          error={null}
        />,
        { locale: 'ja' }
      )

      expect(screen.getByText('システムヘルス')).toBeInTheDocument()
      expect(screen.getByText('ヘルススコア')).toBeInTheDocument()
      expect(screen.getByText('サービス')).toBeInTheDocument()
      expect(screen.getAllByText('正常')).toHaveLength(3)
      expect(screen.getByText('重要な問題なし')).toBeInTheDocument()
    })
  })

  describe('Time Formatting', () => {
    it('formats last check times properly', () => {
      renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      // Should show relative time like "2 hours ago" or actual formatted time
      expect(screen.getByText(/ago|AM|PM/)).toBeInTheDocument()
    })

    it('handles invalid or missing timestamps gracefully', () => {
      const dataWithInvalidTime = {
        ...mockHealthyData,
        services: [
          {
            ...mockHealthyData.services[0],
            lastCheck: 'invalid-date'
          }
        ]
      }

      renderWithProviders(
        <SystemStatusOverview 
          data={dataWithInvalidTime} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('N/A')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const container = screen.getByTestId('system-status-container')
      expect(container).toHaveClass('mobile-layout')
    })

    it('stacks services vertically on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640
      })

      renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const servicesList = screen.getByRole('list', { name: 'Services status' })
      expect(servicesList).toHaveClass('flex-col', 'sm:flex-row')
    })
  })

  describe('Performance', () => {
    it('memoizes expensive calculations', () => {
      const { rerender } = renderWithProviders(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const initialGauge = screen.getByTestId('health-score-gauge')

      // Re-render with same data
      rerender(
        <SystemStatusOverview 
          data={mockHealthyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      // Should not re-render gauge if data hasn't changed
      const sameGauge = screen.getByTestId('health-score-gauge')
      expect(sameGauge).toBe(initialGauge)
    })
  })
})