/**
 * ✅ POLYFILL VALIDATION
 * 
 * Validates that all required polyfills are correctly loaded
 * and warns about missing or conflicting implementations.
 */

export interface PolyfillValidationResult {
  success: boolean;
  checks: Record<string, boolean>;
  warnings: string[];
  errors: string[];
}

export function validatePolyfills(): PolyfillValidationResult {
  const checks: Record<string, boolean> = {};
  const warnings: string[] = [];
  const errors: string[] = [];

  // ============================================================================
  // Check 1: Process object (for Node.js compatibility)
  // ============================================================================
  try {
    checks['process defined'] = typeof (globalThis as any).process !== 'undefined';
    if (!checks['process defined']) {
      warnings.push('process object not found (might be intentional in pure browser)');
    } else {
      checks['process.env works'] = (globalThis as any).process?.env?.NODE_ENV !== undefined;
      if (!checks['process.env works']) {
        errors.push('process.env exists but is not properly initialized');
      }
    }
  } catch (e) {
    errors.push(`Error checking process: ${e}`);
    checks['process defined'] = false;
  }

  // ============================================================================
  // Check 2: AudioContext (critical for audio features)
  // ============================================================================
  try {
    const hasAudioContext = typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
    checks['AudioContext available'] = hasAudioContext;
    
    if (!hasAudioContext) {
      errors.push('AudioContext not available - audio features will fail');
    }

    // Warn if multiple instances might be created
    if (hasAudioContext) {
      const contextCount = countActiveAudioContexts();
      if (contextCount > 1) {
        warnings.push(`⚠️ Multiple AudioContext instances detected (${contextCount})`);
      }
    }
  } catch (e) {
    errors.push(`Error checking AudioContext: ${e}`);
    checks['AudioContext available'] = false;
  }

  // ============================================================================
  // Check 3: React version consistency
  // ============================================================================
  try {
    const reactVersion = (window as any).__REACT_VERSION__ || (globalThis as any).__REACT_VERSION__;
    checks['React single instance'] = reactVersion !== undefined;
    
    if (!checks['React single instance']) {
      warnings.push('Could not detect React version (might indicate multiple instances)');
    }
  } catch (e) {
    warnings.push(`Error checking React: ${e}`);
  }

  // ============================================================================
  // Check 4: Supabase client singleton
  // ============================================================================
  try {
    const supabaseInstances = countGlobalInstances('supabase');
    checks['Supabase singleton'] = supabaseInstances <= 1;
    
    if (supabaseInstances > 1) {
      errors.push(`Multiple Supabase instances found (${supabaseInstances})`);
    }
  } catch (e) {
    warnings.push(`Error checking Supabase: ${e}`);
  }

  // ============================================================================
  // Check 5: EventEmitter prototype integrity
  // ============================================================================
  try {
    const hasEventEmitter = typeof (globalThis as any).EventEmitter !== 'undefined' || 
                           typeof (window as any).EventEmitter !== 'undefined';
    checks['EventEmitter available'] = hasEventEmitter;
    
    if (hasEventEmitter) {
      // Check if prototype has been modified
      const emitterProto = (globalThis as any).EventEmitter?.prototype || (window as any).EventEmitter?.prototype;
      if (emitterProto && emitterProto.__modified) {
        warnings.push('EventEmitter prototype has been modified - potential conflicts');
      }
    }
  } catch (e) {
    warnings.push(`Error checking EventEmitter: ${e}`);
  }

  // ============================================================================
  // Check 6: CSS variable injection
  // ============================================================================
  try {
    const root = document.documentElement;
    const cssVars = getComputedStyle(root).cssText;
    
    if (cssVars.includes('--z-modal-base')) {
      checks['CSS variables loaded'] = true;
    } else {
      warnings.push('CSS variables (--z-modal-base) not found - animations might not work correctly');
      checks['CSS variables loaded'] = false;
    }
  } catch (e) {
    warnings.push(`Error checking CSS variables: ${e}`);
  }

  // ============================================================================
  // Check 7: DOM API availability
  // ============================================================================
  try {
    checks['DOM API available'] = typeof document !== 'undefined' && 
                                  typeof window !== 'undefined' &&
                                  typeof Element !== 'undefined';
    
    if (!checks['DOM API available']) {
      errors.push('DOM API not available - app must run in browser');
    }
  } catch (e) {
    errors.push(`Error checking DOM API: ${e}`);
    checks['DOM API available'] = false;
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  const success = errors.length === 0 && Object.values(checks).filter(v => !v).length === 0;

  const result: PolyfillValidationResult = {
    success,
    checks,
    warnings,
    errors,
  };

  return result;
}

/**
 * Count how many AudioContext instances are currently active
 */
function countActiveAudioContexts(): number {
  if (typeof (window as any).AudioContext === 'undefined') return 0;
  
  // This is a heuristic - we can't directly count instances, but we can check state
  try {
    const ctx = new AudioContext();
    const count = ctx.state === 'running' ? 1 : 0;
    ctx.close();
    return count;
  } catch (e) {
    return 0;
  }
}

/**
 * Count instances of a global object
 */
function countGlobalInstances(name: string): number {
  const keys = Object.keys(globalThis);
  return keys.filter(k => k.toLowerCase().includes(name.toLowerCase())).length;
}

/**
 * Log validation results (use for debugging)
 */
export function logValidationResults(result: PolyfillValidationResult): void {
  console.group('🔍 POLYFILL VALIDATION REPORT');

  // Checks
  console.group('Checks:');
  Object.entries(result.checks).forEach(([name, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}`);
  });
  console.groupEnd();

  // Warnings
  if (result.warnings.length > 0) {
    console.group('⚠️ Warnings:');
    result.warnings.forEach(w => console.warn(w));
    console.groupEnd();
  }

  // Errors
  if (result.errors.length > 0) {
    console.group('🚨 Errors:');
    result.errors.forEach(e => console.error(e));
    console.groupEnd();
  }

  // Summary
  const status = result.success ? '✅ OK' : '❌ FAILED';
  console.log(`\n${status} - ${result.errors.length} errors, ${result.warnings.length} warnings`);

  console.groupEnd();
}

/**
 * Throw if critical checks fail (use in dev/test)
 */
export function validatePolyfillsStrict(): void {
  const result = validatePolyfills();
  
  if (!result.success) {
    logValidationResults(result);
    throw new Error(`Polyfill validation failed: ${result.errors.join(', ')}`);
  }
}
