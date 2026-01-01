import './polyfills/process-shim';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/nexus.css';
import './styles/animations.css';
import { setupGlobalMouseListeners } from './hooks/useGlobalMouseEvents';
import { validatePolyfills, logValidationResults } from './utils/validatePolyfills';

// ✅ Valida polyfills na inicialização
const polyfillValidation = validatePolyfills();
if (!polyfillValidation.success) {
  logValidationResults(polyfillValidation);
  // ⚠️ Continue anyway, but log errors
  if (typeof window !== 'undefined') {
    console.error('⚠️ Some polyfills failed validation - app may not work correctly');
  }
}

// ✅ Inicializa listeners globais UMA VEZ
setupGlobalMouseListeners();

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);
