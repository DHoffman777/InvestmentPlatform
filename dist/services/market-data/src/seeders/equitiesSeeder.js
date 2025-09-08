"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedEquities = seedEquities;
const client_1 = require("@prisma/client");
const equitiesService_1 = require("../services/equitiesService");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
const equitiesService = new equitiesService_1.EquitiesService(prisma);
// Sample common stocks
const commonStocks = [
    {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        cusip: '037833100',
        isin: 'US0378331005',
        equityType: 'COMMON_STOCK',
        exchange: 'NASDAQ',
        currency: 'USD',
        country: 'US',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        marketCap: new Decimal('2800000000000'), // $2.8T
        sharesOutstanding: new Decimal('15500000000'),
        dividendYield: new Decimal('0.47'),
        peRatio: new Decimal('28.5'),
        pbRatio: new Decimal('12.8'),
        beta: new Decimal('1.24'),
        dividendFrequency: 'QUARTERLY',
        listingDate: new Date('1980-12-12'),
    },
    {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        cusip: '594918104',
        isin: 'US5949181045',
        equityType: 'COMMON_STOCK',
        exchange: 'NASDAQ',
        currency: 'USD',
        country: 'US',
        sector: 'Technology',
        industry: 'Software',
        marketCap: new Decimal('2400000000000'), // $2.4T
        sharesOutstanding: new Decimal('7400000000'),
        dividendYield: new Decimal('0.72'),
        peRatio: new Decimal('32.1'),
        pbRatio: new Decimal('11.5'),
        beta: new Decimal('0.89'),
        dividendFrequency: 'QUARTERLY',
        listingDate: new Date('1986-03-13'),
    },
    {
        symbol: 'GOOGL',
        name: 'Alphabet Inc. Class A',
        cusip: '02079K305',
        isin: 'US02079K3059',
        equityType: 'COMMON_STOCK',
        exchange: 'NASDAQ',
        currency: 'USD',
        country: 'US',
        sector: 'Technology',
        industry: 'Internet Services',
        marketCap: new Decimal('1600000000000'), // $1.6T
        sharesOutstanding: new Decimal('12900000000'),
        peRatio: new Decimal('22.8'),
        pbRatio: new Decimal('4.2'),
        beta: new Decimal('1.05'),
        dividendFrequency: 'SPECIAL',
        listingDate: new Date('2004-08-19'),
    },
    {
        symbol: 'JPM',
        name: 'JPMorgan Chase & Co.',
        cusip: '46625H100',
        isin: 'US46625H1005',
        equityType: 'COMMON_STOCK',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        sector: 'Financial Services',
        industry: 'Banks',
        marketCap: new Decimal('420000000000'), // $420B
        sharesOutstanding: new Decimal('2900000000'),
        dividendYield: new Decimal('2.8'),
        peRatio: new Decimal('11.2'),
        pbRatio: new Decimal('1.4'),
        beta: new Decimal('1.18'),
        dividendFrequency: 'QUARTERLY',
        listingDate: new Date('1969-03-05'),
    },
    {
        symbol: 'JNJ',
        name: 'Johnson & Johnson',
        cusip: '478160104',
        isin: 'US4781601046',
        equityType: 'COMMON_STOCK',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        sector: 'Healthcare',
        industry: 'Pharmaceuticals',
        marketCap: new Decimal('380000000000'), // $380B
        sharesOutstanding: new Decimal('2400000000'),
        dividendYield: new Decimal('3.1'),
        peRatio: new Decimal('15.8'),
        pbRatio: new Decimal('4.2'),
        beta: new Decimal('0.68'),
        dividendFrequency: 'QUARTERLY',
        listingDate: new Date('1944-09-25'),
    },
];
// Sample preferred stocks
const preferredStocks = [
    {
        symbol: 'BAC-PL',
        name: 'Bank of America Corp Dep Shs repstg 1/1000th Int Perp Pfd Stk Ser L',
        equityType: 'PREFERRED_STOCK',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        sector: 'Financial Services',
        industry: 'Banks',
        dividendRate: new Decimal('6.25'),
        parValue: new Decimal('25.00'),
        cumulative: true,
        perpetual: true,
        callPrice: new Decimal('25.00'),
        callDate: new Date('2027-12-30'),
        convertible: false,
        marketCap: new Decimal('1200000000'), // $1.2B
        dividendFrequency: 'QUARTERLY',
    },
    {
        symbol: 'WFC-PQ',
        name: 'Wells Fargo & Company Depositary Shares Series Q',
        equityType: 'PREFERRED_STOCK',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        sector: 'Financial Services',
        industry: 'Banks',
        dividendRate: new Decimal('5.85'),
        parValue: new Decimal('25.00'),
        cumulative: true,
        perpetual: true,
        callPrice: new Decimal('25.00'),
        callDate: new Date('2026-06-15'),
        convertible: false,
        marketCap: new Decimal('850000000'), // $850M
        dividendFrequency: 'QUARTERLY',
    },
];
// Sample ADRs
const adrs = [
    {
        symbol: 'TSM',
        name: 'Taiwan Semiconductor Manufacturing Company Limited',
        cusip: '874039100',
        isin: 'US8740391003',
        equityType: 'ADR',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US', // Trading country
        sector: 'Technology',
        industry: 'Semiconductors',
        underlyingSymbol: '2330',
        underlyingExchange: 'TPE',
        underlyingCurrency: 'TWD',
        adrRatio: '1:5', // 1 ADR = 5 underlying shares
        depositoryBank: 'JPMorgan Chase Bank',
        level: 2,
        sponsored: true,
        marketCap: new Decimal('450000000000'), // $450B
        sharesOutstanding: new Decimal('5200000000'),
        dividendYield: new Decimal('2.1'),
        peRatio: new Decimal('16.8'),
        pbRatio: new Decimal('3.2'),
        beta: new Decimal('0.95'),
        dividendFrequency: 'QUARTERLY',
        listingDate: new Date('1997-10-08'),
    },
    {
        symbol: 'ASML',
        name: 'ASML Holding N.V.',
        cusip: '02079K107',
        isin: 'US02079K1079',
        equityType: 'ADR',
        exchange: 'NASDAQ',
        currency: 'USD',
        country: 'US', // Trading country
        sector: 'Technology',
        industry: 'Semiconductor Equipment',
        underlyingSymbol: 'ASML',
        underlyingExchange: 'AEX',
        underlyingCurrency: 'EUR',
        adrRatio: '1:1', // 1 ADR = 1 underlying share
        depositoryBank: 'Bank of New York Mellon',
        level: 2,
        sponsored: true,
        marketCap: new Decimal('280000000000'), // $280B
        sharesOutstanding: new Decimal('410000000'),
        dividendYield: new Decimal('0.9'),
        peRatio: new Decimal('35.2'),
        pbRatio: new Decimal('12.5'),
        beta: new Decimal('1.35'),
        dividendFrequency: 'ANNUAL',
        listingDate: new Date('1995-03-02'),
    },
    {
        symbol: 'NVO',
        name: 'Novo Nordisk A/S',
        cusip: '670756101',
        isin: 'US6707561013',
        equityType: 'ADR',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US', // Trading country
        sector: 'Healthcare',
        industry: 'Pharmaceuticals',
        underlyingSymbol: 'NOVO-B',
        underlyingExchange: 'CPH',
        underlyingCurrency: 'DKK',
        adrRatio: '1:1', // 1 ADR = 1 underlying share
        depositoryBank: 'JPMorgan Chase Bank',
        level: 2,
        sponsored: true,
        marketCap: new Decimal('320000000000'), // $320B
        sharesOutstanding: new Decimal('4700000000'),
        dividendYield: new Decimal('2.3'),
        peRatio: new Decimal('28.9'),
        pbRatio: new Decimal('18.5'),
        beta: new Decimal('0.72'),
        dividendFrequency: 'SEMI_ANNUAL',
        listingDate: new Date('1981-07-08'),
    },
];
async function seedEquities() {
    logger_1.logger.info('Starting equities seeding process...');
    try {
        // Seed common stocks
        logger_1.logger.info(`Seeding ${commonStocks.length} common stocks...`);
        for (const stock of commonStocks) {
            await equitiesService.upsertEquity(stock);
            logger_1.logger.info(`✓ Seeded common stock: ${stock.symbol} - ${stock.name}`);
        }
        // Seed preferred stocks
        logger_1.logger.info(`Seeding ${preferredStocks.length} preferred stocks...`);
        for (const stock of preferredStocks) {
            await equitiesService.upsertEquity(stock);
            logger_1.logger.info(`✓ Seeded preferred stock: ${stock.symbol} - ${stock.name}`);
        }
        // Seed ADRs
        logger_1.logger.info(`Seeding ${adrs.length} ADRs...`);
        for (const adr of adrs) {
            await equitiesService.upsertEquity(adr);
            logger_1.logger.info(`✓ Seeded ADR: ${adr.symbol} - ${adr.name}`);
        }
        logger_1.logger.info('Equities seeding completed successfully!');
        // Generate summary statistics
        const totalEquities = await prisma.security.count({
            where: { assetClass: 'EQUITY', isActive: true }
        });
        const equityTypes = await prisma.security.groupBy({
            by: ['securityType'],
            where: { assetClass: 'EQUITY', isActive: true },
            _count: { securityType: true },
        });
        logger_1.logger.info('Equity seeding summary:', {
            totalEquities,
            breakdown: equityTypes.map(type => ({
                type: type.securityType,
                count: type._count.securityType,
            })),
        });
    }
    catch (error) {
        logger_1.logger.error('Error during equities seeding:', {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
// Run seeder if called directly
if (require.main === module) {
    seedEquities()
        .then(() => {
        logger_1.logger.info('Equities seeding script completed');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error('Equities seeding script failed:', error);
        process.exit(1);
    })
        .finally(async () => {
        await prisma.$disconnect();
    });
}
