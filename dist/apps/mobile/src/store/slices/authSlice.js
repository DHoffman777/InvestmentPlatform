"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendSession = exports.setSessionExpiration = exports.clearError = exports.disableBiometrics = exports.enableBiometrics = exports.checkBiometricAvailability = exports.logout = exports.refreshToken = exports.loginWithBiometrics = exports.login = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const authService = __importStar(require("@services/authService"));
const biometricService = __importStar(require("@services/biometricService"));
const initialState = {
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    biometricInfo: {
        isAvailable: false,
        isEnabled: false,
    },
    isLoading: false,
    error: null,
    lastLoginAt: null,
    sessionExpiresAt: null,
};
exports.login = (0, toolkit_1.createAsyncThunk)('auth/login', async (credentials) => {
    const response = await authService.login(credentials);
    return response;
});
exports.loginWithBiometrics = (0, toolkit_1.createAsyncThunk)('auth/loginWithBiometrics', async () => {
    const biometricResult = await biometricService.authenticate();
    if (biometricResult.success) {
        const savedCredentials = await authService.getSavedCredentials();
        if (savedCredentials) {
            const response = await authService.login(savedCredentials);
            return response;
        }
    }
    throw new Error('Biometric authentication failed');
});
exports.refreshToken = (0, toolkit_1.createAsyncThunk)('auth/refreshToken', async (_, { getState }) => {
    const state = getState();
    if (state.auth.refreshToken) {
        const response = await authService.refreshToken(state.auth.refreshToken);
        return response;
    }
    throw new Error('No refresh token available');
});
exports.logout = (0, toolkit_1.createAsyncThunk)('auth/logout', async () => {
    await authService.logout();
    await authService.clearSavedCredentials();
});
exports.checkBiometricAvailability = (0, toolkit_1.createAsyncThunk)('auth/checkBiometricAvailability', async () => {
    const biometricInfo = await biometricService.checkAvailability();
    return biometricInfo;
});
exports.enableBiometrics = (0, toolkit_1.createAsyncThunk)('auth/enableBiometrics', async (credentials) => {
    await authService.saveCredentialsForBiometrics(credentials);
    return true;
});
exports.disableBiometrics = (0, toolkit_1.createAsyncThunk)('auth/disableBiometrics', async () => {
    await authService.clearSavedCredentials();
    return false;
});
const authSlice = (0, toolkit_1.createSlice)({
    name: 'auth',
    initialState,
    reducers: {
        clearError: state => {
            state.error = null;
        },
        setSessionExpiration: (state, action) => {
            state.sessionExpiresAt = action.payload;
        },
        extendSession: (state, action) => {
            state.sessionExpiresAt = action.payload;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(exports.login.pending, state => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(exports.login.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
            state.lastLoginAt = new Date();
            state.sessionExpiresAt = action.payload.expiresAt;
            state.error = null;
        })
            .addCase(exports.login.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Login failed';
        })
            .addCase(exports.loginWithBiometrics.pending, state => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(exports.loginWithBiometrics.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
            state.lastLoginAt = new Date();
            state.sessionExpiresAt = action.payload.expiresAt;
            state.error = null;
        })
            .addCase(exports.loginWithBiometrics.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Biometric login failed';
        })
            .addCase(exports.refreshToken.fulfilled, (state, action) => {
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
            state.sessionExpiresAt = action.payload.expiresAt;
        })
            .addCase(exports.logout.fulfilled, state => {
            return {
                ...initialState,
                biometricInfo: state.biometricInfo,
            };
        })
            .addCase(exports.checkBiometricAvailability.fulfilled, (state, action) => {
            state.biometricInfo = action.payload;
        })
            .addCase(exports.enableBiometrics.fulfilled, state => {
            state.biometricInfo.isEnabled = true;
        })
            .addCase(exports.disableBiometrics.fulfilled, state => {
            state.biometricInfo.isEnabled = false;
        });
    },
});
_a = authSlice.actions, exports.clearError = _a.clearError, exports.setSessionExpiration = _a.setSessionExpiration, exports.extendSession = _a.extendSession;
exports.default = authSlice.reducer;
