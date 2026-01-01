#!/usr/bin/env node

/**
 * ✅ DEPENDENCY CONFLICT DETECTION SCRIPT
 * 
 * Scans the src/ directory to detect:
 * - Multiple React imports
 * - Multiple AudioContext creations
 * - Duplicate @keyframes definitions
 * - CSS variable conflicts
 * - Multiple Supabase instances
 * 
 * Usage: node scripts/check-conflicts.js
 */

const fs = require('fs');
const path = require('path');

const conflicts = {
  'React imports': [],
  'AudioContext creations': [],
  'Supabase instances': [],
  'Keyframe duplicates': {},
  'CSS variable conflicts': {},
  'EventEmitter instances': [],
};

const errors = [];
const warnings = [];

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx', '.css']) {
  let files = [];
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and build directories
      if (item === 'node_modules' || item === '.next' || item === 'dist' || item === 'build') {
        continue;
      }
      files = files.concat(getAllFiles(fullPath, extensions));
    } else {
      const ext = path.extname(fullPath);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Analyze TypeScript/JavaScript files
 */
function analyzeSourceFiles(files) {
  const reactImports = {};
  const audioContexts = {};
  const supabaseInstances = {};
  const eventEmitterInstances = {};

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js') && !file.endsWith('.jsx')) {
      continue;
    }

    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);

      // Check for React imports
      const reactMatches = content.match(/import\s+.*from\s+['"]react['"]/g) || [];
      if (reactMatches.length > 0) {
        if (!reactImports[relativePath]) {
          reactImports[relativePath] = 0;
        }
        reactImports[relativePath] += reactMatches.length;
      }

      // Check for AudioContext creations (but allow in AudioManager and validatePolyfills)
      const audioMatches = content.match(/new\s+(?:Audio|webkit)Context|new\s+webkitAudioContext/g) || [];
      if (audioMatches.length > 0) {
        // ✅ Allow AudioManager.ts and validatePolyfills.ts to create AudioContext
        if (!relativePath.includes('AudioManager.ts') && !relativePath.includes('validatePolyfills.ts')) {
          audioContexts[relativePath] = audioMatches.length;
        }
      }

      // Check for Supabase instances
      const supabaseMatches = content.match(/createClient\s*\(|new\s+SupabaseClient/g) || [];
      if (supabaseMatches.length > 0) {
        supabaseInstances[relativePath] = supabaseMatches.length;
      }

      // Check for EventEmitter
      const emitterMatches = content.match(/new\s+EventEmitter|EventEmitter\.prototype/g) || [];
      if (emitterMatches.length > 0) {
        eventEmitterInstances[relativePath] = emitterMatches.length;
      }
    } catch (err) {
      warnings.push(`Failed to read ${file}: ${err.message}`);
    }
  }

  return {
    reactImports,
    audioContexts,
    supabaseInstances,
    eventEmitterInstances,
  };
}

/**
 * Analyze CSS files for duplicates
 */
function analyzeCssFiles(files) {
  const keyframes = {};

  for (const file of files) {
    if (!file.endsWith('.css')) {
      continue;
    }

    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);

      const matches = content.match(/@keyframes\s+([a-zA-Z0-9_-]+)/g) || [];
      matches.forEach(match => {
        const name = match.replace('@keyframes ', '');
        
        if (!keyframes[name]) {
          keyframes[name] = [];
        }
        keyframes[name].push(relativePath);
      });
    } catch (err) {
      warnings.push(`Failed to read ${file}: ${err.message}`);
    }
  }

  return keyframes;
}

/**
 * Analyze CSS for variable conflicts
 */
function analyzeCssVariables(files) {
  const variables = {};

  for (const file of files) {
    if (!file.endsWith('.css')) {
      continue;
    }

    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);

      const matches = content.match(/--[a-zA-Z0-9_-]+/g) || [];
      matches.forEach(varName => {
        if (!variables[varName]) {
          variables[varName] = [];
        }
        if (!variables[varName].includes(relativePath)) {
          variables[varName].push(relativePath);
        }
      });
    } catch (err) {
      // Ignore errors in CSS parsing
    }
  }

  return variables;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

console.log('\n🔍 CHECKING FOR DEPENDENCY CONFLICTS...\n');

const srcDir = path.join(process.cwd(), 'src');

if (!fs.existsSync(srcDir)) {
  console.error('❌ src/ directory not found');
  process.exit(1);
}

const allFiles = getAllFiles(srcDir);
console.log(`📁 Scanning ${allFiles.length} files...\n`);

// Analyze source files
const { reactImports, audioContexts, supabaseInstances, eventEmitterInstances } = analyzeSourceFiles(allFiles);

// Check React imports
let reactWarning = false;
Object.entries(reactImports).forEach(([file, count]) => {
  if (count > 1) {
    errors.push(`⚠️ Multiple React imports in ${file} (${count} imports)`);
    reactWarning = true;
  }
});

// Check AudioContext creations
Object.entries(audioContexts).forEach(([file, count]) => {
  errors.push(`🔴 AudioContext created in ${file} (should use AudioManager singleton - found ${count} creations)`);
});

// Check Supabase instances
Object.entries(supabaseInstances).forEach(([file, count]) => {
  if (count > 1) {
    errors.push(`⚠️ Multiple Supabase instances in ${file} (${count} creations)`);
  }
});

// Check EventEmitter
Object.entries(eventEmitterInstances).forEach(([file, count]) => {
  if (count > 1) {
    warnings.push(`⚠️ Multiple EventEmitter usage in ${file}`);
  }
});

// Analyze CSS files
const keyframes = analyzeCssFiles(allFiles);
const cssVars = analyzeCssVariables(allFiles);

// Report duplicate keyframes
console.log('\n📊 KEYFRAMES DUPLICATES:\n');
const keyframeConflicts = [];
Object.entries(keyframes).forEach(([name, files]) => {
  if (files.length > 1) {
    keyframeConflicts.push(`  @keyframes ${name}: ${files.length} files`);
    files.forEach(f => console.log(`    - ${f}`));
  }
});

if (keyframeConflicts.length === 0) {
  console.log('  ✅ No duplicate keyframes found');
} else {
  console.log(`\n❌ Found ${keyframeConflicts.length} duplicate keyframe definitions\n`);
}

// Report CSS variable conflicts
console.log('\n📊 CSS VARIABLES USED IN MULTIPLE FILES:\n');
let cssVarConflicts = 0;
Object.entries(cssVars).forEach(([varName, files]) => {
  if (files.length > 3) { // More than 3 files is suspicious
    console.log(`  ${varName}: used in ${files.length} files (possibly conflicting)`);
    cssVarConflicts++;
  }
});

if (cssVarConflicts === 0) {
  console.log('  ✅ CSS variables seem well-scoped');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📋 SUMMARY');
console.log('='.repeat(60));
console.log(`Errors found: ${errors.length}`);
console.log(`Warnings found: ${warnings.length}`);
console.log(`Duplicate keyframes: ${Object.values(keyframes).filter(f => f.length > 1).length}`);

if (errors.length > 0) {
  console.log('\n🚨 ERRORS:\n');
  errors.forEach(e => console.log(`  ${e}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️ WARNINGS:\n');
  warnings.forEach(w => console.log(`  ${w}`));
}

// Exit with appropriate code
const hasConflicts = errors.length > 0 || keyframeConflicts.length > 0;
if (hasConflicts) {
  console.log('\n❌ CONFLICTS DETECTED\n');
  process.exit(1);
} else {
  console.log('\n✅ No critical conflicts detected\n');
  process.exit(0);
}
