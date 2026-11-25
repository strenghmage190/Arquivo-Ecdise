import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Fingerprint, Calendar, MapPin, Hash, Link as LinkIcon, FileCheck, UserRound, Info } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

export default function TabMetadata() {
  const { metadataState, setMetadataState, personState, setPersonState } = useClueModal();

  return (
    <div className="ccm-tab-stack">
      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Fingerprint size={17} /> METADADOS (EXIF FALSO)
            <span data-tooltip-id="exif-tip" className="ccm-help-icon">
              <Info size={15} />
            </span>
          </h3>
          <Tooltip id="exif-tip" className="cyber-tooltip ccm-tooltip">
            Esses dados aparecem quando o jogador "Inspeciona Arquivo" na lousa. Útil para pistas falsas de data, local e equipamento.
          </Tooltip>
        </div>

        <div className="ccm-grid-2">
          <div className="ccm-field">
            <label className="ccm-label">
              <span className="ccm-label-inline"><Calendar size={13} /> Data Fake</span>
            </label>
            <input
              type="text"
              className="ccm-input"
              value={metadataState.fakeDate}
              onChange={(e) => setMetadataState((s) => ({ ...s, fakeDate: e.target.value }))}
              placeholder="Ex: 14/10/1998 04:22"
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">
              <span className="ccm-label-inline"><MapPin size={13} /> Localização GPS</span>
            </label>
            <input
              type="text"
              className="ccm-input"
              value={metadataState.fakeLocation}
              onChange={(e) => setMetadataState((s) => ({ ...s, fakeLocation: e.target.value }))}
              placeholder="Ex: 48°52.6′S 123°23.6′W"
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">Câmera / Equipamento</label>
            <input
              type="text"
              className="ccm-input"
              value={metadataState.fakeMetaCam}
              onChange={(e) => setMetadataState((s) => ({ ...s, fakeMetaCam: e.target.value }))}
              placeholder="Ex: Canon EOS 5D"
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">Proprietário / Autor</label>
            <input
              type="text"
              className="ccm-input"
              value={metadataState.fakeMetaOwner}
              onChange={(e) => setMetadataState((s) => ({ ...s, fakeMetaOwner: e.target.value }))}
              placeholder="Ex: J. Doe"
            />
          </div>
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Hash size={17} /> OUTROS CAMPOS
          </h3>
        </div>

        <div className="ccm-grid-2">
          <div className="ccm-field ccm-col-full">
            <label className="ccm-label">Nota Técnica (Aparece como anotação do sistema)</label>
            <textarea
              className="ccm-input"
              value={metadataState.technicalNote}
              onChange={(e) => setMetadataState((s) => ({ ...s, technicalNote: e.target.value }))}
              rows={2}
              placeholder="Ex: Arquivo recuperado do setor B..."
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">
              <span className="ccm-label-inline"><FileCheck size={13} /> Carimbo Especial (Stamp)</span>
            </label>
            <input
              type="text"
              className="ccm-input"
              value={metadataState.stamp}
              onChange={(e) => setMetadataState((s) => ({ ...s, stamp: e.target.value }))}
              placeholder="Ex: CONFIDENCIAL"
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">
              <span className="ccm-label-inline"><LinkIcon size={13} /> Link Externo</span>
            </label>
            <input
              type="text"
              className="ccm-input"
              value={metadataState.externalLink}
              onChange={(e) => setMetadataState((s) => ({ ...s, externalLink: e.target.value }))}
              placeholder="Ex: https://..."
            />
          </div>
        </div>
      </section>

      <section className="ccm-section ccm-section-accent">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <UserRound size={17} /> DOSSIÊ DE PESSOA
          </h3>
          <label className="ccm-toggle-row" style={{ minHeight: 34, padding: '4px 10px' }}>
            <span className="ccm-toggle-title">Ativar Dossiê</span>
            <input
              type="checkbox"
              className="ccm-checkbox-input"
              checked={personState.isPerson}
              onChange={(e) => setPersonState((s) => ({ ...s, isPerson: e.target.checked }))}
            />
          </label>
        </div>

        {personState.isPerson && (
          <div className="ccm-grid-2">
            <div className="ccm-field ccm-col-full">
              <label className="ccm-label">Nome Completo</label>
              <input
                className="ccm-input"
                value={personState.name}
                onChange={(e) => setPersonState((s) => ({ ...s, name: e.target.value }))}
              />
            </div>

            <div className="ccm-field">
              <label className="ccm-label">Idade / Data de Nasc.</label>
              <input
                className="ccm-input"
                value={personState.age}
                onChange={(e) => setPersonState((s) => ({ ...s, age: e.target.value }))}
              />
            </div>

            <div className="ccm-field">
              <label className="ccm-label">Status</label>
              <select
                className="ccm-input"
                value={personState.status || 'UNKNOWN'}
                onChange={(e) => setPersonState((s) => ({ ...s, status: e.target.value }))}
              >
                <option value="UNKNOWN">Desconhecido / Suspeito</option>
                <option value="ALIVE">Vivo</option>
                <option value="MIA">Desaparecido</option>
                <option value="DEAD">Morto</option>
              </select>
            </div>

            <div className="ccm-field ccm-col-full">
              <label className="ccm-label">Profissão / Cargo</label>
              <input
                className="ccm-input"
                value={personState.profession}
                onChange={(e) => setPersonState((s) => ({ ...s, profession: e.target.value }))}
              />
            </div>

            <div className="ccm-field ccm-col-full">
              <label className="ccm-label">Detalhes Adicionais (Descrição)</label>
              <textarea
                className="ccm-input"
                rows={4}
                value={personState.details}
                onChange={(e) => setPersonState((s) => ({ ...s, details: e.target.value }))}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
