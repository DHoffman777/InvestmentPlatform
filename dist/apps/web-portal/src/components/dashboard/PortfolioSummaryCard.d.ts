interface PortfolioSummaryCardProps {
    title: string;
    value: string;
    change: number;
    changePercent: number;
    subtitle?: string;
    loading?: boolean;
}
export default function PortfolioSummaryCard({ title, value, change, changePercent, subtitle, loading, }: PortfolioSummaryCardProps): import("react").JSX.Element;
export {};
