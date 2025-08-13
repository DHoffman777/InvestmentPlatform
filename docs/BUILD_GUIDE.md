# Investment Platform - Simple Build Guide

This guide provides straightforward instructions for building the Investment Management Platform.

## Prerequisites

- Node.js 18+ installed
- npm package manager
- Git

## Quick Start (5 Steps)

### 1. Navigate to Project Directory
```bash
cd /path/to/InvestmentPlatform
```
*Replace `/path/to/InvestmentPlatform` with the actual path to your project folder*

### 2. Install Dependencies
**Run from the root project directory:**
```bash
npm install
```

### 3. Build Core Services
**Run from the root project directory:**
```bash
npx lerna run build --scope="@investment-platform/types" --scope="@investment-platform/shared" --scope="@investment-platform/auth-service"
```

### 4. Check Build Status
The build is successful when you see:
```
✅ Successfully ran target build for 3 projects
```

### 5. View Built Files
**Run from the root project directory:**
```bash
ls services/auth/dist/
ls libs/types/dist/
ls libs/shared/dist/
```

### 6. Test the Auth Service (Optional)
**Navigate to the auth service directory:**
```bash
cd services/auth
npm start
```
**To return to the root directory:**
```bash
cd ../..
```
*Note: This will show Redis connection errors, which is normal - it means the service is running but missing database connections.*

## What Gets Built

- **Types Library** (`libs/types/`) - Shared TypeScript interfaces and types
- **Shared Library** (`libs/shared/`) - Common utilities (logging, Kafka, etc.)
- **Auth Service** (`services/auth/`) - Authentication and authorization service

## Common Issues & Solutions

### Issue: "lerna: not found"
**Solution:** Use `npx lerna` instead of just `lerna`

### Issue: Build fails with TypeScript errors
**Solution:** The dependency fixes have been applied. If you see errors, try from the root project directory:
```bash
npx lerna clean
npm install
npx lerna run build --scope="@investment-platform/types" --scope="@investment-platform/shared" --scope="@investment-platform/auth-service"
```

### Issue: Redis connection errors when running services
**Solution:** This is expected - the services need Redis and PostgreSQL to run fully. The build process doesn't require these databases.

## Full Application Setup (Advanced)

For running the complete application with all services, from the root project directory:

1. **Install Docker** (for databases and services)
2. **Set up environment variables** (see `.env.example` files)
3. **Start databases:**
   ```bash
   docker compose up -d redis postgres
   ```
4. **Run all services:**
   ```bash
   npm run dev
   ```

## Project Structure

```
investment-platform/
├── services/          # Individual microservices
│   ├── auth/         # ✅ Authentication service (builds successfully)
│   ├── portfolio-service/  # Portfolio management
│   └── market-data/  # Market data feeds
├── libs/             # Shared libraries
│   ├── types/        # ✅ TypeScript definitions (builds successfully)
│   └── shared/       # ✅ Common utilities (builds successfully)
└── docs/             # Documentation
```

## Build Scripts Explained

- `npm install` - Installs all dependencies for the monorepo
- `npx lerna run build` - Builds all services using Lerna
- `--scope="package-name"` - Builds only specific packages
- `npm run dev` - Starts development environment with Docker Compose

## Success Indicators

✅ **Build Successful:** No TypeScript compilation errors
✅ **Files Generated:** JavaScript files appear in `dist/` folders  
✅ **Service Starts:** Can run `npm start` in individual service directories

## Next Steps

After successful build:
1. Review the [Implementation Guide](implementation-guide.md) for feature details
2. Check [API Documentation](API_DOCUMENTATION.md) for service endpoints
3. Set up databases for full functionality testing

---

**Need Help?** 
- Check the [troubleshooting section](implementation-guide.md#troubleshooting) in the implementation guide
- Review service-specific README files in each service directory