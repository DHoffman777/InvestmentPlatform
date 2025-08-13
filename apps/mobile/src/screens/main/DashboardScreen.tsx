import React, {useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Surface,
  IconButton,
  Button,
  Chip,
} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

import {AppDispatch, RootState} from '@/store';
import {fetchPortfolios, refreshPortfolioData} from '@/store/slices/portfolioSlice';
import {theme, spacing} from '@/utils/theme';
import PortfolioSummaryCard from '@/components/dashboard/PortfolioSummaryCard';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import AssetAllocationChart from '@/components/dashboard/AssetAllocationChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import AlertsWidget from '@/components/dashboard/AlertsWidget';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

const {width} = Dimensions.get('window');

const DashboardScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  const {user} = useSelector((state: RootState) => state.auth);
  const {
    portfolios,
    selectedPortfolio,
    performance,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
  } = useSelector((state: RootState) => state.portfolio);

  const {notifications} = useSelector((state: RootState) => state.alert);

  useEffect(() => {
    if (portfolios.length === 0) {
      dispatch(fetchPortfolios());
    }
  }, [dispatch, portfolios.length]);

  const onRefresh = useCallback(() => {
    if (selectedPortfolio) {
      dispatch(refreshPortfolioData(selectedPortfolio.id));
    } else if (portfolios.length > 0) {
      dispatch(refreshPortfolioData(portfolios[0].id));
    } else {
      dispatch(fetchPortfolios());
    }
  }, [dispatch, selectedPortfolio, portfolios]);

  const handleNavigateToPortfolios = () => {
    navigation.navigate('Portfolios' as never);
  };

  const handleNavigateToSettings = () => {
    navigation.navigate('Settings' as never);
  };

  const getTotalPortfolioValue = () => {
    return portfolios.reduce((total, portfolio) => total + portfolio.totalValue, 0);
  };

  const getTotalPerformance = () => {
    if (portfolios.length === 0) return {change: 0, changePercent: 0};
    
    const totalValue = getTotalPortfolioValue();
    const totalChange = portfolios.reduce(
      (total, portfolio) => total + (portfolio.performance?.dayChange || 0),
      0,
    );
    
    return {
      change: totalChange,
      changePercent: totalValue > 0 ? (totalChange / totalValue) * 100 : 0,
    };
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading && portfolios.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner size={48} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Loading your dashboard...
        </Text>
      </View>
    );
  }

  if (error && portfolios.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage message={error} onRetry={() => dispatch(fetchPortfolios())} />
      </View>
    );
  }

  const totalPerformance = getTotalPerformance();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }>
      <Surface style={styles.header} elevation={1}>
        <View style={styles.headerContent}>
          <View style={styles.greetingContainer}>
            <Text variant="headlineSmall" style={styles.greeting}>
              {getGreeting()}, {user?.firstName}
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Here's your portfolio overview
            </Text>
          </View>
          <IconButton
            icon="cog"
            size={24}
            onPress={handleNavigateToSettings}
            style={styles.settingsButton}
          />
        </View>
      </Surface>

      <View style={styles.content}>
        {/* Portfolio Summary */}
        <Card style={styles.summaryCard} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Total Portfolio Value
            </Text>
            <Text variant="displaySmall" style={styles.totalValue}>
              ${getTotalPortfolioValue().toLocaleString()}
            </Text>
            <View style={styles.performanceContainer}>
              <Chip
                icon={totalPerformance.change >= 0 ? 'trending-up' : 'trending-down'}
                textStyle={[
                  styles.performanceText,
                  {
                    color:
                      totalPerformance.change >= 0
                        ? theme.colors.secondary
                        : theme.colors.error,
                  },
                ]}
                style={[
                  styles.performanceChip,
                  {
                    backgroundColor:
                      totalPerformance.change >= 0
                        ? theme.colors.secondaryContainer
                        : theme.colors.errorContainer,
                  },
                ]}>
                {totalPerformance.change >= 0 ? '+' : ''}
                ${Math.abs(totalPerformance.change).toLocaleString()} (
                {totalPerformance.changePercent.toFixed(2)}%)
              </Chip>
            </View>
            <Button
              mode="outlined"
              onPress={handleNavigateToPortfolios}
              style={styles.viewPortfoliosButton}>
              View All Portfolios
            </Button>
          </Card.Content>
        </Card>

        {/* Alerts Widget */}
        {notifications.length > 0 && (
          <AlertsWidget alerts={notifications.slice(0, 3)} />
        )}

        {/* Performance Chart */}
        {performance && (
          <Card style={styles.chartCard} elevation={2}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Performance Overview
              </Text>
              <PerformanceChart
                performance={performance}
                height={200}
                width={width - spacing.lg * 4}
              />
            </Card.Content>
          </Card>
        )}

        {/* Asset Allocation */}
        {selectedPortfolio && (
          <Card style={styles.chartCard} elevation={2}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Asset Allocation
              </Text>
              <AssetAllocationChart
                positions={selectedPortfolio.positions}
                height={200}
                width={width - spacing.lg * 4}
              />
            </Card.Content>
          </Card>
        )}

        {/* Recent Transactions */}
        <RecentTransactions />

        {/* Quick Actions */}
        <Card style={styles.actionsCard} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Quick Actions
            </Text>
            <View style={styles.actionsContainer}>
              <Button
                mode="outlined"
                icon="file-document"
                onPress={() => navigation.navigate('Documents' as never)}
                style={styles.actionButton}>
                Documents
              </Button>
              <Button
                mode="outlined"
                icon="message"
                onPress={() => navigation.navigate('Messages' as never)}
                style={styles.actionButton}>
                Messages
              </Button>
            </View>
          </Card.Content>
        </Card>

        {lastUpdated && (
          <Text variant="bodySmall" style={styles.lastUpdated}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: theme.colors.onSurfaceVariant,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  settingsButton: {
    margin: 0,
  },
  content: {
    padding: spacing.lg,
  },
  summaryCard: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  totalValue: {
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  performanceContainer: {
    marginBottom: spacing.md,
  },
  performanceChip: {
    alignSelf: 'flex-start',
  },
  performanceText: {
    fontWeight: '600',
  },
  viewPortfoliosButton: {
    marginTop: spacing.sm,
  },
  chartCard: {
    marginBottom: spacing.lg,
  },
  actionsCard: {
    marginBottom: spacing.lg,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  lastUpdated: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.md,
  },
});

export default DashboardScreen;