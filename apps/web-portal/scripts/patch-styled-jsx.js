#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find styled-jsx in node_modules
const styledJsxPaths = [
  path.join(__dirname, '..', '..', '..', 'node_modules', 'styled-jsx', 'dist', 'index', 'index.js'),
  path.join(__dirname, '..', 'node_modules', 'styled-jsx', 'dist', 'index', 'index.js'),
  path.join(__dirname, '..', '..', '..', 'node_modules', 'next', 'dist', 'compiled', 'styled-jsx', 'index.js'),
];

let patched = false;

for (const styledJsxPath of styledJsxPaths) {
  if (fs.existsSync(styledJsxPath)) {
    console.log(`Found styled-jsx at: ${styledJsxPath}`);
    
    let content = fs.readFileSync(styledJsxPath, 'utf8');
    let modified = false;
    
    // Find and replace the StyleRegistry function to check for React availability
    if (content.includes('function StyleRegistry')) {
      const styleRegistryRegex = /function StyleRegistry\(([^)]+)\)\s*{/g;
      content = content.replace(styleRegistryRegex, (match, params) => {
        return `function StyleRegistry(${params}) {
  // Patch: Return children if React context is not available (SSG)
  if (typeof _react === 'undefined' || !_react.useContext) {
    return ${params}.children;
  }`;
      });
      modified = true;
    }
    
    // Also handle arrow function variant
    if (content.includes('const StyleRegistry') || content.includes('var StyleRegistry')) {
      const arrowRegex = /(const|var|let)\s+StyleRegistry\s*=\s*\(([^)]+)\)\s*=>\s*{/g;
      content = content.replace(arrowRegex, (match, decl, params) => {
        return `${decl} StyleRegistry = (${params}) => {
  // Patch: Return children if React context is not available (SSG)
  if (typeof _react === 'undefined' || !_react.useContext) {
    return ${params}.children;
  }`;
      });
      modified = true;
    }
    
    // Replace direct useContext calls with safe version
    if (content.includes('useContext(')) {
      content = content.replace(
        /(\w+)\.useContext\(/g,
        (match, obj) => {
          return `(${obj} && ${obj}.useContext ? ${obj}.useContext : () => null)(`;
        }
      );
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(styledJsxPath, content);
      console.log('✓ Patched styled-jsx for SSG compatibility');
      patched = true;
    }
  }
}

if (!patched) {
  console.log('styled-jsx not found or no changes needed');
}