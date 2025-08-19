"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewport = exports.metadata = exports.revalidate = exports.dynamic = void 0;
exports.default = RootLayout;
const google_1 = require("next/font/google");
const providers_1 = require("./providers");
const ThemeProvider_1 = require("@/components/providers/ThemeProvider");
require("./globals.css");
const inter = (0, google_1.Inter)({ subsets: ['latin'] });
exports.dynamic = 'force-dynamic';
exports.revalidate = 0;
exports.metadata = {
    title: 'Investment Platform - Client Portal',
    description: 'White-labeled investment management platform for financial advisors and institutions',
    keywords: 'investment management, portfolio management, financial advisory, wealth management',
    authors: [{ name: 'Investment Platform' }],
    robots: 'noindex, nofollow', // Private client portal
};
exports.viewport = 'width=device-width, initial-scale=1';
function RootLayout({ children, }) {
    return (<html lang="en">
      <body className={inter.className}>
        <ThemeProvider_1.ThemeProvider>
          <providers_1.Providers>
            {children}
          </providers_1.Providers>
        </ThemeProvider_1.ThemeProvider>
      </body>
    </html>);
}
