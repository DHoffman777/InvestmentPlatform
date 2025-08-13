import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {User, UserPreferences} from '@types/index';

interface UserState {
  profile: User | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  preferences: null,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.profile = action.payload;
      state.preferences = action.payload.preferences;
    },
    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      if (state.preferences) {
        state.preferences = {...state.preferences, ...action.payload};
      }
    },
    clearUser: () => initialState,
  },
});

export const {setUser, updatePreferences, clearUser} = userSlice.actions;
export default userSlice.reducer;