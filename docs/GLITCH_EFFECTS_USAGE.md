// Example Usage of Enhanced EvidenceCard with Glitch Effects

import EvidenceCard from './EvidenceCard';
import { useAuth } from '@supabase/auth-helpers-react';
import { useProfile } from '../hooks/useProfile'; // Assumed hook for user profile

/**
 * Investigation Board with Player/GM View Separation
 * Demonstrates how to properly integrate the new glitch effects
 */
export function InvestigationBoardExample() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);

  // Determine if current user is Game Master
  const isGameMaster = profile?.clearance_level === 'ÔMEGA';

  // Determine if we're in player view mode
  const isPlayerView = true; // Set based on your app state

  // Example investigation cards
  const cards = [
    {
      id: 'card-001',
      title: 'Foto da Cena',
      image: '/images/crime-scene.jpg',
      cardType: 'normal' as const,
      locked: false,
      isUV: false,
      hasUV: false,
    },
    {
      id: 'card-002',
      title: 'Documento Confidencial',
      image: '/images/secret-doc.jpg',
      cardType: 'encrypted' as const,
      locked: true,
      isUV: false,
      hasUV: false,
    },
    {
      id: 'card-003',
      title: 'Enigma Visual',
      image: '/images/puzzle.jpg',
      cardType: 'glitch' as const,
      locked: false,
      isUV: false,
      hasUV: false,
    },
    {
      id: 'card-004',
      title: 'Imagem Ultravioleta',
      image: '/images/base.jpg',
      hiddenSrc: '/images/uv-hidden.jpg',
      cardType: 'normal' as const,
      locked: false,
      isUV: true,
      hasUV: true,
    },
    {
      id: 'card-005',
      title: 'Mega Pista',
      image: '/images/mega-clue.jpg',
      cardType: 'mega-clue' as const,
      locked: false,
      isUV: false,
      hasUV: false,
    },
  ];

  return (
    <div className="board-container">
      <h2>Investigação - {isGameMaster ? '🔐 Mestre Jogo' : '👁️ Jogador'}</h2>

      <div className="cards-grid">
        {cards.map((card) => (
          <EvidenceCard
            key={card.id}
            // Core properties
            id={card.id}
            title={card.title}
            image={card.image}
            hiddenSrc={card.hiddenSrc}
            isUV={card.isUV}
            
            // Content type
            fileType="image"
            cardType={card.cardType}
            
            // Restrictions
            locked={card.locked}
            hasUV={card.hasUV}
            hasHiddenAudio={false}
            
            // View mode (IMPORTANT!)
            isGameMaster={isGameMaster}
            playerView={isPlayerView}
            
            // Handlers
            onOpen={() => console.log(`Opening card: ${card.id}`)}
            onToggleStatus={(status) => console.log(`Status changed to: ${status}`)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * VISUAL REFERENCE - What Players See vs GMs
 * 
 * ==========================================
 * NORMAL CARD (cardType="normal")
 * ==========================================
 * 
 * GM View (isGameMaster=true):
 * ┌──────────────────┐
 * │ [Normal Image]   │ ✅ Can see image
 * │ with scan lines  │ ✅ Clear and visible
 * └──────────────────┘
 * 
 * Player View (isGameMaster=false):
 * ┌──────────────────┐
 * │ [Normal Image]   │ ✅ Can see image
 * │ with scan lines  │ ✅ Normal access
 * └──────────────────┘
 * 
 * ==========================================
 * LOCKED CARD (locked=true, isGameMaster=false)
 * ==========================================
 * 
 * GM View (isGameMaster=true):
 * ┌──────────────────┐
 * │ [Secret Image]   │ ✅ Can see everything
 * │ Unlocked         │ ✅ Full access
 * └──────────────────┘
 * 
 * Player View (isGameMaster=false):
 * ┌──────────────────┐
 * │ 🔐               │ ❌ Locked
 * │ ACESSO NEGADO    │ ❌ Access Denied
 * │ RND-A7F2B1C9    │ ✨ Red grid pulsing
 * └──────────────────┘
 * Animation: Lock icon pulses every 2 seconds
 * 
 * ==========================================
 * GLITCH CARD (cardType="glitch", player view)
 * ==========================================
 * 
 * GM View (isGameMaster=true):
 * ┌──────────────────┐
 * │ [Puzzle Image]   │ ✅ Can see clearly
 * │ Clear details    │ ✅ Full visibility
 * └──────────────────┘
 * 
 * Player View (isGameMaster=false):
 * ┌──────────────────┐ ← RED glitch layer
 * │▓░▓ DATA         │ ← CYAN glitch layer  
 * │CØRRÜPT          │ ← YELLOW glitch layer
 * │░▓░ LOCKED       │ ← Text corruptions
 * │════════════════│ ← Scanlines drifting
 * └──────────────────┘
 * 
 * Animations:
 * - Red layer shifts left/right 0.3s
 * - Cyan layer shifts right/left 0.25s (reverse)
 * - Yellow layer shifts left/right 0.35s
 * - Scanlines drift downward continuously
 * - Text glitches with character displacement
 * - Background hue rotates subtly
 * 
 * ==========================================
 * ENCRYPTED CARD (cardType="encrypted", player view)
 * ==========================================
 * 
 * GM View (isGameMaster=true):
 * ┌──────────────────┐
 * │ [Encrypted Doc]  │ ✅ Can read content
 * │ Full access      │ ✅ See password-protected
 * └──────────────────┘
 * 
 * Player View (isGameMaster=false):
 * ┌──────────────────┐
 * │▓░▓ DATA         │ ← Same as GLITCH
 * │CØRRÜPT          │ ← Heavy data corruption
 * │░▓░ LOCKED       │ ← Visual obfuscation
 * │════════════════│ ← CRT scanlines effect
 * └──────────────────┘
 * 
 * Color Scheme:
 * - Red (#ff003c): Primary glitch layer
 * - Cyan (#00f3ff): Secondary glitch, text shadow
 * - Yellow (#ffff00): Tertiary layer, encryption code
 * - Background: Dark gradient rotating hue
 * 
 * ==========================================
 * MEGA-CLUE CARD (cardType="mega-clue")
 * ==========================================
 * 
 * GM View: Shows normally (no effect override in this implementation)
 * 
 * Player View: 
 * If there's a separate restriction for mega-clues, implement:
 * - Similar to GLITCH/ENCRYPTED effects
 * - Or custom golden glitch effect (#ffd700)
 * - Indicates special importance while still showing content
 * 
 * ==========================================
 * UV LAYER CARD (hasUV=true, isUV=true)
 * ==========================================
 * 
 * GM View:
 * ┌──────────────────┐
 * │ [UV Hidden Layer]│ ✅ Toggle between base and UV
 * │ Use MysteryImage │ ✅ See both layers
 * └──────────────────┘
 * 
 * Player View:
 * Same as normal - MysteryImage handles the dual-layer display
 * 
 * ==========================================
 */

/**
 * INTEGRATION CHECKLIST
 * 
 * [ ] 1. Determine user role/clearance level
 *   - Set `isGameMaster` based on user profile
 *   - Example: `isGameMaster = user.clearance_level === 'ÔMEGA'`
 * 
 * [ ] 2. Determine view mode
 *   - Set `playerView` based on game state
 *   - Example: `playerView = !isEditMode && !isDevelopment`
 * 
 * [ ] 3. Set card properties
 *   - `locked`: true for password-protected
 *   - `cardType`: 'normal' | 'glitch' | 'encrypted' | 'mega-clue'
 *   - `fileType`: Optional, for additional context
 * 
 * [ ] 4. Pass all props to EvidenceCard
 *   - All visible in code example above
 *   - EvidenceCard automatically passes to EvidenceCardContent
 * 
 * [ ] 5. Test different scenarios
 *   - Test as GM with playerView=true (should see everything)
 *   - Test as Player with playerView=true (should see restrictions)
 *   - Test with locked=true (should show access denied)
 *   - Test with cardType='glitch' (should show corruption)
 * 
 * [ ] 6. Customize if needed
 *   - Edit EvidenceCardContent.css for color/timing changes
 *   - Keep component tree intact for proper z-index management
 * 
 */

/**
 * COMMON IMPLEMENTATION PATTERNS
 * 
 * Pattern 1: Show everything to GM, restrict players
 * ─────────────────────────────────────────────────
 * const cardProps = {
 *   id, title, image,
 *   cardType: 'encrypted',
 *   locked: true,
 *   isGameMaster: isMasterUser,    // ← Key: This determines what they see
 *   playerView: true,              // ← All players in restricted view
 * };
 * 
 * If isMasterUser=true: Shows full image
 * If isMasterUser=false: Shows "ACESSO NEGADO"
 * 
 * ─────────────────────────────────────────────────
 * 
 * Pattern 2: Glitch puzzle (everyone can see, but heavily distorted for players)
 * ─────────────────────────────────────────────────
 * const cardProps = {
 *   id, title, image,
 *   cardType: 'glitch',            // ← This determines the effect
 *   locked: false,                 // ← Not locked, just glitched
 *   isGameMaster: isMasterUser,    // ← Clear for GM, glitchy for players
 *   playerView: true,
 * };
 * 
 * If isMasterUser=true: Shows puzzle clearly
 * If isMasterUser=false: Shows heavy glitch corruption
 * 
 * ─────────────────────────────────────────────────
 * 
 * Pattern 3: UV hidden layer (all see base, GM sees UV too)
 * ─────────────────────────────────────────────────
 * const cardProps = {
 *   id, title,
 *   image: baseImage,
 *   hiddenSrc: uvImage,
 *   isUV: isPlayerToggling,        // ← Toggled by player interaction
 *   hasUV: true,                   // ← Indicates UV available
 *   isGameMaster: isMasterUser,    // ← For content visibility
 *   playerView: true,
 * };
 * 
 * Both see base image
 * GM can toggle to see UV
 * Player might also toggle if allowed
 * 
 * ─────────────────────────────────────────────────
 * 
 */
