import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface UIState {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  activeScreen: string;
  tabBarVisible: boolean;
}

const initialState: UIState = {
  isLoading: false,
  isRefreshing: false,
  error: null,
  activeScreen: 'Dashboard',
  tabBarVisible: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.isRefreshing = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setActiveScreen: (state, action: PayloadAction<string>) => {
      state.activeScreen = action.payload;
    },
    setTabBarVisible: (state, action: PayloadAction<boolean>) => {
      state.tabBarVisible = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setRefreshing,
  setError,
  setActiveScreen,
  setTabBarVisible,
  clearError,
} = uiSlice.actions;
export default uiSlice.reducer;