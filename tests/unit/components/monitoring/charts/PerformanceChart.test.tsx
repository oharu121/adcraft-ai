import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithProviders, userEvent } from '../../../../utils'
import { PerformanceChart } from '../../../../../components/monitoring/charts/PerformanceChart'

// Mock Recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children, data, ...props }: any) => (
    <div data-testid="performance-line-chart" data-chart-data={JSON.stringify(data)} {...props}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke }: any) => (
    <div data-testid={`line-${dataKey}`} data-stroke={stroke} />
  ),
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: ({ label }: any) => <div data-testid="y-axis" data-label={label} />,
  CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: ({ content }: any) => <div data-testid="tooltip" data-content={content} />,
  Legend: (props: any) => <div data-testid="legend" {...props} />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  )
}))

// Mock time range selector component
vi.mock('../../../../../components/ui/TimeRangeSelector', () => ({
  TimeRangeSelector: ({ selected, onSelect }: any) => (
    <div data-testid="time-range-selector">
      <button
        onClick={() => onSelect('1h')}
        data-selected={selected === '1h'}
      >
        1H
      </button>
      <button
        onClick={() => onSelect('24h')}
        data-selected={selected === '24h'}
      >
        24H
      </button>
      <button
        onClick={() => onSelect('7d')}
        data-selected={selected === '7d'}
      >
        7D
      </button>
    </div>
  )
}))

describe('PerformanceChart', () => {
  const mockDictionary = {
    monitoring: {
      performance: 'Performance Metrics',
      responseTime: 'Response Time',
      errorRate: 'Error Rate',
      throughput: 'Throughput',
      timeRange: 'Time Range',
      lastHour: 'Last Hour',
      last24Hours: 'Last 24 Hours',
      lastWeek: 'Last Week',
      average: 'Average',
      peak: 'Peak',
      noData: 'No performance data available',
      ms: 'ms',
      requests: 'requests',
      errors: 'errors',
      requestsPerMinute: 'requests/min',
      errorsPerMinute: 'errors/min'
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      refresh: 'Refresh'
    }
  }

  const mockPerformanceData = {
    responseTime: [
      { timestamp: '2024-01-01T10:00:00Z', value: 120, average: 100 },
      { timestamp: '2024-01-01T10:05:00Z', value: 145, average: 110 },
      { timestamp: '2024-01-01T10:10:00Z', value: 98, average: 105 },
      { timestamp: '2024-01-01T10:15:00Z', value: 189, average: 115 },
      { timestamp: '2024-01-01T10:20:00Z', value: 76, average: 108 }
    ],
    errorRate: [
      { timestamp: '2024-01-01T10:00:00Z', value: 0.5, total: 1000 },
      { timestamp: '2024-01-01T10:05:00Z', value: 1.2, total: 1050 },
      { timestamp: '2024-01-01T10:10:00Z', value: 0.8, total: 980 },
      { timestamp: '2024-01-01T10:15:00Z', value: 2.1, total: 1200 },
      { timestamp: '2024-01-01T10:20:00Z', value: 0.3, total: 890 }
    ],
    throughput: [
      { timestamp: '2024-01-01T10:00:00Z', value: 200, successful: 199 },
      { timestamp: '2024-01-01T10:05:00Z', value: 210, successful: 197 },
      { timestamp: '2024-01-01T10:10:00Z', value: 196, successful: 194 },
      { timestamp: '2024-01-01T10:15:00Z', value: 240, successful: 215 },
      { timestamp: '2024-01-01T10:20:00Z', value: 178, successful: 177 }
    ],
    timeRange: '1h' as const,
    lastUpdated: '2024-01-01T10:25:00Z'
  }

  const mockLongTermData = {
    ...mockPerformanceData,
    timeRange: '7d' as const,
    responseTime: Array.from({ length: 168 }, (_, i) => ({
      timestamp: new Date(2024, 0, 1, i).toISOString(),
      value: 80 + Math.random() * 100,
      average: 120
    }))
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders performance chart with all metrics', () => {
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Performance Metrics')).toBeInTheDocument()
      expect(screen.getByTestId('performance-line-chart')).toBeInTheDocument()
      expect(screen.getByTestId('time-range-selector')).toBeInTheDocument()
      expect(screen.getByTestId('line-value')).toBeInTheDocument()
      expect(screen.getByTestId('line-average')).toBeInTheDocument()
    })

    it('displays chart data correctly', () => {
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const chartData = JSON.parse(
        screen.getByTestId('performance-line-chart').getAttribute('data-chart-data') || '[]'
      )
      expect(chartData).toHaveLength(5)
      expect(chartData[0]).toMatchObject({
        timestamp: '2024-01-01T10:00:00Z',
        value: 120,
        average: 100
      })
    })

    it('shows metric summary statistics', () => {
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('Average')).toBeInTheDocument()
      expect(screen.getByText('Peak')).toBeInTheDocument()
      expect(screen.getByText('125.6ms')).toBeInTheDocument() // Average response time
      expect(screen.getByText('189ms')).toBeInTheDocument() // Peak response time
    })
  })

  describe('Loading States', () => {
    it('shows loading skeleton when isLoading is true', () => {
      renderWithProviders(
        <PerformanceChart 
          data={null} 
          dictionary={mockDictionary}
          isLoading={true}
          error={null}
        />
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
    })

    it('shows loading spinner with proper aria-label', () => {
      renderWithProviders(
        <PerformanceChart 
          data={null} 
          dictionary={mockDictionary}
          isLoading={true}
          error={null}
        />
      )

      expect(screen.getByLabelText('Loading performance data')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when error occurs', () => {
      const error = new Error('Failed to fetch performance data')
      renderWithProviders(
        <PerformanceChart 
          data={null} 
          dictionary={mockDictionary}
          isLoading={false}
          error={error}
        />
      )

      expect(screen.getByRole('alert')).toHaveTextContent('Error')
      expect(screen.getByText('Failed to fetch performance data')).toBeInTheDocument()
    })

    it('shows retry button on error', () => {
      const mockOnRetry = vi.fn()
      renderWithProviders(
        <PerformanceChart 
          data={null} 
          dictionary={mockDictionary}
          isLoading={false}
          error={new Error('Network error')}
          onRetry={mockOnRetry}
        />
      )

      const retryButton = screen.getByRole('button', { name: /refresh/i })
      expect(retryButton).toBeInTheDocument()
    })
  })

  describe('Time Range Selection', () => {
    it('shows current time range as selected', () => {
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const oneHourButton = screen.getByText('1H')
      expect(oneHourButton).toHaveAttribute('data-selected', 'true')
    })

    it('calls onTimeRangeChange when time range is selected', async () => {
      const mockOnTimeRangeChange = vi.fn()
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
          onTimeRangeChange={mockOnTimeRangeChange}
        />
      )

      const twentyFourHourButton = screen.getByText('24H')
      await userEvent.click(twentyFourHourButton)

      expect(mockOnTimeRangeChange).toHaveBeenCalledWith('24h')
    })

    it('adapts chart based on time range', () => {
      const { rerender } = renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      let xAxis = screen.getByTestId('x-axis')
      expect(xAxis).toHaveAttribute('data-key', 'time') // Short format for 1h

      rerender(
        <PerformanceChart 
          data={mockLongTermData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      xAxis = screen.getByTestId('x-axis')
      expect(xAxis).toHaveAttribute('data-key', 'date') // Long format for 7d
    })
  })

  describe('Metric Types', () => {
    it('displays response time metrics correctly', () => {
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
          metric="responseTime"
        />
      )

      expect(screen.getByText('Response Time')).toBeInTheDocument()
      expect(screen.getByText('ms')).toBeInTheDocument()
      
      const line = screen.getByTestId('line-value')
      expect(line).toHaveAttribute('data-stroke', '#3B82F6') // Blue color for response time
    })

    it('displays error rate metrics correctly', () => {
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
          metric="errorRate"
        />
      )

      expect(screen.getByText('Error Rate')).toBeInTheDocument()
      expect(screen.getByText('errors')).toBeInTheDocument()

      const line = screen.getByTestId('line-value')
      expect(line).toHaveAttribute('data-stroke', '#EF4444') // Red color for error rate
    })

    it('displays throughput metrics correctly', () => {
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
          metric="throughput"
        />
      )

      expect(screen.getByText('Throughput')).toBeInTheDocument()
      expect(screen.getByText('requests')).toBeInTheDocument()

      const line = screen.getByTestId('line-value')
      expect(line).toHaveAttribute('data-stroke', '#10B981') // Green color for throughput
    })
  })

  describe('Data Transformations', () => {
    it('formats timestamps correctly for different time ranges', () => {
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const chartData = JSON.parse(
        screen.getByTestId('performance-line-chart').getAttribute('data-chart-data') || '[]'
      )
      
      // For 1h range, should have formatted time like "10:00"
      expect(chartData[0].formattedTime).toMatch(/\d{2}:\d{2}/)
    })

    it('calculates statistics correctly', () => {
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
          metric="responseTime"
        />
      )

      // Average should be calculated from all values
      const expectedAverage = (120 + 145 + 98 + 189 + 76) / 5
      expect(screen.getByText(`${expectedAverage.toFixed(1)}ms`)).toBeInTheDocument()
      
      // Peak should be the maximum value
      expect(screen.getByText('189ms')).toBeInTheDocument()
    })

    it('handles empty or invalid data gracefully', () => {
      const emptyData = {
        ...mockPerformanceData,
        responseTime: []
      }

      renderWithProviders(
        <PerformanceChart 
          data={emptyData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByText('No performance data available')).toBeInTheDocument()
    })
  })

  describe('Tooltips and Interactivity', () => {
    it('displays custom tooltip content', () => {
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip')).toHaveAttribute('data-content')
    })

    it('supports keyboard navigation for chart elements', async () => {
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const chart = screen.getByTestId('performance-line-chart')
      chart.focus()
      
      expect(chart).toHaveFocus()

      // Arrow keys should navigate through data points
      await userEvent.keyboard('{ArrowRight}')
      expect(screen.getByRole('tooltip')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByRole('img', { name: /Performance chart/ })).toBeInTheDocument()
      expect(screen.getByLabelText('Time range selector')).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Performance metrics chart' })).toBeInTheDocument()
    })

    it('provides screen reader descriptions for data', () => {
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByRole('status')).toHaveTextContent(/Performance data from/)
      expect(screen.getByLabelText(/Chart showing \d+ data points/)).toBeInTheDocument()
    })

    it('announces data updates to screen readers', () => {
      const { rerender } = renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const updatedData = {
        ...mockPerformanceData,
        responseTime: [...mockPerformanceData.responseTime, {
          timestamp: '2024-01-01T10:25:00Z',
          value: 95,
          average: 110
        }]
      }

      rerender(
        <PerformanceChart 
          data={updatedData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      expect(screen.getByRole('status')).toHaveTextContent('Chart data updated')
    })
  })

  describe('Internationalization', () => {
    it('displays Japanese text when Japanese dictionary is provided', () => {
      const japaneseDictionary = {
        monitoring: {
          performance: 'パフォーマンス指標',
          responseTime: 'レスポンス時間',
          errorRate: 'エラー率',
          throughput: 'スループット',
          timeRange: '時間範囲',
          lastHour: '過去1時間',
          last24Hours: '過去24時間',
          lastWeek: '過去1週間',
          average: '平均',
          peak: 'ピーク',
          noData: 'パフォーマンスデータがありません',
          ms: 'ミリ秒',
          requests: 'リクエスト',
          errors: 'エラー',
          requestsPerMinute: 'リクエスト/分',
          errorsPerMinute: 'エラー/分'
        },
        common: {
          loading: '読み込み中...',
          error: 'エラー',
          refresh: '更新'
        }
      }

      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={japaneseDictionary}
          isLoading={false}
          error={null}
        />,
        { locale: 'ja' }
      )

      expect(screen.getByText('パフォーマンス指標')).toBeInTheDocument()
      expect(screen.getByText('平均')).toBeInTheDocument()
      expect(screen.getByText('ピーク')).toBeInTheDocument()
    })

    it('formats numbers according to locale', () => {
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />,
        { locale: 'ja' }
      )

      // Japanese locale should use different decimal separator
      expect(screen.getByText(/\d+[.,]\d+/)).toBeInTheDocument()
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
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const container = screen.getByTestId('performance-chart-container')
      expect(container).toHaveClass('mobile-layout')
    })

    it('adjusts chart height for different screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      })

      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const responsiveContainer = screen.getByTestId('responsive-container')
      expect(responsiveContainer).toHaveStyle({ height: '400px' })
    })
  })

  describe('Performance Optimizations', () => {
    it('memoizes expensive calculations', () => {
      const { rerender } = renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      const initialChart = screen.getByTestId('performance-line-chart')

      // Re-render with same data
      rerender(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
        />
      )

      // Chart should not re-render if data hasn't changed
      const sameChart = screen.getByTestId('performance-line-chart')
      expect(sameChart).toBe(initialChart)
    })

    it('debounces time range changes', async () => {
      const mockOnTimeRangeChange = vi.fn()
      renderWithProviders(
        <PerformanceChart 
          data={mockPerformanceData} 
          dictionary={mockDictionary}
          isLoading={false}
          error={null}
          onTimeRangeChange={mockOnTimeRangeChange}
        />
      )

      // Rapid clicks should be debounced
      const button = screen.getByText('24H')
      await userEvent.click(button)
      await userEvent.click(button)
      await userEvent.click(button)

      // Should only be called once after debounce
      await new Promise(resolve => setTimeout(resolve, 300))
      expect(mockOnTimeRangeChange).toHaveBeenCalledTimes(1)
    })
  })
})