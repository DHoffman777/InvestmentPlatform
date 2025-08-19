import { User, UserPreferences } from '@types/index';
interface UserState {
    profile: User | null;
    preferences: UserPreferences | null;
    isLoading: boolean;
    error: string | null;
}
export declare const setUser: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "user/setUser">, updatePreferences: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "user/updatePreferences">, clearUser: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"user/clearUser">;
declare const _default: import("redux").Reducer<UserState>;
export default _default;
