"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptBiometricEnrollment = exports.getBiometryType = exports.biometricKeysExist = exports.createSignature = exports.deleteKeys = exports.createKeys = exports.authenticate = exports.checkAvailability = void 0;
const react_native_biometrics_1 = __importDefault(require("react-native-biometrics"));
const biometrics = new react_native_biometrics_1.default({
    allowDeviceCredentials: true,
});
const checkAvailability = async () => {
    try {
        const { available, biometryType } = await biometrics.isSensorAvailable();
        let mappedBiometryType;
        switch (biometryType) {
            case react_native_biometrics_1.default.TouchID:
                mappedBiometryType = 'TouchID';
                break;
            case react_native_biometrics_1.default.FaceID:
                mappedBiometryType = 'FaceID';
                break;
            case react_native_biometrics_1.default.Biometrics:
                mappedBiometryType = 'Fingerprint';
                break;
            default:
                mappedBiometryType = undefined;
        }
        return {
            isAvailable: available,
            biometryType: mappedBiometryType,
            isEnabled: false, // This will be set from stored preferences
        };
    }
    catch (error) {
        console.error('Error checking biometric availability:', error);
        return {
            isAvailable: false,
            isEnabled: false,
        };
    }
};
exports.checkAvailability = checkAvailability;
const authenticate = async (reason) => {
    try {
        const promptMessage = reason || 'Please verify your identity';
        const { success, error } = await biometrics.simplePrompt({
            promptMessage,
            cancelButtonText: 'Cancel',
        });
        if (success) {
            return { success: true };
        }
        else {
            return {
                success: false,
                error: error || 'Biometric authentication failed',
            };
        }
    }
    catch (error) {
        console.error('Biometric authentication error:', error);
        return {
            success: false,
            error: error.message || 'Biometric authentication failed',
        };
    }
};
exports.authenticate = authenticate;
const createKeys = async () => {
    try {
        const { success, error } = await biometrics.createKeys();
        if (success) {
            return { success: true };
        }
        else {
            return {
                success: false,
                error: error || 'Failed to create biometric keys',
            };
        }
    }
    catch (error) {
        console.error('Error creating biometric keys:', error);
        return {
            success: false,
            error: error.message || 'Failed to create biometric keys',
        };
    }
};
exports.createKeys = createKeys;
const deleteKeys = async () => {
    try {
        const { success, error } = await biometrics.deleteKeys();
        if (success) {
            return { success: true };
        }
        else {
            return {
                success: false,
                error: error || 'Failed to delete biometric keys',
            };
        }
    }
    catch (error) {
        console.error('Error deleting biometric keys:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete biometric keys',
        };
    }
};
exports.deleteKeys = deleteKeys;
const createSignature = async (payload, promptMessage) => {
    try {
        const message = promptMessage || 'Please verify your identity to sign';
        const { success, signature, error } = await biometrics.createSignature({
            promptMessage: message,
            payload,
            cancelButtonText: 'Cancel',
        });
        if (success && signature) {
            return { success: true, signature };
        }
        else {
            return {
                success: false,
                error: error || 'Failed to create biometric signature',
            };
        }
    }
    catch (error) {
        console.error('Error creating biometric signature:', error);
        return {
            success: false,
            error: error.message || 'Failed to create biometric signature',
        };
    }
};
exports.createSignature = createSignature;
const biometricKeysExist = async () => {
    try {
        const { keysExist } = await biometrics.biometricKeysExist();
        return keysExist;
    }
    catch (error) {
        console.error('Error checking if biometric keys exist:', error);
        return false;
    }
};
exports.biometricKeysExist = biometricKeysExist;
const getBiometryType = async () => {
    try {
        const { biometryType } = await biometrics.isSensorAvailable();
        return biometryType || null;
    }
    catch (error) {
        console.error('Error getting biometry type:', error);
        return null;
    }
};
exports.getBiometryType = getBiometryType;
const promptBiometricEnrollment = async () => {
    try {
        // This is a placeholder for prompting the user to enroll in biometrics
        // The actual implementation would depend on the platform and requirements
        const { available } = await biometrics.isSensorAvailable();
        if (!available) {
            return {
                success: false,
                error: 'Biometric sensors are not available on this device',
            };
        }
        // In a real implementation, you might show a custom dialog
        // or navigate to system settings to enroll biometrics
        return { success: true };
    }
    catch (error) {
        console.error('Error prompting biometric enrollment:', error);
        return {
            success: false,
            error: error.message || 'Failed to prompt biometric enrollment',
        };
    }
};
exports.promptBiometricEnrollment = promptBiometricEnrollment;
