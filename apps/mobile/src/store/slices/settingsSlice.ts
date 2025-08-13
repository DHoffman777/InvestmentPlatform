import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {UserPreferences} from '@types/index';

interface SettingsState {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  preferences: null,
  isLoading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setPreferences: (state, action: PayloadAction<UserPreferences>) => {
      state.preferences = action.payload;
    },
    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      if (state.preferences) {
        state.preferences = {...state.preferences, ...action.payload};
      }
    },
    clearSettings: () => initialState,
  },
});

export const {setPreferences, updatePreferences, clearSettings} = settingsSlice.actions;
export default settingsSlice.reducer;