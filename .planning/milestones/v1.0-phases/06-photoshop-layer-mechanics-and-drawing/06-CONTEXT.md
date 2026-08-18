# Phase 6: Photoshop-Style Layer Mechanics & Drawing Logic

## Context and Goal
The user reported that the current drawing system "doesn't work like layers" and feels out of control ("every time I draw it creates a new one"). The user provided documentation from GIMP and Photoshop regarding layer management, highlighting the desire for strict Photoshop-like layer behaviors.

## Requirements based on User Request
1. **Background Layer**:
   - Documents should have a default "Background" (Plano de Fundo) layer that is locked by default, rather than starting completely empty and auto-generating layers.
2. **Drawing/Painting Restrictions**:
   - The user must explicitly select a paintable layer to draw.
   - If an invalid layer is selected (e.g., an Image or Text layer that hasn't been rasterized), drawing should be blocked, and the user should receive visual feedback (like a "not allowed" cursor or a toast notification).
   - Drawing should NEVER auto-create a layer randomly unless the user explicitly asks for it or pastes something.
3. **Pasting & Floating Selections**:
   - Pasting content (Ctrl+V) should act as a "floating selection" or automatically generate a new Image Layer fitted to the pasted content.
4. **Rasterization (Conversion)**:
   - Provide a way to convert Image/Text layers into standard Drawing (pixel) layers so they can be painted over directly.

## Action Plan for Phase 6
- **Update ROADMAP.md**: Add Phase 6 detailing the exact mechanics of Photoshop-style layer drawing constraints, rasterization, and paste handling.
- **Update Drawing Logic (`startDrawing`)**: Remove the "Caso 2" auto-creation of drawing layers. If the user tries to draw without a valid layer selected, show an error.
- **Base/Background Layer Initialization**: Ensure new projects start with a solid or transparent Background layer.
- **Rasterize Action**: Add an action in the Layers Panel context menu to "Rasterize Layer" (convert type to `drawing`).
