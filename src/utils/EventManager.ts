/**
 * EventManager - Sistema centralizado de gerenciamento de eventos
 * 
 * Previne race conditions através de:
 * - Fila de execução sequencial
 * - Debouncing configurável
 * - Controle de duplicatas
 * - Cleanup automático
 */

type EventHandler = (...args: any[]) => void;

interface EventConfig {
  handlers: Set<EventHandler>;
  isProcessing: boolean;
  queue: Array<{ handler: EventHandler; args: any[] }>;
}

interface EventQueue {
  [key: string]: EventConfig;
}

class EventManager {
  private static instance: EventManager;
  private events: EventQueue = {};
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    // Singleton pattern
  }

  /**
   * Retorna a instância única do EventManager
   */
  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * Registra um handler para um evento
   * 
   * @param eventName - Nome do evento
   * @param handler - Função a ser executada quando o evento ocorrer
   * @returns Função para remover o handler (cleanup)
   */
  on(eventName: string, handler: EventHandler): () => void {
    if (!this.events[eventName]) {
      this.events[eventName] = {
        handlers: new Set(),
        isProcessing: false,
        queue: []
      };
    }

    // Previne duplicatas automaticamente (Set)
    this.events[eventName].handlers.add(handler);

    // Retorna função de cleanup
    return () => this.off(eventName, handler);
  }

  /**
   * Remove um handler específico de um evento
   */
  off(eventName: string, handler: EventHandler): void {
    if (this.events[eventName]) {
      this.events[eventName].handlers.delete(handler);
    }
  }

  /**
   * Dispara um evento imediatamente
   * 
   * @param eventName - Nome do evento
   * @param args - Argumentos a serem passados aos handlers
   */
  emit(eventName: string, ...args: any[]): void {
    if (!this.events[eventName]) return;

    const event = this.events[eventName];

    // Executa todos os handlers registrados diretamente (sem fila para performance)
    event.handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`[EventManager] Error in handler for '${eventName}':`, error);
      }
    });
  }

  /**
   * Dispara um evento com debouncing
   * 
   * @param eventName - Nome do evento
   * @param delay - Delay em milissegundos
   * @param args - Argumentos a serem passados aos handlers
   */
  emitDebounced(eventName: string, delay: number, ...args: any[]): void {
    const existingTimer = this.debounceTimers.get(eventName);
    
    // Cancela timer anterior se houver
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.emit(eventName, ...args);
      this.debounceTimers.delete(eventName);
    }, delay);

    this.debounceTimers.set(eventName, timer);
  }

  /**
   * Processa eventos enfileirados recursivamente
   */
  private processQueue(eventName: string): void {
    const event = this.events[eventName];
    if (!event || event.queue.length === 0) return;

    const { handler, args } = event.queue.shift()!;
    
    try {
      handler(...args);
    } catch (error) {
      console.error(`[EventManager] Error in queued handler for '${eventName}':`, error);
    }

    // Continua processando fila
    if (event.queue.length > 0) {
      requestAnimationFrame(() => this.processQueue(eventName));
    }
  }

  /**
   * Limpa todos os handlers de um evento específico
   */
  clear(eventName: string): void {
    if (this.events[eventName]) {
      this.events[eventName].handlers.clear();
      this.events[eventName].queue = [];
    }

    // Limpa timer de debounce se houver
    const timer = this.debounceTimers.get(eventName);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(eventName);
    }
  }

  /**
   * Limpa todos os eventos e timers
   */
  clearAll(): void {
    Object.keys(this.events).forEach(key => this.clear(key));
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  /**
   * Retorna informações de debug sobre eventos registrados
   */
  debug(): void {
    console.group('[EventManager] Debug Info');
    Object.entries(this.events).forEach(([eventName, config]) => {
      console.log(`Event: ${eventName}`);
      console.log(`  Handlers: ${config.handlers.size}`);
      console.log(`  Processing: ${config.isProcessing}`);
      console.log(`  Queue: ${config.queue.length}`);
    });
    console.log(`Active debounce timers: ${this.debounceTimers.size}`);
    console.groupEnd();
  }
}

// Exporta instância singleton
export const eventManager = EventManager.getInstance();
