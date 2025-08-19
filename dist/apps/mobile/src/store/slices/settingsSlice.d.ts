import { UserPreferences } from '@types/index';
interface SettingsState {
    preferences: UserPreferences | null;
    isLoading: boolean;
    error: string | null;
}
export declare const setPreferences: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "settings/setPreferences">, updatePreferences: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "settings/updatePreferences">, clearSettings: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"settings/clearSettings">;
declare const _default: import("redux").Reducer<SettingsState>;
export default _default;
