import { FixedIncomeBond, TreasuryBill, CreateFixedIncomePositionRequest, FixedIncomeTradeRequest, CouponProcessingRequest } from '../models/assets/FixedIncomeAssets';
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}
export declare class FixedIncomeValidators {
    static validateBond(bond: Partial<FixedIncomeBond>): ValidationResult;
    static validateTreasuryBill(bill: Partial<TreasuryBill>): ValidationResult;
    static validateFixedIncomePosition(request: CreateFixedIncomePositionRequest): ValidationResult;
    static validateFixedIncomeTrade(request: FixedIncomeTradeRequest): ValidationResult;
    static validateCouponPayment(request: CouponProcessingRequest): ValidationResult;
    static validateYieldCalculation(yieldData: any): ValidationResult;
    static validateMaturityEvent(maturityData: any): ValidationResult;
    static validateCUSIPCheckDigit(cusip: string): boolean;
}
