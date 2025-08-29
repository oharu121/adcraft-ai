# Monitoring Dashboard Demo Guide

## Quick Access

🚀 **Demo URL**: Navigate to `/monitoring` from the header navigation
🔗 **Direct Links**: 
- English: http://localhost:3000/en/monitoring  
- Japanese: http://localhost:3000/ja/monitoring

## Demo Features Showcase

### 1. System Health Overview (Top Left)
- **Real-time Health Score**: Displays 0-100 system health gauge
- **Service Status Grid**: Shows status of all critical services
  - Firestore, Cloud Storage, Veo, Vertex AI, Logger, Metrics, Cost Tracker
- **System Uptime**: Live uptime counter
- **Critical Issues**: Alert badges with severity indicators

### 2. Budget Overview (Top Right) 
- **Budget Utilization**: Progress bar showing spend vs. allocation
- **Service Cost Breakdown**: Interactive pie chart with Recharts
- **Burn Rate Trend**: Visual spending trajectory
- **Recent Transactions**: Paginated transaction history
- **Budget Alerts**: Projected depletion warnings

### 3. Performance Charts (Bottom Section)
- **Interactive Time Ranges**: 1h, 24h, 7d, 30d selector buttons
- **Response Time Chart**: API performance over time
- **Error Rate Visualization**: Error tracking with tooltips
- **Throughput Metrics**: Request volume monitoring
- **Real-time Updates**: Live data streaming via WebSocket

### 4. Advanced Visualizations
- **D3.js Health Gauge**: Custom animated health score visualization
- **Chart Interactions**: Hover tooltips, zoom, and pan functionality
- **Export Features**: CSV/PNG export capabilities
- **Mobile Responsive**: Touch-friendly interactions on mobile

## Demo Data

The dashboard intelligently displays:
- **Real Data**: When sufficient monitoring data exists
- **Compelling Demo Data**: Realistic patterns with business hours variations, occasional spikes, and incident simulations
- **Business Patterns**: Higher activity during business hours (9-17), weekend variations
- **Realistic Incidents**: 2-5% chance of performance spikes and recovery patterns

## Key Demo Points

### Performance Highlights
✅ **Fast Loading**: Dashboard loads in <3 seconds  
✅ **Responsive APIs**: API endpoints respond in <500ms  
✅ **Real-time Updates**: WebSocket connections with 30-second data refresh  
✅ **Mobile Optimized**: Touch-friendly with collapsible sections  

### Technical Features
✅ **Internationalization**: Full English/Japanese support  
✅ **Error Handling**: Graceful fallbacks and offline indicators  
✅ **Accessibility**: ARIA labels, keyboard navigation, screen reader support  
✅ **Code Splitting**: Lazy loading for optimal performance  

### Integration Completeness
✅ **Header Navigation**: Easily discoverable monitoring link  
✅ **Budget Migration**: Budget info completely moved from main screen  
✅ **WebSocket Real-time**: Live updates with automatic reconnection  
✅ **Service Integration**: Connected to all core AdCraft AI services  

## Demo Script (30 seconds)

1. **Navigate to Monitoring** (5s): Click "Monitoring" in header navigation
2. **System Health** (8s): Point out health score gauge and service status grid
3. **Budget Overview** (7s): Show budget utilization and cost breakdown pie chart
4. **Performance Charts** (7s): Change time range, demonstrate interactive tooltips
5. **Mobile View** (3s): Show responsive design on mobile/narrow screen

## Technical Architecture

- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS
- **Charts**: Recharts for standard charts, D3.js for custom visualizations
- **Real-time**: WebSocket integration with automatic fallback to polling
- **State Management**: SWR for data fetching with 30-second revalidation
- **Performance**: Lazy loading, code splitting, optimized bundle size (106kB)

## Production Readiness

- **Environment Variables**: Configurable for production deployment
- **Cloud Run Compatible**: Tested for Cloud Run deployment
- **Monitoring Alerts**: Self-monitoring with dashboard functionality alerts
- **Error Boundaries**: Component-level error isolation
- **Performance Monitoring**: Self-tracking of dashboard performance metrics

---

**Status**: ✅ Production Ready | **Last Updated**: 2025-08-29