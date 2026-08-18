import React, { useState } from 'react';
import { Terminal, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { decodeLSB } from '../../../utils/lsbStegoEngine';
import './AudioLab.css';

interface ForensicTerminalProps {
  baseAudioSamples?: Float32Array | null;
  audioUrl?: string;
}

export default function ForensicTerminal({ baseAudioSamples, audioUrl }: ForensicTerminalProps) {
  const [password, setPassword] = useState('');
  const [log, setLog] = useState<string>('Aguardando arquivo de áudio...');
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtract = async () => {
    if (!baseAudioSamples && !audioUrl) {
      setLog('ERRO: Nenhum áudio carregado no sistema.');
      setIsSuccess(false);
      return;
    }

    setLog('Iniciando varredura profunda (LSB)...');
    setIsExtracting(true);
    
    try {
      let samplesToUse = baseAudioSamples;
      if (!samplesToUse && audioUrl) {
        setLog('Buscando arquivo no servidor seguro...');
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        samplesToUse = audioBuffer.getChannelData(0);
        setLog('Arquivo obtido. Iniciando análise esteganográfica LSB...');
      }

      setTimeout(() => {
        try {
          if (!samplesToUse) throw new Error("Amostras não encontradas");
          const extractedText = decodeLSB(samplesToUse, password);
          
          const isGibberish = /[\x00-\x08\x0E-\x1F]/.test(extractedText.substring(0, 10));

          if (isGibberish || extractedText.trim() === '') {
            setLog(`[FALHA NA DESCRIPTOGRAFIA]\nChave incorreta ou nenhum dado LSB legível encontrado.\n\nResultado Bruto:\n${extractedText.substring(0, 100)}...`);
            setIsSuccess(false);
          } else {
            setLog(`[DADOS EXTRAÍDOS COM SUCESSO]\nDescriptografia XOR finalizada.\n\nCONTEÚDO:\n${extractedText}`);
            setIsSuccess(true);
          }
        } catch (err) {
          setLog('ERRO CRÍTICO: Falha ao analisar os blocos de dados.');
          setIsSuccess(false);
        } finally {
          setIsExtracting(false);
        }
      }, 1500);

    } catch (err: any) {
      setLog(`ERRO DE REDE/AÚDIO: ${err.message}`);
      setIsExtracting(false);
      setIsSuccess(false);
    }
  };

  return (
    <div className="al-layer-panel" style={{ backgroundColor: '#0a0a0c', border: '1px solid #333' }}>
      <div className="al-section-title" style={{ color: '#00f3ff', borderBottom: '1px solid #00f3ff', paddingBottom: '8px' }}>
        <Terminal size={14} style={{ marginRight: '6px' }} />
        Terminal Forense (LSB)
      </div>

      <div style={{ padding: '12px 0', fontSize: '12px', color: '#888' }}>
        Ferramenta de extração de dados esteganográficos em nível de bit.
      </div>

      <div className="al-synth-controls">
        <div className="al-synth-control">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {password ? <Lock size={12} color="#ffaa00" /> : <Unlock size={12} color="#555" />}
            Chave de Descriptografia (XOR)
          </label>
          <input
            type="text"
            placeholder="Insira a chave (Opcional)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="al-synth-input"
            style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
          />
        </div>
      </div>

      <button 
        className={`al-btn-primary ${isExtracting ? 'loading' : ''}`} 
        onClick={handleExtract}
        disabled={!baseAudioSamples || isExtracting}
        style={{ width: '100%', marginBottom: '16px', backgroundColor: '#00f3ff', color: '#000', fontWeight: 'bold' }}
      >
        Executar Extração LSB
      </button>

      {/* Tela do Terminal (Log) */}
      <div style={{
        backgroundColor: '#000',
        border: '1px solid #222',
        borderRadius: '4px',
        padding: '12px',
        fontFamily: "'Courier New', monospace",
        fontSize: '11px',
        color: isSuccess === true ? '#00ff00' : isSuccess === false ? '#ff3333' : '#00f3ff',
        minHeight: '120px',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
      }}>
        {log}
      </div>
      
      {isSuccess === false && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffaa00', fontSize: '11px', marginTop: '8px' }}>
          <AlertTriangle size={12} /> Dica: Se o resultado for lixo, a chave está errada.
        </div>
      )}
    </div>
  );
}
