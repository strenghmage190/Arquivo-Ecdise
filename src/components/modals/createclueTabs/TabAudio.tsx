import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Info, Music, Trash2, Radio, Mic, Square } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

export default function TabAudio() {
  const { mediaState, setMediaState, setEditorState, registerUrl, revokeUrl } = useClueModal();
  const baseAudioRef = useRef<HTMLInputElement>(null);
  const hiddenAudioRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordTarget, setRecordTarget] = useState<'base' | 'hidden'>('base');
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const discardOnStopRef = useRef(false);

  const stopMediaTracksAndTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      discardOnStopRef.current = true;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      mediaRecorderRef.current = null;
      stopMediaTracksAndTimer();
    };
  }, [stopMediaTracksAndTimer]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startRecording = async (target: 'base' | 'hidden' = recordTarget) => {
    setMicError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('Seu navegador não suporta gravação de microfone (MediaDevices indisponível).');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      setMicError('MediaRecorder não suportado neste navegador.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      recordChunksRef.current = [];
      discardOnStopRef.current = false;
      setRecordTarget(target);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          recordChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        stopMediaTracksAndTimer();
        setIsRecording(false);

        if (discardOnStopRef.current) {
          recordChunksRef.current = [];
          return;
        }

        const outType = recorder.mimeType || 'audio/webm';
        const ext = outType.includes('ogg') ? 'ogg' : outType.includes('mp4') ? 'm4a' : 'webm';
        const blob = new Blob(recordChunksRef.current, { type: outType });
        recordChunksRef.current = [];
        if (blob.size === 0) return;

        const file = new File([blob], `mic_${target}_${Date.now()}.${ext}`, { type: outType });
        const newUrl = URL.createObjectURL(file);
        registerUrl(newUrl);

        if (target === 'hidden') {
          revokeUrl(mediaState.audioHiddenPreview);
          setMediaState((s) => ({
            ...s,
            audioHidden: file,
            audioHiddenPreview: newUrl,
            audioHiddenUploadedUrl: null,
            removedAudioHidden: false,
          }));
        } else {
          revokeUrl(mediaState.audioBasePreview);
          setMediaState((s) => ({
            ...s,
            audioBase: file,
            audioBasePreview: newUrl,
            removedAudioBase: false,
          }));
        }
      };

      recorder.onerror = () => {
        stopMediaTracksAndTimer();
        setIsRecording(false);
        setMicError('Erro durante a gravação de áudio.');
      };

      recorder.start();
      setRecordSeconds(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      stopMediaTracksAndTimer();
      setIsRecording(false);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setMicError('Permissão do microfone negada. Libere o acesso ao microfone no navegador.');
      } else if (err?.name === 'NotFoundError') {
        setMicError('Nenhum microfone encontrado neste dispositivo.');
      } else {
        setMicError(err?.message || 'Não foi possível iniciar a gravação pelo microfone.');
      }
    }
  };

  const stopAndUseRecording = () => {
    discardOnStopRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      stopMediaTracksAndTimer();
      setIsRecording(false);
    }
  };

  const handleBaseAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      revokeUrl(mediaState.audioBasePreview);
      const newUrl = URL.createObjectURL(file);
      registerUrl(newUrl);
      setMediaState((s) => ({
        ...s,
        audioBase: file,
        audioBasePreview: newUrl,
        removedAudioBase: false,
      }));
    }
    e.target.value = '';
  };

  const handleRemoveBaseAudio = () => {
    revokeUrl(mediaState.audioBasePreview);
    setMediaState((s) => ({
      ...s,
      audioBase: null,
      audioBasePreview: null,
      removedAudioBase: true,
    }));
  };

  const handleHiddenAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      revokeUrl(mediaState.audioHiddenPreview);
      const newUrl = URL.createObjectURL(file);
      registerUrl(newUrl);
      setMediaState((s) => ({
        ...s,
        audioHidden: file,
        audioHiddenPreview: newUrl,
        audioHiddenUploadedUrl: null,
        removedAudioHidden: false,
      }));
    }
    e.target.value = '';
  };

  const handleRemoveHiddenAudio = () => {
    revokeUrl(mediaState.audioHiddenPreview);
    setMediaState((s) => ({
      ...s,
      audioHidden: null,
      audioHiddenPreview: null,
      audioHiddenUploadedUrl: null,
      removedAudioHidden: true,
    }));
  };

  return (
    <div className="cc-tab-content">
      {/* Voice Microphone Recorder */}
      <div
        style={{
          marginBottom: 16,
          padding: '12px 14px',
          borderRadius: 8,
          border: isRecording
            ? '1px solid rgba(255, 70, 70, 0.7)'
            : '1px solid rgba(0, 243, 255, 0.25)',
          background: isRecording ? 'rgba(255, 40, 40, 0.08)' : 'rgba(0, 243, 255, 0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mic size={16} color={isRecording ? '#ff5555' : 'var(--cc-neon)'} />
            <strong style={{ fontSize: 13 }}>Gravador de Voz (Microfone)</strong>
            {isRecording && (
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#ff6666',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(255, 0, 0, 0.16)',
                }}
              >
                ● REC {formatTimer(recordSeconds)}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {!isRecording ? (
              <>
                <select
                  value={recordTarget}
                  onChange={(e) => setRecordTarget(e.target.value as 'base' | 'hidden')}
                  className="cc-input"
                  style={{ width: 'auto', padding: '5px 8px', fontSize: 12 }}
                  aria-label="Destino da gravação"
                >
                  <option value="base">Destino: Áudio Base</option>
                  <option value="hidden">Destino: Áudio Oculto</option>
                </select>
                <button
                  type="button"
                  className="cc-btn cc-btn-cancel"
                  style={{ borderColor: 'var(--cc-neon)', color: 'var(--cc-neon)' }}
                  onClick={() => startRecording(recordTarget)}
                >
                  🎙️ Gravar pelo Microfone
                </button>
              </>
            ) : (
              <button
                type="button"
                className="cc-btn cc-btn-save"
                style={{ borderColor: '#ff5555', background: 'rgba(255, 50, 50, 0.22)', color: '#fff' }}
                onClick={stopAndUseRecording}
              >
                <Square size={14} /> Parar & Usar ({recordTarget === 'hidden' ? 'Áudio Oculto' : 'Áudio Base'})
              </button>
            )}
          </div>
        </div>

        {micError && (
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#ff6b6b' }}>
            {micError}
          </p>
        )}
      </div>

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Áudio Base
          <span data-tooltip-id="base-audio-tip" style={{ cursor: 'help' }}>
            <Info size={16} color="var(--nexus-text-muted, #666)" />
          </span>
        </h3>
        <Tooltip id="base-audio-tip" className="cyber-tooltip">
          O áudio principal que será reproduzido quando a pista for analisada.
        </Tooltip>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--cc-text-muted)', marginBottom: 8 }}>
          {mediaState.audioBasePreview ? (
            <span style={{ color: '#00ff00' }}>
              [ ✓ ] Áudio Base carregado{mediaState.audioBase?.name ? `: ${mediaState.audioBase.name}` : '.'}
            </span>
          ) : (
            <span>[ - ] Nenhum áudio base.</span>
          )}
        </p>

        {mediaState.audioBasePreview && (
          <div style={{ marginBottom: 10 }}>
            <audio controls src={mediaState.audioBasePreview} style={{ width: '100%' }} />
          </div>
        )}

        <input
          type="file"
          accept="audio/*"
          hidden
          ref={baseAudioRef}
          onChange={handleBaseAudioSelect}
        />
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="cc-btn cc-btn-cancel"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => baseAudioRef.current?.click()}
          >
            <Music size={16} /> Selecionar Áudio Base
          </button>
          <button
            type="button"
            className={mediaState.audioBasePreview ? 'cc-btn cc-btn-save' : 'cc-btn cc-btn-cancel'}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setEditorState((s) => ({ ...s, showAudioForgeFor: 'base' }))}
          >
            <Music size={16} /> Abrir AudioLab
          </button>
          {mediaState.audioBasePreview && (
            <button
              type="button"
              className="cc-btn cc-btn-cancel"
              style={{ borderColor: '#ff4444', color: '#ff6666' }}
              onClick={handleRemoveBaseAudio}
            >
              <Trash2 size={16} /> Remover
            </button>
          )}
        </div>
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={18} />
          Frequência Alvo de Sintonia (Espectrograma / Rádio)
        </h3>
      </div>

      <div className="cc-field" style={{ marginBottom: 16 }}>
        <label className="cc-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Frequência Alvo (0–100 Hz)</span>
          <strong style={{ color: 'var(--cc-neon)' }}>{mediaState.audioTargetFreq} Hz</strong>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={mediaState.audioTargetFreq}
          onChange={(e) =>
            setMediaState((s) => ({ ...s, audioTargetFreq: parseInt(e.target.value, 10) || 0 }))
          }
          style={{ width: '100%', accentColor: 'var(--cc-neon)' }}
        />
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Áudio Oculto (Esteganografia)
          <span data-tooltip-id="hidden-audio-tip" style={{ cursor: 'help' }}>
            <Info size={16} color="var(--nexus-neon, #00ffff)" />
          </span>
        </h3>
        <Tooltip id="hidden-audio-tip" className="cyber-tooltip">
          <span className="cyber-tooltip-title">[ AUDIO FORGE ]</span>
          Oculte frequências, senhas ou imagens dentro do espectrograma. O áudio oculto será revelado apenas quando analisado no modo Espectrograma.
        </Tooltip>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--cc-text-muted)', marginBottom: 8 }}>
          {mediaState.audioHiddenPreview ? (
            <span style={{ color: '#00ff00' }}>
              [ ✓ ] Áudio Oculto carregado{mediaState.audioHidden?.name ? `: ${mediaState.audioHidden.name}` : '.'}
            </span>
          ) : (
            <span>[ - ] Nenhum áudio oculto.</span>
          )}
        </p>

        {mediaState.audioHiddenPreview && (
          <div style={{ marginBottom: 10 }}>
            <audio controls src={mediaState.audioHiddenPreview} style={{ width: '100%' }} />
          </div>
        )}

        <input
          type="file"
          accept="audio/*"
          hidden
          ref={hiddenAudioRef}
          onChange={handleHiddenAudioSelect}
        />
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="cc-btn cc-btn-cancel"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => hiddenAudioRef.current?.click()}
          >
            <Music size={16} /> Selecionar Áudio Oculto
          </button>
          <button
            type="button"
            className={mediaState.audioHiddenPreview ? 'cc-btn cc-btn-save' : 'cc-btn cc-btn-cancel'}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setEditorState((s) => ({ ...s, showAudioForgeFor: 'hidden' }))}
          >
            <Music size={16} /> Abrir AudioLab
          </button>
          {mediaState.audioHiddenPreview && (
            <button
              type="button"
              className="cc-btn cc-btn-cancel"
              style={{ borderColor: '#ff4444', color: '#ff6666' }}
              onClick={handleRemoveHiddenAudio}
            >
              <Trash2 size={16} /> Remover
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
