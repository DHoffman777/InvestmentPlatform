"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeProvider = ThemeProvider;
const react_1 = __importDefault(require("react"));
const material_1 = require("@mui/material");
const theme_1 = require("../../lib/theme");
function ThemeProvider({ children }) {
    return (<material_1.ThemeProvider theme={theme_1.theme}>
      <material_1.CssBaseline />
      {children}
    </material_1.ThemeProvider>);
}
