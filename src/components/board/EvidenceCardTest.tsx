import React from 'react'
import EvidenceCard from './EvidenceCard'

/**
 * Componente de TESTE - Mostra um card com glitch effect forçado
 * Sem precisa da visão de jogador
 */
export const EvidenceCardTest: React.FC = () => {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(3, 1fr)', 
      gap: 20, 
      padding: 20,
      background: '#0a0a0a'
    }}>
      {/* Card Normal */}
      <div>
        <h3 style={{ color: '#00f3ff', marginBottom: 10 }}>Card Normal</h3>
        <EvidenceCard
          id="test-1"
          image="https://via.placeholder.com/220x150?text=Normal"
          title="Normal Card"
          locked={false}
          cardType="normal"
          isGameMaster={true}
          playerView={false}
          hasUV={false}
          hasHiddenAudio={false}
          hasChat={false}
          hasThermal={false}
          hasStamp={false}
          hasExternalLink={false}
          fileType="image"
          status="normal"
        />
      </div>

      {/* Card Locked */}
      <div>
        <h3 style={{ color: '#00f3ff', marginBottom: 10 }}>🔐 Card Locked (playerView=true)</h3>
        <EvidenceCard
          id="test-2"
          image="https://via.placeholder.com/220x150?text=Locked"
          title="Locked Card"
          locked={true}
          cardType="encrypted"
          isGameMaster={false}
          playerView={true}
          hasUV={false}
          hasHiddenAudio={false}
          hasChat={false}
          hasThermal={false}
          hasStamp={false}
          hasExternalLink={false}
          fileType="image"
          status="normal"
        />
      </div>

      {/* Card Glitch */}
      <div>
        <h3 style={{ color: '#00f3ff', marginBottom: 10 }}>⚡ Card Glitch (playerView=true)</h3>
        <EvidenceCard
          id="test-3"
          image="https://via.placeholder.com/220x150?text=Glitch"
          title="Glitch Card"
          locked={false}
          cardType="glitch"
          isGameMaster={false}
          playerView={true}
          hasUV={false}
          hasHiddenAudio={false}
          hasChat={false}
          hasThermal={false}
          hasStamp={false}
          hasExternalLink={false}
          fileType="image"
          status="normal"
        />
      </div>
    </div>
  )
}

export default EvidenceCardTest
