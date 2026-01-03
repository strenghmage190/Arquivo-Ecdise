/// <reference types="cypress" />
// cypress/e2e/mobile.cy.ts

describe('Adaptação Mobile - Arquivo Ecdise', () => {
  const sizes = ['iphone-x', 'ipad-2'];

  sizes.forEach((size) => {
    context(`Em dispositivo: ${size}`, () => {
      beforeEach(() => {
        // @ts-ignore
        cy.viewport(size);
        cy.visit('/');
      });

      it('Deve exibir o menu de navegação mobile e ocultar o de desktop', () => {
        cy.get('nav.desktop-only').should('not.be.visible');

        cy.get('button[aria-label="Abrir menu"]').should('be.visible').click();

        cy.get('aside.mobile-menu').should('be.visible');
        cy.get('aside.mobile-menu').contains('Investigação').click();

        cy.url().should('include', '/investigacao');
      });

      it('Layout não deve ter quebra horizontal (scroll horizontal)', () => {
        cy.window().then((win) => {
          const scrollWidth = win.document.documentElement.scrollWidth;
          const clientWidth = win.document.documentElement.clientWidth;
          expect(scrollWidth).to.be.closeTo(clientWidth, 1);
        });
      });

      it('Cards/Conteúdo devem ocupar largura total ou ajustar colunas', () => {
        cy.get('.container-principal').then($el => {
          const width = $el.width();
          const viewportWidth = Cypress.config('viewportWidth');
          expect(width).to.be.gt(viewportWidth * 0.85);
        });
      });

      // --- Novos testes solicitados ---

      it('Deve funcionar corretamente em modo Paisagem (Landscape)', () => {
        // @ts-ignore
        cy.viewport('iphone-x', 'landscape');
        cy.visit('/');

        // Verifica se o header não está ocupando mais de 30% da tela em landscape
        cy.get('header').invoke('height').should('be.lt', 250);

        // Verifica se ainda é possível ver o conteúdo principal
        cy.get('main').should('be.visible');
      });

      it('Elementos interativos devem ser clicáveis (não dependentes de hover)', () => {
        // Simula toque em elemento que pode depender de :hover
        cy.viewport('iphone-x');
        cy.get('.botao-tooltip').click();
        cy.get('.tooltip-texto').should('be.visible');
      });

      it('Deve mostrar esqueleto/loading antes do conteúdo em rede 3G', () => {
        cy.viewport('iphone-x');

        cy.intercept('GET', '**/api/dados', (req) => {
          req.on('response', (res) => {
            // adiciona delay na resposta para simular rede lenta
            return new Promise((resolve) => setTimeout(resolve, 1500));
          });
        }).as('carregaDados');

        cy.visit('/pagina-pesada');

        cy.get('.skeleton-loader').should('be.visible');

        cy.wait('@carregaDados');

        cy.get('.skeleton-loader').should('not.exist');
        cy.get('.conteudo-real').should('be.visible');
      });

      it('Botão do rodapé não deve ser coberto pela Navbar Fixa', () => {
        // usa viewport mais estreito
        // @ts-ignore
        cy.viewport('iphone-6');
        cy.visit('/artigo-longo');

        cy.scrollTo('bottom');

        // Garantir que o link no footer seja clicável sem forçar
        cy.get('footer a').click({ force: false });
      });

      it('Deve passar nos testes de Acessibilidade Mobile (WCAG)', () => {
        // @ts-ignore
        cy.viewport('samsung-s10');
        cy.visit('/');

        cy.injectAxe();

        cy.checkA11y(null, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa']
          }
        });
      });

      it('Snapshot visual da Home Mobile', () => {
        // @ts-ignore
        cy.viewport('iphone-x');
        cy.visit('/');

        cy.screenshot('home-mobile-iphone-x');
      });

    });
  });
});
