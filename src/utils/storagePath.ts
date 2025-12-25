export function storagePathForInvestigation(investigationId: string, filename: string) {
  return `investigations/${investigationId}/${filename}`;
}
