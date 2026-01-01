# 🌡️ Modo Termal - Documentação

## Visão Geral

O **Modo Termal** é uma funcionalidade de investigação que simula uma câmera termográfica, permitindo revelar mensagens secretas ocultas em evidências através de visualização por calor.

## Características

### 1. Texto Secreto Termal
- Mensagens que **só aparecem** quando o modo termal está ativo
- Renderizadas com efeito de "calor brilhante" em amarelo/branco
- Ideal para pistas ocultas, códigos secretos ou mensagens críticas

### 2. Sistema de Desbloqueio (Opcional)
- **Sem Keyword**: Modo termal fica disponível imediatamente
- **Com Keyword**: Jogador precisa descobrir uma palavra-chave específica usando o Terminal de Busca
- Adiciona camada extra de desafio e progressão

### 3. Paleta Termográfica IRONBOW
- **Preto → Roxo escuro**: Áreas frias (valores baixos)
- **Roxo → Vermelho**: Aquecimento médio
- **Vermelho → Amarelo → Branco**: Áreas quentes (valores altos)

## Como Criar Uma Pista com Modo Termal

### No CreateClueModal:

1. **Aba "VISUAL"** → Role até a seção **"🌡️ VISÃO TÉRMICA"**

2. **Marque o checkbox** "Ativar modo termal na inspeção"

3. **Preencha os campos revelados:**
   - **TEXTO SECRETO**: A mensagem que aparecerá somente na visão térmica
     - Exemplo: `"A SENHA É: PHOENIX-2026"`
     - Exemplo: `"LATITUDE: 42.3601 / LONGITUDE: -71.0589"`
   
   - **PALAVRA-CHAVE PARA ATIVAR** (opcional):
     - Deixe **vazio** se quiser que o modo termal esteja sempre disponível
     - Digite uma palavra (ex: `TERMOGRAFIA`, `CALOR`, `INFRARED`) se quiser bloquear o acesso
     - Esta palavra deverá ser descoberta pelo jogador através de outras pistas

4. **Salve a evidência**

## Como o Jogador Usa

### Modo Desbloqueado (sem keyword):

1. Abrir a evidência no **Modo de Inspeção**
2. Clicar em **"MAIS ▾"** no menu de ferramentas
3. Selecionar **"🌡️ TERMAL"**
4. A imagem será convertida para paleta térmica
5. O texto secreto aparecerá brilhante no centro da imagem

### Modo Bloqueado (com keyword):

1. O jogador tenta usar o modo termal → **Aparece cadeado 🔒**
2. Mensagem informa: *"Use o Terminal de Busca para desbloquear"*
3. Jogador deve:
   - Encontrar a keyword através de outras pistas
   - Abrir o **Terminal de Busca** (ícone de terminal no board)
   - Digitar a palavra-chave exata
4. Sistema confirma: **"🌡️ MODO TERMAL DESBLOQUEADO"**
5. Agora o modo termal pode ser ativado normalmente

## Exemplos de Uso Criativo

### Investigação de Crime
```
Evidência: Foto de uma cena de crime
Texto Secreto: "IMPRESSÃO DIGITAL: AX-4729"
Keyword: "FORENSE"
```

### Mistério Sobrenatural
```
Evidência: Fotografia antiga
Texto Secreto: "ELE AINDA ESTÁ AQUI"
Keyword: "FANTASMA"
```

### Conspiração Científica
```
Evidência: Documento de laboratório
Texto Secreto: "EXPERIMENTO FALHOU - CONTAINMENT BREACH"
Keyword: "TERMOGRAFIA"
```

### Caça ao Tesouro
```
Evidência: Mapa antigo
Texto Secreto: "X MARCA O PONTO: -23.5505, -46.6333"
Keyword: "CALOR"
```

## Dicas de Game Design

1. **Progresso Narrativo**: Use keywords termais para criar gates de progressão
2. **Pistas Encadeadas**: Uma evidência pode conter a keyword de outra
3. **Revelação Dramática**: Textos secretos termais são ótimos para plot twists
4. **Múltiplas Camadas**: Combine com UV, filtros e outras ferramentas
5. **Contraste Visual**: Textos curtos (1-3 palavras) têm mais impacto visual

## Limitações Técnicas

- Texto é renderizado no centro da imagem (não customizável por posição)
- Funciona melhor em imagens com boa resolução
- O efeito termal funciona sobre a imagem base ou UV
- Keywords são **case-insensitive** (não diferenciam maiúsculas)

## Integração com Outras Ferramentas

✅ **Compatível com:**
- Luz UV
- Filtros de tratamento de imagem
- Camadas de filtro (overlays)
- Modo fullscreen

❌ **Não compatível com:**
- Vídeos (apenas imagens)
- Chat/Phone viewer
- Áudio isolado (sem imagem)

---

**Desenvolvido para Site de Investigação**  
*Sistema de Camadas de Evidências v2.0*
