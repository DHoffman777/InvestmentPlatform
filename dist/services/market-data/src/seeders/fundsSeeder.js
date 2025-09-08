"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedFunds = seedFunds;
const client_1 = require("@prisma/client");
const fundsService_1 = require("../services/fundsService");
const logger_1 = require("../utils/logger");
const decimal_js_1 = require("decimal.js");
const prisma = new client_1.PrismaClient();
const fundsService = new fundsService_1.FundsService(prisma);
// Sample ETFs
const etfs = [
    {
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF Trust',
        cusip: '78462F103',
        isin: 'US78462F1030',
        fundType: 'ETF',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        sector: 'Diversified',
        category: 'Large Blend',
        assetClass: 'EQUITY_ETF',
        managementFee: new decimal_js_1.Decimal('0.0945'),
        expenseRatio: new decimal_js_1.Decimal('0.0945'),
        trackingIndex: 'S&P 500 Index',
        // aum: new Decimal('380000000000'), // $380B - removed, not in ETFData type
        dividendYield: new decimal_js_1.Decimal('1.37'),
        // distributionFrequency: 'QUARTERLY', - removed, not in ETFData type
        // fundFamily: 'State Street Global Advisors', - removed, not in ETFData type
        launchDate: new Date('1993-01-22'),
        // primaryBenchmark: 'S&P 500', - removed, not in ETFData type
        // averageDailyVolume: new Decimal('85000000'), - removed, not in ETFData type
        // navFrequency: 'DAILY', - removed, not in ETFData type
        investmentStyle: 'BLEND',
        marketCapFocus: 'LARGE_CAP',
        geographicFocus: 'DOMESTIC',
        beta: new decimal_js_1.Decimal('1.00'),
        standardDeviation: new decimal_js_1.Decimal('18.2'),
    },
    {
        symbol: 'QQQ',
        name: 'Invesco QQQ Trust Series 1',
        cusip: '46090E103',
        isin: 'US46090E1038',
        fundType: 'ETF',
        exchange: 'NASDAQ',
        currency: 'USD',
        country: 'US',
        sector: 'Technology',
        category: 'Large Growth',
        assetClass: 'EQUITY_ETF',
        managementFee: new decimal_js_1.Decimal('0.20'),
        expenseRatio: new decimal_js_1.Decimal('0.20'),
        trackingIndex: 'NASDAQ-100 Index',
        // aum: new Decimal('180000000000'), // $180B - removed, not in ETFData type
        dividendYield: new decimal_js_1.Decimal('0.62'),
        // distributionFrequency: 'QUARTERLY', - removed, not in ETFData type
        // fundFamily: 'Invesco', - removed, not in ETFData type
        launchDate: new Date('1999-03-10'),
        // primaryBenchmark: 'NASDAQ-100', - removed, not in ETFData type
        // averageDailyVolume: new Decimal('35000000'), - removed, not in ETFData type
        // navFrequency: 'DAILY', - removed, not in ETFData type
        investmentStyle: 'GROWTH',
        marketCapFocus: 'LARGE_CAP',
        geographicFocus: 'DOMESTIC',
        beta: new decimal_js_1.Decimal('1.15'),
        standardDeviation: new decimal_js_1.Decimal('22.8'),
    },
    {
        symbol: 'VTI',
        name: 'Vanguard Total Stock Market ETF',
        cusip: '922908769',
        isin: 'US9229087690',
        fundType: 'ETF',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        sector: 'Diversified',
        category: 'Large Blend',
        assetClass: 'EQUITY_ETF',
        managementFee: new decimal_js_1.Decimal('0.03'),
        expenseRatio: new decimal_js_1.Decimal('0.03'),
        trackingIndex: 'CRSP US Total Market Index',
        // aum: new Decimal('280000000000'), // $280B - removed, not in ETFData type
        dividendYield: new decimal_js_1.Decimal('1.28'),
        // distributionFrequency: 'QUARTERLY', - removed, not in ETFData type
        // fundFamily: 'Vanguard', - removed, not in ETFData type
        launchDate: new Date('2001-05-24'),
        // primaryBenchmark: 'CRSP US Total Market', - removed, not in ETFData type
        // averageDailyVolume: new Decimal('4500000'), - removed, not in ETFData type
        // navFrequency: 'DAILY', - removed, not in ETFData type
        investmentStyle: 'BLEND',
        marketCapFocus: 'MULTI_CAP',
        geographicFocus: 'DOMESTIC',
        beta: new decimal_js_1.Decimal('1.00'),
        standardDeviation: new decimal_js_1.Decimal('18.5'),
    },
    {
        symbol: 'AGG',
        name: 'iShares Core U.S. Aggregate Bond ETF',
        cusip: '464287200',
        isin: 'US4642872000',
        fundType: 'ETF',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        sector: 'Fixed Income',
        category: 'Intermediate Core Bond',
        assetClass: 'BOND_ETF',
        managementFee: new decimal_js_1.Decimal('0.03'),
        expenseRatio: new decimal_js_1.Decimal('0.03'),
        trackingIndex: 'Bloomberg U.S. Aggregate Bond Index',
        // aum: new Decimal('85000000000'), // $85B - removed, not in ETFData type
        dividendYield: new decimal_js_1.Decimal('3.2'),
        // distributionFrequency: 'MONTHLY', - removed, not in ETFData type
        // fundFamily: 'iShares', - removed, not in ETFData type
        launchDate: new Date('2003-09-22'),
        // primaryBenchmark: 'Bloomberg US Aggregate Bond', - removed, not in ETFData type
        // averageDailyVolume: new Decimal('6500000'), - removed, not in ETFData type
        // navFrequency: 'DAILY', - removed, not in ETFData type
        geographicFocus: 'DOMESTIC',
        standardDeviation: new decimal_js_1.Decimal('4.2'),
    },
    {
        symbol: 'GLD',
        name: 'SPDR Gold Shares',
        cusip: '78463V107',
        isin: 'US78463V1070',
        fundType: 'ETF',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        sector: 'Commodities',
        category: 'Commodities Precious Metals',
        assetClass: 'COMMODITY_ETF',
        managementFee: new decimal_js_1.Decimal('0.40'),
        expenseRatio: new decimal_js_1.Decimal('0.40'),
        trackingIndex: 'Gold Price',
        // aum: new Decimal('58000000000'), // $58B - removed, not in ETFData type
        // fundFamily: 'State Street Global Advisors', - removed, not in ETFData type
        launchDate: new Date('2004-11-18'),
        // averageDailyVolume: new Decimal('8500000'), - removed, not in ETFData type
        // navFrequency: 'DAILY', - removed, not in ETFData type
        geographicFocus: 'GLOBAL',
        standardDeviation: new decimal_js_1.Decimal('16.8'),
    },
];
// Sample Mutual Funds
const mutualFunds = [
    {
        symbol: 'FXAIX',
        name: 'Fidelity 500 Index Fund',
        cusip: '315911750',
        isin: 'US3159117500',
        fundType: 'MUTUAL_FUND',
        currency: 'USD',
        country: 'US',
        assetClass: 'EQUITY_FUND',
        managementFee: new decimal_js_1.Decimal('0.015'),
        expenseRatio: new decimal_js_1.Decimal('0.015'),
        dividendYield: new decimal_js_1.Decimal('1.25'),
        fundFamily: 'Fidelity',
        inceptionDate: new Date('1988-02-17'),
        shareClass: 'I',
        minimumInvestment: new decimal_js_1.Decimal('0'),
        investmentStyle: 'BLEND',
        beta: new decimal_js_1.Decimal('1.00'),
        standardDeviation: new decimal_js_1.Decimal('18.0'),
        morningstarRating: 4,
    },
    {
        symbol: 'VTSAX',
        name: 'Vanguard Total Stock Market Index Fund Admiral Shares',
        cusip: '922908728',
        isin: 'US9229087281',
        fundType: 'MUTUAL_FUND',
        currency: 'USD',
        country: 'US',
        assetClass: 'EQUITY_FUND',
        managementFee: new decimal_js_1.Decimal('0.04'),
        expenseRatio: new decimal_js_1.Decimal('0.04'),
        dividendYield: new decimal_js_1.Decimal('1.31'),
        fundFamily: 'Vanguard',
        inceptionDate: new Date('2000-11-13'),
        shareClass: 'A',
        minimumInvestment: new decimal_js_1.Decimal('3000'),
        investmentStyle: 'BLEND',
        beta: new decimal_js_1.Decimal('1.00'),
        standardDeviation: new decimal_js_1.Decimal('18.3'),
        morningstarRating: 5,
    },
    {
        symbol: 'PIMIX',
        name: 'PIMCO Income Fund Institutional Class',
        cusip: '72201R104',
        isin: 'US72201R1041',
        fundType: 'MUTUAL_FUND',
        currency: 'USD',
        country: 'US',
        assetClass: 'BOND_FUND',
        managementFee: new decimal_js_1.Decimal('0.55'),
        expenseRatio: new decimal_js_1.Decimal('0.55'),
        dividendYield: new decimal_js_1.Decimal('4.8'),
        fundFamily: 'PIMCO',
        inceptionDate: new Date('2007-03-01'),
        fundManager: 'Dan Ivascyn',
        shareClass: 'I',
        minimumInvestment: new decimal_js_1.Decimal('1000000'),
        beta: new decimal_js_1.Decimal('0.15'),
        standardDeviation: new decimal_js_1.Decimal('3.8'),
        morningstarRating: 4,
    },
    {
        symbol: 'FSMDX',
        name: 'Fidelity Mid Cap Index Fund',
        cusip: '315911859',
        isin: 'US3159118590',
        fundType: 'MUTUAL_FUND',
        currency: 'USD',
        country: 'US',
        assetClass: 'EQUITY_FUND',
        managementFee: new decimal_js_1.Decimal('0.025'),
        expenseRatio: new decimal_js_1.Decimal('0.025'),
        dividendYield: new decimal_js_1.Decimal('1.1'),
        fundFamily: 'Fidelity',
        inceptionDate: new Date('1997-09-26'),
        shareClass: 'I',
        minimumInvestment: new decimal_js_1.Decimal('0'),
        investmentStyle: 'BLEND',
        beta: new decimal_js_1.Decimal('1.05'),
        standardDeviation: new decimal_js_1.Decimal('22.1'),
        morningstarRating: 4,
    },
    {
        symbol: 'VMOT',
        name: 'Vanguard Short-Term Inflation-Protected Securities Index Fund',
        cusip: '92204A508',
        isin: 'US92204A5086',
        fundType: 'MUTUAL_FUND',
        currency: 'USD',
        country: 'US',
        assetClass: 'BOND_FUND',
        managementFee: new decimal_js_1.Decimal('0.06'),
        expenseRatio: new decimal_js_1.Decimal('0.06'),
        dividendYield: new decimal_js_1.Decimal('2.3'),
        fundFamily: 'Vanguard',
        inceptionDate: new Date('2012-10-12'),
        shareClass: 'A',
        minimumInvestment: new decimal_js_1.Decimal('3000'),
        beta: new decimal_js_1.Decimal('0.05'),
        standardDeviation: new decimal_js_1.Decimal('1.8'),
        morningstarRating: 3,
    },
];
async function seedFunds() {
    logger_1.logger.info('Starting funds seeding process...');
    try {
        // Seed ETFs
        logger_1.logger.info(`Seeding ${etfs.length} ETFs...`);
        for (const etf of etfs) {
            await fundsService.upsertETF(etf);
            logger_1.logger.info(`✓ Seeded ETF: ${etf.symbol} - ${etf.name}`);
        }
        // Seed mutual funds
        logger_1.logger.info(`Seeding ${mutualFunds.length} mutual funds...`);
        for (const fund of mutualFunds) {
            await fundsService.upsertMutualFund(fund);
            logger_1.logger.info(`✓ Seeded mutual fund: ${fund.symbol} - ${fund.name}`);
        }
        logger_1.logger.info('Funds seeding completed successfully!');
        // Generate summary statistics
        const totalETFs = await prisma.security.count({
            where: { assetClass: 'ETF', isActive: true }
        });
        const totalMutualFunds = await prisma.security.count({
            where: { assetClass: 'MUTUAL_FUND', isActive: true }
        });
        const fundTypes = await prisma.security.groupBy({
            by: ['assetClass'],
            where: {
                assetClass: { in: ['ETF', 'MUTUAL_FUND'] },
                isActive: true
            },
            _count: { assetClass: true },
        });
        logger_1.logger.info('Fund seeding summary:', {
            totalETFs,
            totalMutualFunds,
            totalFunds: totalETFs + totalMutualFunds,
            breakdown: fundTypes.map(type => ({
                type: type.assetClass,
                count: type._count?.assetClass || 0,
            })),
        });
    }
    catch (error) {
        logger_1.logger.error('Error during funds seeding:', {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
// Run seeder if called directly
if (require.main === module) {
    seedFunds()
        .then(() => {
        logger_1.logger.info('Funds seeding script completed');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error('Funds seeding script failed:', error);
        process.exit(1);
    })
        .finally(async () => {
        await prisma.$disconnect();
    });
}
