import React from 'react';

interface InvestigationStatusTabProps {
  status: string | null;
  setStatus: (status: string | null) => void;
  isGameMaster: boolean;
}

export default function InvestigationStatusTab({
  status,
  setStatus,
  isGameMaster,
}: InvestigationStatusTabProps) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 12 }}>
          📊 Status da Investigação
        </label>

        {isGameMaster ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setStatus(status === 'verified' ? null : 'verified')}
              style={{
                flex: 1,
                minWidth: 120,
                padding: '12px 16px',
                background: status === 'verified' ? '#27ae60' : '#222',
                color: status === 'verified' ? '#fff' : '#ddd',
                border: '1px solid ' + (status === 'verified' ? '#27ae60' : '#333'),
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (status !== 'verified') {
                  e.currentTarget.style.borderColor = '#27ae60';
                }
              }}
              onMouseLeave={(e) => {
                if (status !== 'verified') {
                  e.currentTarget.style.borderColor = '#333';
                }
              }}
            >
              ✅ Confirmado
            </button>
            <button
              type="button"
              onClick={() => setStatus(status === 'theory' ? null : 'theory')}
              style={{
                flex: 1,
                minWidth: 120,
                padding: '12px 16px',
                background: status === 'theory' ? '#f1c40f' : '#222',
                color: status === 'theory' ? '#222' : '#ddd',
                border: '1px solid ' + (status === 'theory' ? '#f1c40f' : '#333'),
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (status !== 'theory') {
                  e.currentTarget.style.borderColor = '#f1c40f';
                }
              }}
              onMouseLeave={(e) => {
                if (status !== 'theory') {
                  e.currentTarget.style.borderColor = '#333';
                }
              }}
            >
              ❓ Teoria
            </button>
            <button
              type="button"
              onClick={() => setStatus(status === 'false' ? null : 'false')}
              style={{
                flex: 1,
                minWidth: 120,
                padding: '12px 16px',
                background: status === 'false' ? '#e74c3c' : '#222',
                color: status === 'false' ? '#fff' : '#ddd',
                border: '1px solid ' + (status === 'false' ? '#e74c3c' : '#333'),
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (status !== 'false') {
                  e.currentTarget.style.borderColor = '#e74c3c';
                }
              }}
              onMouseLeave={(e) => {
                if (status !== 'false') {
                  e.currentTarget.style.borderColor = '#333';
                }
              }}
            >
              ❌ Falso
            </button>
            <button
              type="button"
              onClick={() => setStatus(null)}
              disabled={status === null}
              style={{
                flex: 1,
                minWidth: 120,
                padding: '12px 16px',
                background: status === null ? '#333' : '#222',
                color: '#ddd',
                border: '1px solid #333',
                borderRadius: 6,
                cursor: status === null ? 'default' : 'pointer',
                opacity: status === null ? 0.5 : 1,
              }}
            >
              ○ Limpar
            </button>
          </div>
        ) : (
          <div style={{ padding: '16px', background: '#0a0a0a', borderRadius: 6 }}>
            {status ? (
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '10px 16px',
                    borderRadius: 6,
                    background:
                      status === 'verified' ? '#27ae60' : status === 'theory' ? '#f1c40f' : '#e74c3c',
                    color: status === 'theory' ? '#222' : '#fff',
                    fontWeight: 'bold',
                  }}
                >
                  {status === 'verified'
                    ? '✅ Confirmado'
                    : status === 'theory'
                      ? '❓ Teoria'
                      : '❌ Falso'}
                </span>
              </div>
            ) : (
              <span style={{ color: '#999' }}>Sem status definido</span>
            )}
          </div>
        )}
      </div>

      {/* Status Legend */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #333' }}>
        <strong style={{ display: 'block', marginBottom: 12 }}>📋 Legenda de Status</strong>
        <div style={{ fontSize: 12, color: '#aaa' }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✅ Confirmado</span> - Informação
            verificada e corrreta
          </div>
          <div style={{ marginBottom: 10 }}>
            <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>❓ Teoria</span> - Hipótese a ser
            investigada
          </div>
          <div>
            <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>❌ Falso</span> - Informação
            comprovadamente falsa
          </div>
        </div>
      </div>
    </div>
  );
}
