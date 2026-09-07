import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Fingerprint, Calendar, MapPin, Hash, Link as LinkIcon, FileCheck, UserRound } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

export default function TabMetadata() {
  const { metadataState, setMetadataState, personState, setPersonState } = useClueModal();

  return (
    <div className="cc-tab-content">
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Fingerprint size={18} />
          METADADOS (EXIF FALSO)
        </h3>
        <span data-tooltip-id="exif-tip" style={{ cursor: 'help', marginLeft: '10px' }}>
          [ ? ]
        </span>
        <Tooltip id="exif-tip" className="cyber-tooltip">
          Esses dados aparecem quando o jogador "Inspeciona Arquivo" na lousa. Útil para pistas falsas de data, local e equipamento.
        </Tooltip>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '1rem' }}>
        <div className="cc-field" style={{ flex: 1 }}>
          <label className="cc-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={14} /> Data Fake
          </label>
          <input
            type="text"
            className="cc-input"
            value={metadataState.fakeDate}
            onChange={(e) => setMetadataState(s => ({ ...s, fakeDate: e.target.value }))}
            placeholder="Ex: 14/10/1998 04:22"
          />
        </div>
        <div className="cc-field" style={{ flex: 1 }}>
          <label className="cc-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MapPin size={14} /> Localização GPS
          </label>
          <input
            type="text"
            className="cc-input"
            value={metadataState.fakeLocation}
            onChange={(e) => setMetadataState(s => ({ ...s, fakeLocation: e.target.value }))}
            placeholder="Ex: 48°52.6′S 123°23.6′W"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '1rem' }}>
        <div className="cc-field" style={{ flex: 1 }}>
          <label className="cc-label">Câmera / Equipamento</label>
          <input
            type="text"
            className="cc-input"
            value={metadataState.fakeMetaCam}
            onChange={(e) => setMetadataState(s => ({ ...s, fakeMetaCam: e.target.value }))}
            placeholder="Ex: Canon EOS 5D"
          />
        </div>
        <div className="cc-field" style={{ flex: 1 }}>
          <label className="cc-label">Proprietário / Autor</label>
          <input
            type="text"
            className="cc-input"
            value={metadataState.fakeMetaOwner}
            onChange={(e) => setMetadataState(s => ({ ...s, fakeMetaOwner: e.target.value }))}
            placeholder="Ex: J. Doe"
          />
        </div>
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Hash size={18} />
          OUTROS CAMPOS
        </h3>
      </div>

      <div className="cc-field" style={{ marginTop: '1rem' }}>
        <label className="cc-label">Nota Técnica (Aparece como anotação do sistema)</label>
        <textarea
          className="cc-input"
          value={metadataState.technicalNote}
          onChange={(e) => setMetadataState(s => ({ ...s, technicalNote: e.target.value }))}
          rows={2}
          placeholder="Ex: Arquivo recuperado do setor B..."
        />
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '1rem' }}>
        <div className="cc-field" style={{ flex: 1 }}>
          <label className="cc-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FileCheck size={14} /> Carimbo Especial (Stamp)
          </label>
          <input
            type="text"
            className="cc-input"
            value={metadataState.stamp}
            onChange={(e) => setMetadataState(s => ({ ...s, stamp: e.target.value }))}
            placeholder="Ex: CONFIDENCIAL"
          />
        </div>
        <div className="cc-field" style={{ flex: 1 }}>
          <label className="cc-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <LinkIcon size={14} /> Link Externo
          </label>
          <input
            type="text"
            className="cc-input"
            value={metadataState.externalLink}
            onChange={(e) => setMetadataState(s => ({ ...s, externalLink: e.target.value }))}
            placeholder="Ex: https://..."
          />
        </div>
      </div>

      <hr className="cc-divider" style={{ margin: '30px 0' }} />

      {/* DOSSIÊ DE PESSOA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span className="field-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserRound size={16} color="var(--nexus-neon)" />
          DOSSIÊ DE PESSOA
        </span>
        <label className="cc-checkbox">
          <input
            type="checkbox"
            checked={personState.isPerson}
            onChange={(e) => setPersonState(s => ({ ...s, isPerson: e.target.checked }))}
          />
          <span className="checkmark"></span>
          Ativar Dossiê
        </label>
      </div>

      {personState.isPerson && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(100,150,255,0.2)' }}>
          <div className="cc-field">
            <label className="cc-label">Nome Completo</label>
            <input 
              className="cc-input"
              value={personState.name} 
              onChange={e => setPersonState(s => ({ ...s, name: e.target.value }))} 
            />
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="cc-field" style={{ flex: 1 }}>
              <label className="cc-label">Idade / Data de Nasc.</label>
              <input 
                className="cc-input"
                value={personState.age} 
                onChange={e => setPersonState(s => ({ ...s, age: e.target.value }))} 
              />
            </div>
            <div className="cc-field" style={{ flex: 1 }}>
              <label className="cc-label">Status</label>
              <select 
                className="cc-input"
                value={personState.status} 
                onChange={e => setPersonState(s => ({ ...s, status: e.target.value }))}
                style={{ width: '100%', padding: '6px' }}
              >
                <option value="">Selecione...</option>
                <option value="Vivo">Vivo</option>
                <option value="Desaparecido">Desaparecido</option>
                <option value="Morto">Morto</option>
                <option value="Suspeito">Suspeito</option>
              </select>
            </div>
          </div>

          <div className="cc-field">
            <label className="cc-label">Profissão / Cargo</label>
            <input 
              className="cc-input"
              value={personState.profession} 
              onChange={e => setPersonState(s => ({ ...s, profession: e.target.value }))} 
            />
          </div>

          <div className="cc-field">
            <label className="cc-label">Detalhes Adicionais (Descrição)</label>
            <textarea 
              className="cc-input"
              rows={4} 
              style={{ width: '100%' }}
              value={personState.details} 
              onChange={e => setPersonState(s => ({ ...s, details: e.target.value }))} 
            />
          </div>
        </div>
      )}

    </div>
  );
}
