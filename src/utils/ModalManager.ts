/**
 * ModalManager - Sistema centralizado de gerenciamento de modals
 * 
 * Previne conflitos através de:
 * - Sistema de prioridades
 * - Controle de modal ativo único
 * - Callbacks de fechamento automáticos
 * - Integração com EventManager
 */

import { eventManager } from './EventManager';

interface ModalState {
  id: string;
  isOpen: boolean;
  priority: number; // Maior = maior prioridade
  onClose?: () => void;
}

class ModalManager {
  private static instance: ModalManager;
  private modals: Map<string, ModalState> = new Map();
  private activeModalId: string | null = null;

  private constructor() {
    // Singleton pattern
  }

  /**
   * Retorna a instância única do ModalManager
   */
  static getInstance(): ModalManager {
    if (!ModalManager.instance) {
      ModalManager.instance = new ModalManager();
    }
    return ModalManager.instance;
  }

  /**
   * Registra um modal no sistema
   * 
   * @param id - ID único do modal
   * @param priority - Prioridade (default: 0, maior = maior prioridade)
   */
  register(id: string, priority: number = 0): void {
    if (!this.modals.has(id)) {
      this.modals.set(id, {
        id,
        isOpen: false,
        priority,
      });
      console.log(`[ModalManager] Registered modal: ${id} (priority: ${priority})`);
    }
  }

  /**
   * Abre um modal
   * 
   * @param id - ID do modal a abrir
   * @param onClose - Callback opcional a ser executado no fechamento
   * @returns true se abriu com sucesso, false se foi bloqueado
   */
  open(id: string, onClose?: () => void): boolean {
    const modal = this.modals.get(id);
    
    if (!modal) {
      console.warn(`[ModalManager] Modal '${id}' not registered`);
      return false;
    }

    // Se há modal ativo com maior prioridade, rejeita
    if (this.activeModalId && this.activeModalId !== id) {
      const activeModal = this.modals.get(this.activeModalId);
      if (activeModal && activeModal.priority > modal.priority) {
        console.warn(
          `[ModalManager] Cannot open '${id}' (priority ${modal.priority}): ` +
          `'${this.activeModalId}' has higher priority (${activeModal.priority})`
        );
        return false;
      }

      // Fecha modal anterior
      this.close(this.activeModalId);
    }

    modal.isOpen = true;
    modal.onClose = onClose;
    this.activeModalId = id;

    // Dispara eventos globais
    eventManager.emit('modal:opened', id);
    eventManager.emit('header:toggle', false);

    console.log(`[ModalManager] Opened modal: ${id}`);
    return true;
  }

  /**
   * Fecha um modal específico
   * 
   * @param id - ID do modal a fechar
   */
  close(id: string): void {
    const modal = this.modals.get(id);
    
    if (!modal || !modal.isOpen) {
      return;
    }

    modal.isOpen = false;

    // Executa callback de fechamento se houver
    if (modal.onClose) {
      try {
        modal.onClose();
      } catch (error) {
        console.error(`[ModalManager] Error in onClose callback for '${id}':`, error);
      }
      modal.onClose = undefined;
    }

    // Se era o modal ativo, limpa estado
    if (this.activeModalId === id) {
      this.activeModalId = null;
      
      // Dispara eventos globais
      eventManager.emit('header:toggle', true);
      eventManager.emit('modal:closed', id);
    }

    console.log(`[ModalManager] Closed modal: ${id}`);
  }

  /**
   * Fecha todos os modals abertos
   */
  closeAll(): void {
    console.log('[ModalManager] Closing all modals');
    this.modals.forEach((modal) => {
      if (modal.isOpen) {
        this.close(modal.id);
      }
    });
  }

  /**
   * Verifica se algum modal está aberto
   */
  isAnyOpen(): boolean {
    return this.activeModalId !== null;
  }

  /**
   * Retorna o ID do modal atualmente ativo
   */
  getActiveModal(): string | null {
    return this.activeModalId;
  }

  /**
   * Verifica se um modal específico está aberto
   */
  isOpen(id: string): boolean {
    const modal = this.modals.get(id);
    return modal ? modal.isOpen : false;
  }

  /**
   * Atualiza a prioridade de um modal
   */
  setPriority(id: string, priority: number): void {
    const modal = this.modals.get(id);
    if (modal) {
      modal.priority = priority;
      console.log(`[ModalManager] Updated priority for '${id}': ${priority}`);
    }
  }

  /**
   * Remove um modal do sistema
   */
  unregister(id: string): void {
    if (this.isOpen(id)) {
      this.close(id);
    }
    this.modals.delete(id);
    console.log(`[ModalManager] Unregistered modal: ${id}`);
  }

  /**
   * Retorna informações de debug
   */
  debug(): void {
    console.group('[ModalManager] Debug Info');
    console.log(`Active modal: ${this.activeModalId || 'none'}`);
    console.log(`Total modals: ${this.modals.size}`);
    this.modals.forEach((modal, id) => {
      console.log(`  ${id}: open=${modal.isOpen}, priority=${modal.priority}`);
    });
    console.groupEnd();
  }
}

// Exporta instância singleton
export const modalManager = ModalManager.getInstance();
