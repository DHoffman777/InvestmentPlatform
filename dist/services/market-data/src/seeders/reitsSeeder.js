"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedREITsAndMLPs = seedREITsAndMLPs;
const client_1 = require("@prisma/client");
const reitsService_1 = require("../services/reitsService");
const logger_1 = require("../utils/logger");
const decimal_js_1 = require("decimal.js");
const prisma = new client_1.PrismaClient();
const reitsService = new reitsService_1.REITsService(prisma);
// Sample REITs
const reits = [
    {
        symbol: 'PLD',
        name: 'Prologis Inc',
        cusip: '74340W103',
        isin: 'US74340W1036',
        securityType: 'REIT',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        reitType: 'EQUITY_REIT',
        propertyTypes: ['Industrial', 'Warehouses', 'Distribution Centers'],
        marketCap: new decimal_js_1.Decimal('120000000000'), // $120B
        dividendYield: new decimal_js_1.Decimal('2.8'),
        distributionFrequency: 'QUARTERLY',
        fundsFromOperations: new decimal_js_1.Decimal('4.2'),
        adjustedFFO: new decimal_js_1.Decimal('4.1'),
        netAssetValue: new decimal_js_1.Decimal('140'),
        priceToFFO: new decimal_js_1.Decimal('22.5'),
        debtToEquityRatio: new decimal_js_1.Decimal('0.31'),
        occupancyRate: new decimal_js_1.Decimal('97.5'),
        geographicFocus: 'GLOBAL',
        primaryMarkets: ['United States', 'Europe', 'Japan', 'China'],
        managementCompany: 'Prologis Management LLC',
        totalProperties: 5200,
        totalSquareFootage: new decimal_js_1.Decimal('1000000000'), // 1B sq ft
        totalReturn1Y: new decimal_js_1.Decimal('8.5'),
        totalReturn3Y: new decimal_js_1.Decimal('12.3'),
        totalReturn5Y: new decimal_js_1.Decimal('15.2'),
        beta: new decimal_js_1.Decimal('1.12'),
        standardDeviation: new decimal_js_1.Decimal('20.8'),
    },
    {
        symbol: 'AMT',
        name: 'American Tower Corporation',
        cusip: '03027X100',
        isin: 'US03027X1000',
        securityType: 'REIT',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        reitType: 'EQUITY_REIT',
        propertyTypes: ['Infrastructure', 'Cell Towers', 'Data Centers'],
        marketCap: new decimal_js_1.Decimal('95000000000'), // $95B
        dividendYield: new decimal_js_1.Decimal('2.9'),
        distributionFrequency: 'QUARTERLY',
        fundsFromOperations: new decimal_js_1.Decimal('10.5'),
        adjustedFFO: new decimal_js_1.Decimal('10.2'),
        netAssetValue: new decimal_js_1.Decimal('260'),
        priceToFFO: new decimal_js_1.Decimal('18.8'),
        debtToEquityRatio: new decimal_js_1.Decimal('0.52'),
        occupancyRate: new decimal_js_1.Decimal('99.2'),
        geographicFocus: 'GLOBAL',
        primaryMarkets: ['United States', 'India', 'Brazil', 'Mexico', 'Europe'],
        managementCompany: 'American Tower Management LLC',
        totalProperties: 220000,
        totalReturn1Y: new decimal_js_1.Decimal('-2.1'),
        totalReturn3Y: new decimal_js_1.Decimal('5.8'),
        totalReturn5Y: new decimal_js_1.Decimal('8.9'),
        beta: new decimal_js_1.Decimal('0.88'),
        standardDeviation: new decimal_js_1.Decimal('24.5'),
    },
    {
        symbol: 'SPG',
        name: 'Simon Property Group Inc',
        cusip: '828806109',
        isin: 'US8288061091',
        securityType: 'REIT',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        reitType: 'EQUITY_REIT',
        propertyTypes: ['Retail', 'Shopping Centers', 'Premium Outlets'],
        marketCap: new decimal_js_1.Decimal('38000000000'), // $38B
        dividendYield: new decimal_js_1.Decimal('6.2'),
        distributionFrequency: 'QUARTERLY',
        fundsFromOperations: new decimal_js_1.Decimal('11.8'),
        adjustedFFO: new decimal_js_1.Decimal('11.5'),
        netAssetValue: new decimal_js_1.Decimal('180'),
        priceToFFO: new decimal_js_1.Decimal('8.9'),
        debtToEquityRatio: new decimal_js_1.Decimal('0.65'),
        occupancyRate: new decimal_js_1.Decimal('93.8'),
        geographicFocus: 'DOMESTIC',
        primaryMarkets: ['United States', 'Puerto Rico'],
        managementCompany: 'Simon Property Group LP',
        totalProperties: 204,
        totalSquareFootage: new decimal_js_1.Decimal('241000000'), // 241M sq ft
        totalReturn1Y: new decimal_js_1.Decimal('22.5'),
        totalReturn3Y: new decimal_js_1.Decimal('1.2'),
        totalReturn5Y: new decimal_js_1.Decimal('3.8'),
        beta: new decimal_js_1.Decimal('1.28'),
        standardDeviation: new decimal_js_1.Decimal('35.2'),
    },
    {
        symbol: 'EQIX',
        name: 'Equinix Inc',
        cusip: '29444U700',
        isin: 'US29444U7000',
        securityType: 'REIT',
        exchange: 'NASDAQ',
        currency: 'USD',
        country: 'US',
        reitType: 'EQUITY_REIT',
        propertyTypes: ['Data Centers', 'Colocation', 'Interconnection'],
        marketCap: new decimal_js_1.Decimal('75000000000'), // $75B
        dividendYield: new decimal_js_1.Decimal('1.8'),
        distributionFrequency: 'QUARTERLY',
        fundsFromOperations: new decimal_js_1.Decimal('28.5'),
        adjustedFFO: new decimal_js_1.Decimal('27.8'),
        netAssetValue: new decimal_js_1.Decimal('950'),
        priceToFFO: new decimal_js_1.Decimal('28.2'),
        debtToEquityRatio: new decimal_js_1.Decimal('0.48'),
        occupancyRate: new decimal_js_1.Decimal('90.5'),
        geographicFocus: 'GLOBAL',
        primaryMarkets: ['United States', 'EMEA', 'Asia-Pacific'],
        managementCompany: 'Equinix Operating Company',
        totalProperties: 240,
        totalSquareFootage: new decimal_js_1.Decimal('17000000'), // 17M sq ft
        totalReturn1Y: new decimal_js_1.Decimal('-8.5'),
        totalReturn3Y: new decimal_js_1.Decimal('6.2'),
        totalReturn5Y: new decimal_js_1.Decimal('12.8'),
        beta: new decimal_js_1.Decimal('1.05'),
        standardDeviation: new decimal_js_1.Decimal('28.9'),
    },
    {
        symbol: 'AGNC',
        name: 'AGNC Investment Corp',
        cusip: '00123Q104',
        isin: 'US00123Q1040',
        securityType: 'REIT',
        exchange: 'NASDAQ',
        currency: 'USD',
        country: 'US',
        reitType: 'MORTGAGE_REIT',
        propertyTypes: ['Mortgage Securities', 'Agency MBS'],
        marketCap: new decimal_js_1.Decimal('5500000000'), // $5.5B
        dividendYield: new decimal_js_1.Decimal('14.8'),
        distributionFrequency: 'MONTHLY',
        fundsFromOperations: new decimal_js_1.Decimal('1.2'),
        netAssetValue: new decimal_js_1.Decimal('8.95'),
        priceToFFO: new decimal_js_1.Decimal('8.9'),
        debtToEquityRatio: new decimal_js_1.Decimal('7.2'), // High leverage typical for mREITs
        geographicFocus: 'DOMESTIC',
        managementCompany: 'AGNC Management LLC',
        totalReturn1Y: new decimal_js_1.Decimal('-18.2'),
        totalReturn3Y: new decimal_js_1.Decimal('-12.5'),
        totalReturn5Y: new decimal_js_1.Decimal('-8.9'),
        beta: new decimal_js_1.Decimal('1.82'),
        standardDeviation: new decimal_js_1.Decimal('45.8'),
    },
];
// Sample MLPs
const mlps = [
    {
        symbol: 'EPD',
        name: 'Enterprise Products Partners LP',
        cusip: '29379V100',
        isin: 'US29379V1008',
        securityType: 'MLP',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        mlpType: 'ENERGY',
        businessDescription: 'Midstream energy infrastructure company providing crude oil, natural gas, NGLs, refined products, and petrochemicals transportation and storage services',
        sector: 'Energy',
        subSector: 'Oil & Gas Midstream',
        marketCap: new decimal_js_1.Decimal('55000000000'), // $55B
        distributionYield: new decimal_js_1.Decimal('8.2'),
        distributionFrequency: 'QUARTERLY',
        distributionCoverage: new decimal_js_1.Decimal('1.7'),
        distributionGrowthRate: new decimal_js_1.Decimal('3.5'),
        distributableCashFlow: new decimal_js_1.Decimal('7200000000'), // $7.2B annually
        ebitda: new decimal_js_1.Decimal('8500000000'), // $8.5B
        debtToEbitda: new decimal_js_1.Decimal('3.1'),
        returnOnInvestedCapital: new decimal_js_1.Decimal('8.5'),
        pipelineMiles: new decimal_js_1.Decimal('50000'),
        storageCapacity: new decimal_js_1.Decimal('260000000'), // 260M barrels
        processingCapacity: new decimal_js_1.Decimal('8600000'), // 8.6M barrels/day
        operatingRegions: ['Texas', 'Louisiana', 'New Mexico', 'Colorado', 'Wyoming'],
        assetLocations: ['Gulf Coast', 'Permian Basin', 'Eagle Ford', 'Bakken'],
        generalPartner: 'Enterprise Products GP LLC',
        incentiveDistributionRights: false,
        k1Eligible: true,
        qualifiedIncome: new decimal_js_1.Decimal('85'),
        totalReturn1Y: new decimal_js_1.Decimal('12.8'),
        totalReturn3Y: new decimal_js_1.Decimal('15.2'),
        totalReturn5Y: new decimal_js_1.Decimal('8.9'),
        beta: new decimal_js_1.Decimal('1.15'),
        standardDeviation: new decimal_js_1.Decimal('28.5'),
    },
    {
        symbol: 'MPLX',
        name: 'MPLX LP',
        cusip: '55336V100',
        isin: 'US55336V1008',
        securityType: 'MLP',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        mlpType: 'ENERGY',
        businessDescription: 'Fee-based midstream energy infrastructure partnership that gathers, processes, and transports natural gas, NGLs, crude oil, refined products, and other hydrocarbon-based products',
        sector: 'Energy',
        subSector: 'Oil & Gas Midstream',
        marketCap: new decimal_js_1.Decimal('28000000000'), // $28B
        distributionYield: new decimal_js_1.Decimal('9.5'),
        distributionFrequency: 'QUARTERLY',
        distributionCoverage: new decimal_js_1.Decimal('1.4'),
        distributionGrowthRate: new decimal_js_1.Decimal('5.8'),
        distributableCashFlow: new decimal_js_1.Decimal('3800000000'), // $3.8B annually
        ebitda: new decimal_js_1.Decimal('4200000000'), // $4.2B
        debtToEbitda: new decimal_js_1.Decimal('3.8'),
        returnOnInvestedCapital: new decimal_js_1.Decimal('7.2'),
        pipelineMiles: new decimal_js_1.Decimal('13000'),
        storageCapacity: new decimal_js_1.Decimal('65000000'), // 65M barrels
        processingCapacity: new decimal_js_1.Decimal('1400000'), // 1.4M barrels/day
        operatingRegions: ['Ohio', 'West Virginia', 'Pennsylvania', 'Texas'],
        assetLocations: ['Marcellus/Utica', 'Permian Basin', 'Gulf Coast'],
        generalPartner: 'MPLX GP LLC',
        incentiveDistributionRights: false,
        k1Eligible: true,
        qualifiedIncome: new decimal_js_1.Decimal('90'),
        totalReturn1Y: new decimal_js_1.Decimal('18.5'),
        totalReturn3Y: new decimal_js_1.Decimal('22.8'),
        totalReturn5Y: new decimal_js_1.Decimal('12.5'),
        beta: new decimal_js_1.Decimal('1.25'),
        standardDeviation: new decimal_js_1.Decimal('32.8'),
    },
    {
        symbol: 'KMI',
        name: 'Kinder Morgan Inc',
        cusip: '49456B101',
        isin: 'US49456B1017',
        securityType: 'MLP',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        mlpType: 'ENERGY',
        businessDescription: 'Energy infrastructure company operating natural gas and refined petroleum products pipelines, terminals, and CO2 transportation',
        sector: 'Energy',
        subSector: 'Oil & Gas Midstream',
        marketCap: new decimal_js_1.Decimal('38000000000'), // $38B
        distributionYield: new decimal_js_1.Decimal('6.8'),
        distributionFrequency: 'QUARTERLY',
        distributionCoverage: new decimal_js_1.Decimal('2.1'),
        distributionGrowthRate: new decimal_js_1.Decimal('2.5'),
        distributableCashFlow: new decimal_js_1.Decimal('4500000000'), // $4.5B annually
        ebitda: new decimal_js_1.Decimal('5800000000'), // $5.8B
        debtToEbitda: new decimal_js_1.Decimal('4.2'),
        returnOnInvestedCapital: new decimal_js_1.Decimal('6.8'),
        pipelineMiles: new decimal_js_1.Decimal('83000'),
        storageCapacity: new decimal_js_1.Decimal('180000000'), // 180M barrels
        operatingRegions: ['Texas', 'Louisiana', 'Oklahoma', 'Colorado', 'California'],
        assetLocations: ['Gulf Coast', 'Rocky Mountains', 'Midwest', 'Southeast'],
        generalPartner: 'Kinder Morgan Management LLC',
        incentiveDistributionRights: false,
        k1Eligible: true,
        qualifiedIncome: new decimal_js_1.Decimal('88'),
        totalReturn1Y: new decimal_js_1.Decimal('8.2'),
        totalReturn3Y: new decimal_js_1.Decimal('11.5'),
        totalReturn5Y: new decimal_js_1.Decimal('6.2'),
        beta: new decimal_js_1.Decimal('1.08'),
        standardDeviation: new decimal_js_1.Decimal('26.5'),
    },
    {
        symbol: 'ET',
        name: 'Energy Transfer LP',
        cusip: '29273R109',
        isin: 'US29273R1095',
        securityType: 'MLP',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        mlpType: 'ENERGY',
        businessDescription: 'Diversified midstream energy company with natural gas, crude oil, refined products, and NGL assets including interstate and intrastate transportation and storage',
        sector: 'Energy',
        subSector: 'Oil & Gas Midstream',
        marketCap: new decimal_js_1.Decimal('32000000000'), // $32B
        distributionYield: new decimal_js_1.Decimal('7.8'),
        distributionFrequency: 'QUARTERLY',
        distributionCoverage: new decimal_js_1.Decimal('1.6'),
        distributionGrowthRate: new decimal_js_1.Decimal('4.2'),
        distributableCashFlow: new decimal_js_1.Decimal('5100000000'), // $5.1B annually
        ebitda: new decimal_js_1.Decimal('6800000000'), // $6.8B
        debtToEbitda: new decimal_js_1.Decimal('4.5'),
        returnOnInvestedCapital: new decimal_js_1.Decimal('7.8'),
        pipelineMiles: new decimal_js_1.Decimal('120000'),
        storageCapacity: new decimal_js_1.Decimal('400000000'), // 400M barrels
        processingCapacity: new decimal_js_1.Decimal('4200000'), // 4.2M barrels/day
        operatingRegions: ['Texas', 'Louisiana', 'Oklahoma', 'Pennsylvania', 'New Mexico'],
        assetLocations: ['Permian Basin', 'Eagle Ford', 'Bakken', 'Marcellus/Utica'],
        generalPartner: 'Energy Transfer GP LLC',
        incentiveDistributionRights: false,
        k1Eligible: true,
        qualifiedIncome: new decimal_js_1.Decimal('82'),
        totalReturn1Y: new decimal_js_1.Decimal('25.8'),
        totalReturn3Y: new decimal_js_1.Decimal('18.5'),
        totalReturn5Y: new decimal_js_1.Decimal('9.8'),
        beta: new decimal_js_1.Decimal('1.32'),
        standardDeviation: new decimal_js_1.Decimal('38.5'),
    },
    {
        symbol: 'ENLC',
        name: 'EnLink Midstream LLC',
        cusip: '29265W108',
        isin: 'US29265W1080',
        securityType: 'MLP',
        exchange: 'NYSE',
        currency: 'USD',
        country: 'US',
        mlpType: 'ENERGY',
        businessDescription: 'Midstream energy infrastructure company providing natural gas gathering, processing, transmission, and crude oil services in key producing basins',
        sector: 'Energy',
        subSector: 'Oil & Gas Midstream',
        marketCap: new decimal_js_1.Decimal('4500000000'), // $4.5B
        distributionYield: new decimal_js_1.Decimal('12.5'),
        distributionFrequency: 'QUARTERLY',
        distributionCoverage: new decimal_js_1.Decimal('1.2'),
        distributionGrowthRate: new decimal_js_1.Decimal('8.5'),
        distributableCashFlow: new decimal_js_1.Decimal('580000000'), // $580M annually
        ebitda: new decimal_js_1.Decimal('750000000'), // $750M
        debtToEbitda: new decimal_js_1.Decimal('3.6'),
        returnOnInvestedCapital: new decimal_js_1.Decimal('9.2'),
        pipelineMiles: new decimal_js_1.Decimal('11000'),
        processingCapacity: new decimal_js_1.Decimal('2800000'), // 2.8B cubic feet/day
        operatingRegions: ['Texas', 'Oklahoma', 'Louisiana'],
        assetLocations: ['Permian Basin', 'Oklahoma', 'Louisiana'],
        generalPartner: 'EnLink GP LLC',
        incentiveDistributionRights: false,
        k1Eligible: true,
        qualifiedIncome: new decimal_js_1.Decimal('78'),
        totalReturn1Y: new decimal_js_1.Decimal('35.2'),
        totalReturn3Y: new decimal_js_1.Decimal('28.5'),
        totalReturn5Y: new decimal_js_1.Decimal('15.8'),
        beta: new decimal_js_1.Decimal('1.68'),
        standardDeviation: new decimal_js_1.Decimal('48.5'),
    },
];
async function seedREITsAndMLPs() {
    logger_1.logger.info('Starting REITs and MLPs seeding process...');
    try {
        // Seed REITs
        logger_1.logger.info(`Seeding ${reits.length} REITs...`);
        for (const reit of reits) {
            await reitsService.upsertREIT(reit);
            logger_1.logger.info(`✓ Seeded REIT: ${reit.symbol} - ${reit.name}`);
        }
        // Seed MLPs
        logger_1.logger.info(`Seeding ${mlps.length} MLPs...`);
        for (const mlp of mlps) {
            await reitsService.upsertMLP(mlp);
            logger_1.logger.info(`✓ Seeded MLP: ${mlp.symbol} - ${mlp.name}`);
        }
        logger_1.logger.info('REITs and MLPs seeding completed successfully!');
        // Generate summary statistics
        const totalREITs = await prisma.security.count({
            where: { assetClass: 'REIT', isActive: true }
        });
        const totalMLPs = await prisma.security.count({
            where: { assetClass: 'MLP', isActive: true }
        });
        const reitTypes = await prisma.security.groupBy({
            by: ['securityType'],
            where: {
                assetClass: 'REIT',
                isActive: true
            },
            _count: { securityType: true },
        });
        const mlpTypes = await prisma.security.groupBy({
            by: ['securityType'],
            where: {
                assetClass: 'MLP',
                isActive: true
            },
            _count: { securityType: true },
        });
        logger_1.logger.info('REITs and MLPs seeding summary:', {
            totalREITs,
            totalMLPs,
            total: totalREITs + totalMLPs,
            reitBreakdown: reitTypes.map((type) => ({
                type: type.securityType,
                count: type._count?.securityType || 0,
            })),
            mlpBreakdown: mlpTypes.map((type) => ({
                type: type.securityType,
                count: type._count?.securityType || 0,
            })),
        });
    }
    catch (error) {
        logger_1.logger.error('Error during REITs and MLPs seeding:', {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
// Run seeder if called directly
if (require.main === module) {
    seedREITsAndMLPs()
        .then(() => {
        logger_1.logger.info('REITs and MLPs seeding script completed');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error('REITs and MLPs seeding script failed:', error);
        process.exit(1);
    })
        .finally(async () => {
        await prisma.$disconnect();
    });
}
