import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {User, BiometricInfo} from '@types/index';
import * as authService from '@services/authService';
import * as biometricService from '@services/biometricService';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  biometricInfo: BiometricInfo;
  isLoading: boolean;
  error: string | null;
  lastLoginAt: Date | null;
  sessionExpiresAt: Date | null;
}

const initialState: AuthState = {
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

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: {email: string; password: string}) => {
    const response = await authService.login(credentials);
    return response;
  },
);

export const loginWithBiometrics = createAsyncThunk(
  'auth/loginWithBiometrics',
  async () => {
    const biometricResult = await biometricService.authenticate();
    if (biometricResult.success) {
      const savedCredentials = await authService.getSavedCredentials();
      if (savedCredentials) {
        const response = await authService.login(savedCredentials);
        return response;
      }
    }
    throw new Error('Biometric authentication failed');
  },
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, {getState}) => {
    const state = getState() as {auth: AuthState};
    if (state.auth.refreshToken) {
      const response = await authService.refreshToken(state.auth.refreshToken);
      return response;
    }
    throw new Error('No refresh token available');
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  await authService.clearSavedCredentials();
});

export const checkBiometricAvailability = createAsyncThunk(
  'auth/checkBiometricAvailability',
  async () => {
    const biometricInfo = await biometricService.checkAvailability();
    return biometricInfo;
  },
);

export const enableBiometrics = createAsyncThunk(
  'auth/enableBiometrics',
  async (credentials: {email: string; password: string}) => {
    await authService.saveCredentialsForBiometrics(credentials);
    return true;
  },
);

export const disableBiometrics = createAsyncThunk(
  'auth/disableBiometrics',
  async () => {
    await authService.clearSavedCredentials();
    return false;
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setSessionExpiration: (state, action: PayloadAction<Date>) => {
      state.sessionExpiresAt = action.payload;
    },
    extendSession: (state, action: PayloadAction<Date>) => {
      state.sessionExpiresAt = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.lastLoginAt = new Date();
        state.sessionExpiresAt = action.payload.expiresAt;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(loginWithBiometrics.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithBiometrics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.lastLoginAt = new Date();
        state.sessionExpiresAt = action.payload.expiresAt;
        state.error = null;
      })
      .addCase(loginWithBiometrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Biometric login failed';
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.sessionExpiresAt = action.payload.expiresAt;
      })
      .addCase(logout.fulfilled, state => {
        return {
          ...initialState,
          biometricInfo: state.biometricInfo,
        };
      })
      .addCase(checkBiometricAvailability.fulfilled, (state, action) => {
        state.biometricInfo = action.payload;
      })
      .addCase(enableBiometrics.fulfilled, state => {
        state.biometricInfo.isEnabled = true;
      })
      .addCase(disableBiometrics.fulfilled, state => {
        state.biometricInfo.isEnabled = false;
      });
  },
});

export const {clearError, setSessionExpiration, extendSession} =
  authSlice.actions;
export default authSlice.reducer;