# Investment Platform - Web Portal

A white-labeled web interface for the Investment Platform, providing clients with secure access to their portfolios, performance analytics, documents, and communication tools.

## Features

### ✅ Implemented
- **Responsive Dashboard** with key portfolio metrics
- **Portfolio Performance Visualization** with interactive charts
- **Asset Allocation Display** with pie charts and target tracking
- **Recent Transactions View** with real-time updates
- **Market Summary** with major indices
- **White-labeled Theming** with customizable branding
- **Secure Authentication** with NextAuth.js
- **Redux State Management** for optimal performance
- **Material-UI Components** for professional design
- **Responsive Design** for desktop and mobile devices

### 🚧 To Be Implemented
- **Document Access & E-delivery System**
- **Secure Messaging System**
- **Report Generation Interface**
- **Advanced Analytics Dashboard**
- **User Settings & Preferences**
- **Multi-language Support**
- **Dark/Light Theme Toggle**

## Technology Stack

- **Framework:** Next.js 14 with App Router
- **UI Library:** Material-UI v5
- **State Management:** Redux Toolkit
- **Charts:** Recharts
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS + Material-UI
- **TypeScript:** Full type safety

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Running Investment Platform backend services

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Update environment variables in `.env.local`:
```env
NEXTAUTH_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001
PORTFOLIO_SERVICE_URL=http://localhost:3001
AUTH_SERVICE_URL=http://localhost:3002
MARKET_DATA_SERVICE_URL=http://localhost:3003
```

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
npm run build
npm run start
```

## Architecture

### Component Structure
```
src/
├── app/                    # Next.js App Router
├── components/             # Reusable UI components
│   ├── layout/            # Layout components
│   └── dashboard/         # Dashboard-specific components
├── store/                 # Redux store configuration
│   └── slices/           # Redux slices
├── lib/                   # Utilities and configurations
├── hooks/                 # Custom React hooks
├── services/              # API service layers
└── types/                 # TypeScript type definitions
```

### Key Components
- **DashboardLayout**: Main application shell with navigation
- **PortfolioSummaryCard**: Key metrics display cards
- **PerformanceChart**: Line chart for portfolio performance
- **AssetAllocationChart**: Pie chart for asset allocation
- **RecentTransactions**: Transaction history table
- **MarketSummary**: Market indices summary

## Integration with Backend Services

The web portal integrates with the following Investment Platform services:

- **Portfolio Service** (port 3001): Portfolio data, positions, performance
- **Auth Service** (port 3002): User authentication and authorization
- **Market Data Service** (port 3003): Real-time market data and quotes

## Security Features

- **CSRF Protection**: Built-in Next.js CSRF protection
- **Content Security Policy**: Secure headers configuration
- **Session Management**: Secure session handling with NextAuth.js
- **Input Validation**: Form validation with react-hook-form + Yup
- **Authentication**: JWT-based authentication with automatic refresh

## White Label Customization

The portal supports white-label customization through environment variables:

```env
BRAND_NAME=Your Company Name
BRAND_LOGO_URL=/assets/your-logo.png
PRIMARY_COLOR=#your-primary-color
SECONDARY_COLOR=#your-secondary-color
```

## Performance Optimizations

- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js Image component
- **Caching**: React Query for API caching
- **Bundle Analysis**: Built-in bundle analyzer
- **Lazy Loading**: Component lazy loading where appropriate

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run e2e

# Type checking
npm run type-check
```

## License

Private - Investment Platform Web Portal