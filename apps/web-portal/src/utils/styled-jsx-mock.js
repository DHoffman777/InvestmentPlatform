// Mock for styled-jsx to prevent SSR/SSG errors
// This mock prevents useContext errors during static generation

// Mock the StyleRegistry component - no React hooks
function StyleRegistry({ children }) {
  return children;
}

// Mock the style component
function Style() {
  return null;
}

// Mock jsx function
function jsx() {
  return '';
}

// Mock css function 
function css() {
  return '';
}

// Mock css.global function
css.global = function() {
  return '';
};

// Mock css.resolve function
css.resolve = function() {
  return { className: '', styles: null };
};

// Mock the flush function
function flush() {
  return [];
}

// Mock the server export
const server = {
  StyleRegistry,
  flush,
};

// Export all the mocked components and functions
module.exports = jsx;
module.exports.default = jsx;
module.exports.jsx = jsx;
module.exports.css = css;
module.exports.Style = Style;
module.exports.flush = flush;
module.exports.StyleRegistry = StyleRegistry;
module.exports.server = server;