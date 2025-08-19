import type { Metadata } from 'next';
import './globals.css';
export declare const dynamic = "force-dynamic";
export declare const revalidate = 0;
export declare const metadata: Metadata;
export declare const viewport = "width=device-width, initial-scale=1";
export default function RootLayout({ children, }: {
    children: React.ReactNode;
}): import("react").JSX.Element;
