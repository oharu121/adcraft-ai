# Technical Design: Monitoring Dashboard

## Overview
This document defines the technical architecture for implementing a comprehensive monitoring dashboard that integrates with AdCraft AI's existing monitoring infrastructure while providing beautiful data visualizations and real-time updates.

## Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        MP[Monitoring Page]
        MDC[MonitoringDashboard Component]
        BC[BudgetOverview Component]
        SH[SystemHealth Component]
        PM[PerformanceMetrics Component]
        CV[ChartVisualization Component]
    end

    subgraph "API Layer"
        MDE[/api/monitoring/dashboard]
        MSE[/api/monitoring/status]
        MHE[/api/monitoring/health]
        MBE[/api/monitoring/budget]
    end

    subgraph "Service Layer"
        MS[MonitoringService]
        CT[CostTracker]
        MetS[MetricsService]
        SM[SecurityMonitor]
    end

    subgraph "Real-time Layer"
        WS[WebSocket Server]
        WSC[WebSocket Client]
    end

    MP --> MDC
    MDC --> BC
    MDC --> SH
    MDC --> PM
    MDC --> CV
    
    MDC --> MDE
    MDC --> MSE
    MDC --> MHE
    MDC --> MBE
    
    MDE --> MS
    MSE --> MS
    MHE --> MS
    MBE --> CT

    WSC --> WS
    WS --> MS
```

## Data Architecture

### Core Data Models

```typescript
// Monitoring Dashboard Data Structure
interface MonitoringDashboardData {
  systemHealth: SystemHealthStatus;
  performance: PerformanceSummary;
  logs: LogMetrics;
  budget: BudgetStatus;
  security: SecurityMetrics;
  alerts: AlertSummary;
  trends: SystemTrends;
}

// Enhanced Budget Status (from existing CostTracker)
interface BudgetStatus {
  totalBudget: number;
  currentSpend: number;
  remainingBudget: number;
  percentageUsed: number;
  burnRate: number; // per hour
  projectedDepletion: Date | null;
  costBreakdown: {
    veo: number;
    gemini: number;
    imagen: number;
    storage: number;
    other: number;
  };
  recentTransactions: CostTransaction[];
}

// Chart Data Models
interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  category?: string;
}

interface TimeSeriesData {
  id: string;
  name: string;
  data: ChartDataPoint[];
  color: string;
  unit: string;
}
```

## Component Architecture

### 1. Page Structure
```
/[locale]/monitoring/page.tsx
├── MonitoringDashboard (main container)
│   ├── DashboardHeader (title, refresh controls)
│   ├── SystemStatusOverview (health indicators)
│   ├── BudgetOverview (cost tracking)
│   ├── PerformanceMetrics (API performance)
│   ├── AlertsPanel (active alerts)
│   └── TrendsVisualization (charts)
```

### 2. Component Specifications

#### MonitoringDashboard Component
```typescript
interface MonitoringDashboardProps {
  dict: Dictionary;
  locale: Locale;
}

// Features:
// - Real-time data fetching with SWR
// - WebSocket connection for live updates
// - Error boundaries for graceful failures
// - Loading states with skeleton UI
// - Auto-refresh every 30 seconds
```

#### SystemStatusOverview Component
```typescript
interface SystemStatusOverviewProps {
  healthStatus: SystemHealthStatus;
  onRefresh: () => void;
}

// Features:
// - Overall health score visualization (0-100)
// - Service status grid (Firestore, Veo, Gemini, etc.)
// - Uptime display
// - Critical issues alert badges
```

#### BudgetOverview Component
```typescript
interface BudgetOverviewProps {
  budgetData: BudgetStatus;
  showDetailed?: boolean;
}

// Features:
// - Budget utilization progress bar
// - Cost breakdown pie chart
// - Burn rate trend line
// - Recent transactions list
// - Projected depletion warning
```

#### TrendsVisualization Component  
```typescript
interface TrendsVisualizationProps {
  trends: SystemTrends;
  timeRange: '1h' | '24h' | '7d';
  onTimeRangeChange: (range: string) => void;
}

// Features:
// - Multiple time-series charts
// - Interactive tooltips
// - Zoom/pan functionality
// - Time range selector
// - Chart type switching (line/area/bar)
```

## Chart Library Analysis & Selection

### Option 1: D3.js + TypeScript
**Pros:**
- Maximum customization and control
- TypeScript support via @types/d3
- Excellent performance for complex visualizations
- Industry standard for data visualization

**Cons:**
- Steeper learning curve
- More development time required
- More code to maintain

### Option 2: Recharts
**Pros:**
- React-native components
- Excellent TypeScript support
- Built on D3.js foundation
- Simpler API, faster development
- Good mobile responsiveness

**Cons:**
- Less customization than raw D3
- Limited animation options

### Option 3: Chart.js with react-chartjs-2
**Pros:**
- Very lightweight
- Good TypeScript support
- Easy to implement
- Good performance

**Cons:**
- Limited customization
- Basic interactions only

## Recommended Chart Library Decision

**Selected: Recharts + Custom D3.js for Advanced Features**

**Rationale:**
- Recharts for standard charts (lines, bars, pie charts) - fast development
- Custom D3.js for unique visualizations (health score gauge, real-time updates)
- Best balance of development speed and visual appeal for demo
- Excellent TypeScript support for both
- Responsive design built-in

## API Endpoints Design

### 1. Dashboard Data Endpoint
```typescript
GET /api/monitoring/dashboard

Response: {
  success: boolean;
  data: MonitoringDashboardData;
  timestamp: string;
  cacheAge: number;
}

// Features:
// - Aggregates data from all monitoring services
// - Implements caching for performance
// - Returns comprehensive dashboard data
// - Error handling with fallback data
```

### 2. Real-time Status Endpoint
```typescript
GET /api/monitoring/status

Response: {
  systemHealth: SystemHealthStatus;
  activeAlerts: Alert[];
  budgetStatus: BudgetStatus;
  timestamp: string;
}

// Features:
// - Lightweight endpoint for frequent polling
// - WebSocket push notifications
// - Critical status changes
```

### 3. Historical Trends Endpoint
```typescript
GET /api/monitoring/trends?timeRange=24h&metrics=cpu,memory,cost

Response: {
  trends: {
    [metricName]: TimeSeriesData;
  };
  timeRange: string;
  dataPoints: number;
}

// Features:
// - Parameterized time ranges
// - Selective metric retrieval
// - Optimized data format for charts
```

## Real-time Updates Architecture

### WebSocket Implementation
```typescript
// Client-side WebSocket connection
interface MonitoringWebSocketClient {
  connect(): void;
  disconnect(): void;
  subscribe(events: string[]): void;
  onMessage(callback: (data: any) => void): void;
}

// Server-side WebSocket events
interface MonitoringEvents {
  'health-status-change': SystemHealthStatus;
  'budget-update': BudgetStatus;
  'new-alert': Alert;
  'performance-update': PerformanceSummary;
}
```

### Update Strategy
- **30-second polling** for dashboard data
- **WebSocket push** for critical alerts and status changes
- **Smart caching** to reduce API calls
- **Connection recovery** for network issues

## Mobile Responsiveness Strategy

### Breakpoint Design
```css
/* Mobile First Approach */
.monitoring-dashboard {
  /* 320px+ (Mobile) */
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  
  /* 768px+ (Tablet) */
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
  
  /* 1024px+ (Desktop) */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  /* 1440px+ (Large Desktop) */
  @media (min-width: 1440px) {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Mobile Adaptations
- **Priority Content**: Health status and budget overview first
- **Simplified Charts**: Line charts instead of complex visualizations
- **Touch Interactions**: 44px minimum touch targets
- **Condensed Data**: Essential metrics only, expandable details
- **Horizontal Scroll**: For wide data tables

## Internationalization Implementation

### Translation Strategy
```json
// dictionaries/en.json additions
{
  "monitoring": {
    "title": "System Monitoring",
    "subtitle": "Real-time system health and performance metrics",
    "systemHealth": "System Health",
    "budgetOverview": "Budget Overview",
    "performanceMetrics": "Performance Metrics",
    "alerts": "Active Alerts",
    "trends": "System Trends",
    "timeRanges": {
      "1h": "Last Hour",
      "24h": "Last 24 Hours", 
      "7d": "Last 7 Days"
    },
    "budgetLabels": {
      "totalBudget": "Total Budget",
      "currentSpend": "Current Spend",
      "remainingBudget": "Remaining Budget",
      "burnRate": "Burn Rate",
      "costBreakdown": "Cost Breakdown"
    },
    "healthStatus": {
      "healthy": "Healthy",
      "degraded": "Degraded", 
      "unhealthy": "Unhealthy",
      "critical": "Critical"
    }
  }
}

// dictionaries/ja.json additions
{
  "monitoring": {
    "title": "システム監視",
    "subtitle": "リアルタイムシステムヘルスとパフォーマンス指標",
    "systemHealth": "システムヘルス",
    "budgetOverview": "予算概要",
    "performanceMetrics": "パフォーマンス指標",
    "alerts": "アクティブアラート",
    "trends": "システムトレンド"
  }
}
```

## Performance Optimization

### Caching Strategy
- **Browser Cache**: Static chart configurations
- **SWR Cache**: Dashboard data with 30s revalidation
- **Redis Cache**: Aggregated metrics data (server-side)
- **Memory Cache**: Recent trends data for quick access

### Bundle Optimization
```typescript
// Lazy load chart components
const BudgetChart = lazy(() => import('./charts/BudgetChart'));
const PerformanceChart = lazy(() => import('./charts/PerformanceChart'));
const TrendsChart = lazy(() => import('./charts/TrendsChart'));

// Code splitting by chart type
const chartComponents = {
  budget: () => import('./charts/BudgetChart'),
  performance: () => import('./charts/PerformanceChart'),
  trends: () => import('./charts/TrendsChart')
};
```

## Security Considerations

### Data Exposure
- **Public Dashboard**: No sensitive credentials or internal data
- **Rate Limiting**: Prevent API abuse (100 requests/minute per IP)
- **Input Validation**: All API parameters validated with Zod
- **CORS Policy**: Restrict to known domains

### Real-time Security
- **WebSocket Authentication**: Connection validation (if needed later)
- **Message Validation**: All WebSocket messages validated
- **Connection Limits**: Max 50 concurrent WebSocket connections

## Integration with Existing Services

### MonitoringService Integration
```typescript
// Extend existing MonitoringService
class MonitoringService {
  // New methods for dashboard
  async getDashboardData(): Promise<MonitoringDashboardData>;
  async getChartData(timeRange: string, metrics: string[]): Promise<TimeSeriesData[]>;
  async subscribeToUpdates(callback: (data: any) => void): void;
}
```

### Header Component Integration
```typescript
// Add monitoring link to existing Header component
const monitoringLink = {
  href: `/${locale}/monitoring`,
  label: dict.navigation.monitoring,
  icon: 'BarChart3'
};
```

## Error Handling & Fallbacks

### Error Boundary Strategy
```typescript
interface MonitoringErrorBoundaryState {
  hasError: boolean;
  errorType: 'network' | 'parsing' | 'rendering' | 'unknown';
  fallbackData?: Partial<MonitoringDashboardData>;
}

// Fallback UI for different error types
// - Network errors: Show cached data with warning
// - Parsing errors: Show simplified metrics
// - Rendering errors: Show text-based dashboard
```

### Graceful Degradation
- **API Failures**: Show cached data with timestamp
- **WebSocket Failures**: Fall back to polling
- **Chart Failures**: Show tabular data as fallback
- **Service Unavailable**: Display service status indicators

## Testing Strategy

### Unit Testing
- **Components**: React Testing Library for all dashboard components
- **Services**: Jest for MonitoringService extensions
- **Utilities**: Chart data transformation functions
- **Hooks**: Custom hooks for real-time updates

### Integration Testing  
- **API Endpoints**: Test all monitoring endpoints with real data
- **WebSocket**: Test real-time update flows
- **Chart Rendering**: Verify chart data accuracy
- **Mobile**: Test responsive behavior at all breakpoints

### End-to-End Testing
- **Dashboard Load**: Complete dashboard loading workflow
- **Real-time Updates**: WebSocket connection and data updates
- **Mobile Navigation**: Touch interactions and navigation
- **Language Switching**: i18n functionality

## Implementation Dependencies

### Required Packages
```json
{
  "recharts": "^2.8.0",
  "d3": "^7.8.5",
  "@types/d3": "^7.4.3",
  "swr": "^2.2.4",
  "ws": "^8.14.2",
  "@types/ws": "^8.5.8"
}
```

### Development Packages
```json
{
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^6.1.4",
  "jest-environment-jsdom": "^29.7.0"
}
```

## Deployment Considerations

### Cloud Run Configuration
- **Memory**: Increase to 2GB for chart rendering
- **CPU**: 2 vCPU for real-time processing
- **Concurrency**: Support up to 50 concurrent dashboard users

### Environment Variables
```bash
MONITORING_WEBSOCKET_URL=ws://localhost:3000/api/ws/monitoring
MONITORING_CACHE_TTL=30000
MONITORING_UPDATE_INTERVAL=30000
ENABLE_MONITORING_DEBUG=false
```

## Success Metrics

### Technical Performance
- **Initial Load**: < 3 seconds for complete dashboard
- **Chart Rendering**: < 1 second for all visualizations
- **Real-time Updates**: < 30 second latency
- **Mobile Performance**: Lighthouse score > 90

### User Experience  
- **Judge Accessibility**: Easy navigation from any page
- **Visual Appeal**: Professional chart aesthetics
- **Data Clarity**: Clear interpretation of system status
- **Mobile Usability**: Effective touch interactions

---

## Implementation Notes

This design leverages AdCraft AI's existing robust monitoring infrastructure while adding a beautiful, responsive dashboard layer. The hybrid chart approach (Recharts + D3.js) provides the optimal balance of development speed and visual sophistication for the hackathon demo context.

The architecture supports the project's core requirements: public accessibility, budget transparency, real-time updates, and mobile responsiveness, while maintaining the high technical standards expected in the judging process.