import React from 'react';
import { UVEditorProvider } from './uveditor/UVEditorContext';
import { UVEditorInner } from './UVEditorInner';
import { Layer, UVAuthoringState } from './uveditor/types';

export type { Layer, UVAuthoringState };

interface UVEditorProps {
  baseImageUrl: string;
  onSave: (
    file: File,
    meta?: { targetChannel?: 'R' | 'G' | 'B'; uvAuthoringState?: UVAuthoringState }
  ) => void;
  onClose: () => void;
  mode?: 'uv' | 'filter' | 'rgb' | 'thermal';
  initialImageFile?: File | null;
  initialAuthoringState?: UVAuthoringState | null;
  showForensicControls?: boolean;
}

export default function UVEditor(props: UVEditorProps) {
  return (
    <UVEditorProvider initialMode={props.mode} initialTargetChannel={props.mode === 'rgb' ? 'R' : undefined}>
      <UVEditorInner {...props} />
    </UVEditorProvider>
  );
}
