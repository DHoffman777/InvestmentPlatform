interface WelcomeCardProps {
    user: {
        name?: string;
        email?: string;
    } | null;
}
export default function WelcomeCard({ user }: WelcomeCardProps): import("react").JSX.Element;
export {};
