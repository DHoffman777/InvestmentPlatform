import { MoneyMarketFund, SweepAccount } from '../models/assets/MoneyMarketAssets';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export class CashEquivalentValidators {
  
  static validateMoneyMarketFund(fund: Partial<MoneyMarketFund>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!fund.fundId) errors.push('Fund ID is required');
    if (!fund.name) errors.push('Fund name is required');
    if (!fund.symbol) errors.push('Fund symbol is required');
    if (!fund.provider) errors.push('Fund provider is required');
    if (!fund.category) errors.push('Fund category is required');

    // Category validation
    const validCategories = ['GOVERNMENT', 'PRIME', 'MUNICIPAL', 'TREASURY'];
    if (fund.category && !validCategories.includes(fund.category)) {
      errors.push(`Invalid fund category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Yield validations
    if (fund.sevenDayYield !== undefined) {
      if (fund.sevenDayYield < 0 || fund.sevenDayYield > 50) {
        errors.push('Seven-day yield must be between 0% and 50%');
      }
      if (fund.sevenDayYield > 10) {
        warnings.push('Seven-day yield seems unusually high (>10%)');
      }
    }

    if (fund.thirtyDayYield !== undefined) {
      if (fund.thirtyDayYield < 0 || fund.thirtyDayYield > 50) {
        errors.push('Thirty-day yield must be between 0% and 50%');
      }
    }

    // Expense ratio validation
    if (fund.expenseRatio !== undefined) {
      if (fund.expenseRatio < 0 || fund.expenseRatio > 5) {
        errors.push('Expense ratio must be between 0% and 5%');
      }
      if (fund.expenseRatio > 1) {
        warnings.push('Expense ratio seems high for a money market fund (>1%)');
      }
    }

    // Net Asset Value validation (should be close to $1.00 for MMFs)
    if (fund.netAssetValue !== undefined) {
      if (fund.netAssetValue < 0.95 || fund.netAssetValue > 1.05) {
        errors.push('Net Asset Value should be close to $1.00 for money market funds');
      }
    }

    // Maturity validations
    if (fund.wamDays !== undefined) {
      if (fund.wamDays < 0 || fund.wamDays > 60) {
        errors.push('Weighted Average Maturity should be between 0 and 60 days for money market funds');
      }
    }

    if (fund.walDays !== undefined) {
      if (fund.walDays < 0 || fund.walDays > 120) {
        errors.push('Weighted Average Life should be between 0 and 120 days for money market funds');
      }
    }

    // Credit quality validation
    if (fund.creditQuality) {
      const total = fund.creditQuality.aaa + fund.creditQuality.aa + 
                   fund.creditQuality.a + fund.creditQuality.other;
      if (Math.abs(total - 100) > 0.01) {
        errors.push('Credit quality percentages must sum to 100%');
      }
    }

    // Liquidity validations
    if (fund.dailyLiquidity !== undefined) {
      if (fund.dailyLiquidity < 0 || fund.dailyLiquidity > 100) {
        errors.push('Daily liquidity must be between 0% and 100%');
      }
      if (fund.dailyLiquidity < 10) {
        warnings.push('Daily liquidity seems low for a money market fund (<10%)');
      }
    }

    if (fund.weeklyLiquidity !== undefined) {
      if (fund.weeklyLiquidity < 0 || fund.weeklyLiquidity > 100) {
        errors.push('Weekly liquidity must be between 0% and 100%');
      }
    }

    // Gate threshold validation
    if (fund.gateThreshold !== undefined) {
      if (fund.gateThreshold < 0 || fund.gateThreshold > 50) {
        errors.push('Gate threshold must be between 0% and 50%');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  static validateSweepAccount(account: Partial<SweepAccount>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!account.accountId) errors.push('Account ID is required');
    if (!account.accountNumber) errors.push('Account number is required');
    if (!account.provider) errors.push('Provider is required');
    if (!account.accountType) errors.push('Account type is required');

    // Account type validation
    const validAccountTypes = ['FDIC_INSURED', 'MONEY_MARKET', 'TREASURY_BILLS'];
    if (account.accountType && !validAccountTypes.includes(account.accountType)) {
      errors.push(`Invalid account type. Must be one of: ${validAccountTypes.join(', ')}`);
    }

    // Rate validations
    if (account.currentRate !== undefined) {
      if (account.currentRate < 0 || account.currentRate > 50) {
        errors.push('Current rate must be between 0% and 50%');
      }
    }

    if (account.tier1Rate !== undefined) {
      if (account.tier1Rate < 0 || account.tier1Rate > 50) {
        errors.push('Tier 1 rate must be between 0% and 50%');
      }
    }

    if (account.tier2Rate !== undefined) {
      if (account.tier2Rate < 0 || account.tier2Rate > 50) {
        errors.push('Tier 2 rate must be between 0% and 50%');
      }
    }

    // Tier limit validation
    if (account.tier1Limit !== undefined && account.tier1Limit <= 0) {
      errors.push('Tier 1 limit must be positive');
    }

    // FDIC validation
    if (account.fdicInsured && account.accountType !== 'FDIC_INSURED') {
      warnings.push('Account is marked as FDIC insured but type is not FDIC_INSURED');
    }

    if (account.fdicLimit !== undefined) {
      if (account.fdicLimit <= 0) {
        errors.push('FDIC limit must be positive');
      }
      if (account.fdicLimit > 500000) {
        warnings.push('FDIC limit seems unusually high (>$500,000)');
      }
    }

    // Sweep configuration validation
    if (account.sweepThreshold !== undefined && account.sweepThreshold < 0) {
      errors.push('Sweep threshold cannot be negative');
    }

    const validSweepFrequencies = ['DAILY', 'WEEKLY', 'REAL_TIME'];
    if (account.sweepFrequency && !validSweepFrequencies.includes(account.sweepFrequency)) {
      errors.push(`Invalid sweep frequency. Must be one of: ${validSweepFrequencies.join(', ')}`);
    }

    // Balance validations
    if (account.minimumBalance !== undefined && account.minimumBalance < 0) {
      errors.push('Minimum balance cannot be negative');
    }

    if (account.maximumBalance !== undefined && account.maximumBalance <= 0) {
      errors.push('Maximum balance must be positive');
    }

    if (account.minimumBalance !== undefined && account.maximumBalance !== undefined) {
      if (account.minimumBalance >= account.maximumBalance) {
        errors.push('Minimum balance must be less than maximum balance');
      }
    }

    // Transaction limit validation
    if (account.monthlyTransactionLimit !== undefined) {
      if (account.monthlyTransactionLimit <= 0) {
        errors.push('Monthly transaction limit must be positive');
      }
      if (account.monthlyTransactionLimit > 100) {
        warnings.push('Monthly transaction limit seems high (>100)');
      }
    }

    // Date validations
    if (account.openDate && account.openDate > new Date()) {
      errors.push('Open date cannot be in the future');
    }

    if (account.lastSweepDate && account.nextSweepDate) {
      if (account.lastSweepDate >= account.nextSweepDate) {
        errors.push('Next sweep date must be after last sweep date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  static validateCashEquivalentPosition(positionData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!positionData.portfolioId) errors.push('Portfolio ID is required');
    if (!positionData.tenantId) errors.push('Tenant ID is required');
    if (!positionData.assetType) errors.push('Asset type is required');
    if (!positionData.assetId) errors.push('Asset ID is required');

    // Asset type validation
    const validAssetTypes = ['MONEY_MARKET_FUND', 'SWEEP_ACCOUNT', 'TREASURY_BILL', 'COMMERCIAL_PAPER', 'CERTIFICATE_OF_DEPOSIT'];
    if (positionData.assetType && !validAssetTypes.includes(positionData.assetType)) {
      errors.push(`Invalid asset type. Must be one of: ${validAssetTypes.join(', ')}`);
    }

    // Value validations
    if (positionData.marketValue !== undefined && positionData.marketValue < 0) {
      errors.push('Market value cannot be negative');
    }

    if (positionData.costBasis !== undefined && positionData.costBasis < 0) {
      errors.push('Cost basis cannot be negative');
    }

    if (positionData.shares !== undefined && positionData.shares < 0) {
      errors.push('Shares cannot be negative');
    }

    if (positionData.balance !== undefined && positionData.balance < 0) {
      errors.push('Balance cannot be negative');
    }

    // Yield validations
    if (positionData.currentYield !== undefined) {
      if (positionData.currentYield < 0 || positionData.currentYield > 50) {
        errors.push('Current yield must be between 0% and 50%');
      }
    }

    if (positionData.yieldToMaturity !== undefined) {
      if (positionData.yieldToMaturity < 0 || positionData.yieldToMaturity > 50) {
        errors.push('Yield to maturity must be between 0% and 50%');
      }
    }

    // Liquidity tier validation
    const validLiquidityTiers = ['T0', 'T1', 'T2', 'T3'];
    if (positionData.liquidityTier && !validLiquidityTiers.includes(positionData.liquidityTier)) {
      errors.push(`Invalid liquidity tier. Must be one of: ${validLiquidityTiers.join(', ')}`);
    }

    // Maturity date validation
    if (positionData.maturityDate && positionData.maturityDate <= new Date()) {
      warnings.push('Maturity date is in the past or today');
    }

    // Redemption validations
    if (positionData.minimumRedemption !== undefined && positionData.minimumRedemption < 0) {
      errors.push('Minimum redemption cannot be negative');
    }

    if (positionData.redemptionFee !== undefined) {
      if (positionData.redemptionFee < 0 || positionData.redemptionFee > 10) {
        errors.push('Redemption fee must be between 0% and 10%');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  static validateSweepTransaction(transactionData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (transactionData.amount === undefined) errors.push('Amount is required');
    if (!transactionData.portfolioId) errors.push('Portfolio ID is required');
    if (!transactionData.tenantId) errors.push('Tenant ID is required');

    // Amount validation
    if (transactionData.amount !== undefined && transactionData.amount === 0) {
      errors.push('Sweep amount cannot be zero');
    }

    // Sweep type validation
    const validSweepTypes = ['AUTO', 'MANUAL'];
    if (transactionData.sweepType && !validSweepTypes.includes(transactionData.sweepType)) {
      errors.push(`Invalid sweep type. Must be one of: ${validSweepTypes.join(', ')}`);
    }

    // Large transaction warning
    if (Math.abs(transactionData.amount) > 1000000) {
      warnings.push('Large sweep transaction amount (>$1M)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  static validateYieldDistribution(distributionData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!distributionData.positionId) errors.push('Position ID is required');
    if (!distributionData.distributionDate) errors.push('Distribution date is required');
    if (distributionData.amount === undefined) errors.push('Amount is required');
    if (distributionData.yieldRate === undefined) errors.push('Yield rate is required');

    // Amount validation
    if (distributionData.amount !== undefined && distributionData.amount <= 0) {
      errors.push('Distribution amount must be positive');
    }

    // Yield rate validation
    if (distributionData.yieldRate !== undefined) {
      if (distributionData.yieldRate < 0 || distributionData.yieldRate > 50) {
        errors.push('Yield rate must be between 0% and 50%');
      }
    }

    // Distribution type validation
    const validDistributionTypes = ['DIVIDEND', 'INTEREST'];
    if (distributionData.distributionType && !validDistributionTypes.includes(distributionData.distributionType)) {
      errors.push(`Invalid distribution type. Must be one of: ${validDistributionTypes.join(', ')}`);
    }

    // Date validation
    const distributionDate = new Date(distributionData.distributionDate);
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (distributionDate > oneWeekFromNow) {
      errors.push('Distribution date cannot be more than one week in the future');
    }

    if (distributionDate < new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)) {
      warnings.push('Distribution date is more than one year in the past');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
}