# Arquitetura do Sistema de Camadas - UVEditor

## 📐 Estrutura de Dados

### Interface `Layer`
```typescript
interface Layer {
  // Identificação
  id: string;              // UUID único gerado com timestamp
  type: 'text' | 'image' | 'drawing' | 'group';
  name: string;            // Nome editável pelo usuário
  
  // Propriedades de Exibição
  visible: boolean;        // Controla se aparece no canvas
  opacity: number;         // 0-100, aplicado via globalAlpha
  locked: boolean;         // Previne todas as edições
  
  // Posicionamento (opcional dependendo do tipo)
  x?: number;              // Posição horizontal no canvas
  y?: number;              // Posição vertical no canvas
  
  // Propriedades de Tipo Texto
  text?: string;           // Conteúdo do texto
  size?: number;           // Tamanho da fonte (8-200px)
  color?: string;          // Cor em hex ou rgba
  
  // Propriedades de Tipo Imagem
  img?: HTMLImageElement;  // Elemento de imagem HTML
  scale?: number;          // Escala de renderização (0.1-2.0)
  
  // Hierarquia (para futura implementação de grupos)
  children?: string[];     // IDs das camadas filhas
  parentId?: string | null; // ID do grupo pai, se houver
}
```

## 🔄 Fluxo de Dados

### Estado do Componente
```typescript
// Estado Principal
const [layers, setLayers] = useState<Layer[]>([]);
const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

// Estados de Interação
const [isDraggingLayer, setIsDraggingLayer] = useState(false);
const [editingLayerName, setEditingLayerName] = useState<string | null>(null);

// Estados de Drag-and-Drop para Reordenação
const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);

// Referências
const dragOffsetRef = useRef<{ox:number, oy:number} | null>(null);
const drawingOffscreen = useRef<HTMLCanvasElement | null>(null);
```

### Ciclo de Renderização
```
1. Usuário faz uma ação (cria, edita, move camada)
   ↓
2. Estado `layers` é atualizado
   ↓
3. useEffect detecta mudança em `layers`
   ↓
4. `redrawAll()` é chamado
   ↓
5. Canvas é limpo
   ↓
6. Desenho offscreen é aplicado (traços permanentes)
   ↓
7. Para cada camada visível:
   - Aplicar globalAlpha (opacidade)
   - Desenhar conteúdo (texto ou imagem)
   - Restaurar contexto
   ↓
8. Desenhar outline de seleção se houver camada ativa
```

## 🎨 Renderização no Canvas

### Método `redrawAll()`
```typescript
const redrawAll = () => {
  const canvas = canvasRef.current;
  const off = drawingOffscreen.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // 1. Limpar canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 2. Desenhar traços permanentes do offscreen
  if (off) ctx.drawImage(off, 0, 0);
  
  // 3. Desenhar camadas (respeitando ordem do array)
  for (const layer of layers) {
    if (!layer.visible) continue; // Pular invisíveis
    
    ctx.save();
    ctx.globalAlpha = (layer.opacity || 100) / 100;
    
    if (layer.type === 'text') {
      // Renderizar texto
    } else if (layer.type === 'image' && layer.img) {
      // Renderizar imagem
    }
    
    ctx.restore();
  }
  
  // 4. Desenhar outline de seleção
  if (selectedLayer) {
    // Borda tracejada ao redor da camada selecionada
  }
};
```

### Canvas Offscreen
- **Propósito**: Armazenar traços de desenho permanentes (pincel/borracha)
- **Quando usado**: Ferramentas de desenho direto (não camadas)
- **Benefício**: Separar desenho permanente de camadas editáveis

## 🔧 Operações Principais

### 1. Criar Camada
```typescript
const addEmptyTextLayer = () => {
  const id = `layer-${Date.now()}`;
  const newLayer: Layer = {
    id,
    type: 'text',
    name: 'Novo Texto',
    visible: true,
    opacity: 100,
    locked: false,
    x: canvas.width / 2,
    y: canvas.height / 2,
    text: 'Novo Texto',
    size: textSize,
    color
  };
  setLayers(prev => [...prev, newLayer]); // Adiciona ao final (topo)
  setSelectedLayer(id);
};
```

### 2. Duplicar Camada
```typescript
const duplicateLayer = (id: string) => {
  const layer = layers.find(l => l.id === id);
  const newId = `layer-${Date.now()}`;
  const duplicated: Layer = {
    ...layer,
    id: newId,
    name: layer.name + ' (cópia)',
    x: (layer.x || 0) + 20,  // Offset visual
    y: (layer.y || 0) + 20
  };
  const index = layers.findIndex(l => l.id === id);
  setLayers(prev => [
    ...prev.slice(0, index + 1),
    duplicated,
    ...prev.slice(index + 1)
  ]);
};
```

### 3. Mesclar Para Baixo
```typescript
const mergeDown = (id: string) => {
  // 1. Criar canvas temporário
  const tempCanvas = document.createElement('canvas');
  
  // 2. Desenhar camada inferior
  // 3. Desenhar camada superior
  
  // 4. Converter para imagem
  const mergedImg = new Image();
  mergedImg.src = tempCanvas.toDataURL();
  
  // 5. Criar nova camada mesclada
  // 6. Substituir as duas camadas originais
  setLayers(prev => [
    ...prev.slice(0, index - 1),
    mergedLayer,
    ...prev.slice(index + 1)
  ]);
};
```

### 4. Reordenar (Drag & Drop)
```typescript
const moveLayer = (fromIndex: number, toIndex: number) => {
  const newLayers = [...layers];
  const [movedLayer] = newLayers.splice(fromIndex, 1);
  newLayers.splice(toIndex, 0, movedLayer);
  setLayers(newLayers);
};

// Eventos HTML5 Drag & Drop
onDragStart={(e) => setDraggedLayerId(layer.id)}
onDragOver={(e) => setDragOverLayerId(layer.id)}
onDrop={(e) => {
  const fromIndex = layers.findIndex(l => l.id === draggedLayerId);
  const toIndex = actualIndex;
  moveLayer(fromIndex, toIndex);
}}
```

## 🎯 Detecção de Clique em Camadas

```typescript
const handleCanvasClick = (e: React.MouseEvent): boolean => {
  // 1. Converter coordenadas do mouse para coordenadas do canvas
  const x = rawX * scaleX;
  const y = rawY * scaleY;
  
  // 2. Iterar camadas de cima para baixo (reverse)
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (!layer.visible) continue;
    
    // 3. Calcular bounding box da camada
    if (layer.type === 'image') {
      const w = layer.img.naturalWidth * (layer.scale || 1);
      const h = layer.img.naturalHeight * (layer.scale || 1);
      const left = layer.x - w/2;
      const top = layer.y - h/2;
      
      // 4. Verificar se clique está dentro
      if (x >= left && x <= left + w && y >= top && y <= top + h) {
        setSelectedLayer(layer.id);
        return true; // Clique manipulado
      }
    }
  }
  
  return false; // Clique em área vazia
};
```

## 🔐 Sistema de Bloqueio

```typescript
// Camadas bloqueadas são ignoradas em:

// 1. Drag & Drop no Canvas
if (layer.locked) {
  e.preventDefault();
  return;
}

// 2. Drag & Drop na Lista
draggable={!layer.locked}

// 3. Edição de Nome
if (!layer.locked) setEditingLayerName(layer.id);

// 4. Duplicação, Mesclagem, Exclusão
disabled={layer.locked}
```

## 🎨 Sistema de Visibilidade

```typescript
// Camadas invisíveis:
// 1. Não são renderizadas
for (const layer of layers) {
  if (!layer.visible) continue;
  // ... renderizar
}

// 2. Não são clicáveis
if (!layer.visible) continue;

// 3. Mas ainda aparecem na lista (com visual diferenciado)
className={layer.visible ? 'visible' : 'hidden'}
```

## 📊 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      UVEditor Component                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Canvas     │  │   Layers     │  │  Offscreen   │       │
│  │   Rendering  │  │   State      │  │   Canvas     │       │
│  │              │  │              │  │              │       │
│  │  - Base Img  │  │  - Layer[]   │  │  - Strokes   │       │
│  │  - Layers    │  │  - Selected  │  │  - Permanent │       │
│  │  - Selection │  │  - Editing   │  │    Drawing   │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
│         ┌─────────────────▼─────────────────┐                │
│         │        redrawAll()                │                │
│         │  1. Clear canvas                  │                │
│         │  2. Draw offscreen                │                │
│         │  3. Draw visible layers           │                │
│         │  4. Draw selection outline        │                │
│         └───────────────────────────────────┘                │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Layer Operations                        │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  • Create      • Delete      • Duplicate             │    │
│  │  • Rename      • Reorder     • Toggle Visibility     │    │
│  │  • Lock/Unlock • Set Opacity • Merge Down/Visible    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Event Handlers                          │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  • Canvas Click/Drag   • Layer List Drag & Drop      │    │
│  │  • Double Click Rename • Toolbar Interactions        │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Ordem de Renderização

```
ARRAY INDEX    VISUAL STACK     RENDERIZAÇÃO
─────────────  ──────────────   ────────────
[0]            ┌──────────┐     1º (Fundo)
               │ Camada 1 │
               └──────────┘
[1]            ┌──────────┐     2º
               │ Camada 2 │
               └──────────┘
[2]            ┌──────────┐     3º (Topo)
               │ Camada 3 │
               └──────────┘

LISTA NO UI    ORDEM INVERSA
─────────────  ──────────────
Camada 3       [2] ← Renderiza por último (frente)
Camada 2       [1]
Camada 1       [0] ← Renderiza primeiro (trás)
```

## 🚀 Performance

### Otimizações Implementadas
1. **Canvas Offscreen**: Evita redesenhar traços permanentes
2. **Conditional Rendering**: Camadas invisíveis são puladas
3. **Batch Updates**: `setLayers` atualiza array completo de uma vez
4. **useEffect Dependency**: `redrawAll` só executa quando `layers` muda
5. **Lazy Evaluation**: Operações de merge criam imagem apenas quando necessário

### Considerações
- **Limite recomendado**: 10-15 camadas simultâneas
- **Memória**: Cada camada de imagem mantém HTMLImageElement na memória
- **CPU**: Renderização cresce linearmente com número de camadas visíveis

## 🔮 Extensibilidade Futura

### Grupos (Estrutura Já Preparada)
```typescript
interface Layer {
  type: 'group';           // Novo tipo
  children?: string[];     // IDs das camadas filhas
  parentId?: string;       // Referência ao pai
}
```

### Modos de Mesclagem
```typescript
interface Layer {
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay';
}

// Em redrawAll():
ctx.globalCompositeOperation = layer.blendMode || 'source-over';
```

### Máscaras de Camada
```typescript
interface Layer {
  mask?: HTMLCanvasElement; // Canvas com máscara alpha
}

// Em redrawAll():
if (layer.mask) {
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(layer.mask, 0, 0);
}
```

---

**Sistema robusto, escalável e pronto para expansão! 🎨✨**
