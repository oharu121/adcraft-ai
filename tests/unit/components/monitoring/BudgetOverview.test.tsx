import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithProviders, userEvent } from '../../../utils'
import { BudgetOverview } from '../../../../components/monitoring/overview/BudgetOverview'

// Mock Recharts components
vi.mock('recharts', () => ({
  PieChart: ({ children, ...props }: any) => (
    <div data-testid="pie-chart" {...props}>
      {children}
    </div>
  ),
  Pie: ({ data }: any) => (
    <div data-testid="pie-data">
      {JSON.stringify(data)}
    </div>
  ),
  LineChart: ({ children, data, ...props }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} {...props}>
      {children}
    </div>
  ),
  Line: ({ dataKey }: any) => <div data-testid={`line-${dataKey}`} />,
  XAxis: (props: any) => <div data-testid="x-axis" {...props} />,
  YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
  Tooltip: (props: any) => <div data-testid="tooltip" {...props} />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Cell: ({ fill }: any) => <div data-testid="cell" style={{ backgroundColor: fill }} />
}))

describe('BudgetOverview', () => {
  const mockDictionary = {
    monitoring: {
      budgetOverview: 'Budget Overview',
      totalBudget: 'Total Budget',
      totalSpent: 'Total Spent',
      remainingBudget: 'Remaining Budget',
      utilization: 'Utilization',
      burnRate: 'Burn Rate',
      projectedDepletion: 'Projected Depletion',
      recentTransactions: 'Recent Transactions',
      serviceBreakdown: 'Service Breakdown',
      dailySpend: 'Daily Spend Trend',
      showAll: 'Show All',
      showLess: 'Show Less',
      noTransactions: 'No recent transactions',
      perDay: 'per day',
      daysRemaining: 'days remaining',
      budgetExceeded: 'Budget exceeded',
      warning: 'Warning',
      critical: 'Critical'
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      currency: '$',
      date: 'Date',
      amount: 'Amount',
      service: 'Service'
    }
  }

  const mockBudgetData = {
    totalBudget: 300.00,
    totalSpent: 150.50,
    remainingBudget: 149.50,
    utilization: 50.17,
    burnRate: 12.5,
    projectedDepletion: '2024-02-15T00:00:00Z',
    serviceBreakdown: [
      { name: 'Vertex AI', spent: 75.25, percentage: 50.0, color: '#3B82F6' },
      { name: 'Veo API', spent: 45.15, percentage: 30.0, color: '#10B981' },
      { name: 'Storage', spent: 20.10, percentage: 13.4, color: '#F59E0B' },
      { name: 'Other', spent: 10.00, percentage: 6.6, color: '#8B5CF6' }
    ],
    dailyTrend: [
      { date: '2024-01-01', spent: 5.25 },
      { date: '2024-01-02', spent: 8.50 },
      { date: '2024-01-03', spent: 12.75 },
      { date: '2024-01-04', spent: 15.00 },
      { date: '2024-01-05', spent: 18.25 }
    ],
    recentTransactions: [
      {
        id: 'tx-1',
        service: 'Vertex AI',
        amount: 25.50,
        description: 'Gemini Pro Vision API calls',
        timestamp: '2024-01-05T10:30:00Z'
      },
      {
        id: 'tx-2',
        service: 'Veo API',
        amount: 45.00,
        description: 'Video generation',
        timestamp: '2024-01-05T09:15:00Z'
      },
      {
        id: 'tx-3',
        service: 'Cloud Storage',
        amount: 5.75,
        description: 'File storage and bandwidth',
        timestamp: '2024-01-05T08:45:00Z'
      }
    ],
    lastUpdated: '2024-01-05T12:00:00Z'
  }

  const mockWarningData = {
    ...mockBudgetData,
    totalSpent: 240.00,
    remainingBudget: 60.00,
    utilization: 80.0,
    burnRate: 25.0,
    projectedDepletion: '2024-01-08T00:00:00Z'
  }

  const mockCriticalData = {
    ...mockBudgetData,
    totalSpent: 285.00,
    remainingBudget: 15.00,
    utilization: 95.0,
    burnRate: 30.0,
    projectedDepletion: '2024-01-06T00:00:00Z'
  }

  const mockExceededData = {
    ...mockBudgetData,
    totalSpent: 320.00,
    remainingBudget: -20.00,
    utilization: 106.7,
    burnRate: 0,
    projectedDepletion: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders budget overview with normal spending', () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Budget Overview')).toBeInTheDocument()
      expect(screen.getByText('$300.00')).toBeInTheDocument()
      expect(screen.getByText('$150.50')).toBeInTheDocument()
      expect(screen.getByText('$149.50')).toBeInTheDocument()
      expect(screen.getByText('50.17%')).toBeInTheDocument()
    })

    it('displays service breakdown pie chart', () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
      expect(screen.getByText('Service Breakdown')).toBeInTheDocument()
      
      const pieData = JSON.parse(screen.getByTestId('pie-data').textContent || '[]')
      expect(pieData).toHaveLength(4)
      expect(pieData[0]).toMatchObject({ name: 'Vertex AI', value: 75.25 })
    })

    it('shows burn rate and projected depletion', () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('$12.50 per day')).toBeInTheDocument()
      expect(screen.getByText('12 days remaining')).toBeInTheDocument()
    })

    it('displays recent transactions list', () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Recent Transactions')).toBeInTheDocument()
      expect(screen.getByText('Vertex AI')).toBeInTheDocument()
      expect(screen.getByText('$25.50')).toBeInTheDocument()
      expect(screen.getByText('Gemini Pro Vision API calls')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading skeleton when isLoading is true', () => {
      renderWithProviders(
        <BudgetOverview 
          data={null} 
          dictionary={mockDictionary}
          isLoading={true}
          error={null}
        />
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByTestId('budget-skeleton')).toBeInTheDocument()
    })

    it('shows loading spinner with proper aria-label', () => {
      renderWithProviders(
        <BudgetOverview 
          data={null} 
          dictionary={mockDictionary}
          isLoading={true}
          error={null}
        />
      )

      expect(screen.getByLabelText('Loading budget data')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when error occurs', () => {
      const error = new Error('Failed to fetch budget data')
      renderWithProviders(
        <BudgetOverview 
          data={null} 
          dictionary={mockDictionary}
          isLoading={false}
          error={error}
        />
      )

      expect(screen.getByRole('alert')).toHaveTextContent('Error')
      expect(screen.getByText('Failed to fetch budget data')).toBeInTheDocument()
    })

    it('shows retry button on error', () => {
      const mockOnRetry = vi.fn()
      renderWithProviders(
        <BudgetOverview 
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

  describe('Budget Status Indicators', () => {
    it('shows normal status for healthy spending', () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const utilizationBar = screen.getByTestId('utilization-bar')
      expect(utilizationBar).toHaveClass('bg-green-500')
      expect(screen.queryByText('Warning')).not.toBeInTheDocument()
    })

    it('shows warning status for high spending', () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockWarningData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const utilizationBar = screen.getByTestId('utilization-bar')
      expect(utilizationBar).toHaveClass('bg-yellow-500')
      expect(screen.getByText('Warning')).toBeInTheDocument()
      expect(screen.getByText('80.0%')).toBeInTheDocument()
    })

    it('shows critical status for very high spending', () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockCriticalData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const utilizationBar = screen.getByTestId('utilization-bar')
      expect(utilizationBar).toHaveClass('bg-red-500')
      expect(screen.getByText('Critical')).toBeInTheDocument()
      expect(screen.getByText('95.0%')).toBeInTheDocument()
    })

    it('shows exceeded status when budget is over', () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockExceededData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Budget exceeded')).toBeInTheDocument()
      expect(screen.getByText('106.7%')).toBeInTheDocument()
      expect(screen.getByText('-$20.00')).toBeInTheDocument()
    })
  })

  describe('Daily Trend Chart', () => {
    it('displays daily spending trend chart', () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Daily Spend Trend')).toBeInTheDocument()
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      expect(screen.getByTestId('line-spent')).toBeInTheDocument()

      const chartData = JSON.parse(
        screen.getByTestId('line-chart').getAttribute('data-chart-data') || '[]'
      )
      expect(chartData).toHaveLength(5)
      expect(chartData[0]).toMatchObject({ date: '2024-01-01', spent: 5.25 })
    })

    it('handles empty trend data gracefully', () => {
      const dataWithEmptyTrend = {
        ...mockBudgetData,
        dailyTrend: []
      }

      renderWithProviders(
        <BudgetOverview 
          data={dataWithEmptyTrend} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Daily Spend Trend')).toBeInTheDocument()
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('Recent Transactions', () => {
    it('displays limited transactions initially', () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getAllByTestId('transaction-item')).toHaveLength(3)
      expect(screen.getByRole('button', { name: 'Show All' })).toBeInTheDocument()
    })

    it('expands to show all transactions when Show All is clicked', async () => {
      const dataWithManyTransactions = {
        ...mockBudgetData,
        recentTransactions: [
          ...mockBudgetData.recentTransactions,
          ...Array.from({ length: 5 }, (_, i) => ({
            id: `tx-extra-${i}`,
            service: 'Test Service',
            amount: 10.00,
            description: `Test transaction ${i}`,
            timestamp: '2024-01-04T10:00:00Z'
          }))
        ]
      }

      renderWithProviders(
        <BudgetOverview 
          data={dataWithManyTransactions} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const showAllButton = screen.getByRole('button', { name: 'Show All' })
      await userEvent.click(showAllButton)

      expect(screen.getAllByTestId('transaction-item')).toHaveLength(8)
      expect(screen.getByRole('button', { name: 'Show Less' })).toBeInTheDocument()
    })

    it('handles empty transactions list', () => {
      const dataWithNoTransactions = {
        ...mockBudgetData,
        recentTransactions: []
      }

      renderWithProviders(
        <BudgetOverview 
          data={dataWithNoTransactions} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('No recent transactions')).toBeInTheDocument()
    })

    it('formats transaction amounts and timestamps correctly', () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('$25.50')).toBeInTheDocument()
      expect(screen.getByText('$45.00')).toBeInTheDocument()
      expect(screen.getByText('$5.75')).toBeInTheDocument()

      // Should show formatted timestamps
      expect(screen.getByText(/10:30|09:15|08:45/)).toBeInTheDocument()
    })
  })

  describe('Interactivity', () => {
    it('allows hovering over chart elements for tooltips', async () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const pieChart = screen.getByTestId('pie-chart')
      await userEvent.hover(pieChart)

      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    })

    it('supports keyboard navigation for interactive elements', async () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const showAllButton = screen.getByRole('button', { name: 'Show All' })
      showAllButton.focus()
      
      expect(showAllButton).toHaveFocus()

      await userEvent.keyboard('{Enter}')
      expect(screen.getByRole('button', { name: 'Show Less' })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByRole('region', { name: 'Budget Overview' })).toBeInTheDocument()
      expect(screen.getByLabelText('Budget utilization: 50.17%')).toBeInTheDocument()
      expect(screen.getByRole('table', { name: 'Recent transactions' })).toBeInTheDocument()
    })

    it('provides screen reader descriptions for charts', () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByLabelText(/Service breakdown chart/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Daily spending trend chart/)).toBeInTheDocument()
    })

    it('uses proper table markup for transactions', () => {
      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByRole('columnheader', { name: 'Service' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Amount' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument()
    })
  })

  describe('Internationalization', () => {
    it('displays Japanese text when Japanese dictionary is provided', () => {
      const japaneseDictionary = {
        monitoring: {
          budgetOverview: '予算概要',
          totalBudget: '総予算',
          totalSpent: '総支出',
          remainingBudget: '残予算',
          utilization: '使用率',
          burnRate: 'バーンレート',
          projectedDepletion: '枯渇予定日',
          recentTransactions: '最近の取引',
          serviceBreakdown: 'サービス別内訳',
          dailySpend: '日次支出推移',
          showAll: 'すべて表示',
          showLess: '簡潔表示',
          noTransactions: '最近の取引はありません',
          perDay: '1日あたり',
          daysRemaining: '日残り',
          budgetExceeded: '予算超過',
          warning: '警告',
          critical: '重要'
        },
        common: {
          loading: '読み込み中...',
          error: 'エラー',
          currency: '¥',
          date: '日付',
          amount: '金額',
          service: 'サービス'
        }
      }

      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={japaneseDictionary}
          isLoading={false}
          error={null}
        />,
        { locale: 'ja' }
      )

      expect(screen.getByText('予算概要')).toBeInTheDocument()
      expect(screen.getByText('総予算')).toBeInTheDocument()
      expect(screen.getByText('最近の取引')).toBeInTheDocument()
      expect(screen.getByText('¥300.00')).toBeInTheDocument()
    })

    it('formats currency according to locale', () => {
      const japaneseDictionary = {
        ...mockDictionary,
        common: {
          ...mockDictionary.common,
          currency: '¥'
        }
      }

      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={japaneseDictionary}
          isLoading={false}
          error={null}
        />,
        { locale: 'ja' }
      )

      expect(screen.getByText('¥300.00')).toBeInTheDocument()
      expect(screen.getByText('¥150.50')).toBeInTheDocument()
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
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const container = screen.getByTestId('budget-overview-container')
      expect(container).toHaveClass('mobile-layout')
    })

    it('stacks charts vertically on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640
      })

      renderWithProviders(
        <BudgetOverview 
          data={mockBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const chartsContainer = screen.getByTestId('charts-container')
      expect(chartsContainer).toHaveClass('flex-col', 'md:flex-row')
    })
  })

  describe('Data Validation', () => {
    it('handles invalid or missing data gracefully', () => {
      const invalidData = {
        ...mockBudgetData,
        totalBudget: null,
        totalSpent: undefined,
        serviceBreakdown: null
      }

      renderWithProviders(
        <BudgetOverview 
          data={invalidData as any} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('$0.00')).toBeInTheDocument()
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('calculates utilization correctly with edge cases', () => {
      const zeroBudgetData = {
        ...mockBudgetData,
        totalBudget: 0,
        totalSpent: 50
      }

      renderWithProviders(
        <BudgetOverview 
          data={zeroBudgetData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('N/A')).toBeInTheDocument()
    })
  })
})