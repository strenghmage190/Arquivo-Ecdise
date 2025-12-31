import React, { useState } from 'react';
import { createInviteLink } from '../../api/investigations';

const PingGraph = () => (
  <div style={{height:60, background:'rgba(0,0,0,0.2)', border:'1px solid rgba(0,243,255,0.04)', position:'relative', overflow:'hidden', marginTop:10}}>
    <div style={{width:'200%', height:'100%', backgroundImage:'linear-gradient(90deg, transparent 50%, rgba(0,243,255,0.06) 50%)', backgroundSize:'20px 100%', animation:'scrollGrid 1s linear infinite'}} />
    <div style={{position:'absolute', bottom:6, left:8, color:'var(--nexus-blue)', fontSize:11}}>UPLINK: STABLE (32ms)</div>
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
    <div className="os-window" style={{height:360}}>
      <div className="os-titlebar" style={{background:'linear-gradient(90deg,#001a12,#003322)'}}>
        <span>NETWORK MANAGER v2.0</span>
        <button className="os-btn-close" onClick={onClose}>X</button>
      </div>

      <div className="os-content" style={{display:'flex', gap:16}}>
        <div style={{width:260, borderRight:'1px solid rgba(0,243,255,0.03)', paddingRight:8}}>
          <button onClick={() => setActiveTab('status')} style={{display:'block', width:'100%', marginBottom:6, background:'transparent', border:'none', color: activeTab==='status' ? 'var(--nexus-blue)' : 'var(--muted)', textAlign:'left', cursor:'pointer'}}>› STATUS</button>
          <button onClick={() => setActiveTab('invite')} style={{display:'block', width:'100%', marginBottom:6, background:'transparent', border:'none', color: activeTab==='invite' ? 'var(--nexus-blue)' : 'var(--muted)', textAlign:'left', cursor:'pointer'}}>› CONVIDAR</button>
        </div>

        <div style={{flex:1}}>
          {activeTab === 'status' && (
            <div className="remote-dashboard">
              <div className="map-panel">
                <h3>RASTREAMENTO GLOBAL</h3>
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
                <h3>FEEDS DE SEGURANÇA</h3>
                <div className="camera-feed">
                  <div className="cam-label">CAM_04: CORREDOR B</div>
                  <div className="cam-image" />
                  <div className="static-overlay" />
                  <div className="rec-dot">🔴 REC</div>
                </div>
                <div className="camera-feed">
                  <div className="cam-label">CAM_09: CELA DE CONTENÇÃO</div>
                  <div className="cam-image" />
                  <div className="static-overlay" />
                  <div className="rec-dot">🔴 REC</div>
                </div>
              </div>

              <PingGraph />
            </div>
          )}

          {activeTab === 'invite' && (
            <div>
              <h3 style={{marginTop:0, color:'var(--nexus-blue)'}}>GERAR CHAVE DE ACESSO</h3>
              <p style={{color:'var(--muted)'}}>Abra um caso específico e gere um link seguro para convidar agentes.</p>
              <button onClick={handleGenerate} style={{background:'transparent', border:'1px solid rgba(0,243,255,0.06)', color:'var(--nexus-blue)', padding:8, width:'100%', cursor:'pointer'}} disabled={generating}>{generating ? 'GERANDO...' : '[ INICIAR PROTOCOLO HANDSHAKE ]'}</button>
            </div>
          )}
        </div>
      </div>

      <div className="os-statusbar">MEMBRANA: ESTÁVEL | PING: 32ms</div>
    </div>
  );
}
