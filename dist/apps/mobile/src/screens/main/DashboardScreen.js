"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_paper_1 = require("react-native-paper");
const react_redux_1 = require("react-redux");
const native_1 = require("@react-navigation/native");
const portfolioSlice_1 = require("@/store/slices/portfolioSlice");
const theme_1 = require("@/utils/theme");
const PerformanceChart_1 = __importDefault(require("@/components/dashboard/PerformanceChart"));
const AssetAllocationChart_1 = __importDefault(require("@/components/dashboard/AssetAllocationChart"));
const RecentTransactions_1 = __importDefault(require("@/components/dashboard/RecentTransactions"));
const AlertsWidget_1 = __importDefault(require("@/components/dashboard/AlertsWidget"));
const LoadingSpinner_1 = __importDefault(require("@/components/common/LoadingSpinner"));
const ErrorMessage_1 = __importDefault(require("@/components/common/ErrorMessage"));
const { width } = react_native_1.Dimensions.get('window');
const DashboardScreen = () => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const navigation = (0, native_1.useNavigation)();
    const { user } = (0, react_redux_1.useSelector)((state) => state.auth);
    const { portfolios, selectedPortfolio, performance, isLoading, isRefreshing, error, lastUpdated, } = (0, react_redux_1.useSelector)((state) => state.portfolio);
    const { notifications } = (0, react_redux_1.useSelector)((state) => state.alert);
    (0, react_1.useEffect)(() => {
        if (portfolios.length === 0) {
            dispatch((0, portfolioSlice_1.fetchPortfolios)());
        }
    }, [dispatch, portfolios.length]);
    const onRefresh = (0, react_1.useCallback)(() => {
        if (selectedPortfolio) {
            dispatch((0, portfolioSlice_1.refreshPortfolioData)(selectedPortfolio.id));
        }
        else if (portfolios.length > 0) {
            dispatch((0, portfolioSlice_1.refreshPortfolioData)(portfolios[0].id));
        }
        else {
            dispatch((0, portfolioSlice_1.fetchPortfolios)());
        }
    }, [dispatch, selectedPortfolio, portfolios]);
    const handleNavigateToPortfolios = () => {
        navigation.navigate('Portfolios');
    };
    const handleNavigateToSettings = () => {
        navigation.navigate('Settings');
    };
    const getTotalPortfolioValue = () => {
        return portfolios.reduce((total, portfolio) => total + portfolio.totalValue, 0);
    };
    const getTotalPerformance = () => {
        if (portfolios.length === 0)
            return { change: 0, changePercent: 0 };
        const totalValue = getTotalPortfolioValue();
        const totalChange = portfolios.reduce((total, portfolio) => total + (portfolio.performance?.dayChange || 0), 0);
        return {
            change: totalChange,
            changePercent: totalValue > 0 ? (totalChange / totalValue) * 100 : 0,
        };
    };
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12)
            return 'Good morning';
        if (hour < 18)
            return 'Good afternoon';
        return 'Good evening';
    };
    if (isLoading && portfolios.length === 0) {
        return (<react_native_1.View style={styles.centerContainer}>
        <LoadingSpinner_1.default size={48}/>
        <react_native_paper_1.Text variant="bodyLarge" style={styles.loadingText}>
          Loading your dashboard...
        </react_native_paper_1.Text>
      </react_native_1.View>);
    }
    if (error && portfolios.length === 0) {
        return (<react_native_1.View style={styles.centerContainer}>
        <ErrorMessage_1.default message={error} onRetry={() => dispatch((0, portfolioSlice_1.fetchPortfolios)())}/>
      </react_native_1.View>);
    }
    const totalPerformance = getTotalPerformance();
    return (<react_native_1.ScrollView style={styles.container} refreshControl={<react_native_1.RefreshControl refreshing={isRefreshing} onRefresh={onRefresh}/>}>
      <react_native_paper_1.Surface style={styles.header} elevation={1}>
        <react_native_1.View style={styles.headerContent}>
          <react_native_1.View style={styles.greetingContainer}>
            <react_native_paper_1.Text variant="headlineSmall" style={styles.greeting}>
              {getGreeting()}, {user?.firstName}
            </react_native_paper_1.Text>
            <react_native_paper_1.Text variant="bodyMedium" style={styles.headerSubtitle}>
              Here's your portfolio overview
            </react_native_paper_1.Text>
          </react_native_1.View>
          <react_native_paper_1.IconButton icon="cog" size={24} onPress={handleNavigateToSettings} style={styles.settingsButton}/>
        </react_native_1.View>
      </react_native_paper_1.Surface>

      <react_native_1.View style={styles.content}>
        {/* Portfolio Summary */}
        <react_native_paper_1.Card style={styles.summaryCard} elevation={2}>
          <react_native_paper_1.Card.Content>
            <react_native_paper_1.Text variant="titleMedium" style={styles.cardTitle}>
              Total Portfolio Value
            </react_native_paper_1.Text>
            <react_native_paper_1.Text variant="displaySmall" style={styles.totalValue}>
              ${getTotalPortfolioValue().toLocaleString()}
            </react_native_paper_1.Text>
            <react_native_1.View style={styles.performanceContainer}>
              <react_native_paper_1.Chip icon={totalPerformance.change >= 0 ? 'trending-up' : 'trending-down'} textStyle={[
            styles.performanceText,
            {
                color: totalPerformance.change >= 0
                    ? theme_1.theme.colors.secondary
                    : theme_1.theme.colors.error,
            },
        ]} style={[
            styles.performanceChip,
            {
                backgroundColor: totalPerformance.change >= 0
                    ? theme_1.theme.colors.secondaryContainer
                    : theme_1.theme.colors.errorContainer,
            },
        ]}>
                {totalPerformance.change >= 0 ? '+' : ''}
                ${Math.abs(totalPerformance.change).toLocaleString()} (
                {totalPerformance.changePercent.toFixed(2)}%)
              </react_native_paper_1.Chip>
            </react_native_1.View>
            <react_native_paper_1.Button mode="outlined" onPress={handleNavigateToPortfolios} style={styles.viewPortfoliosButton}>
              View All Portfolios
            </react_native_paper_1.Button>
          </react_native_paper_1.Card.Content>
        </react_native_paper_1.Card>

        {/* Alerts Widget */}
        {notifications.length > 0 && (<AlertsWidget_1.default alerts={notifications.slice(0, 3)}/>)}

        {/* Performance Chart */}
        {performance && (<react_native_paper_1.Card style={styles.chartCard} elevation={2}>
            <react_native_paper_1.Card.Content>
              <react_native_paper_1.Text variant="titleMedium" style={styles.cardTitle}>
                Performance Overview
              </react_native_paper_1.Text>
              <PerformanceChart_1.default performance={performance} height={200} width={width - theme_1.spacing.lg * 4}/>
            </react_native_paper_1.Card.Content>
          </react_native_paper_1.Card>)}

        {/* Asset Allocation */}
        {selectedPortfolio && (<react_native_paper_1.Card style={styles.chartCard} elevation={2}>
            <react_native_paper_1.Card.Content>
              <react_native_paper_1.Text variant="titleMedium" style={styles.cardTitle}>
                Asset Allocation
              </react_native_paper_1.Text>
              <AssetAllocationChart_1.default positions={selectedPortfolio.positions} height={200} width={width - theme_1.spacing.lg * 4}/>
            </react_native_paper_1.Card.Content>
          </react_native_paper_1.Card>)}

        {/* Recent Transactions */}
        <RecentTransactions_1.default />

        {/* Quick Actions */}
        <react_native_paper_1.Card style={styles.actionsCard} elevation={2}>
          <react_native_paper_1.Card.Content>
            <react_native_paper_1.Text variant="titleMedium" style={styles.cardTitle}>
              Quick Actions
            </react_native_paper_1.Text>
            <react_native_1.View style={styles.actionsContainer}>
              <react_native_paper_1.Button mode="outlined" icon="file-document" onPress={() => navigation.navigate('Documents')} style={styles.actionButton}>
                Documents
              </react_native_paper_1.Button>
              <react_native_paper_1.Button mode="outlined" icon="message" onPress={() => navigation.navigate('Messages')} style={styles.actionButton}>
                Messages
              </react_native_paper_1.Button>
            </react_native_1.View>
          </react_native_paper_1.Card.Content>
        </react_native_paper_1.Card>

        {lastUpdated && (<react_native_paper_1.Text variant="bodySmall" style={styles.lastUpdated}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </react_native_paper_1.Text>)}
      </react_native_1.View>
    </react_native_1.ScrollView>);
};
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme_1.theme.colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme_1.theme.colors.background,
    },
    loadingText: {
        marginTop: theme_1.spacing.md,
        color: theme_1.theme.colors.onSurfaceVariant,
    },
    header: {
        backgroundColor: theme_1.theme.colors.surface,
        paddingHorizontal: theme_1.spacing.lg,
        paddingVertical: theme_1.spacing.md,
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
        color: theme_1.theme.colors.onSurface,
        fontWeight: '600',
    },
    headerSubtitle: {
        color: theme_1.theme.colors.onSurfaceVariant,
        marginTop: theme_1.spacing.xs,
    },
    settingsButton: {
        margin: 0,
    },
    content: {
        padding: theme_1.spacing.lg,
    },
    summaryCard: {
        marginBottom: theme_1.spacing.lg,
    },
    cardTitle: {
        marginBottom: theme_1.spacing.md,
        fontWeight: '600',
    },
    totalValue: {
        color: theme_1.theme.colors.primary,
        fontWeight: '700',
        marginBottom: theme_1.spacing.sm,
    },
    performanceContainer: {
        marginBottom: theme_1.spacing.md,
    },
    performanceChip: {
        alignSelf: 'flex-start',
    },
    performanceText: {
        fontWeight: '600',
    },
    viewPortfoliosButton: {
        marginTop: theme_1.spacing.sm,
    },
    chartCard: {
        marginBottom: theme_1.spacing.lg,
    },
    actionsCard: {
        marginBottom: theme_1.spacing.lg,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: theme_1.spacing.md,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: theme_1.spacing.xs,
    },
    lastUpdated: {
        textAlign: 'center',
        color: theme_1.theme.colors.onSurfaceVariant,
        marginTop: theme_1.spacing.md,
    },
});
exports.default = DashboardScreen;
