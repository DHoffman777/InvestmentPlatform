import {combineReducers} from '@reduxjs/toolkit';

import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import portfolioSlice from './slices/portfolioSlice';
import transactionSlice from './slices/transactionSlice';
import alertSlice from './slices/alertSlice';
import documentSlice from './slices/documentSlice';
import messageSlice from './slices/messageSlice';
import settingsSlice from './slices/settingsSlice';
import uiSlice from './slices/uiSlice';
import networkSlice from './slices/networkSlice';

const rootReducer = combineReducers({
  auth: authSlice,
  user: userSlice,
  portfolio: portfolioSlice,
  transaction: transactionSlice,
  alert: alertSlice,
  document: documentSlice,
  message: messageSlice,
  settings: settingsSlice,
  ui: uiSlice,
  network: networkSlice,
});

export default rootReducer;