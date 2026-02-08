// Prefer refactored modal as the primary CreateClueModal export (keep legacy file intact)
// Use legacy CreateClueModal as the primary export so callers get the normal modal by default
export { default as CreateClueModal } from './CreateClueModal';
export { default as InvestigationCardModal } from './InvestigationCardModal';
export { default as CreateClueModal_Refactored } from './CreateClueModal_Refactored';
export { default as InvestigationCardModal_Refactored } from './InvestigationCardModal_Refactored';
export { default as CodePromptModal } from './CodePromptModal';

// Sistema centralizado: tudo em CreateClueModal
export { default as CreatorHub } from './CreatorHub';

// Barrel export for tabs
export * from './investigationTabs';
