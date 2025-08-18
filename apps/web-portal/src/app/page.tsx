'use client';

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Grid, Typography, Paper, Box } from '@mui/material';
import { RootState } from '@/store';
import { setPageTitle, setBreadcrumbs } from '@/store/slices/uiSlice';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PortfolioSummaryCard from '@/components/dashboard/PortfolioSummaryCard';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import AssetAllocationChart from '@/components/dashboard/AssetAllocationChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import MarketSummary from '@/components/dashboard/MarketSummary';
import WelcomeCard from '@/components/dashboard/WelcomeCard';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { portfolios, selectedPortfolio } = useSelector((state: RootState) => state.portfolio);

  useEffect(() => {
    dispatch(setPageTitle('Dashboard'));
    dispatch(setBreadcrumbs([
      { label: 'Dashboard' }
    ]));
  }, [dispatch]);

  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Welcome Section */}
        <WelcomeCard user={user} />

        {/* Key Metrics Row */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <PortfolioSummaryCard
              title="Total Portfolio Value"
              value="$2,487,325"
              change={15750}
              changePercent={0.64}
              subtitle="Across all portfolios"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <PortfolioSummaryCard
              title="Today's Change"
              value="$15,750"
              change={15750}
              changePercent={0.64}
              subtitle="Daily P&L"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <PortfolioSummaryCard
              title="YTD Return"
              value="18.5%"
              change={45250}
              changePercent={18.5}
              subtitle="Year to date performance"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <PortfolioSummaryCard
              title="Available Cash"
              value="$87,500"
              change={0}
              changePercent={0}
              subtitle="Ready to invest"
            />
          </Grid>
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Portfolio Performance
              </Typography>
              <PerformanceChart />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Asset Allocation
              </Typography>
              <AssetAllocationChart />
            </Paper>
          </Grid>
        </Grid>

        {/* Bottom Row */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <RecentTransactions />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Market Summary
              </Typography>
              <MarketSummary />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </DashboardLayout>
  );
}