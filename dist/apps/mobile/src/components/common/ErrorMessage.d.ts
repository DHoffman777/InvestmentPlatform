import React from 'react';
interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
    icon?: string;
    style?: any;
}
declare const ErrorMessage: React.FC<ErrorMessageProps>;
export default ErrorMessage;
