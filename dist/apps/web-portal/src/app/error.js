"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.revalidate = exports.dynamic = void 0;
exports.default = Error;
const react_1 = require("react");
exports.dynamic = 'force-dynamic';
exports.revalidate = 0;
function Error({ error, reset, }) {
    (0, react_1.useEffect)(() => {
        console.error('Application error:', error);
    }, [error]);
    return (<div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundColor: '#fafafa',
            color: '#333',
        }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Oops!
      </h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        Something went wrong
      </h2>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        We're sorry, but something unexpected happened. Please try again.
      </p>
      <button onClick={reset} style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
        }}>
        Try Again
      </button>
    </div>);
}
