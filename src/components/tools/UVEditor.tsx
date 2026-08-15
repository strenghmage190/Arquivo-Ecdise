import React from 'react';
import { UVEditorProvider } from './uveditor/UVEditorContext';
import { UVEditorInner } from './UVEditorInner';
import { Layer } from './uveditor/types';

export type { Layer };

interface UVEditorProps {
  baseImageUrl: string;
  onSave: (file: File, meta?: { targetChannel?: 'R' | 'G' | 'B' }) => void;
  onClose: () => void;
  mode?: 'uv' | 'filter' | 'rgb';
  initialImageFile?: File | null;
  showForensicControls?: boolean;
}

export default function UVEditor(props: UVEditorProps) {
  return (
    <UVEditorProvider initialMode={props.mode} initialTargetChannel={props.mode === 'rgb' ? 'R' : undefined}>
      <UVEditorInner {...props} />
    </UVEditorProvider>
  );
}
