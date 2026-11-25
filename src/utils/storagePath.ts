export function storagePathForCase(caseId: string, filename: string) {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `cases/${caseId}/${safeFilename}`;
}

export function storagePathForEvidence(investigationId: string, filename: string, isForensic = false) {
  const prefix = isForensic ? 'forensic' : 'evidence';
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${investigationId}/${prefix}/${Date.now()}_${safeFilename}`;
}

// Backwards-compatible alias
export const storagePathForInvestigation = storagePathForCase;

export default {
  storagePathForCase,
  storagePathForEvidence,
  storagePathForInvestigation
};
