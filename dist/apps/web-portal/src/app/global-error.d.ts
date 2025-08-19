export declare const dynamic = "force-dynamic";
export declare const revalidate = 0;
export default function GlobalError({ error, reset, }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}): import("react").JSX.Element;
