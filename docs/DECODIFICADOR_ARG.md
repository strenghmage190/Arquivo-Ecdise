# 🔓 Decodificador de Anomalias - Guia para ARG

## Visão Geral

O **Decodificador de Anomalias v1.7** é uma ferramenta de manipulação de imagens transformada em um sistema de enigmas para ARG (Alternate Reality Game). Ao invés de ser apenas um criador de glitches aleatórios, agora é um instrumento de decodificação controlável onde os jogadores precisam descobrir as "chaves" corretas para revelar mensagens ocultas.

## Como Funciona

### Parâmetros Controláveis

A ferramenta possui três parâmetros que os jogadores podem ajustar:

1. **Frequência de Fatias** (1-50)
   - Controla quantas "fatias" da imagem serão deslocadas
   - Valores baixos = efeito sutil
   - Valores altos = fragmentação intensa

2. **Intensidade do Deslocamento** (0-100%)
   - Controla o quão longe as fatias serão deslocadas horizontalmente
   - 0% = sem deslocamento
   - 100% = deslocamento máximo

3. **Corrupção Cromática** (0-100%)
   - Controla a porcentagem de pixels que terão seus canais RGB invertidos
   - 0% = cores originais
   - 100% = máxima distorção de cor

## Como Criar Enigmas

### Método 1: Chave de Calibração Simples

1. **Criar a Imagem Original**
   - Prepare uma imagem com uma mensagem visível ou código

2. **Aplicar Glitch com Parâmetros Específicos**
   - Carregue a imagem no decodificador
   - Configure parâmetros específicos (ex: Fatias: 23, Deslocamento: 15%, Cromática: 5%)
   - Salve a imagem "corrompida"

3. **Distribuir aos Jogadores**
   - Dê aos jogadores a imagem corrompida
   - Em outro lugar do ARG, esconda as "chaves de calibração": `23-15-5`

4. **Resolução**
   - Quando os jogadores inserirem os valores corretos, a imagem se reorganiza revelando a mensagem

### Método 2: Calibração Progressiva

Crie uma série de imagens onde cada uma requer parâmetros específicos:

```
Nível 1: Fatias: 5,  Deslocamento: 10%, Cromática: 0%  → Revela coordenadas GPS
Nível 2: Fatias: 15, Deslocamento: 25%, Cromática: 8%  → Revela código de acesso
Nível 3: Fatias: 30, Deslocamento: 40%, Cromática: 20% → Revela QR code final
```

### Método 3: Mensagens Escondidas em Layers

Para enigmas mais complexos:

1. Crie uma imagem base com "ruído" visual
2. Adicione uma segunda camada com a mensagem real
3. Os parâmetros corretos "limpam" o ruído e revelam a mensagem

## Exemplos de Integração Narrativa

### Cenário 1: Cientista Desaparecido
> "Encontramos este software no laptop do Dr. Silva. O arquivo README.txt diz apenas: 'Se você está lendo isso, calibre para 17-33-12'. Há uma pasta chamada 'EVIDÊNCIA_FINAL' com uma imagem corrompida..."

### Cenário 2: Transmissão Hackeada
> "A transmissão de rádio pirata enviou esta imagem às 03:47 AM. Logo depois, uma voz distorcida disse: 'Quinze fatias, vinte por cento, zero cromática. Não confie em ninguém.'"

### Cenário 3: Memórias Fragmentadas
> "O sistema de backup neural está corrompido. Os logs mostram três tentativas de recuperação com valores diferentes. Apenas uma está correta..."

## Dicas para Game Masters

### ✅ Boas Práticas

- **Sempre teste os parâmetros**: Garanta que a combinação correta realmente revele a mensagem
- **Documente as chaves**: Mantenha um registro de qual imagem usa quais parâmetros
- **Crie pistas graduais**: Não entregue todos os números de uma vez
- **Use narrativa**: Integre os números na história (datas, coordenadas, códigos)

### 🎯 Ideias de Pistas

- **Códigos em Documentos**: "Lote #17, Amostra 33, Sujeito 12"
- **Coordenadas**: "17°33'12" (converte para 17-33-12)
- **Datas/Horas**: "17:33:12" ou "17/33 às 12h"
- **Enigmas Matemáticos**: "Primos entre 15-20, raiz de 1089, dúzia"

### ⚠️ Armadilhas a Evitar

- Não faça os valores muito altos (acima de 40-50-50) ou a imagem fica ilegível
- Evite parâmetros que deixem a imagem praticamente igual à original
- Não use valores decimais - mantenha números inteiros
- Teste em diferentes resoluções de tela

## Próximos Passos Avançados

Se quiser expandir ainda mais:

1. **Modo Esteganográfico**: Fazer o glitch revelar partes de uma segunda imagem oculta
2. **Camadas Múltiplas**: Aplicar glitch progressivamente para revelar informações em etapas
3. **Hash de Validação**: Gerar um código único baseado nos parâmetros para verificar se estão corretos
4. **Modo Temporal**: Os parâmetros corretos só funcionam em determinado horário/data

## Exemplo Completo de Enigma

**Configuração:**
```
Imagem Base: foto_laboratorio.png (contém um QR code)
Imagem Corrompida: evidencia_047.png
Parâmetros Corretos: Fatias: 8, Deslocamento: 42%, Cromática: 17%
```

**Pista 1** (Email interceptado):
> "Protocolo de recuperação: Oito amostras confirmadas."

**Pista 2** (Post-it encontrado):
> "A resposta para tudo é 42%. Nunca esqueça."

**Pista 3** (Código em parede):
> "XVII" (número romano para 17)

**Resultado:**
Quando o jogador configura 8-42-17 e executa a análise, o QR code se torna legível e aponta para o próximo estágio da investigação.

---

**Versão**: 1.7  
**Última Atualização**: Janeiro 2026  
**Status**: Operacional ⚠️
