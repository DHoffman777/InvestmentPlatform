import { PrismaClient, Prisma } from '@prisma/client';
import { CashService, CashEquivalentData, TreasuryData } from '../services/cashService';
import { logger } from '../utils/logger';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();
const cashService = new CashService(prisma);

// Sample Treasury Bills
const treasuryBills: TreasuryData[] = [
  {
    symbol: 'T-BILL-4W',
    name: '4-Week Treasury Bill',
    cusip: '912796MK8',
    isin: 'US912796MK86',
    securityType: 'TREASURY',
    instrumentType: 'TREASURY_BILL',
    maturityDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 4 weeks from now
    issueDate: new Date(),
    auctionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    settlementDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    parValue: new Decimal('100'),
    minimumBid: new Decimal('100'),
    bidIncrement: new Decimal('0.001'),
    auctionType: 'SINGLE_PRICE',
    totalIssued: new Decimal('45000000000'), // $45B
    discountRate: new Decimal('5.15'),
    yield: new Decimal('5.24'),
    daysToMaturity: 28,
    dayCountConvention: 'ACTUAL_360',
    principalPaymentDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
  },
  {
    symbol: 'T-BILL-13W',
    name: '13-Week Treasury Bill',
    cusip: '912796ML6',
    isin: 'US912796ML69',
    securityType: 'TREASURY',
    instrumentType: 'TREASURY_BILL',
    maturityDate: new Date(Date.now() + 91 * 24 * 60 * 60 * 1000), // 13 weeks from now
    issueDate: new Date(),
    auctionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
    settlementDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    parValue: new Decimal('100'),
    minimumBid: new Decimal('100'),
    bidIncrement: new Decimal('0.001'),
    auctionType: 'SINGLE_PRICE',
    totalIssued: new Decimal('52000000000'), // $52B
    discountRate: new Decimal('5.12'),
    yield: new Decimal('5.26'),
    daysToMaturity: 91,
    dayCountConvention: 'ACTUAL_360',
    principalPaymentDate: new Date(Date.now() + 91 * 24 * 60 * 60 * 1000),
  },
  {
    symbol: 'T-BILL-26W',
    name: '26-Week Treasury Bill',
    cusip: '912796MM4',
    isin: 'US912796MM43',
    securityType: 'TREASURY',
    instrumentType: 'TREASURY_BILL',
    maturityDate: new Date(Date.now() + 182 * 24 * 60 * 60 * 1000), // 26 weeks from now
    issueDate: new Date(),
    auctionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    settlementDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    parValue: new Decimal('100'),
    minimumBid: new Decimal('100'),
    bidIncrement: new Decimal('0.001'),
    auctionType: 'SINGLE_PRICE',
    totalIssued: new Decimal('38000000000'), // $38B
    discountRate: new Decimal('5.08'),
    yield: new Decimal('5.32'),
    daysToMaturity: 182,
    dayCountConvention: 'ACTUAL_360',
    principalPaymentDate: new Date(Date.now() + 182 * 24 * 60 * 60 * 1000),
  },
  {
    symbol: 'T-BILL-52W',
    name: '52-Week Treasury Bill',
    cusip: '912796MN2',
    isin: 'US912796MN26',
    securityType: 'TREASURY',
    instrumentType: 'TREASURY_BILL',
    maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 52 weeks from now
    issueDate: new Date(),
    auctionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    settlementDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    parValue: new Decimal('100'),
    minimumBid: new Decimal('100'),
    bidIncrement: new Decimal('0.001'),
    auctionType: 'SINGLE_PRICE',
    totalIssued: new Decimal('28000000000'), // $28B
    discountRate: new Decimal('4.95'),
    yield: new Decimal('5.15'),
    daysToMaturity: 365,
    dayCountConvention: 'ACTUAL_360',
    principalPaymentDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  },
];

// Sample TIPS (Treasury Inflation-Protected Securities)
const tips: TreasuryData[] = [
  {
    symbol: 'TIPS-5Y',
    name: '5-Year Treasury Inflation-Protected Securities',
    cusip: '912828Z29',
    isin: 'US912828Z298',
    securityType: 'TREASURY',
    instrumentType: 'TIPS',
    maturityDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years
    issueDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
    auctionDate: new Date(Date.now() - 185 * 24 * 60 * 60 * 1000),
    settlementDate: new Date(Date.now() - 178 * 24 * 60 * 60 * 1000),
    parValue: new Decimal('100'),
    minimumBid: new Decimal('100'),
    bidIncrement: new Decimal('0.001'),
    auctionType: 'SINGLE_PRICE',
    totalIssued: new Decimal('16000000000'), // $16B
    couponRate: new Decimal('2.125'),
    yield: new Decimal('2.35'),
    realYield: new Decimal('2.12'),
    inflationIndexRatio: new Decimal('1.0234'),
    breakEvenInflationRate: new Decimal('2.45'),
    daysToMaturity: 1825, // 5 years
    duration: new Decimal('4.75'),
    convexity: new Decimal('0.23'),
    dayCountConvention: 'ACTUAL_ACTUAL',
    principalPaymentDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
    interestPaymentDates: [
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),   // Next payment
      new Date(Date.now() + 275 * 24 * 60 * 60 * 1000),  // 6 months later
    ],
  },
];

// Sample Cash Equivalents
const cashEquivalents: CashEquivalentData[] = [
  {
    symbol: 'CP-AAPL-30D',
    name: 'Apple Inc Commercial Paper 30-Day',
    cusip: '037833AA1',
    securityType: 'CASH_EQUIVALENT',
    instrumentType: 'COMMERCIAL_PAPER',
    currency: 'USD',
    country: 'US',
    maturityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    issueDate: new Date(),
    daysToMaturity: 30,
    minimumDenomination: new Decimal('100000'),
    parValue: new Decimal('1000000'),
    currentYield: new Decimal('5.35'),
    discountRate: new Decimal('5.28'),
    bankDiscountYield: new Decimal('5.30'),
    bondEquivalentYield: new Decimal('5.42'),
    effectiveAnnualRate: new Decimal('5.48'),
    issuer: 'Apple Inc',
    issuerType: 'CORPORATION',
    creditRating: 'AA+',
    riskLevel: 'LOW',
    isInsured: false,
    liquidityRating: 'DAILY',
    marketMaker: 'Goldman Sachs',
    interestPaymentFrequency: 'AT_MATURITY',
    dayCountConvention: 'ACTUAL_360',
    isMoneyMarketEligible: true,
  },
  {
    symbol: 'CD-JPM-90D',
    name: 'JPMorgan Chase Bank CD 90-Day',
    cusip: '46625H100',
    securityType: 'CASH_EQUIVALENT',
    instrumentType: 'CERTIFICATE_OF_DEPOSIT',
    currency: 'USD',
    country: 'US',
    maturityDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    issueDate: new Date(),
    daysToMaturity: 90,
    minimumDenomination: new Decimal('1000'),
    parValue: new Decimal('10000'),
    currentYield: new Decimal('5.25'),
    effectiveAnnualRate: new Decimal('5.38'),
    issuer: 'JPMorgan Chase Bank N.A.',
    issuerType: 'BANK',
    creditRating: 'A+',
    riskLevel: 'LOWEST',
    isInsured: true,
    insuranceProvider: 'FDIC',
    liquidityRating: 'AT_MATURITY',
    interestPaymentFrequency: 'AT_MATURITY',
    dayCountConvention: 'ACTUAL_365',
    isMoneyMarketEligible: true,
  },
  {
    symbol: 'BA-CITI-60D',
    name: 'Citibank Banker\'s Acceptance 60-Day',
    cusip: '172967101',
    securityType: 'CASH_EQUIVALENT',
    instrumentType: 'BANKERS_ACCEPTANCE',
    currency: 'USD',
    country: 'US',
    maturityDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    issueDate: new Date(),
    daysToMaturity: 60,
    minimumDenomination: new Decimal('100000'),
    parValue: new Decimal('500000'),
    currentYield: new Decimal('5.18'),
    discountRate: new Decimal('5.12'),
    bankDiscountYield: new Decimal('5.15'),
    bondEquivalentYield: new Decimal('5.28'),
    issuer: 'Citibank N.A.',
    issuerType: 'BANK',
    creditRating: 'A',
    riskLevel: 'LOW',
    isInsured: false,
    liquidityRating: 'WEEKLY',
    marketMaker: 'Citibank N.A.',
    interestPaymentFrequency: 'AT_MATURITY',
    dayCountConvention: 'ACTUAL_360',
    isMoneyMarketEligible: true,
    isBankQualified: true,
  },
  {
    symbol: 'MMD-CHASE',
    name: 'Chase Premier Money Market Account',
    securityType: 'CASH_EQUIVALENT',
    instrumentType: 'MONEY_MARKET_DEPOSIT',
    currency: 'USD',
    country: 'US',
    minimumDenomination: new Decimal('2500'),
    currentYield: new Decimal('4.35'),
    effectiveAnnualRate: new Decimal('4.45'),
    issuer: 'JPMorgan Chase Bank N.A.',
    issuerType: 'BANK',
    creditRating: 'A+',
    riskLevel: 'LOWEST',
    isInsured: true,
    insuranceProvider: 'FDIC',
    liquidityRating: 'DAILY',
    interestPaymentFrequency: 'MONTHLY',
    isMoneyMarketEligible: true,
  },
  {
    symbol: 'REPO-TREAS-ON',
    name: 'Treasury Collateralized Repurchase Agreement Overnight',
    securityType: 'CASH_EQUIVALENT',
    instrumentType: 'REPURCHASE_AGREEMENT',
    currency: 'USD',
    country: 'US',
    maturityDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Overnight
    issueDate: new Date(),
    daysToMaturity: 1,
    minimumDenomination: new Decimal('1000000'),
    parValue: new Decimal('10000000'),
    currentYield: new Decimal('5.31'),
    effectiveAnnualRate: new Decimal('5.46'),
    issuer: 'Primary Dealer',
    issuerType: 'BANK',
    riskLevel: 'LOWEST',
    isInsured: false,
    liquidityRating: 'DAILY',
    marketMaker: 'Primary Dealers',
    interestPaymentFrequency: 'AT_MATURITY',
    dayCountConvention: 'ACTUAL_360',
    isMoneyMarketEligible: true,
  },
];

export async function seedCashInstruments() {
  logger.info('Starting cash instruments seeding process...');

  try {
    // Seed Treasury Bills
    logger.info(`Seeding ${treasuryBills.length} Treasury Bills...`);
    for (const tbill of treasuryBills) {
      await cashService.upsertTreasury(tbill);
      logger.info(`✓ Seeded Treasury Bill: ${tbill.symbol} - ${tbill.name}`);
    }

    // Seed TIPS
    logger.info(`Seeding ${tips.length} TIPS...`);
    for (const tip of tips) {
      await cashService.upsertTreasury(tip);
      logger.info(`✓ Seeded TIPS: ${tip.symbol} - ${tip.name}`);
    }

    // Seed Cash Equivalents
    logger.info(`Seeding ${cashEquivalents.length} cash equivalents...`);
    for (const cashEq of cashEquivalents) {
      await cashService.upsertCashEquivalent(cashEq);
      logger.info(`✓ Seeded cash equivalent: ${cashEq.symbol} - ${cashEq.name}`);
    }

    logger.info('Cash instruments seeding completed successfully!');

    // Generate summary statistics
    const totalTreasuries = await prisma.security.count({
      where: { assetClass: 'TREASURY', isActive: true } as any
    });
    
    const totalCashEquivalents = await prisma.security.count({
      where: { assetClass: 'CASH_EQUIVALENT', isActive: true } as any
    });

    const treasuryTypes = await prisma.security.groupBy({
      by: ['securityType'],
      where: { 
        assetClass: 'TREASURY', 
        isActive: true 
      } as any,
      _count: { securityType: true },
    } as any);

    const cashEquivalentTypes = await prisma.security.groupBy({
      by: ['securityType'],
      where: { 
        assetClass: 'CASH_EQUIVALENT', 
        isActive: true 
      } as any,
      _count: { securityType: true },
    } as any);

    logger.info('Cash instruments seeding summary:', {
      totalTreasuries,
      totalCashEquivalents,
      total: totalTreasuries + totalCashEquivalents,
      treasuryBreakdown: treasuryTypes.map(type => ({
        type: type.securityType,
        count: (type._count as any)?.securityType || 0,
      })),
      cashEquivalentBreakdown: cashEquivalentTypes.map(type => ({
        type: type.securityType,
        count: (type._count as any)?.securityType || 0,
      })),
    });

  } catch (error: any) {
    logger.error('Error during cash instruments seeding:', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedCashInstruments()
    .then(() => {
      logger.info('Cash instruments seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Cash instruments seeding script failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

