import type { AppProps } from 'next/app';
import React from 'react';

// Override styled-jsx globally
if (typeof window === 'undefined') {
  const Module = require('module');
  const originalRequire = Module.prototype.require;
  
  Module.prototype.require = function(id: string) {
    if (id === 'styled-jsx' || id.includes('styled-jsx')) {
      return {
        default: () => null,
        Style: () => null,
        css: () => '',
        global: () => '',
        resolve: () => ({ className: '', styles: '' }),
        flush: () => [],
        StyleRegistry: ({ children }: any) => children,
      };
    }
    return originalRequire.apply(this, arguments);
  };
}

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;