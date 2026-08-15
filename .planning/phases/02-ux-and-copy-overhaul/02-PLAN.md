# Phase 02: ux-and-copy-overhaul - Plan

## Step 1: Add Dependencies
- **Action**: Verify `lucide-react` is installed. (We know it is from previous context/milestone scope, but we should import `Info` or `HelpCircle` in `CreateClueModal.tsx`).

## Step 2: Update JSX Labels
- **Target**: `src/components/modals/CreateClueModal.tsx`
- **Action**: Replace generic labels with diegetic Cyberpunk ones. For example:
  - "Título da Pista" -> "Matriz Visual Não Estabelecida" or "Identificador da Evidência"
  - "Descrição Pública" -> "Relatório Oficial (Visível)"
  - "Descrição Oculta" -> "Arquivo Confidencial (Apenas GM)"
  - "Código de Descoberta" -> "Chave de Descriptografia"
- **Constraint**: Only touch JSX elements, do not change hooks or state variables.

## Step 3: Add GM Tooltips
- **Target**: `src/components/modals/CreateClueModal.tsx`
- **Action**: Add `<Info size={16} />` icons next to complex fields (e.g. "Código de Descoberta"). 
- **Action**: Apply a CSS class (`group` and `group-hover`) or use `react-tooltip` so the GM can hover to see explanations.

## Step 4: Refine Empty States (Alert Visibility)
- **Target**: `src/components/modals/CreateClueModal.tsx`
- **Action**: For required fields, add a placeholder like "Aguardando input...".
- **Action**: When the form is submitted and fields are missing, display a neon red warning below the input (e.g., "ALERTA: Input Necessário"). 
- **Note**: Ensure this does not break the existing saving flow.

## Verification
- Follow `02-VALIDATION.md` Dimension 8 checks.
