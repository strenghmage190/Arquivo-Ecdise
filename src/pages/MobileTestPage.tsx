import React, { useState } from 'react';
import {
  Layers,
  PanelLeft,
  PanelRight,
  Crosshair,
  Hand,
  Trash2,
  Eye,
  Copy,
  Pin,
  LayoutGrid,
} from 'lucide-react';
import InvestigationBoard from '../components/board/InvestigationBoard';
import BottomSheet from '../components/ui/BottomSheet';
import { MobileDrawer } from '../components/ui/MobileDrawer';
import { TouchContextMenu, type ContextMenuItem } from '../components/ui/TouchContextMenu';
import { FloatingNudgePad } from '../components/ui/FloatingNudgePad';
import Button from '../components/ui/Button';
import { useIsMobile } from '../hooks/useIsMobile';

const MobileTestPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'primitives' | 'board'>('primitives');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0, zoom: 100 });
  const [eventLog, setEventLog] = useState<string[]>([
    'Laboratório mobile pronto. Teste os gestos e primitivas abaixo.',
  ]);

  const appendLog = (entry: string) => {
    const time = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setEventLog((prev) => [`[${time}] ${entry}`, ...prev.slice(0, 7)]);
  };

  const contextItems: ContextMenuItem[] = [
    {
      id: 'inspect',
      label: 'Inspecionar Pista',
      icon: <Eye size={16} />,
      onClick: () => appendLog('TouchContextMenu -> Inspecionar Pista'),
    },
    {
      id: 'duplicate',
      label: 'Duplicar Registro',
      icon: <Copy size={16} />,
      onClick: () => appendLog('TouchContextMenu -> Duplicar Registro'),
    },
    {
      id: 'pin',
      label: 'Fixar no Quadro',
      icon: <Pin size={16} />,
      onClick: () => appendLog('TouchContextMenu -> Fixar no Quadro'),
    },
    {
      id: 'delete',
      label: 'Arquivar Evidência',
      icon: <Trash2 size={16} />,
      danger: true,
      onClick: () => appendLog('TouchContextMenu -> Arquivar Evidência'),
    },
  ];

  if (activeTab === 'board') {
    return (
      <div style={{ background: 'var(--bg, #0b0c10)', minHeight: '100dvh', position: 'relative' }}>
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)',
            left: 'max(12px, env(safe-area-inset-left, 0px))',
            zIndex: 'var(--z-mobile-bars, 1200)',
          }}
        >
          <Button variant="secondary" size="md" onClick={() => setActiveTab('primitives')}>
            Voltar ao Painel Mobile
          </Button>
        </div>
        <InvestigationBoard investigationId="test-mobile" />
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        background: 'var(--bg, #0b0c10)',
        color: 'var(--text-primary, #f1f5f9)',
        fontFamily: 'var(--font-system, monospace)',
        padding:
          'max(var(--space-6, 24px), calc(env(safe-area-inset-top, 0px) + 56px)) max(var(--space-3, 12px), env(safe-area-inset-right, 0px)) max(var(--space-8, 32px), env(safe-area-inset-bottom, 0px)) max(var(--space-3, 12px), env(safe-area-inset-left, 0px))',
      }}
    >
      <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4, 16px)' }}>
        <header
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3, 12px)',
            paddingBottom: 'var(--space-3, 12px)',
            borderBottom: '1px solid var(--border, #29313d)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--text-secondary, #94a3b8)' }}>
              C.R.I.S. // LAB DE PRIMITIVAS TOUCH
            </div>
            <h1
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-hud, sans-serif)',
                fontSize: 'clamp(1.2rem, 5vw, 1.75rem)',
                letterSpacing: '0.08em',
              }}
            >
              MOBILE UI TESTBENCH
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--border, #29313d)',
                background: 'var(--surface, #11141b)',
                fontSize: 11,
                color: isMobile ? '#10b981' : '#f59e0b',
              }}
            >
              Modo detectado: {isMobile ? 'MOBILE / TOUCH' : 'DESKTOP'}
            </span>
            <Button variant="secondary" size="md" onClick={() => setActiveTab('board')}>
              <LayoutGrid size={15} /> Abrir Quadro Teste
            </Button>
          </div>
        </header>

        {/* Controles das Primitivas */}
        <section
          aria-label="Controles de primitivas"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: 'var(--space-3, 12px)',
          }}
        >
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => {
              setSheetOpen(true);
              appendLog('BottomSheet aberto');
            }}
          >
            <Layers size={16} /> Abrir BottomSheet
          </Button>

          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => {
              setLeftDrawerOpen(true);
              appendLog('MobileDrawer (esquerda) aberto');
            }}
          >
            <PanelLeft size={16} /> Drawer Esquerda
          </Button>

          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => {
              setRightDrawerOpen(true);
              appendLog('MobileDrawer (direita) aberto');
            }}
          >
            <PanelRight size={16} /> Drawer Direita
          </Button>

          <Button
            variant={nudgeOpen ? 'primary' : 'secondary'}
            size="md"
            fullWidth
            onClick={() => {
              setNudgeOpen((prev) => !prev);
              appendLog(nudgeOpen ? 'FloatingNudgePad fechado' : 'FloatingNudgePad ativado');
            }}
          >
            <Crosshair size={16} /> {nudgeOpen ? 'Ocultar NudgePad' : 'Mostrar NudgePad'}
          </Button>
        </section>

        {/* Zona Interativa: TouchContextMenu + FloatingNudgePad Preview */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 'var(--space-4, 16px)',
          }}
        >
          <TouchContextMenu
            title="Ações da Evidência #04"
            items={contextItems}
            onOpenChange={(open) => {
              if (open) appendLog('TouchContextMenu aberto por long-press / botão direito');
            }}
          >
            <div
              style={{
                background: 'var(--surface, #11141b)',
                border: '1px dashed var(--institutional-red, #e63946)',
                borderRadius: 'var(--radius-md, 8px)',
                padding: 'var(--space-4, 16px)',
                minHeight: 160,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 8,
                userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--institutional-red, #e63946)', fontWeight: 700, fontSize: 13 }}>
                <Hand size={18} /> TOUCH CONTEXT MENU
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary, #94a3b8)' }}>
                Pressione e segure por 500ms (ou clique com o botão direito no desktop) nesta área para abrir o menu contextual com feedback háptico.
              </p>
            </div>
          </TouchContextMenu>

          <div
            style={{
              background: 'var(--surface, #11141b)',
              border: '1px solid var(--border, #29313d)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: 'var(--space-4, 16px)',
              minHeight: 160,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>
                ALVO DO NUDGE PAD
              </span>
              <span className="tabular-nums" style={{ fontSize: 11, color: '#2dd4bf' }}>
                X: {coords.x} | Y: {coords.y} | {coords.zoom}%
              </span>
            </div>

            <div
              style={{
                height: 88,
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--border, #29313d)',
                background: 'var(--bg, #0b0c10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  transform: `translate(${Math.max(-90, Math.min(90, coords.x))}px, ${Math.max(-28, Math.min(28, coords.y))}px) scale(${coords.zoom / 100})`,
                  transition: 'transform 0.12s ease-out',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm, 4px)',
                  background: 'rgba(230, 57, 70, 0.2)',
                  border: '1px solid var(--institutional-red, #e63946)',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                EVIDÊNCIA #04
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCoords({ x: 0, y: 0, zoom: 100 });
                appendLog('Coordenadas resetadas para (0, 0, 100%)');
              }}
              style={{
                minHeight: 'var(--control-h-md-mobile, 44px)',
                background: 'transparent',
                border: '1px solid var(--border, #29313d)',
                borderRadius: 'var(--radius-sm, 4px)',
                color: 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
              }}
            >
              Resetar Posição
            </button>
          </div>
        </section>

        {/* Log de Eventos */}
        <section
          aria-label="Log de interações"
          style={{
            background: 'var(--surface, #11141b)',
            border: '1px solid var(--border, #29313d)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: 'var(--space-4, 16px)',
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--text-secondary, #94a3b8)', marginBottom: 8 }}>
            TELEMETRIA DE EVENTOS
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            {eventLog.map((item, idx) => (
              <li key={idx} style={{ color: idx === 0 ? 'var(--text-primary, #f1f5f9)' : 'var(--text-secondary, #94a3b8)', overflowWrap: 'anywhere' }}>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* BottomSheet Demo */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          appendLog('BottomSheet fechado');
        }}
        title="Dossiê Rápido (BottomSheet)"
        maxHeight="80dvh"
      >
        <div style={{ padding: 'var(--space-4, 16px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary, #94a3b8)' }}>
            Arraste a alça para baixo no topo do scroll ou toque no backdrop para fechar. Este componente respeita safe-area-inset-bottom e 85dvh.
          </p>
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              style={{
                padding: 12,
                border: '1px solid var(--border, #29313d)',
                borderRadius: 'var(--radius-sm, 4px)',
                background: 'var(--bg, #0b0c10)',
                fontSize: 13,
              }}
            >
              Registro Forense #{n} — Integridade verificada
            </div>
          ))}
          <Button variant="primary" size="md" fullWidth onClick={() => setSheetOpen(false)}>
            Concluir Inspeção
          </Button>
        </div>
      </BottomSheet>

      {/* MobileDrawer Left */}
      <MobileDrawer
        isOpen={leftDrawerOpen}
        onClose={() => {
          setLeftDrawerOpen(false);
          appendLog('MobileDrawer (esquerda) fechado');
        }}
        position="left"
        title="Navegação Esquerda"
      >
        <div style={{ padding: 'var(--space-4, 16px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>
            Deslize para a esquerda para fechar este drawer lateral.
          </p>
          <Button variant="secondary" size="md" fullWidth onClick={() => setLeftDrawerOpen(false)}>
            Fechar Drawer
          </Button>
        </div>
      </MobileDrawer>

      {/* MobileDrawer Right */}
      <MobileDrawer
        isOpen={rightDrawerOpen}
        onClose={() => {
          setRightDrawerOpen(false);
          appendLog('MobileDrawer (direita) fechado');
        }}
        position="right"
        title="Inspetor Direito"
      >
        <div style={{ padding: 'var(--space-4, 16px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>
            Deslize para a direita para fechar este drawer lateral.
          </p>
          <Button variant="secondary" size="md" fullWidth onClick={() => setRightDrawerOpen(false)}>
            Fechar Drawer
          </Button>
        </div>
      </MobileDrawer>

      {/* FloatingNudgePad Demo */}
      {nudgeOpen && (
        <FloatingNudgePad
          label="NUDGE TESTE"
          step={10}
          fastStep={50}
          onNudge={(dx, dy) => {
            setCoords((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            appendLog(`FloatingNudgePad -> dx=${dx}, dy=${dy}`);
          }}
          onZoomIn={() => {
            setCoords((prev) => ({ ...prev, zoom: Math.min(180, prev.zoom + 10) }));
            appendLog('FloatingNudgePad -> Zoom +10%');
          }}
          onZoomOut={() => {
            setCoords((prev) => ({ ...prev, zoom: Math.max(50, prev.zoom - 10) }));
            appendLog('FloatingNudgePad -> Zoom -10%');
          }}
          onClose={() => {
            setNudgeOpen(false);
            appendLog('FloatingNudgePad fechado');
          }}
        />
      )}
    </main>
  );
};

export default MobileTestPage;
