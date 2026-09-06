import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_STORAGE_KEY = 'hasSeenClueModalTour';

const TOUR_STEPS = [
  {
    element: '.cc-tabs-nav',
    popover: {
      title: '[ NAVEGAÇÃO ]',
      description: 'Cada aba controla um aspecto da evidência. Navegue entre elas para configurar todos os campos.',
    },
  },
  {
    element: '[data-tab="geral"]',
    popover: {
      title: '[ GERAL ]',
      description: 'Título, sub-tipo, tags, código de descoberta e senha de acesso à evidência.',
    },
  },
  {
    element: '[data-tab="visual"]',
    popover: {
      title: '[ VISUAL ]',
      description: 'Upload de imagem, camada UV para revelar conteúdo oculto, e filtros reveladores.',
    },
  },
  {
    element: '[data-tab="cifra"]',
    popover: {
      title: '[ CIFRA ]',
      description: 'Shredder — fragmenta o texto em pedaços criptografados que o jogador deve reconstituir.',
    },
  },
  {
    element: '[data-tab="glitch"]',
    popover: {
      title: '[ GLITCH ]',
      description: 'Puzzle de frequência de áudio. Configure os parâmetros corretos e a dificuldade da calibração.',
    },
  },
  {
    element: '.cc-btn-save',
    popover: {
      title: '[ SALVAR ]',
      description: 'Confirma e persiste a evidência no banco de dados da investigação.',
      side: 'top' as const,
    },
  },
];

export function useClueTour() {
  const shouldShowTour = (): boolean => {
    try {
      return !localStorage.getItem(TOUR_STORAGE_KEY);
    } catch {
      return false;
    }
  };

  const markTourSeen = (): void => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch {
      // localStorage unavailable — fail silently
    }
  };

  const startTour = (): void => {
    const driverObj = driver({
      animate: true,
      overlayColor: 'rgba(0, 0, 0, 0.85)',
      popoverClass: 'cyber-tour-popover',
      nextBtnText: '[ PRÓXIMO ]',
      prevBtnText: '[ VOLTAR ]',
      doneBtnText: '[ CONCLUIR ]',
      showProgress: true,
      steps: TOUR_STEPS,
      onDestroyStarted: () => {
        markTourSeen();
        driverObj.destroy();
      },
    });

    driverObj.drive();
  };

  return { startTour, shouldShowTour, markTourSeen };
}
