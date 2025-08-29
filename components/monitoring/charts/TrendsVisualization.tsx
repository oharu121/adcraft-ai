'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MonitoringDashboardData } from '@/types/monitoring';
import { cn } from '@/lib/utils/cn';

interface TrendsVisualizationProps {
  trends: MonitoringDashboardData['trends'];
  timeRange?: string;
  dictionary: any;
  onTimeRangeChange?: (range: string) => void;
  className?: string;
}

export function TrendsVisualization({
  trends,
  timeRange = '24h',
  dictionary,
  onTimeRangeChange,
  className
}: TrendsVisualizationProps) {
  const formatTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Combine trend data into a single chart dataset
  const chartData = trends.requestTrend.slice(-20).map((point, index) => ({
    time: formatTime(point.timestamp),
    requests: point.value,
    errors: trends.errorTrend[index]?.value || 0,
    cpu: trends.cpuTrend[index]?.value || 0,
    memory: (trends.memoryTrend[index]?.value || 0) / 1024 / 1024, // Convert to MB
    cost: trends.costTrend[index]?.value || 0,
  }));

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">System Trends</h2>
        
        {/* Time Range Selector */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {['1h', '24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange?.(range)}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-md transition-colors',
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Trends */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h3 className="text-sm font-medium mb-3">Request Trends</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="time" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Resources */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h3 className="text-sm font-medium mb-3">System Resources</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="time" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="cpu" stroke="#10b981" strokeWidth={2} dot={false} name="CPU %" />
                <Line type="monotone" dataKey="memory" stroke="#f59e0b" strokeWidth={2} dot={false} name="Memory (MB)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrendsVisualization;