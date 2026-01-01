# 🔐 Sistema de Decodificador de Anomalias - Guia de Uso

## Resumo das Mudanças

O **Decodificador de Anomalias v1.7** foi completamente separado do modal de criação de pistas.

### Antes ❌
- Game Masters podiam acessar GlitchMaker ao criar pistas
- Interface confusa com múltiplas ferramentas misturadas

### Agora ✅
- **Jogadores descobrem e desbloqueiam** o Decodificador através de um código
- **Única forma de acesso**: Sistema de desbloqueio por senha
- Interface limpa e imersiva para ARG

---

## 🎮 Como Funciona para Jogadores

### 1️⃣ **Descoberta**
Ao abrir uma investigação, o jogador vê um botão no HUD:

```
🔐 ARQUIVO PROTEGIDO
```

### 2️⃣ **Tentativa de Desbloqueio**
Clica no botão e aparece um modal:

```
┌─────────────────────────────────────┐
│ 🔐 ARQUIVO PROTEGIDO                │
│    PROTOCOLO DELTA                  │
├─────────────────────────────────────┤
│ > SISTEMA DE SEGURANÇA ATIVO        │
│ > Verificando permissões...         │
│ > ACESSO NEGADO - Credenciais...    │
│                                     │
│ Digite o código de acesso:          │
│ [ __________________ ]              │
│                                     │
│ [CONFIRMAR] [CANCELAR]              │
└─────────────────────────────────────┘
```

### 3️⃣ **Busca por Pistas**
O jogador precisa encontrar o código nas pistas da investigação:
- Documentos
- Fotografias
- Emails
- Qualquer pista criada pelo Game Master

### 4️⃣ **Desbloqueio**
Digita o código correto: `DELTA-1977`

**Resultado:**
```
✓ DECODIFICADOR DE ANOMALIAS v1.7 DESBLOQUEADO
```

### 5️⃣ **Uso da Ferramenta**
Agora aparece novo botão no HUD:

```
⚠ DECODIFICADOR (com efeito de brilho)
```

Ao clicar, abre a ferramenta com:
- Upload de imagens corrompidas
- Sliders para parâmetros:
  - Frequência de Fatias (1-50)
  - Intensidade do Deslocamento (0-100%)
  - Corrupção Cromática (0-100%)
- Botão "Executar Análise"
- Botão "Extrair Artefato"

---

## 📋 Como o Game Master Cria Enigmas

### Passo 1: Criar Pistas com Dicas

Crie pistas normais que remetem ao código:

**Exemplo 1: Documento**
```
TÍTULO: Projeto D.E.L.T.A
DESCRIÇÃO: 
"Este é o arquivo de resumo do Projeto DELTA, 
iniciado em 1977. O protocolo de segurança requer 
a senha como: [PROJETO]-[ANO]"
```

**Exemplo 2: Fotografia**
```
TÍTULO: Foto do Laboratório (1977)
DESCRIÇÃO OCULTA:
"Há um papel na parede com 'DELTA-1977'"
(Ou o jogador descobre vendo a foto)
```

**Exemplo 3: Email**
```
TÍTULO: Email Interceptado
DESCRIÇÃO:
"De: silva@[redacted]
Para: equipe@[redacted]
Assunto: Protocolo D

Pessoal,
A senha de acesso ao decodificador é simples:
[Nome do Projeto]-[Ano de Início]
D=4, E=5, L=12, T=20, A=1
Junho de 1977."
```

### Passo 2: Preparar Imagens Corrompidas

1. Use uma ferramenta externa (GIMP, Photoshop, etc.) ou crie manualmente
2. Aplique efeitos para deixar a imagem "corrompida" ou com glitch
3. Salve a imagem com um nome sugestivo: `evidencia_047_corrupted.png`

Ou, use estes parâmetros como "receita":
- Fatias: 17
- Deslocamento: 33%
- Cromática: 12%

### Passo 3: Colocar a Imagem Corrompida no Quadro

Crie uma pista normal com a imagem corrompida:

```
TÍTULO: Imagem Corrompida - Lab-047
DESCRIÇÃO: "Uma fotografia foi corrompida. 
Parece conter dados importantes."
ANEXO: [imagem corrompida]
```

### Passo 4: Fornecer Parâmetros de Decodificação

Em **outra pista** ou **email**, adicione os parâmetros:

```
TÍTULO: Email - Instruções Técnicas
DESCRIÇÃO:
"Para recuperar a imagem corrompida, use:
- Frequência: 17
- Deslocamento: 33%
- Cromática: 12%"
```

Ou, de forma narrativa:

```
TÍTULO: Código de Laboratório
DESCRIÇÃO:
"Amostra 17 | Parâmetro Beta 33 | Teste Gamma 12"
```

### Passo 5: O Resultado

Quando o jogador:
1. ✓ Encontra o código `DELTA-1977` e desbloqueia o Decodificador
2. ✓ Carrega a imagem corrompida
3. ✓ Coloca os parâmetros: 17-33-12
4. ✓ Clica "Executar Análise"

A imagem se reorganiza e revela... um **QR code**! 🎉

---

## 🔧 Customização do Código

Para mudar o código de desbloqueio, edite em:

**Arquivo**: `src/components/board/InvestigationBoard.tsx`  
**Linha**: ~280 (na função `handleDecoderCodeSubmit`)

```tsx
const correctCode = 'DELTA-1977'; // ← MUDE AQUI
```

Exemplos de códigos temáticos:
- `OMEGA-2025`
- `ARCANO-XIII`
- `VERDADE-X`
- `PHOENIX-RISING`
- `NEXUS-ALPHA`

---

## 📚 Fluxo Completo de ARG

```
INÍCIO DO JOGO
    ↓
Jogador vê: 🔐 ARQUIVO PROTEGIDO
    ↓
Clica no botão → Modal de código aparece
    ↓
Jogador explora pistas da investigação
    ↓
Encontra dicas sobre "DELTA", "1977"
    ↓
Digita: DELTA-1977
    ↓
✓ DESBLOQUEADO!
    ↓
Novo botão aparece: ⚠ DECODIFICADOR
    ↓
Carrega imagem corrompida
    ↓
Ajusta parâmetros (17-33-12)
    ↓
Clica "Executar Análise"
    ↓
Imagem se reconstrói → QR CODE!
    ↓
Escaneia QR → Próximo enigma
    ↓
FIM OU PRÓXIMO NÍVEL
```

---

## ⚠️ Notas Importantes

### Para Game Masters:

1. **Salve o código em um lugar seguro** - Você pode mudar quando quiser
2. **Crie boas pistas** - As dicas devem ser descobríveis, não óbvias
3. **Teste o fluxo completo** antes de dar aos jogadores
4. **Use narrativa** - O código faz parte da história, não é aleatório
5. **Varie os parâmetros** - Cada imagem pode ter valores diferentes

### Para Jogadores:

1. **Explorem todas as pistas** - A senha está escondida em algum lugar
2. **Procurem padrões** - Datas, nomes, números
3. **Usem o Decodificador com criatividade** - Experimentem diferentes valores
4. **Trabalhem juntos** - ARGs são melhor em grupo

---

## 🎬 Exemplos de Enigmas Multietapas

### Enigma 1: O Código Oculto
1. Jogador encontra foto com "1977" visível
2. Encontra documento com "D.E.L.T.A" 
3. Combina: DELTA-1977
4. Desbloqueia ferramenta

### Enigma 2: Os Parâmetros Fragmentados
1. Uma pista tem: "Frequência mínima: 17"
2. Outra tem: "Beta máximo: 33%"
3. Outra tem: "Teste final: 12%"
4. Jogador monta: 17-33-12 no Decodificador

### Enigma 3: A Imagem em Camadas
1. Jogador carrega imagem corrompida
2. Experimenta diferentes parâmetros
3. Descobre que 8-42-17 revela **QR code**
4. QR aponta para coordenadas GPS reais

---

## 🚀 Estado Atual

✅ Sistema implementado e funcional
✅ Interface imersiva e temática
✅ Persistência no localStorage (não perde desbloqueio ao recarregar)
✅ Sons de feedback
✅ Notificações visuais
✅ Modal temático com design hacker

---

## 📞 Suporte

Se encontrar problemas:

1. **Botão não aparece** → Recarregue a página
2. **Código não funciona** → Verifique maiúsculas/minúsculas (deve ser exato)
3. **Modal travado** → Feche e abra novamente
4. **Parâmetros não salvam** → Tente recarregar após "Executar Análise"

---

**Versão**: 1.0  
**Status**: ✅ Operacional  
**Última atualização**: Janeiro 2026  

Aproveite o Decodificador! 🔓⚠️
