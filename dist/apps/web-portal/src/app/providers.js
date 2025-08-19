"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Providers = Providers;
const react_redux_1 = require("react-redux");
const react_1 = require("next-auth/react");
const react_query_1 = require("react-query");
const store_1 = require("@/store");
const react_2 = require("react");
function Providers({ children }) {
    const [queryClient] = (0, react_2.useState)(() => new react_query_1.QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000, // 5 minutes
                cacheTime: 10 * 60 * 1000, // 10 minutes
                refetchOnWindowFocus: false,
            },
        },
    }));
    return (<react_1.SessionProvider>
      <react_redux_1.Provider store={store_1.store}>
        <react_query_1.QueryClientProvider client={queryClient}>
          {children}
        </react_query_1.QueryClientProvider>
      </react_redux_1.Provider>
    </react_1.SessionProvider>);
}
