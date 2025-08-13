# Investment Platform API Documentation

## Overview
The Investment Platform provides a comprehensive REST API for managing portfolios, market data, analytics, and compliance. All APIs follow RESTful principles and support JSON request/response formats.

## Base URL
- **Production**: `https://api.investment-platform.com/v1`
- **Staging**: `https://api-staging.investment-platform.com/v1`
- **Development**: `http://localhost:3000/api/v1`

## Authentication

### OAuth 2.0 / OpenID Connect
All API endpoints require authentication using OAuth 2.0 Bearer tokens.

```bash
# Obtain access token
curl -X POST https://api.investment-platform.com/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "grant_type": "client_credentials",
    "scope": "portfolio:read portfolio:write analytics:read"
  }'
```

### API Key Authentication (Alternative)
For server-to-server integrations, API key authentication is supported:

```bash
curl -X GET https://api.investment-platform.com/v1/portfolios \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json"
```

## Rate Limiting
- **Standard Rate Limit**: 1,000 requests per hour per API key
- **Burst Limit**: 100 requests per minute
- **Premium Rate Limit**: 10,000 requests per hour (enterprise plans)

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Error Handling

### HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid portfolio configuration",
    "details": [
      {
        "field": "allocation.equity",
        "message": "Must be between 0 and 100"
      }
    ],
    "request_id": "req_1234567890"
  }
}
```

## Core API Endpoints

### Portfolio Management

#### Get All Portfolios
```http
GET /portfolios
```

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 50, max: 100)
- `status` (string, optional): Filter by status (`active`, `inactive`, `archived`)
- `client_id` (string, optional): Filter by client ID

**Response:**
```json
{
  "data": [
    {
      "id": "port_123456789",
      "name": "Conservative Growth Portfolio",
      "client_id": "client_987654321",
      "status": "active",
      "total_value": 1250000.00,
      "currency": "USD",
      "inception_date": "2023-01-15",
      "last_updated": "2024-01-30T10:30:00Z",
      "allocation": {
        "equity": 60.0,
        "fixed_income": 35.0,
        "alternatives": 5.0
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "pages": 3
  }
}
```

#### Create Portfolio
```http
POST /portfolios
```

**Request Body:**
```json
{
  "name": "Growth Portfolio",
  "client_id": "client_987654321",
  "currency": "USD",
  "investment_objective": "capital_growth",
  "risk_profile": "moderate",
  "allocation": {
    "equity": 70.0,
    "fixed_income": 25.0,
    "alternatives": 5.0
  },
  "restrictions": [
    {
      "type": "sector_limit",
      "sector": "technology",
      "max_percentage": 25.0
    }
  ]
}
```

#### Get Portfolio Details
```http
GET /portfolios/{portfolio_id}
```

**Path Parameters:**
- `portfolio_id` (string, required): Portfolio identifier

**Response:**
```json
{
  "id": "port_123456789",
  "name": "Conservative Growth Portfolio",
  "client_id": "client_987654321",
  "status": "active",
  "total_value": 1250000.00,
  "currency": "USD",
  "inception_date": "2023-01-15",
  "last_updated": "2024-01-30T10:30:00Z",
  "positions": [
    {
      "security_id": "AAPL",
      "symbol": "AAPL",
      "quantity": 500,
      "market_value": 87500.00,
      "cost_basis": 82500.00,
      "unrealized_pnl": 5000.00,
      "weight": 7.0
    }
  ],
  "allocation": {
    "equity": 60.0,
    "fixed_income": 35.0,
    "alternatives": 5.0
  },
  "performance": {
    "mtd_return": 2.5,
    "qtd_return": 8.2,
    "ytd_return": 12.8,
    "inception_return": 25.4
  }
}
```

### Market Data

#### Get Real-Time Quotes
```http
GET /market-data/quotes
```

**Query Parameters:**
- `symbols` (string, required): Comma-separated list of symbols
- `fields` (string, optional): Comma-separated list of fields

**Example:**
```bash
GET /market-data/quotes?symbols=AAPL,MSFT,GOOGL&fields=price,volume,change
```

**Response:**
```json
{
  "data": [
    {
      "symbol": "AAPL",
      "price": 175.25,
      "change": 2.15,
      "change_percent": 1.24,
      "volume": 45678900,
      "bid": 175.20,
      "ask": 175.30,
      "last_updated": "2024-01-30T15:59:55Z"
    }
  ]
}
```

#### Get Historical Data
```http
GET /market-data/history/{symbol}
```

**Path Parameters:**
- `symbol` (string, required): Security symbol

**Query Parameters:**
- `from` (string, required): Start date (YYYY-MM-DD)
- `to` (string, required): End date (YYYY-MM-DD)
- `interval` (string, optional): Data interval (`1d`, `1w`, `1m`) (default: `1d`)

### Analytics & Risk

#### Calculate Portfolio Risk Metrics
```http
POST /analytics/risk/portfolio
```

**Request Body:**
```json
{
  "portfolio_id": "port_123456789",
  "risk_metrics": ["var", "expected_shortfall", "beta", "sharpe_ratio"],
  "confidence_level": 0.95,
  "time_horizon": 252,
  "benchmark": "SPY"
}
```

**Response:**
```json
{
  "portfolio_id": "port_123456789",
  "calculation_date": "2024-01-30T16:00:00Z",
  "metrics": {
    "var_95": -0.0287,
    "expected_shortfall": -0.0421,
    "beta": 0.87,
    "sharpe_ratio": 1.24,
    "tracking_error": 0.0456,
    "information_ratio": 0.78
  },
  "benchmark_comparison": {
    "benchmark": "SPY",
    "correlation": 0.82,
    "relative_volatility": 0.94
  }
}
```

#### Performance Attribution Analysis
```http
POST /analytics/performance/attribution
```

**Request Body:**
```json
{
  "portfolio_id": "port_123456789",
  "benchmark": "SPY",
  "start_date": "2024-01-01",
  "end_date": "2024-01-30",
  "attribution_type": "brinson"
}
```

### Trading & Orders

#### Submit Order
```http
POST /trading/orders
```

**Request Body:**
```json
{
  "portfolio_id": "port_123456789",
  "symbol": "AAPL",
  "side": "buy",
  "order_type": "market",
  "quantity": 100,
  "time_in_force": "day",
  "client_order_id": "order_abc123"
}
```

**Response:**
```json
{
  "order_id": "ord_987654321",
  "client_order_id": "order_abc123",
  "status": "pending_new",
  "created_at": "2024-01-30T16:15:00Z",
  "estimated_value": 17525.00
}
```

#### Get Order Status
```http
GET /trading/orders/{order_id}
```

### Compliance & Reporting

#### Generate Compliance Report
```http
POST /compliance/reports
```

**Request Body:**
```json
{
  "report_type": "portfolio_compliance",
  "portfolio_id": "port_123456789",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-30"
  },
  "format": "json"
}
```

#### Get Regulatory Filings
```http
GET /compliance/filings
```

**Query Parameters:**
- `filing_type` (string, optional): Type of filing (`13f`, `adv`, `pf`)
- `status` (string, optional): Filing status (`draft`, `submitted`, `approved`)

## Webhooks

### Event Types
- `portfolio.updated` - Portfolio data changed
- `order.filled` - Order execution completed
- `compliance.breach` - Compliance violation detected
- `market_data.alert` - Price alert triggered

### Webhook Configuration
```http
POST /webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks/investment-platform",
  "events": ["portfolio.updated", "order.filled"],
  "secret": "your_webhook_secret"
}
```

### Webhook Payload Example
```json
{
  "event": "portfolio.updated",
  "timestamp": "2024-01-30T16:30:00Z",
  "data": {
    "portfolio_id": "port_123456789",
    "changes": ["total_value", "positions"]
  },
  "signature": "sha256=..."
}
```

## SDKs and Libraries

### Python SDK
```bash
pip install investment-platform-sdk
```

```python
from investment_platform import Client

client = Client(api_key="your_api_key")
portfolios = client.portfolios.list()
```

### JavaScript SDK
```bash
npm install @investment-platform/sdk
```

```javascript
import { InvestmentPlatform } from '@investment-platform/sdk';

const client = new InvestmentPlatform({ apiKey: 'your_api_key' });
const portfolios = await client.portfolios.list();
```

### Java SDK
```xml
<dependency>
    <groupId>com.investment-platform</groupId>
    <artifactId>investment-platform-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

## Testing

### Sandbox Environment
Use the sandbox environment for testing:
- **Base URL**: `https://api-sandbox.investment-platform.com/v1`
- **API Key**: Use test API keys from the developer portal
- **Test Data**: Pre-populated portfolios and market data available

### Postman Collection
Download our Postman collection with example requests:
```bash
curl -O https://docs.investment-platform.com/postman/collection.json
```

## Support

### Developer Portal
Access our developer portal for:
- API key management
- Usage analytics
- Support tickets
- Community forums

**Portal URL**: https://developers.investment-platform.com

### Support Channels
- **Email**: api-support@investment-platform.com
- **Slack**: #api-support in our developer community
- **Documentation**: https://docs.investment-platform.com

### SLA Commitments
- **Response Time**: 99.9% of API calls complete within 2 seconds
- **Uptime**: 99.95% API availability
- **Support Response**: 24 hours for standard support, 4 hours for premium

---

*This documentation is automatically updated from our OpenAPI specifications. Last updated: $(date)*