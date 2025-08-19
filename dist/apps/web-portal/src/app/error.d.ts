export declare const dynamic = "force-dynamic";
export declare const revalidate = 0;
export default function Error({ error, reset, }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}): import("react").JSX.Element;
