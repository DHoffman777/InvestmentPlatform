import { MoneyMarketFund, SweepAccount } from '../models/assets/MoneyMarketAssets';
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}
export declare class CashEquivalentValidators {
    static validateMoneyMarketFund(fund: Partial<MoneyMarketFund>): ValidationResult;
    static validateSweepAccount(account: Partial<SweepAccount>): ValidationResult;
    static validateCashEquivalentPosition(positionData: any): ValidationResult;
    static validateSweepTransaction(transactionData: any): ValidationResult;
    static validateYieldDistribution(distributionData: any): ValidationResult;
}
