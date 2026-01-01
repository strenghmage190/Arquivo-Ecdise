# Sistema de Camadas - UVEditor

## 📋 Visão Geral

O UVEditor agora possui um sistema completo de camadas inspirado no Adobe Photoshop, permitindo edição não-destrutiva e organização complexa de elementos visuais.

## 🎯 Funcionalidades Implementadas

### 1. Gerenciamento Básico de Camadas

#### ✅ Painel de Camadas
- Lista vertical exibindo todas as camadas do documento
- Miniatura visual e informações de cada camada
- Contador de camadas no cabeçalho

#### ✅ Criar Nova Camada
- Botão **"➕"** para adicionar novas camadas de texto
- Camadas são criadas transparentes no topo da pilha
- Nome automático baseado no conteúdo

#### ✅ Excluir Camada
- Botão **"🗑️"** em cada camada
- Camadas bloqueadas não podem ser excluídas (botão desabilitado)
- Confirmação visual antes da exclusão

#### ✅ Camada Ativa
- Apenas uma camada pode ser editada por vez
- Camada selecionada destacada visualmente com:
  - Cor de fundo diferenciada
  - Borda brilhante roxa (#b366ff)
  - Sombra externa luminosa
- Todas as ações afetam apenas a camada ativa

#### ✅ Renomear Camada
- **Clique duplo** no nome da camada para editar
- Campo de texto inline para edição rápida
- Tecla **Enter** para confirmar
- Tecla **Escape** para cancelar
- Indicação visual "Clique duplo para renomear"

### 2. Ordem e Visibilidade

#### ✅ Reordenar Camadas (Drag & Drop)
- **Arrastar e soltar** camadas para reorganizar
- Indicação visual durante o arraste:
  - Camada arrastada fica semi-transparente (50%)
  - Borda destacada no local de destino
- Camadas bloqueadas não podem ser reordenadas
- Ordem determina sobreposição na imagem final

#### ✅ Visibilidade (Olho)
- Ícone **"👁️"** ao lado de cada camada
- Clique para ocultar/mostrar sem excluir
- Camada oculta:
  - Ícone muda para **"🚫"**
  - Fica semi-transparente na lista (40% opacidade)
  - Não aparece no canvas
  - Não afeta outras operações
- Essencial para focar na edição de partes específicas

### 3. Propriedades Essenciais

#### ✅ Opacidade
- Slider de 0% a 100% para camada selecionada
- Controle em tempo real com preview instantâneo
- Exibição numérica do valor atual
- Camadas bloqueadas têm slider desabilitado
- Afeta apenas a camada, não elementos filhos

#### ✅ Bloquear Camada
- Ícone de **"🔓"** / **"🔒"** em cada camada
- Camada bloqueada:
  - Não pode ser movida
  - Não pode ser desenhada
  - Não pode ser editada
  - Não pode ser excluída
  - Não pode ser reordenada
  - Não pode ser duplicada
  - Visual diferenciado (cor avermelhada)
- Previne edições acidentais em trabalho finalizado

### 4. Organização Avançada

#### ✅ Duplicar Camada
- Botão **"📑"** em cada camada
- Cria cópia exata incluindo:
  - Todo o conteúdo visual
  - Propriedades (opacidade, visibilidade)
  - Offset de posição (+20px x/y para diferenciar)
- Nome automático com sufixo "(cópia)"
- Inserida logo acima da camada original
- Camada duplicada automaticamente selecionada

#### ✅ Mesclar Camadas

##### Mesclar para Baixo (⬇️)
- Botão **"⬇️"** em cada camada (exceto a inferior)
- Combina camada ativa com a imediatamente abaixo
- Respeita opacidade e propriedades visuais
- Nome resultante: "Camada A + Camada B"
- Remove as duas camadas originais
- Útil para simplificar progressivamente

##### Mesclar Visíveis (🔗)
- Botão **"🔗"** no cabeçalho do painel
- Combina TODAS as camadas visíveis em uma só
- Camadas ocultas são preservadas e não mescladas
- Nome resultante: "Camadas Mescladas"
- Substitui todas as camadas visíveis pela mesclada
- Ótimo para finalizar e reduzir tamanho do arquivo
- Habilitado apenas quando há 2+ camadas visíveis

## 🎨 Interface Visual

### Indicadores de Estado

| Estado | Visual | Descrição |
|--------|--------|-----------|
| **Ativa** | Fundo roxo + borda brilhante | Camada sendo editada |
| **Bloqueada** | Fundo avermelhado + ícone 🔒 | Não pode ser modificada |
| **Oculta** | Ícone 🚫 + opacidade reduzida | Não aparece no canvas |
| **Sendo Arrastada** | 50% opacidade | Durante reorganização |
| **Destino do Arraste** | Borda roxa espessa | Local onde será solta |

### Controles por Camada

```
┌─────────────────────────────────────────┐
│ 👁️  Camada Principal         📑 ⬇️ 🗑️  │
│ 🔓  Texto 24px                          │
│     Opacidade: 85%                      │
└─────────────────────────────────────────┘
```

- **Coluna Esquerda**: Visibilidade e bloqueio
- **Centro**: Nome (clique duplo para editar) e tipo
- **Direita**: Ações (duplicar, mesclar, deletar)
- **Abaixo**: Slider de opacidade (quando selecionada)

## 🔧 Teclas e Atalhos

| Ação | Como Fazer |
|------|-----------|
| Selecionar camada | Clicar na camada no painel |
| Renomear | Duplo clique no nome |
| Confirmar nome | Enter |
| Cancelar edição | Escape |
| Reordenar | Arrastar e soltar |
| Ocultar/Mostrar | Clicar no ícone 👁️ |
| Bloquear/Desbloquear | Clicar no ícone 🔒 |

## 💡 Casos de Uso

### Experimentação Segura
1. Duplicar camada importante
2. Testar edições na cópia
3. Manter original intacta como backup

### Trabalho em Partes
1. Ocultar camadas temporariamente
2. Focar em elementos específicos
3. Revelar novamente quando necessário

### Organização Complexa
1. Nomear camadas descritivamente
2. Bloquear elementos finalizados
3. Mesclar grupos relacionados
4. Manter hierarquia clara

### Finalização
1. Revisar todas as camadas
2. Ocultar elementos não utilizados
3. Mesclar camadas relacionadas
4. Mesclar visíveis para exportação final

## 🎯 Comparação com Photoshop

| Funcionalidade | Photoshop | UVEditor | Status |
|----------------|-----------|----------|--------|
| Criar camada | ✅ | ✅ | Implementado |
| Excluir camada | ✅ | ✅ | Implementado |
| Renomear | ✅ | ✅ | Implementado |
| Reordenar | ✅ | ✅ | Implementado |
| Visibilidade | ✅ | ✅ | Implementado |
| Opacidade | ✅ | ✅ | Implementado |
| Bloquear | ✅ | ✅ | Implementado |
| Duplicar | ✅ | ✅ | Implementado |
| Mesclar para baixo | ✅ | ✅ | Implementado |
| Mesclar visíveis | ✅ | ✅ | Implementado |
| Grupos | ✅ | 🔄 | Estrutura pronta |
| Modos de mesclagem | ✅ | ❌ | Não implementado |
| Máscara de camada | ✅ | ❌ | Não implementado |
| Estilos de camada | ✅ | ❌ | Não implementado |

## 📝 Notas Técnicas

### Estrutura de Dados
```typescript
interface Layer {
  id: string;              // Identificador único
  type: 'text' | 'image' | 'drawing' | 'group';
  name: string;            // Nome editável
  visible: boolean;        // Estado de visibilidade
  opacity: number;         // 0-100
  locked: boolean;         // Bloqueio
  x?: number;              // Posição X
  y?: number;              // Posição Y
  // ... propriedades específicas do tipo
}
```

### Renderização
- Camadas ocultas são puladas durante o desenho
- Opacidade aplicada via `globalAlpha`
- Ordem de desenho: primeira camada no array = fundo
- Camadas mescladas são convertidas para imagem PNG

### Performance
- Mesclagem usa canvas temporário off-screen
- Redraw otimizado apenas quando necessário
- Drag & drop nativo do navegador
- Sem re-renders desnecessários

## 🚀 Próximos Passos Sugeridos

1. **Grupos de Camadas**: Implementar pastas para organização
2. **Modos de Mesclagem**: Multiply, Screen, Overlay, etc.
3. **Máscaras**: Ocultar partes sem deletar
4. **Atalhos de Teclado**: Ctrl+J para duplicar, Delete para excluir
5. **Histórico**: Desfazer/refazer operações
6. **Thumbnails**: Miniatura visual do conteúdo
7. **Estilos**: Sombra, brilho, contorno

---

✨ **Sistema de camadas completo e funcional inspirado no Photoshop!**
