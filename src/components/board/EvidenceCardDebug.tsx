/**
 * DEBUG: EvidenceCard Glitch Effects Test
 * Use this para testar se os efeitos estão funcionando
 */

import React, { useState } from 'react'
import EvidenceCard from './EvidenceCard'

export function EvidenceCardDebug() {
  const [isGameMaster, setIsGameMaster] = useState(false)
  const [playerView, setPlayerView] = useState(true)
  const [locked, setLocked] = useState(false)
  const [cardType, setCardType] = useState<'normal' | 'glitch' | 'encrypted' | 'mega-clue'>('normal')

  console.log('=== DEBUG EVIDENCE CARD ===')
  console.log('isGameMaster:', isGameMaster)
  console.log('playerView:', playerView)
  console.log('locked:', locked)
  console.log('cardType:', cardType)

  return (
    <div style={{ padding: 20, backgroundColor: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>🧪 Evidence Card Debug</h1>

      <div style={{ marginBottom: 30, padding: 20, border: '1px solid #00f3ff' }}>
        <h2>Controles</h2>

        <label style={{ display: 'block', marginBottom: 10 }}>
          <input 
            type="checkbox" 
            checked={isGameMaster} 
            onChange={(e) => {
              setIsGameMaster(e.target.checked)
              console.log('Toggled isGameMaster:', e.target.checked)
            }} 
          />
          {' '}isGameMaster (Mestre de Jogo)
        </label>

        <label style={{ display: 'block', marginBottom: 10 }}>
          <input 
            type="checkbox" 
            checked={playerView} 
            onChange={(e) => {
              setPlayerView(e.target.checked)
              console.log('Toggled playerView:', e.target.checked)
            }} 
          />
          {' '}playerView (Modo Jogador)
        </label>

        <label style={{ display: 'block', marginBottom: 10 }}>
          <input 
            type="checkbox" 
            checked={locked} 
            onChange={(e) => {
              setLocked(e.target.checked)
              console.log('Toggled locked:', e.target.checked)
            }} 
          />
          {' '}locked (Conteúdo Bloqueado)
        </label>

        <div style={{ marginTop: 15 }}>
          <label>cardType:</label>
          <select 
            value={cardType}
            onChange={(e) => {
              setCardType(e.target.value as any)
              console.log('Changed cardType:', e.target.value)
            }}
            style={{ marginLeft: 10, padding: 5, color: '#000' }}
          >
            <option value="normal">normal</option>
            <option value="glitch">glitch (Enigma Visual)</option>
            <option value="encrypted">encrypted (Encriptado)</option>
            <option value="mega-clue">mega-clue (Mega Pista)</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 30 }}>
        <h2>Estado Atual:</h2>
        <pre style={{ backgroundColor: '#0a0a0a', padding: 15, borderLeft: '3px solid #ff003c' }}>
{`isGameMaster: ${isGameMaster}
playerView: ${playerView}
locked: ${locked}
cardType: ${cardType}

Lógica Renderização:
- isPlayerViewingLockedContent: ${playerView && locked && !isGameMaster}
- isPlayerViewingEncrypted: ${playerView && cardType === 'encrypted' && !isGameMaster}
- isPlayerViewingGlitch: ${playerView && cardType === 'glitch' && !isGameMaster}
- renderGMView: ${isGameMaster || !playerView}

Esperado: ${
  playerView && locked && !isGameMaster ? '🔴 LOCKED VIEW (ACESSO NEGADO)' :
  (playerView && cardType === 'encrypted' && !isGameMaster) ? '🟠 GLITCH VIEW (ENCRYPTED)' :
  (playerView && cardType === 'glitch' && !isGameMaster) ? '🟠 GLITCH VIEW (GLITCH)' :
  (isGameMaster || !playerView) ? '🟢 GM VIEW (NORMAL)' :
  '❓ FALLBACK VIEW'
}`}
        </pre>
      </div>

      <div style={{ marginBottom: 30 }}>
        <h2>Teste 1: Normal Card</h2>
        <p style={{ opacity: 0.7 }}>Deve mostrar imagem normal em ambos os casos</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <h3>GM View</h3>
            <div style={{ width: 300, height: 200, border: '2px solid #00f3ff' }}>
              <EvidenceCard
                id="test-1"
                image="https://images.unsplash.com/photo-1578974160322-cd2207b7ede0?w=400&h=300&fit=crop"
                title="Foto Normal"
                cardType="normal"
                locked={false}
                isGameMaster={true}
                playerView={true}
              />
            </div>
          </div>
          <div>
            <h3>Player View</h3>
            <div style={{ width: 300, height: 200, border: '2px solid #ffff00' }}>
              <EvidenceCard
                id="test-1b"
                image="https://images.unsplash.com/photo-1578974160322-cd2207b7ede0?w=400&h=300&fit=crop"
                title="Foto Normal"
                cardType="normal"
                locked={false}
                isGameMaster={false}
                playerView={true}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 30 }}>
        <h2>Teste 2: Locked Card (ACESSO NEGADO)</h2>
        <p style={{ opacity: 0.7 }}>GM vê tudo, Player vê "ACESSO NEGADO"</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <h3>GM View</h3>
            <div style={{ width: 300, height: 200, border: '2px solid #00f3ff' }}>
              <EvidenceCard
                id="test-2"
                image="https://images.unsplash.com/photo-1578974160322-cd2207b7ede0?w=400&h=300&fit=crop"
                title="Documento Secreto"
                cardType="normal"
                locked={true}
                isGameMaster={true}
                playerView={true}
              />
            </div>
          </div>
          <div>
            <h3>Player View (Bloqueado)</h3>
            <div style={{ width: 300, height: 200, border: '2px solid #ff003c' }}>
              <EvidenceCard
                id="test-2b"
                image="https://images.unsplash.com/photo-1578974160322-cd2207b7ede0?w=400&h=300&fit=crop"
                title="Documento Secreto"
                cardType="normal"
                locked={true}
                isGameMaster={false}
                playerView={true}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 30 }}>
        <h2>Teste 3: Glitch Card (Enigma Visual)</h2>
        <p style={{ opacity: 0.7 }}>GM vê claro, Player vê glitches</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <h3>GM View</h3>
            <div style={{ width: 300, height: 200, border: '2px solid #00f3ff' }}>
              <EvidenceCard
                id="test-3"
                image="https://images.unsplash.com/photo-1578974160322-cd2207b7ede0?w=400&h=300&fit=crop"
                title="Enigma Visual"
                cardType="glitch"
                locked={false}
                isGameMaster={true}
                playerView={true}
              />
            </div>
          </div>
          <div>
            <h3>Player View (Glitch)</h3>
            <div style={{ width: 300, height: 200, border: '2px solid #ff00ff' }}>
              <EvidenceCard
                id="test-3b"
                image="https://images.unsplash.com/photo-1578974160322-cd2207b7ede0?w=400&h=300&fit=crop"
                title="Enigma Visual"
                cardType="glitch"
                locked={false}
                isGameMaster={false}
                playerView={true}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 30 }}>
        <h2>Teste 4: Encrypted Card (Encriptado)</h2>
        <p style={{ opacity: 0.7 }}>GM vê tudo, Player vê dados corrompidos</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <h3>GM View</h3>
            <div style={{ width: 300, height: 200, border: '2px solid #00f3ff' }}>
              <EvidenceCard
                id="test-4"
                image="https://images.unsplash.com/photo-1578974160322-cd2207b7ede0?w=400&h=300&fit=crop"
                title="Arquivo Encriptado"
                cardType="encrypted"
                locked={false}
                isGameMaster={true}
                playerView={true}
              />
            </div>
          </div>
          <div>
            <h3>Player View (Corrompido)</h3>
            <div style={{ width: 300, height: 200, border: '2px solid #ff00ff' }}>
              <EvidenceCard
                id="test-4b"
                image="https://images.unsplash.com/photo-1578974160322-cd2207b7ede0?w=400&h=300&fit=crop"
                title="Arquivo Encriptado"
                cardType="encrypted"
                locked={false}
                isGameMaster={false}
                playerView={true}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 30, padding: 20, backgroundColor: '#0a0a0a', border: '1px solid #ffd700' }}>
        <h2>🎮 Teste Interativo:</h2>
        <p>Use os controles acima para alternar entre GM e Player</p>
        <div style={{ width: 350, height: 250, margin: '20px auto', border: '3px solid #ffd700' }}>
          <EvidenceCard
            id="interactive-test"
            image="https://images.unsplash.com/photo-1578974160322-cd2207b7ede0?w=400&h=300&fit=crop"
            title="Teste Interativo"
            cardType={cardType}
            locked={locked}
            isGameMaster={isGameMaster}
            playerView={playerView}
          />
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, opacity: 0.7 }}>
          {isGameMaster ? '✅ Você está como MESTRE DE JOGO (vê tudo)' : '👁️ Você está como JOGADOR'}
          {playerView ? ' | 🎮 Modo Jogo Ativo' : ' | 🛠️ Modo Edição'}
          {locked ? ' | 🔐 Conteúdo Bloqueado' : ' | 🔓 Desbloqueado'}
        </p>
      </div>

      <div style={{ marginTop: 40, padding: 20, backgroundColor: '#1a0a0a', border: '1px solid #ff003c' }}>
        <h2>📝 Como Usar:</h2>
        <ol>
          <li>Abra o console (F12 - Dev Tools)</li>
          <li>Use os controles acima para testar diferentes combinações</li>
          <li>Verifique o console para logs de debug</li>
          <li>Procure por anomalias visuais (efeitos não aparecem)</li>
          <li>Verifique se o CSS está sendo aplicado (inspecione elemento)</li>
        </ol>
      </div>

      <div style={{ marginTop: 20, padding: 20, backgroundColor: '#0a1a0a', border: '1px solid #00ff41' }}>
        <h2>✅ Checklist Visual:</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>☐ Locked View mostra "ACESSO NEGADO" com 🔐</li>
          <li>☐ Locked View tem grid vermelha pulsante</li>
          <li>☐ Locked View mostra código RND-XXXXX</li>
          <li>☐ Glitch View mostra "DATA CØRRÜPT LOCKED"</li>
          <li>☐ Glitch View tem 3 camadas de cores (vermelho, cyan, amarelo)</li>
          <li>☐ Glitch View tem scanlines horizontais</li>
          <li>☐ GM View mostra imagem normal sempre</li>
          <li>☐ Player View mostra restrições apropriadas</li>
          <li>☐ Animações funcionam suavemente</li>
          <li>☐ Sem erros no console</li>
        </ul>
      </div>
    </div>
  )
}

export default EvidenceCardDebug
