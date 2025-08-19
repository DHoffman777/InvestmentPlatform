"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.darkTheme = exports.theme = void 0;
const styles_1 = require("@mui/material/styles");
// Investment Platform Brand Theme
exports.theme = (0, styles_1.createTheme)({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
            dark: '#115293',
            light: '#42a5f5',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#424242',
            dark: '#1c1c1c',
            light: '#6d6d6d',
            contrastText: '#ffffff',
        },
        error: {
            main: '#d32f2f',
            dark: '#c62828',
            light: '#ef5350',
        },
        warning: {
            main: '#ed6c02',
            dark: '#e65100',
            light: '#ff9800',
        },
        info: {
            main: '#0288d1',
            dark: '#01579b',
            light: '#03a9f4',
        },
        success: {
            main: '#2e7d32',
            dark: '#1b5e20',
            light: '#4caf50',
        },
        grey: {
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#eeeeee',
            300: '#e0e0e0',
            400: '#bdbdbd',
            500: '#9e9e9e',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121',
        },
        background: {
            default: '#fafafa',
            paper: '#ffffff',
        },
        text: {
            primary: '#212121',
            secondary: '#757575',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
            lineHeight: 1.2,
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600,
            lineHeight: 1.3,
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.5,
        },
        h6: {
            fontSize: '1.125rem',
            fontWeight: 600,
            lineHeight: 1.5,
        },
        subtitle1: {
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.5,
        },
        subtitle2: {
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.57,
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.5,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.43,
        },
        caption: {
            fontSize: '0.75rem',
            lineHeight: 1.66,
        },
        overline: {
            fontSize: '0.75rem',
            fontWeight: 500,
            lineHeight: 2.66,
            textTransform: 'uppercase',
        },
    },
    shape: {
        borderRadius: 8,
    },
    spacing: 8,
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 8,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
                elevation1: {
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                },
                elevation2: {
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                    },
                },
            },
        },
    },
});
// Dark theme variant
exports.darkTheme = (0, styles_1.createTheme)({
    ...exports.theme,
    palette: {
        ...exports.theme.palette,
        mode: 'dark',
        primary: {
            main: '#42a5f5',
            dark: '#1976d2',
            light: '#90caf9',
            contrastText: '#000000',
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
        text: {
            primary: '#ffffff',
            secondary: '#b0b0b0',
        },
    },
});
