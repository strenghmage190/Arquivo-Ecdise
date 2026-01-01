/**
 * AudioManager - Sistema centralizado de gerenciamento de áudio
 * 
 * Previne race conditions através de:
 * - Singleton pattern (apenas UMA instância)
 * - Mutex na inicialização
 * - Controle de estado
 * - Cleanup automático
 * - Valida que NENHUMA outra AudioContext é criada
 */

class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private isInitializing: boolean = false;
  private isActive: boolean = false;
  private createdAt: number = Date.now();

  private constructor() {
    // Singleton pattern - prevent direct instantiation
    console.log('[AudioManager] Instance created (singleton)');
  }

  /**
   * ✅ Retorna a instância única do AudioManager
   */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
      // Register globally para debugging
      (globalThis as any).__AUDIO_MANAGER__ = AudioManager.instance;
    }
    return AudioManager.instance;
  }

  /**
   * ✅ Validação: garante que nenhuma AudioContext extra foi criada
   */
  static validateNoExtraContexts(): boolean {
    try {
      const instances = (window as any).__AUDIO_CONTEXT_INSTANCES__ || 0;
      if (instances > 1) {
        console.error(`❌ Multiple AudioContext instances detected: ${instances}`);
        return false;
      }
      return true;
    } catch (e) {
      return true; // Continue anyway
    }
  }

  /**
   * Inicializa o contexto de áudio (com mutex para prevenir race conditions)
   */
  async initialize(): Promise<void> {
    // Mutex: previne inicialização simultânea
    if (this.isInitializing) {
      console.warn('[AudioManager] Already initializing, waiting...');
      return this.waitForInitialization();
    }

    if (this.isActive) {
      console.log('[AudioManager] Already initialized');
      return;
    }

    this.isInitializing = true;
    console.log('[AudioManager] Initializing...');

    try {
      // Cleanup anterior se houver
      await this.cleanup();

      // ✅ Valida que não há múltiplas instâncias
      if (!AudioManager.validateNoExtraContexts()) {
        console.error('[AudioManager] Extra AudioContext instances detected - may cause issues');
      }

      // Cria novo contexto de áudio
      const ctx = new AudioContext();
      this.audioContext = ctx;
      
      // Track no global (para debugging)
      (window as any).__AUDIO_CONTEXT_INSTANCES__ = ((window as any).__AUDIO_CONTEXT_INSTANCES__ || 0) + 1;

      // Cria gain node
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);
      this.gainNode = gain;

      // Cria oscilador para drone
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 60;
      
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.6;
      
      osc.connect(oscGain);
      oscGain.connect(gain);
      osc.start();
      
      this.oscillator = osc;
      this.isActive = true;

      console.log('[AudioManager] Initialized successfully');
    } catch (error) {
      console.error('[AudioManager] Initialization failed:', error);
      this.isActive = false;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Aguarda inicialização em andamento (com timeout)
   */
  private async waitForInitialization(maxWait: number = 2000): Promise<void> {
    const startTime = Date.now();
    
    while (this.isInitializing && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (this.isInitializing) {
      console.error('[AudioManager] Initialization timeout');
      throw new Error('AudioManager: Initialization timeout');
    }
  }

  /**
   * Define o volume do gain principal
   */
  setVolume(value: number): void {
    if (!this.isActive || !this.gainNode) {
      console.warn('[AudioManager] Cannot set volume: not initialized');
      return;
    }

    const clampedValue = Math.max(0, Math.min(1, value));
    this.gainNode.gain.value = clampedValue;
  }

  /**
   * Fade in do volume
   */
  fadeIn(duration: number = 1000, targetVolume: number = 1): void {
    if (!this.isActive || !this.gainNode || !this.audioContext) {
      console.warn('[AudioManager] Cannot fade in: not initialized');
      return;
    }

    const now = this.audioContext.currentTime;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime(targetVolume, now + duration / 1000);
  }

  /**
   * Fade out do volume
   */
  fadeOut(duration: number = 1000): void {
    if (!this.isActive || !this.gainNode || !this.audioContext) {
      console.warn('[AudioManager] Cannot fade out: not initialized');
      return;
    }

    const now = this.audioContext.currentTime;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000);
  }

  /**
   * Resume o AudioContext (necessário após interação do usuário)
   */
  async resume(): Promise<void> {
    if (!this.audioContext) {
      console.warn('[AudioManager] Cannot resume: not initialized');
      return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('[AudioManager] AudioContext resumed');
      }
    } catch (error) {
      console.error('[AudioManager] Error resuming AudioContext:', error);
    }
  }

  /**
   * Cleanup completo de recursos de áudio
   */
  async cleanup(): Promise<void> {
    console.log('[AudioManager] Cleaning up...');

    // Para oscilador
    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (e) {
        // Ignora se já parou
      }
      this.oscillator = null;
    }

    // Fecha contexto de áudio
    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch (e) {
        console.warn('[AudioManager] Error closing AudioContext:', e);
      }
      this.audioContext = null;
    }

    this.gainNode = null;
    this.isActive = false;
    
    console.log('[AudioManager] Cleanup complete');
  }

  /**
   * Verifica se o AudioManager está pronto para uso
   */
  isReady(): boolean {
    return this.isActive && !this.isInitializing;
  }

  /**
   * Retorna o estado atual
   */
  getState(): string {
    if (this.isInitializing) return 'initializing';
    if (this.isActive) return 'active';
    return 'inactive';
  }

  /**
   * Retorna o AudioContext (use com cuidado)
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Retorna informações de debug
   */
  debug(): void {
    console.group('[AudioManager] Debug Info');
    console.log(`State: ${this.getState()}`);
    console.log(`AudioContext: ${this.audioContext ? 'exists' : 'null'}`);
    console.log(`AudioContext state: ${this.audioContext?.state || 'N/A'}`);
    console.log(`GainNode: ${this.gainNode ? 'exists' : 'null'}`);
    console.log(`Gain value: ${this.gainNode?.gain.value || 'N/A'}`);
    console.log(`Oscillator: ${this.oscillator ? 'exists' : 'null'}`);
    console.groupEnd();
  }
}

// Exporta instância singleton
export const audioManager = AudioManager.getInstance();
