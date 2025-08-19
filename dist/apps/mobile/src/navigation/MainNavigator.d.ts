import React from 'react';
export type MainTabParamList = {
    Dashboard: undefined;
    Portfolios: undefined;
    Transactions: undefined;
    Documents: undefined;
    Messages: undefined;
};
export type MainStackParamList = {
    MainTabs: undefined;
    PortfolioDetails: {
        portfolioId: string;
    };
    Settings: undefined;
    Profile: undefined;
};
declare const MainNavigator: React.FC;
export default MainNavigator;
