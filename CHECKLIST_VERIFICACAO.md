# ✅ Checklist de Verificação - Refatoração de Puzzles

## 📋 Pré-Lançamento

### 1. Verificação de Código
- [x] Remover importações obsoletas
- [x] Remover estados desnecessários
- [x] Remover componentes da renderização
- [x] Sem erros de compilação TypeScript
- [x] Sem warnings de ESLint

### 2. Funcionalidade CreateClueModal
- [ ] Seletor de tipo aparece na aba "GERAL"
- [ ] Seletor funciona com 3 opções
- [ ] Cores diferentes para cada tipo
- [ ] Abas dinâmicas aparecem/desaparecem corretamente

### 3. Aba "CONFIG. GLITCH"
- [ ] Aparece quando "Glitch Puzzle" é selecionado
- [ ] Upload de imagem original funciona
- [ ] Upload de imagem corrompida funciona
- [ ] Previsualizações de imagens aparecem
- [ ] Sliders de parâmetros funcionam
- [ ] Valores dos sliders exibem corretamente
- [ ] Campo de código de recompensa aceita entrada
- [ ] Código é convertido para maiúsculas automaticamente

### 4. Aba "CONFIG. MEGA-PISTA"
- [ ] Aparece quando "Mega-Pista" é selecionada
- [ ] Campo de texto da verdade final funciona
- [ ] Contador de caracteres (x/2000) atualiza
- [ ] Upload de imagem final funciona
- [ ] Pré-visualização da imagem aparece
- [ ] Lista de puzzles carrega automaticamente
- [ ] Checkboxes para puzzles funcionam
- [ ] Múltiplos puzzles podem ser selecionados
- [ ] Contador de puzzles selecionados aparece

### 5. Validações
- [ ] Documento Padrão: apenas título obrigatório
- [ ] Glitch Puzzle: título + ambas as imagens obrigatórias
- [ ] Mega-Pista: título + texto + mínimo 1 puzzle obrigatório
- [ ] Mensagens de erro apropriadas

### 6. Salvamento (handleSave)
- [ ] Documento Padrão salva com `type: null`
- [ ] Glitch Puzzle salva com `type: 'glitch_puzzle'`
- [ ] Mega-Pista salva com `type: 'mega_clue'`
- [ ] Metadata estruturada corretamente
- [ ] Imagens fazem upload com sucesso
- [ ] Card aparece no board após salvar

### 7. Integração com Board
- [ ] Botão "CRIAR EVIDÊNCIA" aparece na toolbar
- [ ] Clique abre CreateClueModal
- [ ] Botão também funciona no menu móvel
- [ ] Posição inicial do card é respeitada (se fornecida)
- [ ] Board recarrega após salvar

### 8. Testes de Usuário
- [ ] Criar um Documento Padrão simples
- [ ] Criar um Glitch Puzzle com ambas as imagens
- [ ] Criar uma Mega-Pista com 2+ puzzles selecionados
- [ ] Alternar entre tipos de evidência e verificar abas
- [ ] Salvamento/carregamento de dados persistem

### 9. Dados no Banco
```sql
-- Verificar cards criados
SELECT id, title, type, 
  CASE 
    WHEN type IS NULL THEN 'Documento'
    WHEN type = 'glitch_puzzle' THEN 'Glitch Puzzle'
    WHEN type = 'mega_clue' THEN 'Mega-Pista'
  END as tipo,
  metadata
FROM investigation_cards
WHERE investigation_id = 'YOUR_ID'
ORDER BY created_at DESC;
```

Esperado:
- [ ] Cards tipo `null` (Documentos)
- [ ] Cards tipo `'glitch_puzzle'` com `metadata.glitch_puzzle`
- [ ] Cards tipo `'mega_clue'` com `metadata.mega_clue`

### 10. Compatibilidade Retroativa
- [ ] Cards antigos de glitch_puzzle funcionam corretamente
- [ ] Cards antigos de mega_clue funcionam corretamente
- [ ] Campo `type` é respeitado pelo sistema de exibição

---

## 🧪 Testes Específicos

### Teste 1: Criar Glitch Puzzle
```
1. Abrir CreateClueModal
2. Aba "GERAL & DADOS" → Selecionar "🧩 Quebra-cabeça de Glitch"
3. Preencher:
   - Título: "Imagem Corrompida"
   - Descrição: "Uma imagem que precisa ser decodificada"
4. Aba "🧩 CONFIG. GLITCH" → Upload imagem original
5. Aba "🧩 CONFIG. GLITCH" → Upload imagem corrompida
6. Ajustar sliders: Freq: 20, Shift: 40%, Cromática: 15%
7. Código: "PUZZLE-001"
8. REGISTRAR EVIDÊNCIA
✅ Esperado: Card criado com type='glitch_puzzle'
```

### Teste 2: Criar Mega-Pista
```
1. Primeiro, criar 2-3 Glitch Puzzles (veja Teste 1)
2. Abrir CreateClueModal
3. Aba "GERAL & DADOS" → Selecionar "🔐 Mega-Pista Final"
4. Preencher:
   - Título: "A VERDADE FINAL"
   - Descrição: "Todos os puzzles resolvidos"
5. Aba "🔐 CONFIG. MEGA-PISTA" → Digitar verdade final
6. Aba "🔐 CONFIG. MEGA-PISTA" → Marcar 2+ puzzles com checkbox
7. (Opcional) Upload imagem final
8. REGISTRAR EVIDÊNCIA
✅ Esperado: Card criado com type='mega_clue' e required_puzzle_ids preenchido
```

### Teste 3: Alternar Tipos
```
1. Abrir CreateClueModal
2. Preencher informações básicas (título, descrição)
3. Selecionar "Documento Padrão" → Verificar abas normais
4. Selecionar "Glitch Puzzle" → Verificar aba CONFIG. GLITCH aparece
5. Selecionar "Mega-Pista" → Verificar aba CONFIG. MEGA-PISTA aparece
6. Voltar para "Documento" → Verificar abas dinâmicas desaparecem
✅ Esperado: Abas aparecem/desaparecem dinamicamente
```

### Teste 4: Validações
```
Teste 4a - Glitch Puzzle sem imagens:
1. Selecionar "Glitch Puzzle"
2. Preenchertítulo apenas
3. Clicar "REGISTRAR"
✅ Esperado: Alerta "Você precisa de ambas as imagens"

Teste 4b - Mega-Pista sem puzzles:
1. Selecionar "Mega-Pista"
2. Preencher título e texto
3. NÃO selecionar nenhum puzzle
4. Clicar "REGISTRAR"
✅ Esperado: Alerta "Selecione pelo menos um quebra-cabeça"

Teste 4c - Documento sem título:
1. Deixar título vazio
2. Clicar "REGISTRAR"
✅ Esperado: Alerta "A pista precisa de um Título/Código"
```

---

## 🐛 Debugging (se necessário)

### Se as abas dinâmicas não aparecem:
```typescript
// Verificar em browser console:
console.log('activeTab:', activeTab);
console.log('evidenceType:', evidenceType);
// Abas devem aparecer quando:
// activeTab === 'glitch' && evidenceType === 'glitch_puzzle'
// activeTab === 'mega' && evidenceType === 'mega_clue'
```

### Se puzzles não carregam:
```typescript
// Verificar se fetchAvailablePuzzles está sendo chamada
// Adicionar log em: useEffect(() => { if (isOpen && evidenceType === 'mega_clue') { ... } })
// Verificar se há puzzles no banco com type='glitch_puzzle'
```

### Se salvar falha:
```typescript
// Verificar console para erro de upload
// Verificar se investigationId é válido
// Verificar se campos obrigatórios estão preenchidos
// Verificar payload em console.debug (veja CreateClueModal linha ~550)
```

---

## 📊 Métricas de Sucesso

| Métrica | Target | Status |
|---------|--------|--------|
| Sem erros de compilação | 0 | ✅ |
| Testes funcionais | 4/4 | [ ] |
| Abas dinâmicas funcionam | Sim | [ ] |
| Validações funcionam | 3/3 tipos | [ ] |
| Dados salvam corretamente | 100% | [ ] |
| Compatibilidade retroativa | 100% | [ ] |
| Performance (load time) | < 500ms | [ ] |

---

## 🚀 Lista de Implantação

- [ ] Merge de `refactor/unify-puzzle-creation` para `main`
- [ ] Deploy em staging
- [ ] Testar em staging (todos os 4 testes)
- [ ] Code review
- [ ] Deploy em produção
- [ ] Monitorar erro logs
- [ ] Comunicar aos usuários sobre nova interface
- [ ] Após 1 semana: Considerar remover componentes obsoletos

---

## 📞 Contatos para Escalação

Se encontrar problemas:
1. Verificar console do browser (F12 → Console)
2. Confirmar que investigationId é válido
3. Verificar se cards estão sendo criados no banco (mesmo com erro visual)
4. Verificar logs do servidor

---

## ✨ Parabéns! 

Se todos os checkmarks estão marcados, a refatoração foi bem-sucedida! 🎉

A nova interface unificada está pronta para uso.
