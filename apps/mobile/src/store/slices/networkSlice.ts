import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {NetworkStatus} from '@types/index';

interface NetworkState {
  status: NetworkStatus;
  isOffline: boolean;
}

const initialState: NetworkState = {
  status: {
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  },
  isOffline: false,
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkStatus: (state, action: PayloadAction<NetworkStatus>) => {
      state.status = action.payload;
      state.isOffline = !action.payload.isConnected || !action.payload.isInternetReachable;
    },
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },
  },
});

export const {setNetworkStatus, setOfflineMode} = networkSlice.actions;
export default networkSlice.reducer;