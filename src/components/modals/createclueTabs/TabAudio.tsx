import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Info, Music, Trash2, Radio, Mic, Square, Check, Sparkles } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import AudioStudioModal from '../AudioStudioModal';

export default function TabAudio() {
  const { mediaState, setMediaState, setEditorState, registerUrl, revokeUrl, setAudioStudioMeta } = useClueModal();
  const baseAudioRef = useRef<HTMLInputElement>(null);
  const hiddenAudioRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
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
        } catch { }
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
        } catch { }
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
    <div className="ccm-tab-stack">
      <div className="ccm-section" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <span className="ccm-note" style={{ fontSize: 12 }}>
          Estúdio Acústico 48 kHz (Zona Fantasma, Estéreo L−R, Ruído &amp; LSB)
        </span>
        <button
          type="button"
          className="ccm-btn"
          style={{ gap: 6 }}
          onClick={() => setShowStudioModal(true)}
        >
          <Sparkles size={14} /> Abrir Estúdio Acústico
        </button>
      </div>

      <AudioStudioModal
        isOpen={showStudioModal}
        onClose={() => setShowStudioModal(false)}
        initialBaseAudio={mediaState.audioBase}
        onSave={(file, studioMeta) => {
          const url = URL.createObjectURL(file);
          registerUrl(url);
          revokeUrl(mediaState.audioBasePreview);
          setMediaState((prev) => ({
            ...prev,
            audioBase: file,
            audioBasePreview: url,
            removedAudioBase: false,
          }));
          if (studioMeta) setAudioStudioMeta(studioMeta);
        }}
      />

      <section className={`ccm-recorder-box ${isRecording ? 'is-recording' : ''}`}>
        <div className="ccm-recorder-row">
          <div className="ccm-label-inline">
            <Mic size={16} color={isRecording ? '#f87171' : 'var(--ccm-accent)'} />
            <strong>Gravador de Voz (Microfone)</strong>
            {isRecording && (
              <span className="ccm-rec-badge">● REC {formatTimer(recordSeconds)}</span>
            )}
          </div>

          <div className="ccm-btn-row">
            {!isRecording ? (
              <>
                <select
                  value={recordTarget}
                  onChange={(e) => setRecordTarget(e.target.value as 'base' | 'hidden')}
                  className="ccm-input"
                  style={{ width: 'auto' }}
                  aria-label="Destino da gravação"
                >
                  <option value="base">Destino: Áudio Base</option>
                  <option value="hidden">Destino: Áudio Oculto</option>
                </select>
                <button
                  type="button"
                  className="ccm-btn ccm-btn-primary"
                  onClick={() => startRecording(recordTarget)}
                >
                  <Mic size={14} /> Gravar pelo Microfone
                </button>
              </>
            ) : (
              <button
                type="button"
                className="ccm-btn ccm-btn-danger"
                onClick={stopAndUseRecording}
              >
                <Square size={14} /> Parar & Usar ({recordTarget === 'hidden' ? 'Áudio Oculto' : 'Áudio Base'})
              </button>
            )}
          </div>
        </div>

        {micError && (
          <p className="ccm-note" style={{ color: 'var(--ccm-danger)' }}>
            {micError}
          </p>
        )}
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            Áudio Base
            <span data-tooltip-id="base-audio-tip" className="ccm-help-icon">
              <Info size={15} />
            </span>
          </h3>
          <Tooltip id="base-audio-tip" className="cyber-tooltip ccm-tooltip">
            O áudio principal que será reproduzido quando a pista for analisada.
          </Tooltip>
        </div>

        <p className="ccm-note">
          {mediaState.audioBasePreview ? (
            <span style={{ color: 'var(--ccm-success)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Check size={14} /> Áudio Base carregado{mediaState.audioBase?.name ? `: ${mediaState.audioBase.name}` : '.'}
            </span>
          ) : (
            <span>[ - ] Nenhum áudio base.</span>
          )}
        </p>

        {mediaState.audioBasePreview && (
          <audio controls src={mediaState.audioBasePreview} className="ccm-audio-player" />
        )}

        <input
          type="file"
          accept="audio/*"
          hidden
          ref={baseAudioRef}
          onChange={handleBaseAudioSelect}
        />
        <div className="ccm-btn-grid">
          <button
            type="button"
            className="ccm-btn"
            onClick={() => baseAudioRef.current?.click()}
          >
            <Music size={16} /> Selecionar Áudio Base
          </button>
          <button
            type="button"
            className={`ccm-btn ${mediaState.audioBasePreview ? 'ccm-btn-primary' : ''}`}
            onClick={() => setEditorState((s) => ({ ...s, showAudioForgeFor: 'base' }))}
          >
            <Music size={16} /> Abrir AudioLab
          </button>
          {mediaState.audioBasePreview && (
            <button
              type="button"
              className="ccm-btn ccm-btn-danger"
              onClick={handleRemoveBaseAudio}
            >
              <Trash2 size={16} /> Remover
            </button>
          )}
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <Radio size={17} /> Frequência Alvo de Sintonia (Espectrograma / Rádio)
          </h3>
        </div>

        <div className="ccm-slider-field">
          <div className="ccm-slider-head">
            <label className="ccm-label">Frequência Alvo (0–100 Hz)</label>
            <span className="ccm-slider-val">{mediaState.audioTargetFreq} Hz</span>
          </div>
          <input
            type="range"
            className="ccm-range"
            min={0}
            max={100}
            value={mediaState.audioTargetFreq}
            onChange={(e) =>
              setMediaState((s) => ({ ...s, audioTargetFreq: parseInt(e.target.value, 10) || 0 }))
            }
          />
        </div>
      </section>

      <section className="ccm-section ccm-section-accent">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            Áudio Oculto (Esteganografia)
            <span data-tooltip-id="hidden-audio-tip" className="ccm-help-icon">
              <Info size={15} />
            </span>
          </h3>
          <Tooltip id="hidden-audio-tip" className="cyber-tooltip ccm-tooltip">
            <span className="cyber-tooltip-title">[ AUDIO FORGE ]</span>
            Oculte frequências, senhas ou imagens dentro do espectrograma. O áudio oculto será revelado apenas quando analisado no modo Espectrograma.
          </Tooltip>
        </div>

        <p className="ccm-note">
          {mediaState.audioHiddenPreview ? (
            <span style={{ color: 'var(--ccm-success)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Check size={14} /> Áudio Oculto carregado{mediaState.audioHidden?.name ? `: ${mediaState.audioHidden.name}` : '.'}
            </span>
          ) : (
            <span>[ - ] Nenhum áudio oculto.</span>
          )}
        </p>

        {mediaState.audioHiddenPreview && (
          <audio controls src={mediaState.audioHiddenPreview} className="ccm-audio-player" />
        )}

        <input
          type="file"
          accept="audio/*"
          hidden
          ref={hiddenAudioRef}
          onChange={handleHiddenAudioSelect}
        />
        <div className="ccm-btn-grid">
          <button
            type="button"
            className="ccm-btn"
            onClick={() => hiddenAudioRef.current?.click()}
          >
            <Music size={16} /> Selecionar Áudio Oculto
          </button>
          <button
            type="button"
            className={`ccm-btn ${mediaState.audioHiddenPreview ? 'ccm-btn-primary' : ''}`}
            onClick={() => setEditorState((s) => ({ ...s, showAudioForgeFor: 'hidden' }))}
          >
            <Music size={16} /> Abrir AudioLab
          </button>
          {mediaState.audioHiddenPreview && (
            <button
              type="button"
              className="ccm-btn ccm-btn-danger"
              onClick={handleRemoveHiddenAudio}
            >
              <Trash2 size={16} /> Remover
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
