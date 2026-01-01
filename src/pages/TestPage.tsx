import React from 'react'
import EvidenceCardTest from '../components/board/EvidenceCardTest'

export const TestPage: React.FC = () => {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: 40 }}>
      <h1 style={{ color: '#00f3ff', textAlign: 'center', marginBottom: 30 }}>
        🔬 TESTE DE EFFECTS - GLITCH CARDS
      </h1>
      
      <div style={{ marginBottom: 40, padding: 20, background: '#1a1a1a', borderLeft: '3px solid #00f3ff' }}>
        <p style={{ color: '#00f3ff', margin: 0 }}>
          ✅ <strong>Espera por:</strong>
        </p>
        <ul style={{ color: '#ffff00', marginTop: 10 }}>
          <li>Esquerda: Card normal (imagem com filtro)</li>
          <li>Centro: Card LOCKED com 🔐 ACESSO NEGADO (piscando)</li>
          <li>Direita: Card GLITCH com corrupted data (efeito de glitch)</li>
        </ul>
      </div>

      <EvidenceCardTest />
    </div>
  )
}

export default TestPage
