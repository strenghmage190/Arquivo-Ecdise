# 🎮 TESTE IMEDIATO - 30 SEGUNDOS

## Você precisa fazer ISTO AGORA:

### 1️⃣ Procure na página por este botão:
```
👁️ (olho)  ou  🕶️ (óculos de sol)
```
**Localização**: Na toolbar superior (barra de botões)

### 2️⃣ Clique nele
- Se tá 👁️ (olho), clique para virar 🕶️
- Se tá 🕶️ (óculos), clique para voltar a 👁️

### 3️⃣ Veja se algo muda nos cards
- Devem aparecer efeitos DIFERENTES

---

## Se funcionar ✅

Os efeitos devem aparecer quando:

1. **Clicou no 👁️ → virou 🕶️**
2. **E tem um card com essas propriedades:**
   - `is_locked = true` → mostra 🔐 ACESSO NEGADO
   - `metadata.type = 'glitch_puzzle'` → mostra corrupted text
   - `metadata.type = 'mega_clue'` → mostra com cor dourada

---

## Se NÃO funcionar ❌

Faça isto:

1. Pressione **F12** (abre Dev Tools)
2. Clique em **"Console"**
3. Procure por logs que começam com `[EvidenceCard`
4. Se VER logs = problema em renderizar efeitos
5. Se NÃO VER logs = componente nem está renderizando

---

## ⚠️ PONTO CRÍTICO

**Os botões 👁️ e 🕶️ não estão visíveis?**

Significa que você é jogador (não Mestre). 
- Mestre: vê botão, pode fazer toggle
- Jogador: não vê botão, sempre vê normal

Para testar como Mestre, precisamos:
1. Que você seja dono da investigação
2. Ou mudar o `isGameMaster` no código

---

## 📸 O que DEVERIA aparecer

Quando **playerView = ON** (🕶️ ativo):

### Card Normal (sem restrição):
```
[Imagem normal]
```

### Card Bloqueado (is_locked = true):
```
🔐
ACESSO NEGADO
RND-A7F2B1C9
```

### Card Glitch (metadata.type = 'glitch_puzzle'):
```
▓░▓ DATA
CØRRÜPT  
░▓░ LOCKED
[com cores piscando]
```

---

## 🔧 Se ainda assim não ver nada

Responda:
1. Consegue VER o botão 👁️ ?
2. Consegue clicar nele?
3. O estado muda quando clica?
4. Tem cards na tela?
5. Abriu F12 → Console?

Se respondeu NÃO para 1-2 = problema de renderização
Se respondeu NÃO para 3-4 = problema de lógica
Se respondeu NÃO para 5 = faça agora

---

## ✅ Resumo Técnico

Implementado:
- ✅ `EvidenceCardContent.tsx` - componente de separação GM/Player
- ✅ `EvidenceCardContent.css` - animações de glitch
- ✅ `cardType` prop em InvestigationBoard
- ✅ CSS básico para `.card-content-container`
- ✅ Debug logs no EvidenceCard

Testado:
- ✅ Build sem erros
- ✅ Componentes carregam
- ✅ Props passadas corretamente

Pendente:
- ⏳ Você testar se aparece na tela

---

**Faça agora**: Clique no botão 👁️/🕶️ e olhe os cards!
