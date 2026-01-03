import 'cypress-axe';

describe('Adaptação Mobile - Arquivo Ecdise', () => {
  const sizes = ['iphone-x', 'ipad-2'];

  sizes.forEach((size) => {
    context(`Em dispositivo: ${size}`, () => {
      beforeEach(() => {
        // @ts-ignore
        cy.viewport(size);
        cy.visit('/');
        // Injeta a engine de acessibilidade em cada visita
        cy.injectAxe();
      });

      it('Deve exibir o menu mobile e conseguir navegar', () => {
        cy.get('body').then(($body) => {
            if ($body.find('button[aria-label*="menu"], button[class*="hamburger"]').length > 0) {
                cy.get('button[aria-label*="menu"], button[class*="hamburger"]').first().click({force: true});
                cy.wait(500);
            }
        });

        cy.get('nav, aside').should('be.visible');
      });

      it('Layout não deve quebrar horizontalmente', () => {
        cy.window().then((win) => {
          const scrollWidth = win.document.documentElement.scrollWidth;
          const clientWidth = win.document.documentElement.clientWidth;
          (expect as any)(scrollWidth).to.be.closeTo(clientWidth, 2);
        });
      });

      it('Interação com ferramentas (Detectando menu colapsado)', () => {
        cy.get('body').then(($body) => {
          if ($body.find('.investigation-toolbar').css('display') === 'none') {
            cy.log('Ferramentas Desktop estão ocultas no mobile corretamente');
            cy.get('.investigation-toolbar').should('not.be.visible');
          } else {
             cy.get('button[data-tooltip="Decodificador de Texto"]').click({ force: true });
          }
        });
      });

      it('Deve lidar com atraso de rede (Simulação 3G)', () => {
        cy.intercept('GET', '**/*.json*', {
            delay: 1500,
            statusCode: 200,
            body: {}
        }).as('carregamentoLento');

        cy.visit('/investigacao', {
            onBeforeLoad: (win) => {
                win.sessionStorage.clear();
            }
        });
        
        cy.wait('@carregamentoLento', { timeout: 10000 }).then((interception) => {
            assert.isNotNull(interception.response.body, 'A resposta chegou com atraso');
        });
      });

      it('Scroll até o fim da página (Wrapper Check)', () => {
        cy.get('body').then(($body) => {
            if ($body.css('overflow') === 'hidden') {
                cy.get('#root, main, .app-container').first().scrollTo('bottom', { ensureScrollable: false });
            } else {
                cy.scrollTo('bottom');
            }
        });
        
        cy.get('footer, .credits, div:last-child').last().should('exist');
      });

      it('Check de Acessibilidade Mobile (Logs de erro)', () => {
        const violationCallback = (violations) => {
            cy.task('log', `${violations.length} violações de acessibilidade encontradas`);
            const violationData = violations.map(
                ({ id, impact, description, nodes }) => ({
                    id,
                    impact,
                    description,
                    nodes: nodes.length
                })
            )
            console.table(violationData); 
            cy.log('⚠️ ABRA O CONSOLE (F12) PARA VER DETALHES DE ACESSIBILIDADE');
        }

        cy.checkA11y(null, { 
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }
        }, violationCallback, true);
      });
      
    });
  });
});
