# 🌡️ Sistema Termal - C.R.I.S. Console

## ✨ Como Funciona Agora

O sistema de **desbloqueio termal** foi **movido para o C.R.I.S. Console** (terminal do sistema)!

---

## 🎮 Para o Jogador

### Como Desbloquear Modo Termal:

1. **Abra o C.R.I.S. Console**
   - No quadro de investigação, pressione **TAB** ou clique no ícone de terminal
   
2. **Digite o comando:**
   ```
   thermal PALAVRA_CHAVE
   ```
   ou
   ```
   unlock PALAVRA_CHAVE
   ```

3. **Exemplo:**
   ```
   root@ordo:~# thermal TERMOGRAFIA
   ```

4. **Mensagem de Sucesso:**
   ```
   ═══════════════════════════════════
   🌡️  DESBLOQUEIO TERMAL AUTORIZADO
   ═══════════════════════════════════
   EVIDÊNCIA: FOTO DA CENA
   STATUS: MODO TERMOGRÁFICO ATIVO
   ═══════════════════════════════════
   ```
   ✨ **Mensagem aparece em LARANJA BRILHANTE com animação de pulso!**

5. **Agora pode usar o modo termal:**
   - Abra a evidência
   - MAIS → 🌡️ TERMAL (agora desbloqueado!)
   - Veja a mensagem secreta!

---

## 🛠️ Para o Game Master

### Criar Evidência com Modo Termal:

**No CreateClueModal:**

1. Aba **"VISUAL"**
2. Seção **"🌡️ VISÃO TÉRMICA"**
3. Marque ☑️ "Ativar modo termal na inspeção"
4. Preencha:
   - **TEXTO SECRETO:** `"A SENHA É: PHOENIX-2026"`
   - **PALAVRA-CHAVE:** `"TERMOGRAFIA"`
5. Salve

### Dica de Narrativa:

Esconda pistas sobre a palavra-chave em outras evidências:

```
Evidência A: "Análise forense revelou assinaturas TERMOGRÁFICAS anormais..."
↓
Jogador digita: thermal TERMOGRAFIA
↓
Desbloqueio! Texto secreto aparece na Evidência B
```

---

## 📟 Comandos do C.R.I.S. Console

### Comandos Disponíveis:

```bash
help              # Lista todos os comandos
list              # Lista arquivos/evidências
open <ID>         # Abre uma evidência
thermal <KEYWORD> # Desbloqueia modo termal
unlock <KEYWORD>  # Alias para thermal
scan              # Varredura de segurança
clear             # Limpa o terminal
exit              # Fecha o terminal
```

### Exemplos de Uso:

```bash
# Ver ajuda
root@ordo:~# help

# Listar evidências
root@ordo:~# list

# Desbloquear termal
root@ordo:~# thermal CALOR

# Abrir evidência
root@ordo:~# open f4e2
```

---

## 🎨 Visual da Mensagem

### Antes (Antigo - Lupa 🔍):
```
[Toast pequeno] 🌡️ MODO TERMAL DESBLOQUEADO
```
❌ Fácil de perder, desaparecia rápido

### Agora (C.R.I.S. Console):
```
═══════════════════════════════════
🌡️  DESBLOQUEIO TERMAL AUTORIZADO
═══════════════════════════════════
EVIDÊNCIA: FOTO LABORATÓRIO
STATUS: MODO TERMOGRÁFICO ATIVO
═══════════════════════════════════
```
✅ **Cor laranja brilhante (#ff9500)**
✅ **Animação de pulso**
✅ **Permanece no histórico do terminal**
✅ **Muito mais visível e impactante!**

---

## 🔧 Sistema Técnico

### Localização:
- **Botão de lupa (🔍):** Agora só busca evidências ocultas (keyword_unlock)
- **C.R.I.S. Console:** Onde se faz desbloqueio termal

### Arquivos Modificados:
1. **SystemTerminal.tsx**
   - Adicionado comando `thermal` e `unlock`
   - Callback `onThermalUnlock` recebe keyword
   - Estado `processing` durante async operation
   - Renderização com destaque visual

2. **SystemTerminal.css**
   - Classe `.thermal-highlight` para mensagens laranja
   - Animação `thermal-pulse` 
   - Input disabled durante processamento

3. **InvestigationBoard.tsx**
   - Função `handleThermalUnlock` busca keyword em metadados
   - Atualiza `thermal_unlocked = true` no card
   - Passa callback para SystemTerminal
   - Removida lógica termal do TerminalSearch (🔍)

4. **InspectionModal.tsx** (sem alterações)
   - Sistema de renderização do texto secreto mantido
   - Verificação de unlock mantida

---

## 🎯 Fluxo Completo

```
1. GM cria evidência com modo termal
   ├─ Texto secreto: "CÓDIGO: 2947-DELTA"
   └─ Keyword: "TERMOGRAFIA"

2. Jogador encontra pista que menciona "termografia"

3. Jogador abre C.R.I.S. Console (TAB)

4. Jogador digita: thermal TERMOGRAFIA

5. Sistema processa:
   ├─ Busca keyword em todos os cards
   ├─ Encontra match
   ├─ Atualiza metadata: thermal_unlocked = true
   └─ Toca som de sucesso

6. Console mostra mensagem LARANJA:
   "🌡️ DESBLOQUEIO TERMAL AUTORIZADO"

7. Jogador abre a evidência

8. Botão TERMAL agora está desbloqueado

9. Ativa modo termal

10. Vê o texto secreto brilhando! ✨
```

---

## ⌨️ Atalhos

- **TAB** - Abre/fecha C.R.I.S. Console (se configurado)
- **ESC** - Fecha o console
- **Seta ↑/↓** - (futuro) Navegar histórico de comandos

---

## 🚀 Vantagens do Novo Sistema

✅ **Mais imersivo** - Terminal hacker/investigador
✅ **Mensagem visível** - Laranja brilhante com animação
✅ **Histórico persistente** - Fica no log do terminal
✅ **Interface única** - Um lugar para todos os comandos
✅ **Escalável** - Fácil adicionar novos comandos
✅ **Feedback claro** - Bordas, cores, texto formatado

---

**Desenvolvido em 01/01/2026**  
*Sistema C.R.I.S. v4.0.2 - Módulo Termográfico Integrado*
