export function storagePathForCase(caseId: string, filename: string) {
  return `cases/${caseId}/${filename}`;
}

// Backwards-compatible alias
export const storagePathForInvestigation = storagePathForCase;
