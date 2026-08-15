import React from 'react';
import {
  Type,
  Image as ImageIcon,
  Pencil,
  Folder,
  FileText,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Plus,
  FolderPlus,
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Palette,
  Radio,
  MousePointer,
  Eraser,
  Save,
  X,
} from 'lucide-react';

export function LayerIcon({ type, className = '', size = 16 }: { type: string; className?: string; size?: number }) {
  switch (type) {
    case 'text':
      return <Type size={size} className={className} />;
    case 'image':
      return <ImageIcon size={size} className={className} />;
    case 'drawing':
      return <Pencil size={size} className={className} />;
    case 'group':
      return <Folder size={size} className={className} />;
    default:
      return <FileText size={size} className={className} />;
  }
}

export function MaskIcon({ className = '', size = 14 }: { className?: string; size?: number }) {
  return <Layers size={size} className={className} />;
}

export {
  Type,
  ImageIcon,
  Pencil,
  Folder,
  FileText,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Plus,
  FolderPlus,
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Palette,
  Radio,
  MousePointer,
  Eraser,
  Save,
  X,
};

export default LayerIcon;
