import React from 'react';

export function NotesSidebar() {
  return (
    <aside
      aria-label="Anotações da Investigação"
      style={{
        padding: 'var(--space-3)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-secondary)',
        fontSize: 'var(--font-size-sm)',
      }}
    >
      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
        Bloco de Notas
      </div>
      <div>Nenhuma anotação selecionada.</div>
    </aside>
  );
}

export default NotesSidebar;
