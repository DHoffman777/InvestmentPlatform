export const __esModule: boolean;
export class FixedIncomeValidators {
    static validateBond(bond: any): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    static validateTreasuryBill(bill: any): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    static validateFixedIncomePosition(request: any): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    static validateFixedIncomeTrade(request: any): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    static validateCouponPayment(request: any): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    static validateYieldCalculation(yieldData: any): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    static validateMaturityEvent(maturityData: any): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    static validateCUSIPCheckDigit(cusip: any): boolean;
}
