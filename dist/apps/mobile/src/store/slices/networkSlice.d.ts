import { NetworkStatus } from '@types/index';
interface NetworkState {
    status: NetworkStatus;
    isOffline: boolean;
}
export declare const setNetworkStatus: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "network/setNetworkStatus">, setOfflineMode: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "network/setOfflineMode">;
declare const _default: import("redux").Reducer<NetworkState>;
export default _default;
