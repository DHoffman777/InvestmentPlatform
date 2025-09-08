import ReactNativeBiometrics from 'react-native-biometrics';
import {BiometricInfo} from '@types/index';

const biometrics = new ReactNativeBiometrics({
  allowDeviceCredentials: true,
});

export const checkAvailability = async (): Promise<BiometricInfo> => {
  try {
    const {available, biometryType} = await biometrics.isSensorAvailable();
    
    let mappedBiometryType: 'TouchID' | 'FaceID' | 'Fingerprint' | undefined;
    
    switch (biometryType) {
      case ReactNativeBiometrics.TouchID:
        mappedBiometryType = 'TouchID';
        break;
      case ReactNativeBiometrics.FaceID:
        mappedBiometryType = 'FaceID';
        break;
      case ReactNativeBiometrics.Biometrics:
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
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return {
      isAvailable: false,
      isEnabled: false,
    };
  }
};

export const authenticate = async (
  reason?: string,
): Promise<{success: boolean; error?: string}> => {
  try {
    const promptMessage = reason || 'Please verify your identity';
    
    const {success, error} = await biometrics.simplePrompt({
      promptMessage,
      cancelButtonText: 'Cancel',
    });

    if (success) {
      return {success: true};
    } else {
      return {
        success: false,
        error: error || 'Biometric authentication failed',
      };
    }
  } catch (error: any) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' || 'Biometric authentication failed',
    };
  }
};

export const createKeys = async (): Promise<{success: boolean; error?: string}> => {
  try {
    const {success, error} = await biometrics.createKeys();
    
    if (success) {
      return {success: true};
    } else {
      return {
        success: false,
        error: error || 'Failed to create biometric keys',
      };
    }
  } catch (error: any) {
    console.error('Error creating biometric keys:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' || 'Failed to create biometric keys',
    };
  }
};

export const deleteKeys = async (): Promise<{success: boolean; error?: string}> => {
  try {
    const {success, error} = await biometrics.deleteKeys();
    
    if (success) {
      return {success: true};
    } else {
      return {
        success: false,
        error: error || 'Failed to delete biometric keys',
      };
    }
  } catch (error: any) {
    console.error('Error deleting biometric keys:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' || 'Failed to delete biometric keys',
    };
  }
};

export const createSignature = async (
  payload: string,
  promptMessage?: string,
): Promise<{success: boolean; signature?: string; error?: string}> => {
  try {
    const message = promptMessage || 'Please verify your identity to sign';
    
    const {success, signature, error} = await biometrics.createSignature({
      promptMessage: message,
      payload,
      cancelButtonText: 'Cancel',
    });

    if (success && signature) {
      return {success: true, signature};
    } else {
      return {
        success: false,
        error: error || 'Failed to create biometric signature',
      };
    }
  } catch (error: any) {
    console.error('Error creating biometric signature:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' || 'Failed to create biometric signature',
    };
  }
};

export const biometricKeysExist = async (): Promise<boolean> => {
  try {
    const {keysExist} = await biometrics.biometricKeysExist();
    return keysExist;
  } catch (error) {
    console.error('Error checking if biometric keys exist:', error);
    return false;
  }
};

export const getBiometryType = async (): Promise<string | null> => {
  try {
    const {biometryType} = await biometrics.isSensorAvailable();
    return biometryType || null;
  } catch (error) {
    console.error('Error getting biometry type:', error);
    return null;
  }
};

export const promptBiometricEnrollment = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // This is a placeholder for prompting the user to enroll in biometrics
    // The actual implementation would depend on the platform and requirements
    const {available} = await biometrics.isSensorAvailable();
    
    if (!available) {
      return {
        success: false,
        error: 'Biometric sensors are not available on this device',
      };
    }

    // In a real implementation, you might show a custom dialog
    // or navigate to system settings to enroll biometrics
    return {success: true};
  } catch (error: any) {
    console.error('Error prompting biometric enrollment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' || 'Failed to prompt biometric enrollment',
    };
  }
};