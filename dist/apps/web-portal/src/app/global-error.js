"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GlobalError;
const react_1 = require("react");
// Static export mode - removed dynamic directives
// export const dynamic = 'force-dynamic';
// export const revalidate = 0;
function GlobalError({ error, reset, }) {
    (0, react_1.useEffect)(() => {
        console.error('Global error:', error);
    }, [error]);
    return (<html>
      <body style={{
            margin: 0,
            padding: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            backgroundColor: '#fafafa',
            color: '#333',
        }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            500
          </h1>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Server Error
          </h2>
          <p style={{ marginBottom: '2rem', color: '#666' }}>
            A server-side error occurred. Please try refreshing the page.
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
        </div>
      </body>
    </html>);
}
