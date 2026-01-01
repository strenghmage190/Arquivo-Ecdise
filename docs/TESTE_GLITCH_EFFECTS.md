# 🧪 Como Testar os Efeitos de Glitch

## Problema Identificado

Os efeitos de glitch não estavam sendo aplicados porque:
1. ❌ `cardType` não estava sendo passado ao EvidenceCard em InvestigationBoard
2. ❌ A ordem das renderizações estava errada (GM View era testada antes das restrições)
3. ❌ As props `isGameMaster` e `playerView` não estavam configuradas corretamente

## Soluções Implementadas

### ✅ 1. Adicionado `cardType` em InvestigationBoard
```tsx
cardType={
  card?.metadata?.type === 'glitch_puzzle' ? 'glitch' :
  card?.metadata?.type === 'mega_clue' ? 'mega-clue' :
  (card?.is_locked || card?.lock_password) ? 'encrypted' :
  'normal'
}
```

### ✅ 2. Reordenada a lógica de EvidenceCardContent
Agora verifica as restrições ANTES de renderizar GM view:
```
1. Locked View (ACESSO NEGADO) ?
2. Glitch/Encrypted View (DATA CORRUPTED) ?
3. Fallback: GM View (Normal)
```

### ✅ 3. Corrigida a condição de renderização
Mudou de `if (isGameMaster || !playerView)` para ordem correta de verificações

---

## 🧪 Como Testar

### Opção 1: Usando o Componente Debug

1. Importe em um lugar visível (ex: Home.tsx ou Investigation.tsx):
```tsx
import EvidenceCardDebug from '@/components/board/EvidenceCardDebug'

// Em algum lugar do JSX:
<EvidenceCardDebug />
```

2. Abra a página e veja o componente debug

3. Use os controles para testar:
   - Toggle `isGameMaster`
   - Toggle `playerView`
   - Toggle `locked`
   - Selecione `cardType`

4. Verifique que:
   - ✅ Locked View mostra "ACESSO NEGADO"
   - ✅ Glitch View mostra corrução de dados
   - ✅ GM View mostra normal sempre
   - ✅ Abra F12 para ver logs de debug

### Opção 2: Criar Cards de Teste no Banco

1. Crie alguns cards com:
   - `is_locked = true` (para testar ACESSO NEGADO)
   - `metadata.type = 'glitch_puzzle'` (para testar glitch)
   - `metadata.type = 'mega_clue'` (para testar mega-clue)

2. Acesse como jogador:
   - Cartões bloqueados mostram 🔐 ACESSO NEGADO
   - Cartões glitch mostram DATA CORRUPTED

3. Acesse como Mestre (clearance_level = ÔMEGA):
   - Todos os cartões mostram normalmente

### Opção 3: Debug no Console

1. Abra Dev Tools (F12)

2. Procure no console por logs:
```
=== DEBUG EVIDENCE CARD ===
isGameMaster: [true/false]
playerView: [true/false]
locked: [true/false]
cardType: [normal/glitch/encrypted/mega-clue]
```

3. Verifique a lógica de renderização

---

## 🔍 Checklist de Verificação

### Visual

- [ ] **Locked View** (player vendo card bloqueado)
  - [ ] Mostra "ACESSO NEGADO" em vermelho
  - [ ] Exibe ícone 🔐
  - [ ] Grid vermelho pulsante ao fundo
  - [ ] Código RND-XXXXX único
  - [ ] Ícone pulsa a cada 2 segundos
  - [ ] Texto pisca a cada 1 segundo

- [ ] **Glitch View** (player vendo card glitch)
  - [ ] Mostra "▓░▓ DATA CØRRÜPT ░▓░ LOCKED"
  - [ ] 3 camadas de cores (vermelho, cyan, amarelo) se deslocando
  - [ ] Scanlines horizontais driftando
  - [ ] Fundo rotacionando hue sutilmente
  - [ ] SVG com padrão de corrupção

- [ ] **GM View** (mestre vendo qualquer card)
  - [ ] Mostra imagem normal sempre
  - [ ] Sem efeitos de restrição
  - [ ] Scanlines sutis apenas

### Funcional

- [ ] isGameMaster=true, playerView=true → mostra GM View
- [ ] isGameMaster=false, playerView=true, locked=true → mostra Locked View
- [ ] isGameMaster=false, playerView=true, cardType='glitch' → mostra Glitch View
- [ ] isGameMaster=false, playerView=true, cardType='encrypted' → mostra Glitch View
- [ ] isGameMaster=false, playerView=false → mostra normal (edição)

### Performance

- [ ] Sem lag nas animações
- [ ] Transições suaves entre estados
- [ ] Sem erros no console
- [ ] Build completa sem warnings de erro (alguns CSS warnings são OK)

---

## 🐛 Se Ainda Não Funcionar

### Problema: Nada aparece

**Verificações:**
1. Inspecione o elemento (F12 → Elements)
2. Procure por `.card-content-container`
3. Verifique se as classes estão sendo aplicadas:
   - `.locked-view`
   - `.glitch-view`
   - `.gm-view`

4. Abra Console (F12 → Console)
5. Procure por logs ou erros

### Problema: Sem cores/animações

1. Verifique se `EvidenceCardContent.css` está sendo carregado:
   - Dev Tools → Elements → procure por `EvidenceCardContent.css`
   - Ou na aba Network → veja se `EvidenceCardContent.css` foi carregado

2. Inspecione o elemento:
   - Clique direito no card → "Inspect"
   - Verifique se o CSS está sendo aplicado
   - Procure por media queries ou conflitos

3. Verifique se as animações estão em keyframes:
   - Procure por `@keyframes glitch-shift`
   - Procure por `@keyframes lock-pulse`

### Problema: Props não estão sendo passadas

1. Abra o componente debug
2. Verifique o console
3. Procure por logs de debug
4. Verifique se as props estão corretas:
   ```
   isGameMaster: [true/false]
   playerView: [true/false]
   locked: [true/false]
   cardType: [normal/glitch/encrypted/mega-clue]
   ```

5. Se `cardType` está sempre como 'normal', o problema é em InvestigationBoard
6. Se `isGameMaster` está sempre como false, verificar se `clearance_level` está sendo lido corretamente

---

## 📋 Próximas Ações Recomendadas

1. **Testar com o Debug Component**
   - Importe em Home.tsx ou crie rota `/debug`
   - Use os controles para testar cada cenário

2. **Verificar Dados no Banco**
   - Confirme que `is_locked` está sendo salvo
   - Confirme que `metadata.type` está sendo salvo
   - Confirme que `user.clearance_level` está correto

3. **Fazer Build Final**
   ```bash
   npm run build
   ```
   - Deve passar sem erros

4. **Deploy**
   - Se tudo estiver funcionando, fazer deploy

---

## 🎮 Teste Final Rápido

Se quer testar rapidinho sem debug:

1. Crie um card com `is_locked = true`
2. Acesse como jogador
3. Deve ver "🔐 ACESSO NEGADO" com grid vermelha pulsante
4. Acesse como Mestre (ÔMEGA)
5. Deve ver a imagem normal

Se isso funcionar, tudo está OK!

---

## 📞 Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| `InvestigationBoard.tsx` | Adicionado `cardType` prop |
| `EvidenceCardContent.tsx` | Reordenada lógica de renderização |
| `EvidenceCardDebug.tsx` | ✨ NOVO - Componente para testar |

**Status**: ✅ Pronto para testar
