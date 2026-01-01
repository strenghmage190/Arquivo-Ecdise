# 🌡️ MODO TERMAL - Guia Rápido

## ✨ O que foi implementado

Criei um sistema completo de **Visão Térmica** para o seu site de investigação que permite esconder mensagens secretas que só aparecem quando o jogador ativa o modo termal!

---

## 🎮 Como Funciona para o Jogador

### 1️⃣ Modo Simples (Sem Senha)
- O jogador abre uma evidência
- Clica em **"MAIS ▾"** → **"🌡️ TERMAL"**
- A imagem vira uma visão de calor (roxo → vermelho → amarelo → branco)
- **BOOM!** A mensagem secreta aparece brilhante no meio da imagem

### 2️⃣ Modo com Desafio (Com Palavra-Chave)
- O jogador tenta ativar o termal → **Aparece 🔒 bloqueado**
- Precisa investigar outras pistas para descobrir a palavra-chave
- Abre o **Terminal de Busca** (ícone de terminal no quadro)
- Digita a palavra-chave correta
- Sistema mostra: **"🌡️ MODO TERMAL DESBLOQUEADO"**
- Agora pode ver a mensagem secreta!

---

## 🛠️ Como Criar uma Pista Termal

### Passo a Passo:

1. **Abra o CreateClue** (modal de criar evidência)

2. **Vá na aba "VISUAL"**

3. **Role até a seção laranja "🌡️ VISÃO TÉRMICA"**

4. **Marque o checkbox** "Ativar modo termal na inspeção"

5. **Preencha:**
   ```
   TEXTO SECRETO: "A SENHA É: PHOENIX-2026"
   ```
   (Este texto aparecerá brilhante na visão termal)

6. **OPCIONAL - Palavra-chave:**
   ```
   PALAVRA-CHAVE: TERMOGRAFIA
   ```
   (Se deixar vazio, o modo termal fica sempre disponível)
   (Se preencher, o jogador precisa descobrir e digitar no Terminal)

7. **Salve a evidência normalmente**

---

## 💡 Exemplos Criativos

### Caso de Assassinato
```
Evidência: Foto da cena do crime
Texto Secreto: "IMPRESSÃO DIGITAL: AX-4729"
Keyword: "FORENSE"

Contexto: O jogador encontra um documento falando sobre 
"análise forense", usa a palavra no Terminal, desbloqueia 
o modo termal e descobre o código da impressão digital.
```

### Conspiração Alienígena
```
Evidência: Fotografia antiga
Texto Secreto: "ELES NOS OBSERVAM"
Keyword: (vazio - sempre disponível)

Contexto: Texto de impacto imediato para assustar o jogador.
```

### Caça ao Tesouro
```
Evidência: Mapa rasgado
Texto Secreto: "LAT: -23.5505\nLONG: -46.6333"
Keyword: "CALOR"

Contexto: Uma pista anterior diz "Siga o calor", 
o jogador digita no Terminal e descobre coordenadas GPS.
```

---

## 🎨 Como Fica Visualmente

### Cores Termográficas:
- **Áreas escuras** → Roxo/Preto (frio)
- **Áreas claras** → Vermelho/Laranja (morno)
- **Áreas muito claras** → Amarelo/Branco (quente)
- **Texto secreto** → **Branco brilhante com aura amarela** (muito quente!)

### Texto Secreto:
- Centralizado na imagem
- Quebra de linha automática (máx 40 caracteres por linha)
- Efeito de "brilho termal" em 3 camadas
- Usa fonte monospace (tipo computador)
- Suporta múltiplas linhas (use `\n` no texto)

---

## 🔧 Integrações

### ✅ Funciona Com:
- Luz UV
- Filtros de imagem
- Camadas de overlay
- Modo fullscreen
- Todas as ferramentas visuais

### ❌ Não Funciona Com:
- Vídeos (só imagens estáticas)
- Chat/Phone viewer
- Áudio sem imagem

---

## 🎯 Dicas de Game Design

1. **Progressão**: Use keywords para criar "gates" de progresso
   ```
   Evidência A tem keyword "ALPHA"
   → Desbloqueando A, revela texto "A próxima é BETA"
   → Jogador usa "BETA" para desbloquear Evidência B
   ```

2. **Plot Twist**: Guarde revelações importantes para modo termal
   ```
   "O TRAIDOR É: [NOME DO NPC]"
   ```

3. **Coordenadas/Senhas**: Perfeito para dados técnicos
   ```
   "CÓDIGO DE ACESSO: 2947-DELTA"
   ```

4. **Atmosfera**: Mensagens curtas e impactantes
   ```
   "ELE AINDA ESTÁ AQUI"
   "NÃO CONFIE EM NINGUÉM"
   ```

---

## 📊 Indicadores Visuais

### No Quadro de Evidências:
- Cards com modo termal mostram badge **"🌡️"** laranja
- Fácil de identificar quais evidências têm essa feature

### No Modo de Inspeção:
- Botão "MAIS ▾" → "🌡️ TERMAL"
- Se bloqueado: mostra **"🌡️ TERMAL 🔒"**
- Tooltip explica como desbloquear

---

## ⚙️ Técnico

### Arquivos Modificados:
- `CreateClueModal.tsx` - Adicionado UI para configurar modo termal
- `InspectionModal.tsx` - Renderização do canvas termal + texto brilhante
- `InvestigationBoard.tsx` - Sistema de keyword unlock no Terminal
- `EvidenceCard.tsx` - Badge visual (já existia)

### Dados Salvos:
No campo `metadata` do card:
```json
{
  "thermal": true,
  "thermal_secret_text": "A SENHA É: PHOENIX",
  "thermal_keyword": "TERMOGRAFIA",
  "thermal_unlocked": true  // adicionado quando o jogador desbloqueia
}
```

---

## 🚀 Teste Rápido

1. Crie uma evidência com foto
2. Ative modo termal
3. Digite: `"TESTE FUNCIONANDO"`
4. Keyword: `"TESTE"`
5. Salve
6. No quadro, abra o Terminal
7. Digite: `TESTE`
8. Veja a mensagem de desbloqueio
9. Abra a evidência → MAIS → TERMAL
10. Veja o texto brilhando! ✨

---

**Desenvolvido em 01/01/2026**  
*Sistema de Evidências Multicamadas - Modo Termal v1.0*
