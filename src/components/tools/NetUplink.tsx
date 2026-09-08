import React, { useState } from 'react';
import { Radio, X } from 'lucide-react';
import { createInviteLink } from '../../api/investigations';

const PingGraph = () => (
  <div className="ping-graph">
    <div className="ping-grid" />
    <div className="ping-label">UPLINK: STABLE (32ms)</div>
  </div>
);

export default function NetUplink({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'status'|'invite'>('status');
  const [generating, setGenerating] = useState(false);
  const [jump, setJump] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // This is a placeholder: generating requires an investigation id to attach invite to.
      alert('Abra um caso antes para gerar convites.');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('invite gen error', e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="os-window os-window-compact">
      <div className="os-titlebar">
        <span>NETWORK MANAGER v2.0</span>
        <button className="os-btn-close" onClick={onClose} aria-label="Fechar conexão"><X size={16} /></button>
      </div>

      <div className="os-content os-content-split">
        <div className="uplink-tabs">
          <button onClick={() => setActiveTab('status')} className={activeTab === 'status' ? 'uplink-tab active' : 'uplink-tab'}>› STATUS</button>
          <button onClick={() => setActiveTab('invite')} className={activeTab === 'invite' ? 'uplink-tab active' : 'uplink-tab'}>› CONVIDAR</button>
        </div>

        <div style={{flex:1}}>
          {activeTab === 'status' && (
            <div className="remote-dashboard">
              <div className="map-panel">
                <h3 className="panel-heading">RASTREAMENTO GLOBAL</h3>
                <div className="map-container">
                  <div className={`world-map ${jump? 'jump-scare':''}`}>
                    {/* pins */}
                    <div className="map-pin" style={{top:'30%', left:'18%'}} title="Base A"></div>
                    <div className="map-pin danger" style={{top:'52%', left:'58%'}} title="SINAL DESCONHECIDO"></div>
                    <div className="map-pin" style={{top:'20%', left:'78%'}} title="BASE REMOTA"></div>
                  </div>
                </div>
                <div className="coordinates">LAT: -23.5505 | LON: -46.6333</div>
              </div>

              <div className="cctv-panel">
                <h3 className="panel-heading">FEEDS DE SEGURANÇA</h3>
                <div className="camera-feed">
                  <div className="cam-label">CAM_04: CORREDOR B</div>
                  <div className="cam-image" />
                  <div className="static-overlay" />
                  <div className="rec-dot"><Radio size={12} /> REC</div>
                </div>
                <div className="camera-feed">
                  <div className="cam-label">CAM_09: CELA DE CONTENÇÃO</div>
                  <div className="cam-image" />
                  <div className="static-overlay" />
                  <div className="rec-dot"><Radio size={12} /> REC</div>
                </div>
              </div>

              <PingGraph />
            </div>
          )}

          {activeTab === 'invite' && (
            <div>
              <h3 className="panel-heading">GERAR CHAVE DE ACESSO</h3>
              <p className="uplink-description">Abra um caso específico e gere um link seguro para convidar agentes.</p>
              <button onClick={handleGenerate} className="uplink-action" disabled={generating}>{generating ? 'GERANDO...' : '[ INICIAR PROTOCOLO HANDSHAKE ]'}</button>
            </div>
          )}
        </div>
      </div>

      <div className="os-statusbar">MEMBRANA: ESTÁVEL | PING: 32ms</div>
    </div>
  );
}
