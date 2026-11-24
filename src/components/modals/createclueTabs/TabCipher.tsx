import React, { useMemo, useState } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { ShieldAlert, Info, Grid, Copy, ArrowDownToLine, FileText, Eye } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { toast } from 'sonner';
import { CipherType, encodeWithCipher } from '../../../utils/ciphers';

const CIPHER_OPTIONS: Array<{ value: CipherType; label: string }> = [
  { value: 'caesar', label: 'César (Deslocamento)' },
  { value: 'rot13', label: 'ROT13' },
  { value: 'atbash', label: 'Atbash (Espelho)' },
  { value: 'vigenere', label: 'Vigenère (Com Chave)' },
  { value: 'a1z26', label: 'A1Z26 (Números)' },
  { value: 'hex', label: 'Hexadecimal' },
  { value: 'binary', label: 'Binário (8-bit)' },
  { value: 'morse', label: 'Código Morse' },
  { value: 'enigma', label: 'Enigma Simples (Com Chave)' },
  { value: 'base64', label: 'Base64' },
];

export default function TabCipher() {
  const { cipherState, setCipherState, coreState, setCoreState, mediaState, setActiveTab } =
    useClueModal();

  const [plainInput, setPlainInput] = useState('');
  const [cipherType, setCipherType] = useState<CipherType>('caesar');
  const [caesarShift, setCaesarShift] = useState<number>(3);
  const [cipherKey, setCipherKey] = useState<string>('ECDISE');
  const [saveOriginalToGmNotes, setSaveOriginalToGmNotes] = useState<boolean>(true);

  const cipherPreview = useMemo(() => {
    return encodeWithCipher(plainInput, cipherType, {
      shift: caesarShift,
      key: cipherKey,
    });
  }, [plainInput, cipherType, caesarShift, cipherKey]);

  const maybeSaveOriginalToGmNotes = (original: string) => {
    if (!saveOriginalToGmNotes || !original.trim()) return;
    const noteEntry = `[Texto Original (${cipherType.toUpperCase()})]:\n${original.trim()}`;
    setCoreState((s) => {
      if (s.descHidden && s.descHidden.includes(original.trim())) return s;
      const nextHidden = s.descHidden?.trim()
        ? `${s.descHidden.trim()}\n\n${noteEntry}`
        : noteEntry;
      return { ...s, descHidden: nextHidden };
    });
  };

  const handleCopyCipher = async () => {
    if (!cipherPreview) {
      toast.error('Digite um texto original primeiro.');
      return;
    }
    try {
      await navigator.clipboard.writeText(cipherPreview);
      toast.success('Texto cifrado copiado!');
    } catch {
      toast.error('Não foi possível copiar automaticamente.');
    }
  };

  const handleApplyToPublicDesc = () => {
    if (!cipherPreview) {
      toast.error('Digite um texto original primeiro.');
      return;
    }
    setCoreState((s) => ({ ...s, descPublic: cipherPreview }));
    maybeSaveOriginalToGmNotes(plainInput);
    toast.success('Texto cifrado aplicado na Descrição Pública!');
  };

  const handleApplyToDecoderLens = () => {
    if (!plainInput.trim() || !cipherPreview) {
      toast.error('Digite um texto original primeiro.');
      return;
    }
    setCipherState((s) => ({
      ...s,
      realText: plainInput,
      cipherText: cipherPreview,
    }));
    maybeSaveOriginalToGmNotes(plainInput);
    toast.success('Texto aplicado na Lente Decifradora!');
  };

  const hasBaseImage = Boolean(mediaState.imgFile || mediaState.previewUrl);
  const isNotDocument = coreState.evidenceType !== 'document';
  const totalPieces = (cipherState.shredRows || 1) * (cipherState.shredCols || 1);

  return (
    <div className="field-block">
      {/* PAINEL: CIFRADOR EMBUTIDO */}
      <div
        style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 6,
          border: '1px solid rgba(0, 255, 255, 0.25)',
          background: 'rgba(0, 20, 30, 0.45)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <span className="field-title" style={{ margin: 0, color: '#00ffff' }}>
            🔐 Cifrador Embutido
          </span>
          <button
            type="button"
            className="cc-btn cc-btn-cancel"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={() => {
              if (!coreState.descPublic?.trim()) {
                toast.error('A Descrição Pública está vazia.');
                return;
              }
              setPlainInput(coreState.descPublic);
            }}
          >
            <ArrowDownToLine size={13} /> Puxar da Descrição Pública
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="field-title">Texto Original (Para Cifrar)</label>
          <textarea
            className="cc-input"
            style={{ minHeight: 70, resize: 'vertical' }}
            value={plainInput}
            onChange={(e) => setPlainInput(e.target.value)}
            placeholder="Digite aqui a mensagem secreta que deseja cifrar..."
          />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label className="field-title">Cifra</label>
            <select
              className="cc-input"
              value={cipherType}
              onChange={(e) => setCipherType(e.target.value as CipherType)}
            >
              {CIPHER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {cipherType === 'caesar' && (
            <div style={{ flex: 1, minWidth: 120 }}>
              <label className="field-title">Shift (Deslocamento)</label>
              <input
                type="number"
                className="cc-input"
                value={caesarShift}
                min={-25}
                max={25}
                onChange={(e) => setCaesarShift(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          )}

          {(cipherType === 'vigenere' || cipherType === 'enigma') && (
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="field-title">Chave</label>
              <input
                type="text"
                className="cc-input"
                value={cipherKey}
                onChange={(e) => setCipherKey(e.target.value)}
                placeholder="Ex: ECDISE"
              />
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="field-title">Preview em Tempo Real (Texto Cifrado)</label>
          <textarea
            className="cc-input"
            readOnly
            style={{
              minHeight: 70,
              resize: 'vertical',
              fontFamily: 'monospace',
              color: '#00ffff',
              background: 'rgba(0, 0, 0, 0.5)',
            }}
            value={cipherPreview}
            placeholder="O resultado cifrado aparecerá aqui automaticamente..."
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="cc-checkbox">
            <input
              type="checkbox"
              checked={saveOriginalToGmNotes}
              onChange={(e) => setSaveOriginalToGmNotes(e.target.checked)}
            />
            <span className="checkmark"></span>
            Guardar texto original nas Notas Confidenciais do GM
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="cc-btn cc-btn-cancel"
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={handleCopyCipher}
          >
            <Copy size={13} /> 📋 Copiar
          </button>
          <button
            type="button"
            className="cc-btn cc-btn-save"
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={handleApplyToPublicDesc}
          >
            <FileText size={13} /> Aplicar na descrição pública
          </button>
          <button
            type="button"
            className="cc-btn cc-btn-save"
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={handleApplyToDecoderLens}
          >
            <Eye size={13} /> Aplicar na Lente Decifradora
          </button>
        </div>
      </div>

      <hr className="cc-divider" style={{ margin: '20px 0' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span className="field-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          SHREDDER & CIFRA
          <span data-tooltip-id="cipher-tip" style={{ display: 'flex', cursor: 'help' }}>
            <Info size={16} color="#00ffff" />
          </span>
        </span>
        <label className="cc-checkbox">
          <input
            type="checkbox"
            checked={cipherState.isShredded}
            onChange={(e) => setCipherState((s) => ({ ...s, isShredded: e.target.checked }))}
          />
          <span className="checkmark"></span>
          Ativar Shredder
        </label>
      </div>
      <Tooltip id="cipher-tip" className="cyber-tooltip">
        <span className="cyber-tooltip-title">[ CIFRA SHREDDER ]</span>
        O Shredder fragmenta a imagem do documento em tiras/peças para o jogador remontar.
      </Tooltip>

      {cipherState.isShredded && isNotDocument && (
        <div className="neon-warning-box" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff6666' }}>
              <ShieldAlert size={18} />
              <strong>Shredder exige subtipo "Documento Padrão"</strong>
            </div>
            <button
              type="button"
              className="cc-btn cc-btn-save"
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => setCoreState((s) => ({ ...s, evidenceType: 'document' }))}
            >
              Corrigir para Documento
            </button>
          </div>
        </div>
      )}

      {cipherState.isShredded && !hasBaseImage && (
        <div className="neon-warning-box" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff6666' }}>
              <ShieldAlert size={18} />
              <strong>Shredder requer uma imagem base selecionada</strong>
            </div>
            <button
              type="button"
              className="cc-btn cc-btn-save"
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => setActiveTab('visual')}
            >
              Ir para aba Visual
            </button>
          </div>
        </div>
      )}

      {cipherState.isShredded && (
        <>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--cc-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Grid size={14} /> Presets rápidos:
            </span>
            <button
              type="button"
              className="cc-btn cc-btn-cancel"
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => setCipherState((s) => ({ ...s, shredRows: 1, shredCols: 8 }))}
            >
              1×8 (Tiras Horizontais)
            </button>
            <button
              type="button"
              className="cc-btn cc-btn-cancel"
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => setCipherState((s) => ({ ...s, shredRows: 4, shredCols: 4 }))}
            >
              4×4 (Grade)
            </button>
            <button
              type="button"
              className="cc-btn cc-btn-cancel"
              style={{ padding: '4px 10px', fontSize: 12 }}
              onClick={() => setCipherState((s) => ({ ...s, shredRows: 8, shredCols: 1 }))}
            >
              8×1 (Tiras Verticais)
            </button>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--cc-neon)', fontWeight: 700 }}>
              Total de Peças: {totalPieces}
            </span>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="field-title">Linhas do Shredder</label>
              <input
                type="number"
                className="cc-input"
                value={cipherState.shredRows}
                onChange={(e) =>
                  setCipherState((s) => ({ ...s, shredRows: Math.max(1, parseInt(e.target.value, 10) || 1) }))
                }
                min={1}
                max={12}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="field-title">Colunas do Shredder</label>
              <input
                type="number"
                className="cc-input"
                value={cipherState.shredCols}
                onChange={(e) =>
                  setCipherState((s) => ({ ...s, shredCols: Math.max(1, parseInt(e.target.value, 10) || 1) }))
                }
                min={1}
                max={12}
              />
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <label className="field-title">Texto Real (Decifrado — Lente Decifradora)</label>
        <textarea
          className="cc-input"
          style={{ minHeight: 80, resize: 'vertical' }}
          value={cipherState.realText}
          onChange={(e) => setCipherState((s) => ({ ...s, realText: e.target.value }))}
          placeholder="O texto quando o puzzle é resolvido..."
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label className="field-title">Texto Cifrado (Inicial — Lente Decifradora)</label>
        <textarea
          className="cc-input"
          style={{ minHeight: 80, resize: 'vertical' }}
          value={cipherState.cipherText}
          onChange={(e) => setCipherState((s) => ({ ...s, cipherText: e.target.value }))}
          placeholder="O texto embaralhado que o usuário vê..."
        />
      </div>

      <hr className="cc-divider" style={{ margin: '30px 0' }} />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          HEX VIEWER & ENCODING
          <span data-tooltip-id="hex-tip" style={{ display: 'flex', cursor: 'help' }}>
            <Info size={16} color="#00ffff" />
          </span>
        </h3>
        <Tooltip id="hex-tip" className="cyber-tooltip">
          Configura o código oculto no Inspetor Hexadecimal.
        </Tooltip>
      </div>

      <div style={{ marginTop: 16 }}>
        <label className="field-title">Comentário Oculto / Texto Original para Hex</label>
        <textarea
          className="cc-input"
          style={{ minHeight: 60, resize: 'vertical' }}
          value={cipherState.hexCode}
          onChange={(e) => setCipherState((s) => ({ ...s, hexCode: e.target.value }))}
          placeholder="Ex: SECTOR_7G_COMPROMISED"
        />
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label className="field-title">Método de Encoding Hex</label>
          <select
            className="cc-input"
            value={cipherState.hexEncodingMethod}
            onChange={(e) => setCipherState((s) => ({ ...s, hexEncodingMethod: e.target.value as any }))}
          >
            <option value="plain">Texto Puro (Plain)</option>
            <option value="utf8hex">UTF-8 para Hex (Padrão)</option>
            <option value="xor">Cifra XOR</option>
            <option value="enigma">Cifra Enigma Simples</option>
          </select>
        </div>

        {cipherState.hexEncodingMethod !== 'plain' && cipherState.hexEncodingMethod !== 'utf8hex' && (
          <div style={{ flex: 1 }}>
            <label className="field-title">Chave do Encoding</label>
            <input
              type="text"
              className="cc-input"
              value={cipherState.hexEncodingKey}
              onChange={(e) => setCipherState((s) => ({ ...s, hexEncodingKey: e.target.value }))}
              placeholder="Ex: 42 ou CHAVE_SECRETA"
            />
          </div>
        )}
      </div>
    </div>
  );
}
