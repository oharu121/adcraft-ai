'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useViewport } from '@/hooks';
import { cn } from '@/lib/utils/cn';

interface PerformanceChartProps {
  data: Array<{ timestamp: Date | string; value: number; responseTime?: number }>;
  width?: number;
  height?: number;
  timeRange?: '1h' | '24h' | '7d' | '30d';
  onTimeRangeChange?: (range: string) => void;
  dictionary: any;
  className?: string;
}

export function PerformanceChart({
  data,
  height = 250,
  timeRange = '24h',
  onTimeRangeChange,
  dictionary,
  className
}: PerformanceChartProps) {
  const { isMobile, isTablet } = useViewport();
  
  const formatTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    // Show more compact time format on mobile
    if (isMobile) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
    }
    
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Reduce data points on mobile for better performance
  const maxDataPoints = isMobile ? 25 : isTablet ? 35 : 50;
  
  const chartData = data.slice(-maxDataPoints).map(point => ({
    time: formatTime(point.timestamp),
    value: point.responseTime || point.value,
    timestamp: point.timestamp
  }));

  // Responsive height based on viewport
  const responsiveHeight = isMobile ? Math.max(height * 0.8, 200) : height;

  return (
    <div className={cn('w-full', className)}>
      {/* Time Range Selector */}
      <div className="flex justify-end mb-4">
        <div className={cn(
          'flex bg-gray-100 dark:bg-gray-800 rounded-lg',
          isMobile ? 'p-0.5' : 'p-1'
        )}>
          {['1h', '24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange?.(range)}
              className={cn(
                'font-medium rounded-md transition-colors touch-manipulation',
                isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm',
                timeRange === range
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              {dictionary.monitoring?.charts?.timeRange?.[range] || range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: responsiveHeight }}>
        <ResponsiveContainer>
          <LineChart 
            data={chartData}
            margin={isMobile ? { top: 5, right: 5, left: 5, bottom: 5 } : undefined}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="opacity-30"
              stroke={isMobile ? undefined : '#e5e7eb'}
            />
            <XAxis 
              dataKey="time" 
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              axisLine={false}
              interval={isMobile ? 'preserveStartEnd' : undefined}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : undefined}
            />
            <YAxis 
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => isMobile ? `${value}` : `${value}ms`}
              width={isMobile ? 40 : undefined}
            />
            <Tooltip 
              labelFormatter={(label) => `Time: ${label}`}
              formatter={(value: number) => [`${value.toFixed(2)}ms`, 'Response Time']}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: isMobile ? '11px' : '12px',
                padding: isMobile ? '8px' : '12px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={isMobile ? 1.5 : 2}
              dot={false}
              activeDot={{ r: isMobile ? 3 : 4, fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PerformanceChart;