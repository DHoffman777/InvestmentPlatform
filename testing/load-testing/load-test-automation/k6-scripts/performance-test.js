import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

/**
 * K6 Performance Test Script for Investment Management Platform
 * Comprehensive load testing with business-specific scenarios
 */

// Custom metrics
const orderPlacementRate = new Rate('order_placement_success');
const portfolioUpdateRate = new Rate('portfolio_update_success');
const marketDataLatency = new Trend('market_data_latency');
const tradingErrors = new Counter('trading_errors');

// Test data
const users = new SharedArray('users', function () {
  return [
    { username: 'pm@testfirm.com', password: 'TestPM123!', role: 'portfolio_manager' },
    { username: 'trader@testfirm.com', password: 'TestTrader123!', role: 'trader' },
    { username: 'analyst@testfirm.com', password: 'TestAnalyst123!', role: 'analyst' },
    { username: 'client@testfirm.com', password: 'TestClient123!', role: 'client' }
  ];
});

const symbols = new SharedArray('symbols', function () {
  return ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'SPY', 'QQQ'];
});

const portfolioIds = new SharedArray('portfolios', function () {
  return ['portfolio-1', 'portfolio-2', 'portfolio-3', 'portfolio-4', 'portfolio-5'];
});

// Test configuration
export let options = {
  scenarios: {
    // Baseline load test
    baseline_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 },   // Ramp up to 100 users
        { duration: '20m', target: 100 },  // Stay at 100 users
        { duration: '5m', target: 0 },     // Ramp down
      ],
    },
    
    // Peak trading hours simulation
    peak_trading: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 500 },   // Pre-market ramp up
        { duration: '30m', target: 2000 }, // Market open surge
        { duration: '45m', target: 1200 }, // Mid-day steady
        { duration: '30m', target: 2000 }, // Market close surge
        { duration: '5m', target: 0 },     // Ramp down
      ],
    },
    
    // Stress testing
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      preAllocatedVUs: 500,
      maxVUs: 5000,
      stages: [
        { duration: '10m', target: 500 },  // Ramp up requests/sec
        { duration: '20m', target: 1000 }, // High load
        { duration: '10m', target: 2000 }, // Stress level
        { duration: '5m', target: 0 },     // Ramp down
      ],
    },
    
    // Spike testing
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '5m', target: 100 },   // Normal load
        { duration: '1m', target: 2000 },  // Sudden spike
        { duration: '5m', target: 2000 },  // Maintain spike
        { duration: '1m', target: 100 },   // Drop back
        { duration: '5m', target: 100 },   // Normal load
        { duration: '5m', target: 0 },     // Ramp down
      ],
    }
  },
  
  thresholds: {
    // Overall performance thresholds
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'], // Less than 1% errors
    
    // Business-specific thresholds
    order_placement_success: ['rate>0.99'], // 99% success rate for orders
    portfolio_update_success: ['rate>0.995'], // 99.5% success for portfolio updates
    market_data_latency: ['p(95)<100'], // Market data under 100ms
    trading_errors: ['count<100'], // Less than 100 trading errors total
    
    // Scenario-specific thresholds
    'http_req_duration{scenario:peak_trading}': ['p(95)<800'],
    'http_req_duration{scenario:stress_test}': ['p(95)<1200'],
  }
};

// Base URL configuration
const BASE_URL = __ENV.LOAD_TEST_URL || 'http://localhost:3000';

// Authentication helper
function authenticate(user) {
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    username: user.username,
    password: user.password
  }), {
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'auth token received': (r) => r.json('token') !== null,
  });
  
  return loginResponse.json('token');
}

// Portfolio management scenario
export function portfolioManagement() {
  const user = users[Math.floor(Math.random() * users.length)];
  const token = authenticate(user);
  
  if (!token) {
    tradingErrors.add(1);
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Get portfolio dashboard
  const dashboardStart = new Date().getTime();
  const dashboardResponse = http.get(`${BASE_URL}/api/portfolios/dashboard`, { headers });
  const dashboardEnd = new Date().getTime();
  
  check(dashboardResponse, {
    'dashboard loaded': (r) => r.status === 200,
    'dashboard has portfolios': (r) => r.json('portfolios').length > 0,
  }) && portfolioUpdateRate.add(1);
  
  // Get specific portfolio details
  const portfolioId = portfolioIds[Math.floor(Math.random() * portfolioIds.length)];
  const positionsResponse = http.get(`${BASE_URL}/api/portfolios/${portfolioId}/positions`, { headers });
  
  check(positionsResponse, {
    'positions loaded': (r) => r.status === 200,
    'positions data present': (r) => r.json('positions') !== null,
  });
  
  // Get portfolio performance
  const performanceResponse = http.get(`${BASE_URL}/api/portfolios/${portfolioId}/performance`, { headers });
  
  check(performanceResponse, {
    'performance loaded': (r) => r.status === 200,
    'performance metrics present': (r) => r.json('returns') !== null,
  });
  
  sleep(1); // Think time
}

// Trading operations scenario
export function tradingOperations() {
  const user = users.find(u => u.role === 'trader' || u.role === 'portfolio_manager');
  if (!user) return;
  
  const token = authenticate(user);
  if (!token) {
    tradingErrors.add(1);
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Place a market order
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const quantity = [100, 200, 500, 1000][Math.floor(Math.random() * 4)];
  const side = Math.random() > 0.5 ? 'buy' : 'sell';
  const portfolioId = portfolioIds[Math.floor(Math.random() * portfolioIds.length)];
  
  const orderData = {
    symbol: symbol,
    quantity: quantity,
    side: side,
    type: 'market',
    portfolioId: portfolioId
  };
  
  const orderResponse = http.post(`${BASE_URL}/api/orders`, JSON.stringify(orderData), { headers });
  
  const orderSuccess = check(orderResponse, {
    'order placed successfully': (r) => r.status === 201,
    'order has ID': (r) => r.json('orderId') !== null,
  });
  
  orderPlacementRate.add(orderSuccess);
  
  if (orderSuccess) {
    const orderId = orderResponse.json('orderId');
    
    // Check order status
    const statusResponse = http.get(`${BASE_URL}/api/orders/${orderId}/status`, { headers });
    
    check(statusResponse, {
      'order status retrieved': (r) => r.status === 200,
      'order has status': (r) => r.json('status') !== null,
    });
  } else {
    tradingErrors.add(1);
  }
  
  // Get active orders
  const activeOrdersResponse = http.get(`${BASE_URL}/api/orders/active`, { headers });
  
  check(activeOrdersResponse, {
    'active orders retrieved': (r) => r.status === 200,
  });
  
  sleep(0.5); // Short think time for trading
}

// Market data consumption scenario
export function marketDataConsumption() {
  const user = users[Math.floor(Math.random() * users.length)];
  const token = authenticate(user);
  
  if (!token) return;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Get bulk quotes
  const quotesStart = new Date().getTime();
  const quotesResponse = http.get(`${BASE_URL}/api/market-data/quotes/bulk?symbols=${symbols.join(',')}`, { headers });
  const quotesEnd = new Date().getTime();
  
  marketDataLatency.add(quotesEnd - quotesStart);
  
  check(quotesResponse, {
    'quotes retrieved': (r) => r.status === 200,
    'quotes have data': (r) => r.json('quotes').length > 0,
  });
  
  // Get level 2 data for random symbol
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const level2Response = http.get(`${BASE_URL}/api/market-data/level2/${symbol}`, { headers });
  
  check(level2Response, {
    'level2 data retrieved': (r) => r.status === 200,
    'level2 has bids/asks': (r) => r.json('bids') && r.json('asks'),
  });
  
  // Get intraday chart
  const chartResponse = http.get(`${BASE_URL}/api/market-data/charts/intraday/${symbol}`, { headers });
  
  check(chartResponse, {
    'chart data retrieved': (r) => r.status === 200,
  });
  
  sleep(0.1); // Fast market data consumption
}

// Client portal usage scenario
export function clientPortalUsage() {
  const clientUser = users.find(u => u.role === 'client');
  if (!clientUser) return;
  
  const token = authenticate(clientUser);
  if (!token) return;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Get portfolio summary
  const summaryResponse = http.get(`${BASE_URL}/api/client/portfolio-summary`, { headers });
  
  check(summaryResponse, {
    'portfolio summary loaded': (r) => r.status === 200,
    'summary has total value': (r) => r.json('totalValue') !== null,
  });
  
  // Get recent transactions
  const transactionsResponse = http.get(`${BASE_URL}/api/client/recent-transactions`, { headers });
  
  check(transactionsResponse, {
    'transactions loaded': (r) => r.status === 200,
  });
  
  // Get client alerts
  const alertsResponse = http.get(`${BASE_URL}/api/client/alerts`, { headers });
  
  check(alertsResponse, {
    'alerts loaded': (r) => r.status === 200,
  });
  
  // Get statements
  const statementsResponse = http.get(`${BASE_URL}/api/client/statements`, { headers });
  
  check(statementsResponse, {
    'statements loaded': (r) => r.status === 200,
  });
  
  sleep(3); // Longer think time for client users
}

// Reporting and analytics scenario
export function reportingAnalytics() {
  const user = users.find(u => u.role === 'portfolio_manager' || u.role === 'analyst');
  if (!user) return;
  
  const token = authenticate(user);
  if (!token) return;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Get performance report
  const performanceResponse = http.get(`${BASE_URL}/api/reports/performance`, { headers });
  
  check(performanceResponse, {
    'performance report generated': (r) => r.status === 200,
  });
  
  // Get risk analytics
  const riskResponse = http.get(`${BASE_URL}/api/analytics/risk`, { headers });
  
  check(riskResponse, {
    'risk analytics loaded': (r) => r.status === 200,
  });
  
  // Generate custom report
  const reportData = {
    type: 'monthly',
    portfolioIds: [portfolioIds[0], portfolioIds[1]],
    dateRange: {
      start: '2024-01-01',
      end: '2024-01-31'
    }
  };
  
  const customReportResponse = http.post(`${BASE_URL}/api/reports/generate`, JSON.stringify(reportData), { headers });
  
  check(customReportResponse, {
    'custom report requested': (r) => r.status === 202,
  });
  
  sleep(2); // Think time for analysis
}

// Main test function with scenario distribution
export default function () {
  const scenario = Math.random();
  
  if (scenario < 0.4) {
    portfolioManagement(); // 40% of requests
  } else if (scenario < 0.7) {
    tradingOperations(); // 30% of requests
  } else if (scenario < 0.85) {
    marketDataConsumption(); // 15% of requests
  } else if (scenario < 0.95) {
    clientPortalUsage(); // 10% of requests
  } else {
    reportingAnalytics(); // 5% of requests
  }
}

// Test lifecycle hooks
export function setup() {
  console.log('🚀 Starting Investment Platform Performance Test');
  console.log(`Target: ${BASE_URL}`);
  
  // Verify system health before starting
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    throw new Error('System health check failed');
  }
  
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log('✅ Performance test completed');
  console.log(`Started at: ${data.startTime}`);
  console.log(`Ended at: ${new Date().toISOString()}`);
}

// Generate HTML report
export function handleSummary(data) {
  return {
    'load-test-results/k6-performance-report.html': htmlReport(data),
    'load-test-results/k6-performance-results.json': JSON.stringify(data, null, 2),
  };
}