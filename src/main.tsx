import './polyfills/process-shim';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/nexus.css';
import './styles/animations.css';
import './styles/performance.css';
// Ensure UVEditor styles are always available (avoid relying on dynamic import timing)
import './components/tools/UVEditor.css';
import EventEmitter from 'eventemitter3';
// import { setupGlobalMouseListeners } from './hooks/useGlobalMouseEvents'; // Desabilitado - cursor customizado removido
import { validatePolyfills, logValidationResults } from './utils/validatePolyfills';

// Expose React version for polyfill validation and detect single instance
if (typeof window !== 'undefined') {
  (window as any).__REACT_VERSION__ = (React as any).version || 'unknown';
  // Provide a lightweight EventEmitter polyfill for libraries expecting it
  (window as any).EventEmitter = (EventEmitter as any) || (window as any).EventEmitter;
}

// Render app first, then validate polyfills to ensure styles and globals are applied
const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

// Defer validation to next animation frame so CSS and other imports settle
requestAnimationFrame(() => {
  try {
    const polyfillValidation = validatePolyfills();
    if (!polyfillValidation.success) {
      logValidationResults(polyfillValidation);
      if (typeof window !== 'undefined') {
        console.error('⚠️ Some polyfills failed validation - app may not work correctly');
      }
    }
  } catch (e) {
    console.error('Error during polyfill validation:', e);
  }
});
