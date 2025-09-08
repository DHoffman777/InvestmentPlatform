export const __esModule: boolean;
export const CDNManagementService: typeof CDNManagementService_1.CDNManagementService;
import CDNManagementService_1 = require("./services/CDNManagementService");
export namespace config {
    let provider: string;
    let primaryProvider: string;
    let fallbackProviders: any[];
    namespace assetOptimization {
        let enableCompression: boolean;
        let enableWebP: boolean;
        let enableAVIF: boolean;
        let compressionQuality: number;
        let resizeImages: boolean;
        let maxImageWidth: number;
        let maxImageHeight: number;
        let stripMetadata: boolean;
    }
    let cachePolicies: {
        '\\.(js|css|woff|woff2|ttf|otf)$': {
            public: boolean;
            maxAge: number;
            staleWhileRevalidate: number;
        };
        '\\.(jpg|jpeg|png|gif|webp|avif|svg)$': {
            public: boolean;
            maxAge: number;
            staleWhileRevalidate: number;
        };
        '\\.(pdf|doc|docx|xls|xlsx)$': {
            public: boolean;
            maxAge: number;
            mustRevalidate: boolean;
        };
        '^/api/': {
            public: boolean;
            maxAge: number;
            mustRevalidate: boolean;
        };
    };
    namespace purgeStrategies {
        let automatic: boolean;
        namespace scheduledPurge {
            let enabled: boolean;
            let schedule: string;
        }
        let apiTriggered: boolean;
    }
}
