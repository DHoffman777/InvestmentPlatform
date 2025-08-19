"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardPage;
const react_1 = require("react");
const react_redux_1 = require("react-redux");
const material_1 = require("@mui/material");
const uiSlice_1 = require("@/store/slices/uiSlice");
const DashboardLayout_1 = __importDefault(require("@/components/layout/DashboardLayout"));
const PortfolioSummaryCard_1 = __importDefault(require("@/components/dashboard/PortfolioSummaryCard"));
const PerformanceChart_1 = __importDefault(require("@/components/dashboard/PerformanceChart"));
const AssetAllocationChart_1 = __importDefault(require("@/components/dashboard/AssetAllocationChart"));
const RecentTransactions_1 = __importDefault(require("@/components/dashboard/RecentTransactions"));
const MarketSummary_1 = __importDefault(require("@/components/dashboard/MarketSummary"));
const WelcomeCard_1 = __importDefault(require("@/components/dashboard/WelcomeCard"));
function DashboardPage() {
    const dispatch = (0, react_redux_1.useDispatch)();
    const { user } = (0, react_redux_1.useSelector)((state) => state.auth);
    const { portfolios, selectedPortfolio } = (0, react_redux_1.useSelector)((state) => state.portfolio);
    (0, react_1.useEffect)(() => {
        dispatch((0, uiSlice_1.setPageTitle)('Dashboard'));
        dispatch((0, uiSlice_1.setBreadcrumbs)([
            { label: 'Dashboard' }
        ]));
    }, [dispatch]);
    return (<DashboardLayout_1.default>
      <material_1.Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Welcome Section */}
        <WelcomeCard_1.default user={user}/>

        {/* Key Metrics Row */}
        <material_1.Grid container spacing={3} sx={{ mb: 3 }}>
          <material_1.Grid item xs={12} sm={6} md={3}>
            <PortfolioSummaryCard_1.default title="Total Portfolio Value" value="$2,487,325" change={15750} changePercent={0.64} subtitle="Across all portfolios"/>
          </material_1.Grid>
          <material_1.Grid item xs={12} sm={6} md={3}>
            <PortfolioSummaryCard_1.default title="Today's Change" value="$15,750" change={15750} changePercent={0.64} subtitle="Daily P&L"/>
          </material_1.Grid>
          <material_1.Grid item xs={12} sm={6} md={3}>
            <PortfolioSummaryCard_1.default title="YTD Return" value="18.5%" change={45250} changePercent={18.5} subtitle="Year to date performance"/>
          </material_1.Grid>
          <material_1.Grid item xs={12} sm={6} md={3}>
            <PortfolioSummaryCard_1.default title="Available Cash" value="$87,500" change={0} changePercent={0} subtitle="Ready to invest"/>
          </material_1.Grid>
        </material_1.Grid>

        {/* Charts Row */}
        <material_1.Grid container spacing={3} sx={{ mb: 3 }}>
          <material_1.Grid item xs={12} md={8}>
            <material_1.Paper sx={{ p: 3, height: 400 }}>
              <material_1.Typography variant="h6" gutterBottom>
                Portfolio Performance
              </material_1.Typography>
              <PerformanceChart_1.default />
            </material_1.Paper>
          </material_1.Grid>
          <material_1.Grid item xs={12} md={4}>
            <material_1.Paper sx={{ p: 3, height: 400 }}>
              <material_1.Typography variant="h6" gutterBottom>
                Asset Allocation
              </material_1.Typography>
              <AssetAllocationChart_1.default />
            </material_1.Paper>
          </material_1.Grid>
        </material_1.Grid>

        {/* Bottom Row */}
        <material_1.Grid container spacing={3}>
          <material_1.Grid item xs={12} md={8}>
            <material_1.Paper sx={{ p: 3 }}>
              <material_1.Typography variant="h6" gutterBottom>
                Recent Transactions
              </material_1.Typography>
              <RecentTransactions_1.default />
            </material_1.Paper>
          </material_1.Grid>
          <material_1.Grid item xs={12} md={4}>
            <material_1.Paper sx={{ p: 3 }}>
              <material_1.Typography variant="h6" gutterBottom>
                Market Summary
              </material_1.Typography>
              <MarketSummary_1.default />
            </material_1.Paper>
          </material_1.Grid>
        </material_1.Grid>
      </material_1.Container>
    </DashboardLayout_1.default>);
}
