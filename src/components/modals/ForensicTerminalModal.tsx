import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Terminal, Lock, Unlock, AlertTriangle, X } from 'lucide-react';
import { decodeLSB } from '../../utils/lsbStegoEngine';
import './ForensicTerminalModal.css';

interface ForensicTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseAudioSamples?: Float32Array | null;
  audioUrl?: string;
}

export default function ForensicTerminalModal({ isOpen, onClose, baseAudioSamples, audioUrl }: ForensicTerminalModalProps) {
  const [password, setPassword] = useState('');
  const [log, setLog] = useState<string>('Aguardando inicialização do terminal forense...');
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setIsSuccess(null);
      setIsExtracting(false);
      if (!baseAudioSamples && !audioUrl) {
        setLog('AVISO: Nenhum arquivo de áudio carregado no buffer.');
      } else {
        setLog('Terminal inicializado. Buffer de áudio pronto para análise LSB.');
      }
    }
  }, [isOpen, baseAudioSamples, audioUrl]);

  if (!isOpen) return null;

  const handleExtract = async () => {
    if (!baseAudioSamples && !audioUrl) {
      setLog('ERRO: Nenhum áudio carregado no sistema para análise.');
      setIsSuccess(false);
      return;
    }

    setLog('> Iniciando varredura profunda LSB...\n> Analisando estrutura de bits...');
    setIsExtracting(true);
    setIsSuccess(null);
    
    try {
      let samplesToUse = baseAudioSamples;
      if (!samplesToUse && audioUrl) {
        setLog((prev) => prev + '\n> Buscando arquivo remoto...');
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        samplesToUse = audioBuffer.getChannelData(0);
        setLog((prev) => prev + '\n> Arquivo remoto obtido e decodificado.');
      }

      // Small timeout to allow UI update and simulate terminal processing delay
      setTimeout(() => {
        try {
          if (!samplesToUse) throw new Error("Amostras não encontradas no buffer");
          setLog((prev) => prev + '\n> Executando descriptografia XOR e extração LSB...');
          
          const extractedText = decodeLSB(samplesToUse, password);
          
          // Verify if it's gibberish (common control characters often mean bad decryption)
          const isGibberish = /[\x00-\x08\x0E-\x1F]/.test(extractedText.substring(0, 10));

          if (isGibberish || extractedText.trim() === '') {
            setLog(`\n[FALHA NA DESCRIPTOGRAFIA]\nChave incorreta ou nenhum dado LSB legível encontrado.\n\nResultado Bruto (Hex/ASCII limitados):\n${extractedText.substring(0, 150)}...`);
            setIsSuccess(false);
          } else {
            setLog(`\n[DADOS EXTRAÍDOS COM SUCESSO]\nDescriptografia finalizada sem erros.\n\n----------------------------------------\nCONTEÚDO:\n${extractedText}\n----------------------------------------`);
            setIsSuccess(true);
          }
        } catch (err) {
          setLog('\n[ERRO CRÍTICO]\nFalha ao analisar os blocos de dados LSB. O arquivo pode estar corrompido ou o algoritmo foi rejeitado.');
          setIsSuccess(false);
        } finally {
          setIsExtracting(false);
        }
      }, 800);

    } catch (err: any) {
      setLog(`\n[ERRO DE SISTEMA]\nFalha na rede ou na inicialização do áudio: ${err.message}`);
      setIsExtracting(false);
      setIsSuccess(false);
    }
  };

  const getLogClass = () => {
    if (isSuccess === true) return 'ftm-log-success';
    if (isSuccess === false) return 'ftm-log-error';
    return 'ftm-log-default';
  };

  return createPortal(
    <div className="ftm-overlay" onClick={onClose}>
      <div className="ftm-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="ftm-header">
          <div className="ftm-title">
            <Terminal size={16} />
            Terminal Forense (Decodificador LSB)
          </div>
          <button className="ftm-close-btn" onClick={onClose} aria-label="Fechar terminal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="ftm-body">
          <div className="ftm-description">
            Ferramenta avançada para extração e descriptografia de dados esteganográficos ocultos nos bits menos significativos (LSB) de sinais de áudio.
          </div>

          <div className="ftm-control-group">
            <label className="ftm-label">
              {password ? <Lock size={14} color="var(--nx-warning)" /> : <Unlock size={14} />}
              Chave de Descriptografia XOR (Opcional)
            </label>
            <input
              type="text"
              placeholder="Insira a chave secreta..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ftm-input"
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          <button 
            className={`ftm-btn-extract ${isExtracting ? 'loading' : ''}`} 
            onClick={handleExtract}
            disabled={(!baseAudioSamples && !audioUrl) || isExtracting}
          >
            {isExtracting ? 'Analisando...' : 'Executar Extração LSB'}
          </button>

          {/* Terminal Screen */}
          <div className={`ftm-terminal-screen ${getLogClass()}`}>
            {log}
          </div>
          
          {isSuccess === false && (
            <div className="ftm-hint">
              <AlertTriangle size={14} /> 
              Se o resultado parece um texto incompreensível (lixo digital), a chave XOR está errada ou não há dados esteganográficos LSB no áudio.
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
