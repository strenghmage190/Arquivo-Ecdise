# Segurança e decisões de mitigação — Arquivo-Ecdise

Data: 2026-01-03

Resumo
- Durante `npm audit` foram identificadas vulnerabilidades de alta severidade em dependências utilizadas no ambiente de desenvolvimento/testes (`cypress`, `@cypress/request`, `cypress-axe`, `qs`).
- Foi criada a branch `audit-fix-force` onde foi executado `npm audit fix --force` para reduzir o número de vulnerabilidades automaticamente.

Detalhes das vulnerabilidades (resumido)
- `qs` (high): DoS via arrayLimit bypass — afeta `@cypress/request` e, indiretamente, `cypress`.
- `@cypress/request` (high): usa `qs` internamente.
- `cypress` (high): dependências transitivas vulneráveis (ex.: `lodash`, `minimist`, `moment`).
- `cypress-axe` (high): linked via `cypress`.

Decisão tomada
- Tratamento aplicado em branch `audit-fix-force` via `npm audit fix --force`.
- Observação importante: a correção sugerida pelo `audit` passa por alterar linhas major-version de `cypress` (retroceder para versões da série 4.x), o que é breaking para o projeto (nós usamos recursos e integrações compatíveis com Cypress v15+).
- Para reduzir exposição imediata, aplicamos `--force` em branch isolada para experimentar a correção e validar regressões. Unit tests e typecheck passaram após as mudanças; alguns artefatos de screenshots foram removidos no commit (cleanup). E2E requer servidor dev ativo e pode precisar de ajustes adicionais, portanto não é considerado completamente seguro automaticamente.

Risco e justificativa
- As vulnerabilidades apontadas são em dependências de desenvolvimento (ferramentas de teste), portanto o risco de exploração em produção é baixo.
- Forçar downgrades/alterações em ferramentas de teste pode introduzir regressões e reduzir eficácia dos testes (ex.: versões antigas do Cypress com APIs/diff de comportamento). Por isso a estratégia adotada foi: isolar mudanças em branch para revisão, executar testes automáticos e documentar o resultado para decisão de equipe.

Recomendações e próximos passos
1. Revisar o branch `audit-fix-force` (PR aberto) e decidir se aceitamos as mudanças forçadas ou preferimos uma abordagem conservadora (aguardar atualizações upstream). PR: https://github.com/strenghmage190/Arquivo-Ecdise/pull/new/audit-fix-force
2. Caso contrário, reverter `audit-fix-force` e documentar aceitação do risco (manter `cypress` v15) até que `cypress-axe`/`@cypress/request` atualizem dependências transitivas.
3. Agendar uma revisão trimestral das dependências dev para aplicar atualizações oficiais assim que disponíveis.
4. Se for necessário eliminar o risco agora, criar um plano de QA para atualizar e ajustar E2E (corrigir seletores/rotas) após aplicar `--force` em branch de feature e validar manualmente as flows críticas.

Comandos úteis
- Ver relatório de auditoria atual: `npm audit --json > audit-report.json`
- Reproduzir correção (em branch isolada): `npm audit fix --force`
- Reverter a branch se necessário: `git checkout master && git branch -D audit-fix-force`

Contato
- Para dúvidas sobre a análise e próximos passos, abra issue ou responda neste PR.

---

Arquivo gerado automaticamente por script de manutenção em branch `audit-fix-force`.
