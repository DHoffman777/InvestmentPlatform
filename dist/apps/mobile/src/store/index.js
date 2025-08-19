"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistor = exports.store = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const redux_persist_1 = require("redux-persist");
const react_native_encrypted_storage_1 = __importDefault(require("react-native-encrypted-storage"));
const rootReducer_1 = __importDefault(require("./rootReducer"));
const persistConfig = {
    key: 'root',
    storage: react_native_encrypted_storage_1.default,
    whitelist: ['auth', 'user', 'settings'],
    blacklist: ['ui', 'network'],
};
const persistedReducer = (0, redux_persist_1.persistReducer)(persistConfig, rootReducer_1.default);
exports.store = (0, toolkit_1.configureStore)({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware({
        serializableCheck: {
            ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
    }),
    devTools: __DEV__,
});
exports.persistor = (0, redux_persist_1.persistStore)(exports.store);
