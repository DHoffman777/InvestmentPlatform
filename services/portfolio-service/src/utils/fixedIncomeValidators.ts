import { 
  FixedIncomeBond, 
  TreasuryBill, 
  FixedIncomePosition,
  CreateFixedIncomePositionRequest,
  FixedIncomeTradeRequest,
  CouponProcessingRequest
} from '../models/assets/FixedIncomeAssets';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export class FixedIncomeValidators {

  static validateBond(bond: Partial<FixedIncomeBond>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!bond.bondId) errors.push('Bond ID is required');
    if (!bond.cusip) errors.push('CUSIP is required');
    if (!bond.issuerName) errors.push('Issuer name is required');
    if (!bond.bondType) errors.push('Bond type is required');
    if (!bond.maturityDate) errors.push('Maturity date is required');
    if (!bond.issueDate) errors.push('Issue date is required');

    // Bond type validation
    const validBondTypes = ['GOVERNMENT', 'CORPORATE', 'MUNICIPAL', 'TREASURY', 'AGENCY'];
    if (bond.bondType && !validBondTypes.includes(bond.bondType)) {
      errors.push(`Invalid bond type. Must be one of: ${validBondTypes.join(', ')}`);
    }

    // CUSIP format validation
    if (bond.cusip && !/^[0-9A-Z]{9}$/.test(bond.cusip)) {
      errors.push('CUSIP must be 9 alphanumeric characters');
    }

    // ISIN format validation (if provided)
    if (bond.isin && !/^[A-Z]{2}[0-9A-Z]{9}[0-9]$/.test(bond.isin)) {
      errors.push('ISIN must be in format: 2 letters + 9 alphanumeric + 1 check digit');
    }

    // Face value validation
    if (bond.faceValue !== undefined) {
      if (bond.faceValue <= 0) {
        errors.push('Face value must be positive');
      }
      if (bond.faceValue < 100) {
        warnings.push('Face value seems unusually low (<$100)');
      }
      if (bond.faceValue > 1000000) {
        warnings.push('Face value seems unusually high (>$1M)');
      }
    }

    // Coupon rate validation
    if (bond.couponRate !== undefined) {
      if (bond.couponRate < 0 || bond.couponRate > 50) {
        errors.push('Coupon rate must be between 0% and 50%');
      }
      if (bond.couponRate > 15) {
        warnings.push('Coupon rate seems unusually high (>15%)');
      }
    }

    // Date validations
    if (bond.issueDate && bond.maturityDate) {
      if (new Date(bond.maturityDate) <= new Date(bond.issueDate)) {
        errors.push('Maturity date must be after issue date');
      }
      
      const yearsToMaturity = (new Date(bond.maturityDate).getTime() - new Date(bond.issueDate).getTime()) / (365 * 24 * 60 * 60 * 1000);
      if (yearsToMaturity > 100) {
        warnings.push('Bond term seems unusually long (>100 years)');
      }
    }

    if (bond.firstCouponDate && bond.issueDate) {
      if (new Date(bond.firstCouponDate) <= new Date(bond.issueDate)) {
        errors.push('First coupon date must be after issue date');
      }
    }

    // Payment frequency validation
    const validFrequencies = ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'ZERO_COUPON'];
    if (bond.paymentFrequency && !validFrequencies.includes(bond.paymentFrequency)) {
      errors.push(`Invalid payment frequency. Must be one of: ${validFrequencies.join(', ')}`);
    }

    // Zero coupon validation
    if (bond.paymentFrequency === 'ZERO_COUPON' && bond.couponRate && bond.couponRate > 0) {
      errors.push('Zero coupon bonds cannot have a coupon rate');
    }

    // Day count convention validation
    const validDayCount = ['ACT_360', 'ACT_365', '30_360', 'ACT_ACT'];
    if (bond.dayCountConvention && !validDayCount.includes(bond.dayCountConvention)) {
      errors.push(`Invalid day count convention. Must be one of: ${validDayCount.join(', ')}`);
    }

    // Price validation
    if (bond.currentPrice !== undefined) {
      if (bond.currentPrice <= 0) {
        errors.push('Current price must be positive');
      }
      if (bond.currentPrice > 200) {
        warnings.push('Bond price seems unusually high (>200% of par)');
      }
      if (bond.currentPrice < 20) {
        warnings.push('Bond price seems unusually low (<20% of par)');
      }
    }

    // Yield validations
    if (bond.yieldToMaturity !== undefined) {
      if (bond.yieldToMaturity < 0 || bond.yieldToMaturity > 50) {
        errors.push('Yield to maturity must be between 0% and 50%');
      }
    }

    if (bond.yieldToCall !== undefined) {
      if (bond.yieldToCall < 0 || bond.yieldToCall > 50) {
        errors.push('Yield to call must be between 0% and 50%');
      }
    }

    // Duration validations
    if (bond.duration !== undefined) {
      if (bond.duration < 0) {
        errors.push('Duration cannot be negative');
      }
      if (bond.duration > 50) {
        warnings.push('Duration seems unusually high (>50 years)');
      }
    }

    if (bond.modifiedDuration !== undefined) {
      if (bond.modifiedDuration < 0) {
        errors.push('Modified duration cannot be negative');
      }
    }

    if (bond.convexity !== undefined) {
      if (bond.convexity < 0) {
        errors.push('Convexity cannot be negative');
      }
    }

    // Call/put feature validations
    if (bond.isCallable) {
      if (!bond.callDate) {
        errors.push('Callable bonds must have a call date');
      }
      if (!bond.callPrice) {
        errors.push('Callable bonds must have a call price');
      }
      if (bond.callDate && bond.maturityDate && new Date(bond.callDate) >= new Date(bond.maturityDate)) {
        errors.push('Call date must be before maturity date');
      }
    }

    if (bond.isPutable) {
      if (!bond.putDate) {
        errors.push('Putable bonds must have a put date');
      }
      if (!bond.putPrice) {
        errors.push('Putable bonds must have a put price');
      }
      if (bond.putDate && bond.maturityDate && new Date(bond.putDate) >= new Date(bond.maturityDate)) {
        errors.push('Put date must be before maturity date');
      }
    }

    // Credit rating validations
    const validMoodysRatings = ['Aaa', 'Aa1', 'Aa2', 'Aa3', 'A1', 'A2', 'A3', 'Baa1', 'Baa2', 'Baa3', 'Ba1', 'Ba2', 'Ba3', 'B1', 'B2', 'B3', 'Caa1', 'Caa2', 'Caa3', 'Ca', 'C'];
    if (bond.moodysRating && !validMoodysRatings.includes(bond.moodysRating)) {
      warnings.push('Moody\'s rating format may be invalid');
    }

    const validSPRatings = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC+', 'CCC', 'CCC-', 'CC', 'C', 'D'];
    if (bond.spRating && !validSPRatings.includes(bond.spRating)) {
      warnings.push('S&P rating format may be invalid');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  static validateTreasuryBill(bill: Partial<TreasuryBill>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!bill.billId) errors.push('Bill ID is required');
    if (!bill.cusip) errors.push('CUSIP is required');
    if (!bill.maturityDate) errors.push('Maturity date is required');
    if (!bill.issueDate) errors.push('Issue date is required');
    if (!bill.auctionDate) errors.push('Auction date is required');

    // CUSIP format validation
    if (bill.cusip && !/^[0-9A-Z]{9}$/.test(bill.cusip)) {
      errors.push('CUSIP must be 9 alphanumeric characters');
    }

    // Face value validation
    if (bill.faceValue !== undefined) {
      if (bill.faceValue <= 0) {
        errors.push('Face value must be positive');
      }
      if (![100, 1000, 10000, 100000, 1000000].includes(bill.faceValue)) {
        warnings.push('Face value should typically be $100, $1K, $10K, $100K, or $1M');
      }
    }

    // Date validations
    if (bill.issueDate && bill.maturityDate) {
      if (new Date(bill.maturityDate) <= new Date(bill.issueDate)) {
        errors.push('Maturity date must be after issue date');
      }
    }

    if (bill.auctionDate && bill.issueDate) {
      if (new Date(bill.issueDate) < new Date(bill.auctionDate)) {
        errors.push('Issue date must be on or after auction date');
      }
    }

    // Term validations
    if (bill.termDays !== undefined) {
      if (bill.termDays <= 0) {
        errors.push('Term days must be positive');
      }
      if (![28, 91, 182, 364].includes(bill.termDays)) {
        warnings.push('Treasury bills typically have terms of 28, 91, 182, or 364 days');
      }
    }

    if (bill.termWeeks !== undefined) {
      if (bill.termWeeks <= 0) {
        errors.push('Term weeks must be positive');
      }
      if (bill.termDays && Math.abs(bill.termWeeks - bill.termDays / 7) > 1) {
        errors.push('Term weeks and term days are inconsistent');
      }
    }

    // Rate validations
    if (bill.discountRate !== undefined) {
      if (bill.discountRate < 0 || bill.discountRate > 50) {
        errors.push('Discount rate must be between 0% and 50%');
      }
    }

    if (bill.yieldToMaturity !== undefined) {
      if (bill.yieldToMaturity < 0 || bill.yieldToMaturity > 50) {
        errors.push('Yield to maturity must be between 0% and 50%');
      }
    }

    // Price validation
    if (bill.currentPrice !== undefined && bill.faceValue !== undefined) {
      if (bill.currentPrice <= 0) {
        errors.push('Current price must be positive');
      }
      if (bill.currentPrice >= bill.faceValue) {
        errors.push('Treasury bill price must be less than face value (sold at discount)');
      }
      if (bill.currentPrice < bill.faceValue * 0.80) {
        warnings.push('Treasury bill discount seems unusually large (>20%)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  static validateFixedIncomePosition(request: CreateFixedIncomePositionRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!request.portfolioId) errors.push('Portfolio ID is required');
    if (!request.tenantId) errors.push('Tenant ID is required');
    if (!request.assetType) errors.push('Asset type is required');
    if (!request.cusip) errors.push('CUSIP is required');
    if (request.quantity === undefined) errors.push('Quantity is required');
    if (request.purchasePrice === undefined) errors.push('Purchase price is required');
    if (request.faceValue === undefined) errors.push('Face value is required');
    if (!request.maturityDate) errors.push('Maturity date is required');

    // Asset type validation
    const validAssetTypes = ['GOVERNMENT_BOND', 'CORPORATE_BOND', 'MUNICIPAL_BOND', 'TREASURY_BILL', 'AGENCY_BOND'];
    if (request.assetType && !validAssetTypes.includes(request.assetType)) {
      errors.push(`Invalid asset type. Must be one of: ${validAssetTypes.join(', ')}`);
    }

    // CUSIP validation
    if (request.cusip && !/^[0-9A-Z]{9}$/.test(request.cusip)) {
      errors.push('CUSIP must be 9 alphanumeric characters');
    }

    // Value validations
    if (request.quantity !== undefined && request.quantity <= 0) {
      errors.push('Quantity must be positive');
    }

    if (request.purchasePrice !== undefined && request.purchasePrice <= 0) {
      errors.push('Purchase price must be positive');
    }

    if (request.faceValue !== undefined && request.faceValue <= 0) {
      errors.push('Face value must be positive');
    }

    // Maturity date validation
    if (request.maturityDate) {
      const maturityDate = new Date(request.maturityDate);
      const today = new Date();
      
      if (maturityDate <= today) {
        errors.push('Maturity date must be in the future');
      }
      
      const yearsToMaturity = (maturityDate.getTime() - today.getTime()) / (365 * 24 * 60 * 60 * 1000);
      if (yearsToMaturity > 100) {
        warnings.push('Maturity date is more than 100 years in the future');
      }
    }

    // Coupon rate validation
    if (request.couponRate !== undefined) {
      if (request.couponRate < 0 || request.couponRate > 50) {
        errors.push('Coupon rate must be between 0% and 50%');
      }
    }

    // Treasury bill specific validations
    if (request.assetType === 'TREASURY_BILL') {
      if (request.couponRate && request.couponRate > 0) {
        errors.push('Treasury bills should not have coupon rates (they are discount instruments)');
      }
      if (request.purchasePrice && request.faceValue && request.purchasePrice >= request.faceValue) {
        errors.push('Treasury bills must be purchased at a discount to face value');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  static validateFixedIncomeTrade(request: FixedIncomeTradeRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!request.portfolioId) errors.push('Portfolio ID is required');
    if (!request.tenantId) errors.push('Tenant ID is required');
    if (!request.transactionType) errors.push('Transaction type is required');
    if (!request.cusip) errors.push('CUSIP is required');
    if (request.quantity === undefined) errors.push('Quantity is required');
    if (request.price === undefined) errors.push('Price is required');
    if (!request.tradeDate) errors.push('Trade date is required');
    if (!request.settlementDate) errors.push('Settlement date is required');

    // Transaction type validation
    if (request.transactionType && !['BUY', 'SELL'].includes(request.transactionType)) {
      errors.push('Transaction type must be either BUY or SELL');
    }

    // CUSIP validation
    if (request.cusip && !/^[0-9A-Z]{9}$/.test(request.cusip)) {
      errors.push('CUSIP must be 9 alphanumeric characters');
    }

    // Value validations
    if (request.quantity !== undefined && request.quantity <= 0) {
      errors.push('Quantity must be positive');
    }

    if (request.price !== undefined && request.price <= 0) {
      errors.push('Price must be positive');
    }

    // Date validations
    if (request.tradeDate && request.settlementDate) {
      const tradeDate = new Date(request.tradeDate);
      const settlementDate = new Date(request.settlementDate);
      
      if (settlementDate < tradeDate) {
        errors.push('Settlement date cannot be before trade date');
      }
      
      const daysDiff = (settlementDate.getTime() - tradeDate.getTime()) / (24 * 60 * 60 * 1000);
      if (daysDiff > 10) {
        warnings.push('Settlement period seems unusually long (>10 days)');
      }
    }

    // Trade date validation
    if (request.tradeDate) {
      const tradeDate = new Date(request.tradeDate);
      const today = new Date();
      const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
      
      if (tradeDate > today) {
        errors.push('Trade date cannot be in the future');
      }
      
      if (tradeDate < oneYearAgo) {
        warnings.push('Trade date is more than one year in the past');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  static validateCouponPayment(request: CouponProcessingRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!request.positionId) errors.push('Position ID is required');
    if (!request.paymentDate) errors.push('Payment date is required');
    if (request.couponRate === undefined) errors.push('Coupon rate is required');
    if (!request.tenantId) errors.push('Tenant ID is required');

    // Coupon rate validation
    if (request.couponRate !== undefined) {
      if (request.couponRate < 0 || request.couponRate > 50) {
        errors.push('Coupon rate must be between 0% and 50%');
      }
      if (request.couponRate === 0) {
        warnings.push('Zero coupon rate - verify this is correct');
      }
    }

    // Payment date validation
    if (request.paymentDate) {
      const paymentDate = new Date(request.paymentDate);
      const today = new Date();
      const futureLimit = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
      
      if (paymentDate > futureLimit) {
        errors.push('Payment date cannot be more than 90 days in the future');
      }
      
      const pastLimit = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year
      if (paymentDate < pastLimit) {
        warnings.push('Payment date is more than one year in the past');
      }
    }

    // Reinvest option validation
    if (request.reinvestOption && !['CASH', 'REINVEST'].includes(request.reinvestOption)) {
      errors.push('Reinvest option must be either CASH or REINVEST');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  static validateYieldCalculation(yieldData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required data for yield calculation
    if (yieldData.currentPrice === undefined) errors.push('Current price is required for yield calculation');
    if (yieldData.faceValue === undefined) errors.push('Face value is required for yield calculation');
    if (yieldData.couponRate === undefined) errors.push('Coupon rate is required for yield calculation');
    if (!yieldData.maturityDate) errors.push('Maturity date is required for yield calculation');

    // Value validations
    if (yieldData.currentPrice !== undefined && yieldData.currentPrice <= 0) {
      errors.push('Current price must be positive');
    }

    if (yieldData.faceValue !== undefined && yieldData.faceValue <= 0) {
      errors.push('Face value must be positive');
    }

    if (yieldData.couponRate !== undefined && (yieldData.couponRate < 0 || yieldData.couponRate > 50)) {
      errors.push('Coupon rate must be between 0% and 50%');
    }

    // Maturity date validation
    if (yieldData.maturityDate) {
      const maturityDate = new Date(yieldData.maturityDate);
      const today = new Date();
      
      if (maturityDate <= today) {
        errors.push('Cannot calculate yield for matured bonds');
      }
    }

    // Reasonableness checks
    if (yieldData.currentPrice && yieldData.faceValue) {
      const priceRatio = yieldData.currentPrice / yieldData.faceValue;
      if (priceRatio > 2.0) {
        warnings.push('Bond price is more than 200% of face value - verify accuracy');
      }
      if (priceRatio < 0.2) {
        warnings.push('Bond price is less than 20% of face value - may indicate distressed bond');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  static validateMaturityEvent(maturityData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!maturityData.positionId) errors.push('Position ID is required');
    if (!maturityData.maturityDate) errors.push('Maturity date is required');
    if (maturityData.principalAmount === undefined) errors.push('Principal amount is required');

    // Date validation
    if (maturityData.maturityDate) {
      const maturityDate = new Date(maturityData.maturityDate);
      const today = new Date();
      const daysDiff = Math.abs(maturityDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000);
      
      if (daysDiff > 7) {
        warnings.push('Maturity processing date is more than 7 days from maturity date');
      }
    }

    // Principal amount validation
    if (maturityData.principalAmount !== undefined && maturityData.principalAmount <= 0) {
      errors.push('Principal amount must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  // Utility method to validate CUSIP check digit
  static validateCUSIPCheckDigit(cusip: string): boolean {
    if (cusip.length !== 9) return false;
    
    const weights = [1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;
    
    for (let i = 0; i < 8; i++) {
      let char = cusip[i];
      let value: number;
      
      if (char >= '0' && char <= '9') {
        value = parseInt(char);
      } else {
        value = char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
      }
      
      let product = value * weights[i];
      sum += Math.floor(product / 10) + (product % 10);
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(cusip[8]);
  }
}