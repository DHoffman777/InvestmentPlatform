import { BiometricInfo } from '@types/index';
export declare const checkAvailability: () => Promise<BiometricInfo>;
export declare const authenticate: (reason?: string) => Promise<{
    success: boolean;
    error?: string;
}>;
export declare const createKeys: () => Promise<{
    success: boolean;
    error?: string;
}>;
export declare const deleteKeys: () => Promise<{
    success: boolean;
    error?: string;
}>;
export declare const createSignature: (payload: string, promptMessage?: string) => Promise<{
    success: boolean;
    signature?: string;
    error?: string;
}>;
export declare const biometricKeysExist: () => Promise<boolean>;
export declare const getBiometryType: () => Promise<string | null>;
export declare const promptBiometricEnrollment: () => Promise<{
    success: boolean;
    error?: string;
}>;
